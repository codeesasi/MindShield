const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    _id: { type: String, default: 'default' },
    model: { type: String, default: 'gpt-oss:120b-cloud' },
    enabled: { type: Boolean, default: true },
    whitelist: { type: [String], default: [] },
    showWarning: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
