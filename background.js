/**
 * MindShield Pro - Background Service Worker
 * Secure, AI-governed content analysis with transparency
 * @module background
 */

// Note: Using inline constants since service workers have module loading limitations
const API_CONFIG = {
    BACKEND_URL: 'http://localhost:3001/api',
    OLLAMA_URL: 'http://localhost:11434/api/generate',
    DEFAULT_MODEL: 'gpt-oss:120b-cloud'
};

const TIMEOUTS = {
    API_REQUEST: 15000,
    CACHE_EXPIRY: 24 * 60 * 60 * 1000
};

const CONTENT_CONFIG = {
    MAX_TEXT_LENGTH: 1500,
    MIN_TEXT_LENGTH: 10,
    MAX_URL_LENGTH: 2048
};

// ==================== STATE MANAGEMENT ====================

/** @type {Map<string, {result: string, timestamp: number, confidence: number}>} */
const localCache = new Map();

/** @type {Array<{url: string, result: string, timestamp: number, reason: string}>} */
const auditLog = [];

/** Statistics tracking */
const stats = {
    scansToday: 0,
    blockedToday: 0,
    lastReset: Date.now()
};

/** Rate limiter state */
const rateLimiter = {
    requests: [],
    maxRequests: 60,
    windowMs: 60000
};

// ==================== VALIDATORS ====================

/**
 * Validates URL format and protocol
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string' || url.length > CONTENT_CONFIG.MAX_URL_LENGTH) {
        return false;
    }
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Sanitizes text content
 * @param {string} text - Text to sanitize
 * @returns {string}
 */
function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim()
        .slice(0, CONTENT_CONFIG.MAX_TEXT_LENGTH);
}

/**
 * Extracts domain from URL safely
 * @param {string} url - URL
 * @returns {string}
 */
function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

/**
 * Check if rate limit allows request
 * @returns {boolean}
 */
function isRateLimitOk() {
    const now = Date.now();
    rateLimiter.requests = rateLimiter.requests.filter(t => now - t < rateLimiter.windowMs);
    if (rateLimiter.requests.length >= rateLimiter.maxRequests) {
        return false;
    }
    rateLimiter.requests.push(now);
    return true;
}

// ==================== AUDIT LOGGING ====================

/**
 * Log AI decision for governance/transparency
 * @param {string} url - Analyzed URL
 * @param {string} result - Decision (allow/block)
 * @param {string} reason - Reason for decision
 * @param {number} confidence - Confidence score 0-1
 */
function logAuditEntry(url, result, reason, confidence = 0.5) {
    const entry = {
        url: extractDomain(url),
        result,
        reason,
        confidence,
        timestamp: Date.now()
    };

    auditLog.unshift(entry);

    // Keep only last 30 days of logs (approx 1000 entries max)
    if (auditLog.length > 1000) {
        auditLog.pop();
    }

    // Also store in chrome.storage for persistence
    chrome.storage.local.get(['auditLog'], (data) => {
        const storedLog = data.auditLog || [];
        storedLog.unshift(entry);
        chrome.storage.local.set({
            auditLog: storedLog.slice(0, 1000)
        });
    });
}

/**
 * Get audit log for transparency
 * @returns {Array}
 */
function getAuditLog() {
    return auditLog.slice(0, 50);
}

// ==================== CACHE MANAGEMENT ====================

/**
 * Check local cache first, then backend
 * @param {string} url - URL to check
 * @returns {Promise<{hit: boolean, result?: string, confidence?: number}>}
 */
async function checkCache(url) {
    // Check local cache first
    const localResult = localCache.get(url);
    if (localResult && (Date.now() - localResult.timestamp < TIMEOUTS.CACHE_EXPIRY)) {
        console.log(`✅ Local cache HIT: ${extractDomain(url)}`);
        return { hit: true, result: localResult.result, confidence: localResult.confidence };
    }

    // Try backend cache
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
            `${API_CONFIG.BACKEND_URL}/cache?url=${encodeURIComponent(url)}`,
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data.hit) {
                localCache.set(url, {
                    result: data.result,
                    timestamp: Date.now(),
                    confidence: data.confidence || 0.5
                });
            }
            return data;
        }
    } catch (error) {
        console.warn('Backend unavailable, using local cache only');
    }

    return { hit: false };
}

