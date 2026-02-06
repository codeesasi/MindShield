const mongoose = require('mongoose');

const cacheSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true, index: true },
    content: { type: String, default: '' },
    result: { type: String, enum: ['allow', 'block'], required: true },
    reason: { type: String, default: '' },
    scannedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date } // Optional - no auto-expiration
}, { timestamps: true });

// TTL index removed - cache will be stored permanently
// To manually clean old entries, you can run: db.caches.deleteMany({ scannedAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) } })

module.exports = mongoose.model('Cache', cacheSchema);
