/**
 * MindShield Pro - Validators
 * Input validation and sanitization utilities
 * @module validators
 */

import { CONTENT_CONFIG, ERROR_MESSAGES } from './constants.js';

/**
 * Validates if a string is a properly formatted URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    if (url.length > CONTENT_CONFIG.MAX_URL_LENGTH) {
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
 * Sanitizes text content to prevent XSS and injection attacks
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
        .slice(0, CONTENT_CONFIG.MAX_TEXT_LENGTH);
}

/**
 * Validates model name input
 * @param {string} model - Model name to validate
 * @returns {boolean} True if valid model name
 */
export function isValidModelName(model) {
    if (!model || typeof model !== 'string') {
        return false;
    }

    // Model names should be alphanumeric with : - . _ allowed
    const modelPattern = /^[a-zA-Z0-9][a-zA-Z0-9:.\-_]*$/;
    return modelPattern.test(model) && model.length <= 100;
}

/**
 * Sanitizes URL for display (removes sensitive params)
 * @param {string} url - URL to sanitize for display
 * @returns {string} Sanitized URL
 */
export function sanitizeUrlForDisplay(url) {
    if (!isValidUrl(url)) {
        return 'Invalid URL';
    }

    try {
        const parsed = new URL(url);
        // Remove sensitive query parameters
        const sensitiveParams = ['token', 'key', 'password', 'secret', 'auth'];
        sensitiveParams.forEach(param => parsed.searchParams.delete(param));
        return parsed.toString();
    } catch {
        return 'Invalid URL';
    }
}

/**
 * Extracts domain from URL safely
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name or empty string
 */
export function extractDomain(url) {
    if (!isValidUrl(url)) {
        return '';
    }

    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

/**
 * Validates whitelist entry
 * @param {string} domain - Domain to validate
 * @returns {boolean} True if valid domain format
 */
export function isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') {
        return false;
    }

    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return domainPattern.test(domain) && domain.length <= 253;
}

/**
 * Truncates text for safe logging (no sensitive data)
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateForLog(text, maxLength = 100) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.slice(0, maxLength) + '...';
}

/**
 * Rate limiter class for preventing API abuse
 */
export class RateLimiter {
    constructor(maxRequests = 60, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    /**
     * Check if request is allowed
     * @returns {boolean} True if request is allowed
     */
    isAllowed() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);

        if (this.requests.length >= this.maxRequests) {
            return false;
        }

        this.requests.push(now);
        return true;
    }

    /**
     * Get remaining requests in current window
     * @returns {number} Number of remaining requests
     */
    getRemaining() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - this.requests.length);
    }
}