/**
 * Save result to cache (local + backend)
 * @param {string} url - URL
 * @param {string} result - Result
 * @param {string} reason - Reason
 * @param {number} confidence - Confidence score
 */
async function saveToCache(url, result, reason, confidence) {
    // Always save locally
    localCache.set(url, { result, timestamp: Date.now(), confidence });

    // Try backend (non-blocking)
    fetch(`${API_CONFIG.BACKEND_URL}/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, result, reason, confidence })
    }).catch(() => { });
}

// ==================== SETTINGS ====================

/**
 * Get settings from backend or local storage
 * @returns {Promise<Object>}
 */
async function getSettings() {
    try {
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/settings`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('Backend settings unavailable');
    }

    return new Promise(resolve => {
        chrome.storage.local.get(
            ['model', 'enabled', 'whitelist', 'showWarning', 'theme'],
            (result) => resolve({
                model: result.model || API_CONFIG.DEFAULT_MODEL,
                enabled: result.enabled !== false,
                whitelist: result.whitelist || [],
                showWarning: result.showWarning !== false,
                theme: result.theme || 'system'
            })
        );
    });
}

// ==================== AI ANALYSIS ====================

/**
 * Analyze text with Ollama AI
 * @param {string} text - Content to analyze
 * @param {string} url - Source URL
 * @param {string} model - AI model to use
 * @returns {Promise<{safe: boolean, confidence: number, reason: string}>}
 */
async function analyzeWithAI(text, url, model) {
    const sanitizedText = sanitizeText(text);

    if (sanitizedText.length < CONTENT_CONFIG.MIN_TEXT_LENGTH) {
        return { safe: true, confidence: 1.0, reason: 'Insufficient content' };
    }

    const prompt = `Analyze this webpage for explicit adult/NSFW content.

URL: ${extractDomain(url)}
Content: ${sanitizedText}

Instructions:
- Reply ONLY with JSON format: {"safe": true/false, "confidence": 0.0-1.0, "reason": "brief reason"}
- Consider context: medical, educational, or artistic content is usually safe
- Look for explicit sexual content, pornography, or graphic material`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST);

        const response = await fetch(API_CONFIG.OLLAMA_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model || API_CONFIG.DEFAULT_MODEL,
                prompt,
                stream: false,
                options: { temperature: 0.1 }
            })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.response?.trim() || '';

        // Try to parse JSON response
        try {
            const parsed = JSON.parse(result);
            return {
                safe: parsed.safe !== false,
                confidence: parseFloat(parsed.confidence) || 0.7,
                reason: parsed.reason || 'AI analysis'
            };
        } catch {
            // Fallback to text parsing
            const isSafe = result.toUpperCase().includes('SAFE') &&
                !result.toUpperCase().includes('UNSAFE');
            return {
                safe: isSafe,
                confidence: 0.6,
                reason: isSafe ? 'Content appears safe' : 'Potential adult content detected'
            };
        }
    } catch (error) {
        console.error('AI analysis error:', error.message);
        // Fail open for availability
        return { safe: true, confidence: 0.5, reason: 'Analysis unavailable - allowing' };
    }
}

// ==================== CONTENT HANDLING ====================

/**
 * Handle content check request from content script
 * @param {Object} request - Request data
 * @param {Object} sender - Sender info
 * @returns {Promise<{action: string, confidence?: number, reason?: string}>}
 */
async function handleContentCheck(request, sender) {
    const { text, url } = request;

    // Validate inputs
    if (!isValidUrl(url)) {
        console.warn('Invalid URL received');
        return { action: 'allow', reason: 'Invalid URL' };
    }

    // Rate limiting
    if (!isRateLimitOk()) {
        console.warn('Rate limited');
        return { action: 'allow', reason: 'Rate limited' };
    }

    // Get settings
    const settings = await getSettings();

    if (!settings.enabled) {
        return { action: 'allow', reason: 'Protection disabled' };
    }

    // Check whitelist
    const domain = extractDomain(url);
    if (settings.whitelist?.some(w => domain.includes(w))) {
        console.log(`Whitelisted: ${domain}`);
        return { action: 'allow', reason: 'Whitelisted domain' };
    }

    // Check cache
    const cached = await checkCache(url);
    if (cached.hit) {
        if (cached.result === 'block') {
            redirectToBlocked(sender.tab.id, url, cached.confidence);
        }
        return { action: cached.result, confidence: cached.confidence };
    }

    // AI Analysis
    stats.scansToday++;
    const analysis = await analyzeWithAI(text, url, settings.model);
    const action = analysis.safe ? 'allow' : 'block';

    // Save to cache
    await saveToCache(url, action, analysis.reason, analysis.confidence);

    // Log for transparency
    logAuditEntry(url, action, analysis.reason, analysis.confidence);

    if (action === 'block') {
        stats.blockedToday++;
        redirectToBlocked(sender.tab.id, url, analysis.confidence, analysis.reason);
    }

    return { action, confidence: analysis.confidence, reason: analysis.reason };
}

