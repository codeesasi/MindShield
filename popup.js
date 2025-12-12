/**
 * MindShield Pro - Popup Script
 * Modern UI controller with theme support
 * @module popup
 */

(() => {
    'use strict';

    // ==================== CONSTANTS ====================
    const BACKEND_URL = 'http://localhost:3001/api';
    const DEBOUNCE_MS = 500;

    // ==================== SAFE MESSAGE WRAPPER ====================

    /**
     * Safe wrapper for chrome.runtime.sendMessage that handles port closure
     * @param {Object} message - Message to send
     * @returns {Promise<any>} Response from background
     */
    function sendMessageSafe(message) {
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage(message, (response) => {
                    // Check for runtime.lastError to prevent the console error
                    if (chrome.runtime.lastError) {
                        console.log('Extension message error:', chrome.runtime.lastError.message);
                        resolve(null);
                        return;
                    }
                    resolve(response);
                });
            } catch (error) {
                console.log('Extension not available:', error.message);
                resolve(null);
            }
        });
    }

    // ==================== DOM ELEMENTS ====================
    const elements = {
        statusDot: document.getElementById('statusDot'),
        scansToday: document.getElementById('scansToday'),
        blockedToday: document.getElementById('blockedToday'),
        enabledToggle: document.getElementById('enabledToggle'),
        warningToggle: document.getElementById('warningToggle'),
        modelInput: document.getElementById('modelInput'),
        saveBtn: document.getElementById('saveBtn'),
        clearCacheBtn: document.getElementById('clearCacheBtn'),
        testConnectionBtn: document.getElementById('testConnectionBtn'),
        viewStatsBtn: document.getElementById('viewStatsBtn'),
        themeToggle: document.getElementById('themeToggle'),
        viewAuditLog: document.getElementById('viewAuditLog'),
        toast: document.getElementById('toast'),
        // Whitelist elements
        whitelistCount: document.getElementById('whitelistCount'),
        whitelistContainer: document.getElementById('whitelistContainer'),
        whitelistEmpty: document.getElementById('whitelistEmpty'),
        whitelistList: document.getElementById('whitelistList'),
        addWhitelistInput: document.getElementById('addWhitelistInput'),
        addWhitelistBtn: document.getElementById('addWhitelistBtn'),
        // Collapsible sections
        settingsSection: document.getElementById('settingsSection'),
        whitelistSection: document.getElementById('whitelistSection')
    };

    // Current whitelist state
    let currentWhitelist = [];

    // ==================== THEME MANAGEMENT ====================

    /**
     * Initialize theme based on storage or system preference
     */
    function initTheme() {
        chrome.storage.local.get(['theme'], (result) => {
            const theme = result.theme || 'system';
            applyTheme(theme);
        });
    }

    /**
     * Apply theme to body
     * @param {string} theme - 'light', 'dark', or 'system'
     */
    function applyTheme(theme) {
        const isDark = theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        document.body.classList.remove('light', 'dark');
        document.body.classList.add(isDark ? 'dark' : 'light');
        elements.themeToggle.textContent = isDark ? '☀️' : '🌙';
    }

    /**
     * Toggle between light and dark theme
     */
    function toggleTheme() {
        const isDark = document.body.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
        chrome.storage.local.set({ theme: newTheme });
        showToast('Theme updated', 'success');
    }

    // ==================== TOAST NOTIFICATIONS ====================

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success' or 'error'
     */
    function showToast(message, type = 'success') {
        elements.toast.textContent = message;
        elements.toast.className = `toast ${type} show`;

        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    // ==================== CONNECTION STATUS ====================

    /**
     * Update connection status dot
     * @param {boolean} connected - Is connected
     * @param {string} info - Tooltip info
     */
    function updateConnectionStatus(connected, info = '') {
        const dot = elements.statusDot;
        if (connected) {
            dot.classList.add('online');
        } else {
            dot.classList.remove('online');
        }
        dot.title = info || (connected ? 'Connected' : 'Disconnected');
    }

    /**
     * Check connection to services
     */
    async function checkConnection() {
        try {
            // Test backend and Ollama directly
            const [backendRes, ollamaRes] = await Promise.allSettled([
                fetch(`${BACKEND_URL}/health`, { mode: 'cors' })
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null),
                fetch('http://localhost:11434/api/version', { mode: 'cors' })
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
            ]);

            const backendOk = backendRes.status === 'fulfilled' && backendRes.value?.status === 'ok';
            const ollamaOk = ollamaRes.status === 'fulfilled' && ollamaRes.value?.version;

            if (backendOk && ollamaOk) {
                updateConnectionStatus(true, `Ollama: ${ollamaRes.value.version}`);
            } else if (ollamaOk) {
                updateConnectionStatus(true, `Ollama: ${ollamaRes.value.version} (Backend offline)`);
            } else if (backendOk) {
                updateConnectionStatus(false, 'Ollama offline');
            } else {
                updateConnectionStatus(false, 'Services offline');
            }
        } catch (error) {
            updateConnectionStatus(false, error.message);
        }
    }

    // ==================== SETTINGS ====================

    /**
     * Load settings - show cached first, then refresh
     */
    async function loadSettings() {
        // Show cached settings instantly
        chrome.storage.local.get(['model', 'enabled', 'showWarning', 'cachedSettings'], (result) => {
            applySettings({
                model: result.model || result.cachedSettings?.model || 'gpt-oss:120b-cloud',
                enabled: result.enabled !== false,
                showWarning: result.showWarning !== false
            });
        });

        // Quietly refresh from backend
        try {
            const response = await fetch(`${BACKEND_URL}/settings`);
            if (response.ok) {
                const settings = await response.json();
                applySettings(settings);
                chrome.storage.local.set({ cachedSettings: settings });
            }
        } catch { }
    }

    /**
     * Apply settings to UI
     * @param {Object} settings
     */
    function applySettings(settings) {
        elements.modelInput.value = settings.model || 'gpt-oss:120b-cloud';
        elements.enabledToggle.checked = settings.enabled !== false;
        elements.warningToggle.checked = settings.showWarning !== false;
    }

    /**
     * Save settings
     */
    async function saveSettings() {
        const settings = {
            model: elements.modelInput.value.trim(),
            enabled: elements.enabledToggle.checked,
            showWarning: elements.warningToggle.checked
        };

        if (!settings.model) {
            showToast('Please enter a model name', 'error');
            return;
        }

        // Validate model name
        if (!/^[a-zA-Z0-9][a-zA-Z0-9:.\-_]*$/.test(settings.model)) {
            showToast('Invalid model name format', 'error');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                showToast('Settings saved!', 'success');
            } else {
                throw new Error('Backend error');
            }
        } catch {
            // Fallback to local storage
            chrome.storage.local.set(settings);
            showToast('Saved locally', 'success');
        }
    }

    // ==================== STATS ====================

    /**
     * Load statistics - show cached first, then refresh
     */
    async function loadStats() {
        // Show cached stats instantly
        chrome.storage.local.get(['cachedStats'], (result) => {
            if (result.cachedStats) {
                elements.scansToday.textContent = result.cachedStats.total || 0;
                elements.blockedToday.textContent = result.cachedStats.blocked || 0;
            }
        });

        // Quietly refresh from backend
        try {
            const response = await fetch(`${BACKEND_URL}/cache/stats`);
            if (response.ok) {
                const stats = await response.json();
                elements.scansToday.textContent = stats.total || 0;
                elements.blockedToday.textContent = stats.blocked || 0;
                chrome.storage.local.set({ cachedStats: stats });
                return;
            }
        } catch { }

        // Fallback to runtime message
        sendMessageSafe({ action: 'getStats' }).then((response) => {
            if (response) {
                elements.scansToday.textContent = response.scansToday || 0;
                elements.blockedToday.textContent = response.blockedToday || 0;
                chrome.storage.local.set({ cachedStats: { total: response.scansToday, blocked: response.blockedToday } });
            }
        }).catch(() => { });
    }

    // ==================== CACHE ====================

    /**
     * Clear cache
     */
    async function clearCache() {
        elements.clearCacheBtn.disabled = true;
        elements.clearCacheBtn.textContent = '⏳ Clearing...';

        try {
            await fetch(`${BACKEND_URL}/cache`, { method: 'DELETE' });
            showToast('Cache cleared!', 'success');
        } catch {
            sendMessageSafe({ action: 'clearCache' });
            showToast('Local cache cleared', 'success');
        }

        elements.clearCacheBtn.disabled = false;
        elements.clearCacheBtn.textContent = '🗑️ Clear Cache';
        loadStats();
    }

    // ==================== WHITELIST MANAGEMENT ====================

    /**
     * Load whitelist from storage
     */
    /**
     * Load whitelist - show cached first, then refresh
     */
    async function loadWhitelist() {
        // Show cached whitelist instantly
        chrome.storage.local.get(['whitelist', 'cachedWhitelist'], (result) => {
            currentWhitelist = result.whitelist || result.cachedWhitelist || [];
            renderWhitelist();
        });

        // Quietly refresh from backend
        try {
            const response = await fetch(`${BACKEND_URL}/settings`);
            if (response.ok) {
                const settings = await response.json();
                currentWhitelist = settings.whitelist || [];
                renderWhitelist();
                chrome.storage.local.set({ cachedWhitelist: currentWhitelist });
            }
        } catch { }
    }



    /**
     * Render whitelist to UI
     */
    function renderWhitelist() {
        // Update stats row counter
        elements.whitelistCount.textContent = currentWhitelist.length;

        if (currentWhitelist.length === 0) {
            elements.whitelistList.innerHTML = '<div class="whitelist-empty">No whitelisted sites</div>';
        } else {
            elements.whitelistList.innerHTML = currentWhitelist.map(domain => `
                <div class="whitelist-item">
                    <span>🌐 ${escapeHtml(domain)}</span>
                    <button class="whitelist-remove" data-domain="${escapeHtml(domain)}">×</button>
                </div>
            `).join('');

            // Add event listeners to remove buttons
            elements.whitelistList.querySelectorAll('.whitelist-remove').forEach(btn => {
                btn.addEventListener('click', () => removeFromWhitelist(btn.dataset.domain));
            });
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Add domain to whitelist
     */
    async function addToWhitelist() {
        const domain = elements.addWhitelistInput.value.trim().toLowerCase();

        if (!domain) {
            showToast('Please enter a domain', 'error');
            return;
        }

        // Validate domain format
        if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(domain)) {
            showToast('Invalid domain format', 'error');
            return;
        }

        if (currentWhitelist.includes(domain)) {
            showToast('Domain already whitelisted', 'error');
            return;
        }

        currentWhitelist.push(domain);
        elements.addWhitelistInput.value = '';

        await saveWhitelist();
        renderWhitelist();
        showToast(`${domain} added to whitelist`, 'success');
    }

    /**
     * Remove domain from whitelist
     */
    async function removeFromWhitelist(domain) {
        currentWhitelist = currentWhitelist.filter(d => d !== domain);
        await saveWhitelist();
        renderWhitelist();
        showToast(`${domain} removed from whitelist`, 'success');
    }

    /**
     * Save whitelist to storage
     */
    async function saveWhitelist() {
        // Always save to local cache so next load is instant
        chrome.storage.local.set({ cachedWhitelist: currentWhitelist });

        try {
            await fetch(`${BACKEND_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whitelist: currentWhitelist })
            });
        } catch {
            // Fallback for offline (already saved to cache above)
            chrome.storage.local.set({ whitelist: currentWhitelist });
        }
    }

    // ==================== TEST CONNECTION ====================

    /**
     * Test connection with feedback
     */
    async function testConnection() {
        elements.testConnectionBtn.disabled = true;
        elements.testConnectionBtn.innerHTML = '<span class="spinner"></span>';

        await checkConnection();

        elements.testConnectionBtn.disabled = false;
        elements.testConnectionBtn.textContent = '🔌 Test';

        const isConnected = elements.connectionStatus.classList.contains('connected');
        showToast(isConnected ? 'All services connected!' : 'Connection issues',
            isConnected ? 'success' : 'error');
    }

    // ==================== EVENT LISTENERS ====================

    function setupEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Save button
        elements.saveBtn.addEventListener('click', saveSettings);

        // Auto-save on toggle changes
        elements.enabledToggle.addEventListener('change', saveSettings);
        elements.warningToggle.addEventListener('change', saveSettings);

        // Debounced auto-save on model input
        let modelDebounce;
        elements.modelInput.addEventListener('input', () => {
            clearTimeout(modelDebounce);
            modelDebounce = setTimeout(saveSettings, DEBOUNCE_MS);
        });

        // Clear cache
        elements.clearCacheBtn.addEventListener('click', clearCache);

        // Test connection
        elements.testConnectionBtn.addEventListener('click', testConnection);

        // View analytics
        elements.viewStatsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('survey.html') });
        });

        // View audit log
        elements.viewAuditLog.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessageSafe({ action: 'getAuditLog' }).then((log) => {
                if (log && log.length > 0) {
                    console.table(log);
                    showToast('Audit log printed to console', 'success');
                } else {
                    showToast('No audit entries yet', 'success');
                }
            });
        });

        // Whitelist add button
        elements.addWhitelistBtn.addEventListener('click', addToWhitelist);

        // Whitelist add on Enter key
        elements.addWhitelistInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addToWhitelist();
        });

        // Collapsible sections with state persistence
        [elements.settingsSection, elements.whitelistSection].forEach(section => {
            if (section) {
                section.querySelector('.section-header').addEventListener('click', () => {
                    section.classList.toggle('collapsed');
                    saveCollapsedState();
                });
            }
        });
    }

    /**
     * Save collapsed section state to storage
     */
    function saveCollapsedState() {
        const state = {
            settingsCollapsed: elements.settingsSection?.classList.contains('collapsed'),
            whitelistCollapsed: elements.whitelistSection?.classList.contains('collapsed')
        };
        chrome.storage.local.set({ collapsedState: state });
    }

    /**
     * Restore collapsed section state from storage
     */
    function restoreCollapsedState() {
        chrome.storage.local.get(['collapsedState'], (result) => {
            const state = result.collapsedState || {};
            if (state.settingsCollapsed && elements.settingsSection) {
                elements.settingsSection.classList.add('collapsed');
            }
            if (state.whitelistCollapsed && elements.whitelistSection) {
                elements.whitelistSection.classList.add('collapsed');
            }
        });
    }

    // ==================== INITIALIZATION ====================

    function init() {
        initTheme();
        restoreCollapsedState();
        setupEventListeners();
        loadSettings();
        loadStats();
        loadWhitelist();
        checkConnection();

        // Auto-refresh stats
        setInterval(loadStats, 10000);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();