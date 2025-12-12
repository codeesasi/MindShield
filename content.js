/**
 * MindShield Pro - Content Script
 * Secure DOM analysis with minimal data exposure
 * @module content
 */

(() => {
    'use strict';

    // ==================== CONSTANTS ====================
    const CONFIG = {
        MIN_TEXT_LENGTH: 10,
        MAX_TEXT_LENGTH: 1500,
        DEBOUNCE_MS: 2000,
        MUTATION_DEBOUNCE_MS: 2000
    };

    // ==================== STATE ====================
    let isAlive = true;
    let port = null;
    let debounceTimeout = null;
    let observer = null;
    let hasScanned = false;

    // ==================== VALIDATORS ====================

    /**
     * Sanitize text to remove sensitive patterns
     * @param {string} text - Raw text
     * @returns {string} Sanitized text
     */
    function sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';

        return text
            // Remove potential passwords/secrets
            .replace(/password\s*[:=]\s*\S+/gi, '[REDACTED]')
            .replace(/token\s*[:=]\s*\S+/gi, '[REDACTED]')
            .replace(/api[_-]?key\s*[:=]\s*\S+/gi, '[REDACTED]')
            // Remove email addresses
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            // Remove credit card patterns
            .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, CONFIG.MAX_TEXT_LENGTH);
    }

    /**
     * Check if current page is sensitive (login, payment, etc.)
     * @returns {boolean}
     */
    function isSensitivePage() {
        try {
            // Check for password fields
            if (document.querySelector('input[type="password"]')) {
                console.log('[CB Pro] Sensitive page detected: password field');
                return true;
            }

            // Check URL patterns
            const sensitivePatterns = [
                /login/i, /signin/i, /sign-in/i,
                /checkout/i, /payment/i, /billing/i,
                /account/i, /password/i, /auth/i
            ];

            if (sensitivePatterns.some(p => p.test(window.location.href))) {
                console.log('[CB Pro] Sensitive page detected: URL pattern');
                return true;
            }

            // Check for payment forms
            const paymentSelectors = [
                'input[autocomplete="cc-number"]',
                'input[autocomplete="cc-exp"]',
                'input[autocomplete="cc-csc"]',
                'input[name*="card"]',
                'input[name*="cvv"]'
            ];

            if (paymentSelectors.some(sel => document.querySelector(sel))) {
                console.log('[CB Pro] Sensitive page detected: payment form');
                return true;
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    // ==================== EXTENSION COMMUNICATION ====================

    /**
     * Setup connection to background script
     * @returns {boolean} Success
     */
    function setupConnection() {
        try {
            port = chrome.runtime.connect({ name: 'content-script' });

            port.onDisconnect.addListener(() => {
                isAlive = false;
                cleanup();
            });

            return true;
        } catch (e) {
            isAlive = false;
            return false;
        }
    }

    /**
     * Check if extension is still alive
     * @returns {boolean}
     */
    function checkAlive() {
        if (!isAlive) return false;

        try {
            return !!(chrome.runtime && chrome.runtime.id);
        } catch {
            isAlive = false;
            return false;
        }
    }

    // ==================== CONTENT EXTRACTION ====================

    /**
     * Extract visible text content from page
     * @returns {string}
     */
    function extractContent() {
        try {
            if (!document.body) return '';

            // Get visible text only
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;

                        // Skip hidden elements
                        const style = window.getComputedStyle(parent);
                        if (style.display === 'none' || style.visibility === 'hidden') {
                            return NodeFilter.FILTER_REJECT;
                        }

                        // Skip scripts, styles, etc.
                        const tag = parent.tagName.toLowerCase();
                        if (['script', 'style', 'noscript', 'iframe'].includes(tag)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            let text = '';
            let node;
            while ((node = walker.nextNode()) && text.length < CONFIG.MAX_TEXT_LENGTH) {
                text += node.textContent + ' ';
            }

            return sanitizeText(text);
        } catch (e) {
            return '';
        }
    }

    // ==================== SCANNING ====================

    /**
     * Perform page scan
     */
    function scanPage() {
        if (!checkAlive()) {
            cleanup();
            return;
        }

        // Skip sensitive pages
        if (isSensitivePage()) {
            return;
        }

        const text = extractContent();
        if (text.length < CONFIG.MIN_TEXT_LENGTH) {
            return;
        }

        hasScanned = true;

        try {
            chrome.runtime.sendMessage({
                action: 'checkContent',
                text: text,
                url: window.location.href
            }, (response) => {
                if (chrome.runtime.lastError) {
                    const msg = chrome.runtime.lastError.message || '';
                    if (msg.includes('context invalidated') ||
                        msg.includes('Extension context')) {
                        isAlive = false;
                        cleanup();
                    }
                    return;
                }

                if (response) {
                    console.log(`[CB Pro] Scan result: ${response.action}`);
                }
            });
        } catch (error) {
            isAlive = false;
            cleanup();
        }
    }

    /**
     * Debounced scan trigger
     */
    function debouncedScan() {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
            if (checkAlive()) {
                scanPage();
            }
        }, CONFIG.DEBOUNCE_MS);
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup all resources
     */
    function cleanup() {
        isAlive = false;

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }

        if (observer) {
            observer.disconnect();
            observer = null;
        }

        if (port) {
            try { port.disconnect(); } catch { }
            port = null;
        }
    }

    // ==================== INITIALIZATION ====================

    function init() {
        if (!setupConnection()) {
            console.log('[CB Pro] Failed to connect to extension');
            return;
        }

        // Initial scan
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (checkAlive()) scanPage();
            });
        } else {
            scanPage();
        }

        // Setup mutation observer for SPAs
        try {
            observer = new MutationObserver((mutations) => {
                if (!checkAlive()) {
                    cleanup();
                    return;
                }

                // Only rescan if significant changes
                const significant = mutations.some(m =>
                    m.addedNodes.length > 5 ||
                    (m.target.textContent?.length || 0) > 500
                );

                if (significant && !hasScanned) {
                    debouncedScan();
                }
            });

            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        } catch (e) {
            console.log('[CB Pro] Observer setup failed');
        }
    }

    // Cleanup on page hide (pagehide is the modern replacement for unload)
    window.addEventListener('pagehide', cleanup);

    // Start
    init();
})();
