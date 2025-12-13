# 🛡️ MindShield Pro

**AI-Powered Content Protection for Browsers - Privacy-First, Locally Processed**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/yourusername/content-blocker-pro)
[![Chrome](https://img.shields.io/badge/chrome-v100+-green.svg)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-v16+-brightgreen.svg)](https://nodejs.org/)

---

## 🎯 Overview

**MindShield Pro** is an advanced browser extension that uses artificial intelligence to analyze and filter web content in real-time. By leveraging local AI models through Ollama, it provides intelligent content moderation while keeping your browsing data private and secure.

> 💡 **Privacy First:** All content analysis happens locally using your own AI model. No browsing data is sent to external servers or third parties.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Powered Analysis** | Uses local LLM models via Ollama to intelligently analyze webpage content |
| ⚡ **Real-Time Protection** | Scans pages as you browse with minimal performance impact |
| 🎨 **Modern UI** | Beautiful glassmorphism design with dark/light theme support |
| 📊 **Analytics Dashboard** | Track browsing safety with interactive charts and history |
| 🔒 **Security Hardened** | XSS prevention, rate limiting, CSP compliance, data redaction |
| 📋 **Whitelist Management** | Easy domain management with instant sync |
| 🎯 **Smart Caching** | Triple-layer caching system for fast performance |
| 📝 **Audit Logging** | Complete transparency with detailed AI decision logs |
| 🔄 **Appeal System** | User empowerment with dispute mechanism |

---

## 🛡️ AI Governance & Compliance

Built-in transparency and accountability features:

### Audit Logging
- **Complete History:** Every AI decision logged with timestamp, URL, result, and reasoning
- **Confidence Scores:** View the AI's confidence level (0-100%) for each decision
- **Exportable Data:** Access logs via console or API for compliance reporting

### User Control & Appeals
- **Appeal Mechanism:** Users can dispute AI decisions on blocked pages
- **Automatic Whitelisting:** Appeals instantly whitelist the domain
- **User Override:** Complete control - users can always access content via appeal

### Compliance Features
- **GDPR-Ready:** All processing is local, no data transfer to third parties
- **Audit Trail:** Complete decision history for regulatory requirements
- **Data Minimization:** Only visible text is analyzed, sensitive data redacted

---

## 📦 Installation

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | v16+ | Backend server runtime |
| **MongoDB** | v5+ | Data persistence |
| **Ollama** | Latest | Local AI model hosting |
| **Chrome** | v100+ | Browser compatibility |

### Step-by-Step Guide

#### 1️⃣ Install Ollama

Download from [https://ollama.ai](https://ollama.ai) and pull your preferred model:

```bash
# Recommended model (default)
ollama pull gpt-oss:120b-cloud

# Alternative models
ollama pull llama3.2:3b
ollama pull mistral:latest

# Verify installation
ollama list
```

#### 2️⃣ Set Up MongoDB

```bash
# Start MongoDB (Windows)
mongod --dbpath=C:\data\db

# Start MongoDB (Linux/Mac)
sudo systemctl start mongod

# Verify connection
mongosh
```

#### 3️⃣ Configure Backend Server

```bash
# Navigate to server directory
cd d:\Extension\server

# Install dependencies
npm install

# (Optional) Create .env file
echo MONGO_URI=mongodb://localhost:27017/content-blocker > .env
echo PORT=3001 >> .env

# Start the server
npm start
```

✅ **Expected Output:**
```
MongoDB Connected
Server running on port 3001
```

#### 4️⃣ Load Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `d:\Extension` folder
5. Grant **"On all sites"** permission when prompted

#### 5️⃣ Verify Installation

1. Click the extension icon in Chrome toolbar
2. Check the status dot in popup (should be green 🟢)
3. Click **"Test Connection"** button
4. Verify stats are loading

---

## 🚀 Quick Start with Batch Files (Windows)

For convenience, use the provided batch files to manage all services:

### One-Time Setup

Install PM2 globally (process manager):

```bash
npm install -g pm2
```

### Start All Services

```bash
cd d:\Extension
start-services.bat
```

This automatically:
- Installs npm dependencies
- Starts MongoDB
- Starts Ollama
- Starts backend server with PM2 (auto-restart, watch mode)

### Stop All Services

```bash
stop-services.bat
```

### Enable Auto-Start on Login

```bash
# Run as Administrator
setup-autostart.bat
```

Services will now start automatically when you log in to Windows.

### PM2 Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | View all running processes |
| `pm2 logs content-blocker` | Stream backend logs |
| `pm2 restart content-blocker` | Restart backend server |
| `pm2 stop content-blocker` | Stop backend |
| `pm2 monit` | Real-time monitoring dashboard |

---

## ⚙️ Configuration

### Extension Settings

Access via popup interface:

| Setting | Default | Description |
|---------|---------|-------------|
| **AI Model** | `gpt-oss:120b-cloud` | Ollama model name for content analysis |
| **Protection** | ✅ Enabled | Master toggle for content scanning |
| **Show Reason** | ✅ Enabled | Display AI reasoning on blocked pages |
| **Theme** | System | Light, Dark, or System preference |

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/content-blocker

# Server Port
PORT=3001

# (Optional) Node Environment
NODE_ENV=development
```

---

## 🚀 Usage Guide

### Basic Workflow

1. **Browse Normally** → Extension monitors pages automatically
2. **AI Analysis** → Content analyzed in real-time using local model
3. **Smart Blocking** → Harmful content triggers block page with explanation
4. **User Control** → Review decisions, whitelist sites, or request appeals

### Popup Interface

#### 📊 Stats Row
- **Scans Today** - Total pages analyzed
- **Blocked Today** - Pages blocked by AI
- **Whitelist** - Number of trusted domains

#### ⚙️ Settings Section
- Toggle protection on/off
- Toggle block reason display
- Change AI model
- Quick actions: Clear Cache, Test Connection, View Stats

#### 📋 Whitelist Section
- View all whitelisted domains
- Add domains manually
- Remove domains with one-click

### Analytics Dashboard

Access: Popup → **📊 View Analytics Dashboard**

Features:
- 📈 **Timeline Chart:** 24-hour scan/block activity
- 🍩 **Pie Chart:** Allow vs. Block ratio
- 📜 **History Table:** Paginated scan history
- ✅ **Offline Mode:** Falls back to local audit logs when backend unavailable

---

## 🗂️ Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│                Chrome Extension                     │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐              │
│  │ Content      │───▶│ Background   │              │
│  │ Script       │◀───│ Worker       │              │
│  └──────────────┘    └──────┬───────┘              │
│                             │                       │
│  ┌──────────────┐           │                       │
│  │ Popup UI     │───────────┤                       │
│  └──────────────┘           │                       │
│                             │                       │
│  ┌──────────────┐           │                       │
│  │ Blocked Page │───────────┘                       │
│  └──────────────┘                                   │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/REST
                 │
        ┌────────▼────────┐         ┌──────────────┐
        │  Backend Server │────────▶│   MongoDB    │
        │   (Express.js)  │◀────────│   Database   │
        └────────┬────────┘         └──────────────┘
                 │ HTTP
                 │
        ┌────────▼────────┐
        │     Ollama      │
        │   (Local LLM)   │
        └─────────────────┘
```

### Triple-Layer Caching System

| Layer | Storage | TTL | Purpose |
|-------|---------|-----|---------|
| **L1: Memory** | JavaScript Map | 5 minutes | Fastest access, session-based |
| **L2: Chrome Storage** | chrome.storage.local | Persistent | Offline capability, instant UI |
| **L3: Backend DB** | MongoDB | Permanent | Cross-session, analytics, sync |

**Cache Priority:**
1. Check L1 (Map) → Return if hit
2. Check L2 (Storage) → Save to L1 if hit
3. Check L3 (MongoDB) → Save to L1 & L2 if hit
4. Query Ollama → Save to L1, L2, L3

---

## 🔧 Troubleshooting

### ❌ "Services offline" in popup

**Symptoms:** Red status dot in popup

**Solutions:**
1. Start Ollama:
   ```bash
   ollama serve
   ```

2. Start backend:
   ```bash
   cd d:\Extension\server
   npm start
   ```

3. Test connection: Click "🔌 Test" button in popup

---

### ❌ Slow page loading

**Solutions:**
- Use a smaller/faster AI model (e.g., `llama3.2:3b`)
- Whitelist frequently visited sites
- Verify cache is working (visit site twice - should be instant)

---

### ❌ Dashboard shows "Failed to fetch"

**Solution:** Dashboard automatically works in offline mode using local audit logs. To restore full history, start the backend server.

---

## 💻 Development

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Chrome Manifest V3 | v3 | Extension framework |
| JavaScript ES6+ | ECMAScript 2020+ | Client-side logic |
| Ollama | Latest | Local LLM runtime |
| Node.js | v16+ | Backend runtime |
| Express.js | v4.18+ | Web framework |
| MongoDB | v5+ | Database |
| Mongoose | v7+ | ODM for MongoDB |
| Chart.js | v4+ | Analytics charts |

### Project Structure

```
d:\Extension\
├── manifest.json              # Extension configuration
├── background.js              # Service worker (main logic)
├── content.js                 # Content script (page analysis)
├── popup.html/js              # Popup UI
├── blocked.html/js            # Block page
├── survey.html/js             # Analytics dashboard
├── icons/                     # Extension icons
├── utils/
│   ├── constants.js           # Configuration constants
│   └── validators.js          # Input validation
└── server/
    ├── index.js               # Express server
    ├── package.json           # Dependencies
    └── models/
        ├── Settings.js        # Mongoose schemas
        └── Cache.js
```

### Code Standards

- ✅ **SonarQube Compliant** - No magic numbers, proper error handling
- ✅ **JSDoc Documentation** - All functions documented
- ✅ **CSP Compliant** - No unsafe-eval or inline scripts
- ✅ **Security Best Practices** - XSS prevention, rate limiting, HTTPS

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Follow code standards (JSDoc, CSP compliance)
4. Write clear commit messages using [Conventional Commits](https://www.conventionalcommits.org/)
5. Push and create a Pull Request

**Commit Message Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 MindShield Pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Credits & Acknowledgments

### Open Source Libraries
- **[Ollama](https://ollama.ai)** - Local LLM runtime
- **[Chart.js](https://www.chartjs.org)** - Beautiful charts
- **[MongoDB](https://www.mongodb.com)** - Reliable database
- **[Express.js](https://expressjs.com)** - Fast web framework
- **[Mongoose](https://mongoosejs.com)** - Elegant MongoDB ODM

---

## 📧 Support & Contact

### Get Help
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/content-blocker-pro/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/yourusername/content-blocker-pro/discussions)
- 📧 **Email:** sasitharun011996@hotmail.com

### Roadmap
- [ ] Firefox extension support
- [ ] Safari version (Manifest V3 port)
- [ ] Advanced AI fine-tuning options
- [ ] Cloud sync for settings (optional)
- [ ] Multi-language support
- [ ] Export/import configuration
- [ ] Custom block page templates

---

<div align="center">

## 🌟 Thank you for using MindShield Pro!

**Made with ❤️ by the MindShield Pro Team**

*Your privacy and security are our top priorities.*

![GitHub stars](https://img.shields.io/github/stars/yourusername/content-blocker-pro?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/content-blocker-pro?style=social)

[⬆ Back to Top](#️-mindshield-pro)

</div>