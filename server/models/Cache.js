const mongoose = require('mongoose');

const cacheSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true, index: true },
    content: { type: String, default: '' },
    result: { type: String, enum: ['allow', 'block'], required: true },
    reason: { type: String, default: '' },
    scannedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 3600000) } // 1 hour
}, { timestamps: true });

// TTL index to auto-delete expired entries
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Cache', cacheSchema);
