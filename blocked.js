/**
 * MindShield Pro - Blocked Page Script
 * Handles appeal process and navigation
 * @module blocked
 */

(() => {
    'use strict';

    // ==================== DOM ELEMENTS ====================
    const elements = {
        blockedUrl: document.getElementById('blockedUrl'),
        reasonText: document.getElementById('reasonText'),
        confidenceBar: document.getElementById('confidenceBar'),
        confidenceValue: document.getElementById('confidenceValue'),
        goBackBtn: document.getElementById('goBackBtn'),
        goHomeBtn: document.getElementById('goHomeBtn'),
        appealBtn: document.getElementById('appealBtn'),
        viewStatsLink: document.getElementById('viewStatsLink'),
        appealModal: document.getElementById('appealModal'),
        appealReason: document.getElementById('appealReason'),
        cancelAppeal: document.getElementById('cancelAppeal'),
        submitAppeal: document.getElementById('submitAppeal'),
        toast: document.getElementById('toast')
    };

    // Store blocked URL
    let blockedUrl = '';

    // ==================== INITIALIZATION ====================

    /**
     * Parse URL parameters and display info
     */
    function init() {
        const params = new URLSearchParams(window.location.search);

        // Get blocked URL
        blockedUrl = decodeURIComponent(params.get('url') || '');
        if (blockedUrl) {
            elements.blockedUrl.textContent = sanitizeUrl(blockedUrl);
        } else {
            elements.blockedUrl.textContent = 'URL not available';
        }

        // Get reason
        const reason = decodeURIComponent(params.get('reason') || 'Potential adult content detected');
        elements.reasonText.textContent = reason;

        // Get confidence
        const confidence = parseFloat(params.get('confidence') || '0.75');
        animateConfidence(confidence);

        // Setup event listeners
        setupEventListeners();
    }

    /**
     * Sanitize URL for display (remove sensitive params)
     * @param {string} url - URL to sanitize
     * @returns {string}
     */
    function sanitizeUrl(url) {
        try {
            const parsed = new URL(url);
            // Remove sensitive query parameters
            ['token', 'key', 'password', 'secret', 'auth', 'session'].forEach(
                param => parsed.searchParams.delete(param)
            );

            // Truncate if too long
            const display = parsed.toString();
            if (display.length > 100) {
                return display.slice(0, 97) + '...';
            }
            return display;
        } catch {
            return 'Invalid URL';
        }
    }

    /**
     * Animate confidence bar
     * @param {number} confidence - 0-1 value
     */
    function animateConfidence(confidence) {
        const percent = Math.round(confidence * 100);

        // Delay for animation effect
        setTimeout(() => {
            elements.confidenceBar.style.width = `${percent}%`;
            elements.confidenceValue.textContent = `${percent}% confident this content should be blocked`;
        }, 300);
    }

    /**
     * Show toast message
     * @param {string} message
     */
    function showToast(message) {
        elements.toast.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => elements.toast.classList.remove('show'), 3000);
    }

    // ==================== EVENT HANDLERS ====================

    function setupEventListeners() {
        // Go back
        elements.goBackBtn.addEventListener('click', () => {
            if (window.history.length > 2) {
                window.history.go(-2); // Go back before the blocked page
            } else {
                window.history.back();
            }
        });

        // Go home
        elements.goHomeBtn.addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });

        // Open appeal modal
        elements.appealBtn.addEventListener('click', () => {
            elements.appealModal.classList.add('open');
            elements.appealReason.focus();
        });

        // Cancel appeal
        elements.cancelAppeal.addEventListener('click', () => {
            elements.appealModal.classList.remove('open');
            elements.appealReason.value = '';
        });

        // Close modal on outside click
        elements.appealModal.addEventListener('click', (e) => {
            if (e.target === elements.appealModal) {
                elements.appealModal.classList.remove('open');
            }
        });

        // Submit appeal
        elements.submitAppeal.addEventListener('click', submitAppeal);

        // View stats
        elements.viewStatsLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (chrome.runtime && chrome.runtime.getURL) {
                chrome.tabs.create({ url: chrome.runtime.getURL('survey.html') });
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.appealModal.classList.contains('open')) {
                elements.appealModal.classList.remove('open');
            }
        });
    }

    /**
     * Submit appeal and whitelist URL
     */
    async function submitAppeal() {
        const reason = elements.appealReason.value.trim().slice(0, 500);

        elements.submitAppeal.disabled = true;
        elements.submitAppeal.textContent = 'Processing...';

        try {
            // Send appeal to background script
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: 'appealDecision',
                    url: blockedUrl,
                    reason: reason || 'User requested review'
                }, resolve);
            });

            if (response && response.success) {
                showToast('Site whitelisted! Redirecting...');

                // Redirect to original URL after brief delay
                setTimeout(() => {
                    if (blockedUrl) {
                        window.location.href = blockedUrl;
                    }
                }, 1500);
            } else {
                throw new Error('Appeal failed');
            }
        } catch (error) {
            elements.submitAppeal.disabled = false;
            elements.submitAppeal.textContent = '✓ Whitelist & Continue';
            showToast('Error processing request');
        }
    }

    // ==================== START ====================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
