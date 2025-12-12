/**
 * MindShield Pro - Backend Server
 * Secure Express server with MongoDB
 * @module server
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Models
const Settings = require('./models/Settings');
const Cache = require('./models/Cache');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/content-blocker';

// ==================== SECURITY MIDDLEWARE ====================

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// CORS configuration
const corsOptions = {
    origin: [
        'chrome-extension://*',
        'http://localhost:*',
        'http://127.0.0.1:*'
    ],
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
    maxAge: 86400
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(limiter);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// ==================== INPUT VALIDATION ====================

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string' || url.length > 2048) {
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
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
function sanitize(str, maxLength = 500) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .trim()
        .slice(0, maxLength);
}

// ==================== DATABASE CONNECTION ====================

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Handle connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
});

// ==================== SETTINGS ENDPOINTS ====================

/**
 * GET /api/settings - Retrieve settings
 */
app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findById('default').lean();
        if (!settings) {
            settings = await Settings.create({
                _id: 'default',
                model: 'gpt-oss:120b-cloud',
                enabled: true,
                whitelist: [],
                showWarning: true
            });
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/settings - Update settings
 */
app.post('/api/settings', async (req, res) => {
    try {
        const { model, enabled, whitelist, showWarning } = req.body;

        // Validate model name
        const safeModel = sanitize(model, 100);
        if (safeModel && !/^[a-zA-Z0-9][a-zA-Z0-9:.\-_]*$/.test(safeModel)) {
            return res.status(400).json({ error: 'Invalid model name' });
        }

        // Validate whitelist
        const safeWhitelist = Array.isArray(whitelist)
            ? whitelist.filter(d => typeof d === 'string').map(d => sanitize(d, 253))
            : undefined;

        const settings = await Settings.findByIdAndUpdate(
            'default',
            {
                model: safeModel || undefined,
                enabled: typeof enabled === 'boolean' ? enabled : undefined,
                whitelist: safeWhitelist,
                showWarning: typeof showWarning === 'boolean' ? showWarning : undefined
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== CACHE ENDPOINTS ====================

/**
 * GET /api/cache - Check cache for URL
 */
app.get('/api/cache', async (req, res) => {
    try {
        const { url } = req.query;

        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        const cached = await Cache.findOne({
            url,
            expiresAt: { $gt: new Date() }
        }).lean();

        if (cached) {
            res.json({
                hit: true,
                result: cached.result,
                confidence: cached.confidence || 0.5
            });
        } else {
            res.json({ hit: false });
        }
    } catch (error) {
        console.error('Error checking cache:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/cache - Save to cache
 */
app.post('/api/cache', async (req, res) => {
    try {
        const { url, content, result, reason, confidence } = req.body;

        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        if (!['allow', 'block'].includes(result)) {
            return res.status(400).json({ error: 'Invalid result' });
        }

        const cached = await Cache.findOneAndUpdate(
            { url },
            {
                url,
                content: sanitize(content, 500),
                result,
                reason: sanitize(reason, 200),
                confidence: Math.min(1, Math.max(0, parseFloat(confidence) || 0.5)),
                scannedAt: new Date(),
                expiresAt: new Date(Date.now() + 3600000) // 1 hour
            },
            { new: true, upsert: true }
        );

        res.json(cached);
    } catch (error) {
        console.error('Error saving to cache:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/cache - Clear all cache
 */
app.delete('/api/cache', async (req, res) => {
    try {
        await Cache.deleteMany({});
        res.json({ success: true, message: 'Cache cleared' });
    } catch (error) {
        console.error('Error clearing cache:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/cache/stats - Get cache statistics
 */
app.get('/api/cache/stats', async (req, res) => {
    try {
        const [total, blocked, allowed] = await Promise.all([
            Cache.countDocuments(),
            Cache.countDocuments({ result: 'block' }),
            Cache.countDocuments({ result: 'allow' })
        ]);

        res.json({ total, blocked, allowed });
    } catch (error) {
        console.error('Error getting stats:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/cache/all - Get all cache entries (for charts)
 */
app.get('/api/cache/all', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const skip = (page - 1) * limit;

        const entries = await Cache.find({})
            .sort({ scannedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('url result scannedAt confidence')
            .lean();

        res.json(entries);
    } catch (error) {
        console.error('Error getting cache entries:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1,
        uptime: process.uptime(),
        version: '3.0.0'
    });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
    console.log(`🚀 MindShield Pro Server v3.0.0`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   MongoDB: ${MONGO_URI}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});