/**
 * Redirect to blocked page with context
 * @param {number} tabId - Tab ID
 * @param {string} url - Blocked URL
 * @param {number} confidence - AI confidence
 * @param {string} reason - Block reason
 */
function redirectToBlocked(tabId, url, confidence = 0.5, reason = '') {
    const params = new URLSearchParams({
        url: encodeURIComponent(url),
        confidence: confidence.toFixed(2),
        reason: encodeURIComponent(reason || 'Adult content detected')
    });

    chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL(`blocked.html?${params.toString()}`)
    });
}

// ==================== MESSAGE HANDLERS ====================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handlers = {
        checkContent: () => handleContentCheck(request, sender),
        getStats: () => Promise.resolve({ ...stats, auditLog: getAuditLog() }),
        clearCache: () => {
            localCache.clear();
            return fetch(`${API_CONFIG.BACKEND_URL}/cache`, { method: 'DELETE' })
                .then(() => ({ success: true }))
                .catch(() => ({ success: true, local: true }));
        },
        testConnection: () => testConnection(),
        getAuditLog: () => Promise.resolve(getAuditLog()),
        whitelistUrl: () => addToWhitelist(request.url),
        appealDecision: () => handleAppeal(request.url, request.reason)
    };

    const handler = handlers[request.action];
    if (handler) {
        handler().then(sendResponse);
        return true;
    }
});

/**
 * Test Ollama connection
 * @returns {Promise<{connected: boolean, version?: string}>}
 */
async function testConnection() {
    try {
        const response = await fetch('http://localhost:11434/api/version');
        if (response.ok) {
            const data = await response.json();
            return { connected: true, version: data.version };
        }
    } catch (error) {
        return { connected: false, error: error.message };
    }
    return { connected: false };
}

/**
 * Add URL to whitelist
 * @param {string} url - URL to whitelist
 * @returns {Promise<{success: boolean}>}
 */
async function addToWhitelist(url) {
    const domain = extractDomain(url);
    if (!domain) return { success: false };

    const settings = await getSettings();
    const whitelist = settings.whitelist || [];

    if (!whitelist.includes(domain)) {
        whitelist.push(domain);
        await chrome.storage.local.set({ whitelist });

        // Try to update backend
        fetch(`${API_CONFIG.BACKEND_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...settings, whitelist })
        }).catch(() => { });
    }

    return { success: true, domain };
}

/**
 * Handle appeal for blocked content
 * @param {string} url - Appealed URL
 * @param {string} reason - Appeal reason
 * @returns {Promise<{success: boolean}>}
 */
async function handleAppeal(url, reason) {
    logAuditEntry(url, 'appeal', reason || 'User requested review', 0);

    // Auto-whitelist on appeal (immediate relief)
    const result = await addToWhitelist(url);

    return { success: true, whitelisted: result.success };
}

// ==================== LIFECYCLE ====================

chrome.runtime.onInstalled.addListener(() => {
    console.log('MindShield Pro installed');
    chrome.storage.local.set({
        model: API_CONFIG.DEFAULT_MODEL,
        enabled: true,
        whitelist: [],
        showWarning: true,
        theme: 'system'
    });
});

// Reset daily stats
setInterval(() => {
    const now = Date.now();
    if (now - stats.lastReset > 86400000) {
        stats.scansToday = 0;
        stats.blockedToday = 0;
        stats.lastReset = now;
    }
}, 3600000);

// Handle content script connections
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'content-script') {
        port.onDisconnect.addListener(() => { });
    }
});