/**
 * MindShield Pro - Constants
 * Centralized configuration values following SonarQube standards
 * @module constants
 */

// API Configuration
export const API_CONFIG = {
    BACKEND_URL: 'http://localhost:3001/api',
    OLLAMA_URL: 'http://localhost:11434/api/generate',
    DEFAULT_MODEL: 'gpt-oss:120b-cloud'
};

// Timeouts (in milliseconds)
export const TIMEOUTS = {
    API_REQUEST: 15000,
    DEBOUNCE_SCAN: 2000,
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    MESSAGE_DISPLAY: 3000,
    CONNECTION_CHECK: 5000
};

// Rate Limiting
export const RATE_LIMITS = {
    MAX_REQUESTS_PER_MINUTE: 60,
    COOLDOWN_MS: 1000
};

// Content Analysis
export const CONTENT_CONFIG = {
    MAX_TEXT_LENGTH: 1500,
    MIN_TEXT_LENGTH: 10,
    MAX_URL_LENGTH: 2048
};

// Error Messages
export const ERROR_MESSAGES = {
    INVALID_URL: 'Invalid URL provided',
    TIMEOUT: 'Request timed out',
    CONNECTION_FAILED: 'Failed to connect to service',
    INVALID_INPUT: 'Invalid input provided',
    RATE_LIMITED: 'Too many requests, please wait'
};

// Success Messages  
export const SUCCESS_MESSAGES = {
    SETTINGS_SAVED: 'Settings saved successfully',
    CACHE_CLEARED: 'Cache cleared successfully',
    CONNECTED: 'All services connected'
};

// AI Governance
export const AI_GOVERNANCE = {
    AUDIT_RETENTION_DAYS: 30,
    MAX_APPEAL_REASON_LENGTH: 500,
    TRANSPARENCY_ENABLED: true
};

// CSS Classes for UI state
export const UI_CLASSES = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success'
};
