# 🛡️ MindShield Pro

**Version 3.0.0 - PRO Edition**

> AI-Powered Content Protection for browsers - Privacy-First, Locally Processed

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/yourusername/content-blocker-pro)
[![Chrome](https://img.shields.io/badge/chrome-v100+-green.svg)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-v16+-brightgreen.svg)](https://nodejs.org/)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [AI Governance & Compliance](#️-ai-governance--compliance)
- [Installation](#-installation)
  - [Quick Start with Batch File](#-quick-start-with-batch-file-windows)
- [Configuration](#️-configuration)
- [Usage Guide](#-usage-guide)
- [Architecture](#️-architecture)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)
- [License](#-license)

---

## 🎯 Overview

**MindShield Pro** is an advanced browser extension that uses artificial intelligence to analyze and filter web content in real-time. By leveraging local AI models through Ollama, it provides intelligent content moderation while keeping your browsing data private and secure.

> 💡 **Privacy First:** All content analysis happens locally using your own AI model. No browsing data is sent to external servers or third parties.

### Why MindShield Pro?

- ✅ **100% Local Processing** - Your data never leaves your machine
- ✅ **Customizable AI Models** - Use any Ollama-compatible LLM
- ✅ **Smart Caching** - Fast performance with minimal overhead
- ✅ **Transparent Decisions** - View AI reasoning and confidence scores
- ✅ **User Control** - Whitelist sites, request appeals, full transparency

---

## ✨ Key Features

### 🤖 AI-Powered Analysis
Uses local LLM models (via Ollama) to intelligently analyze webpage content for harmful or inappropriate material with configurable sensitivity.

### ⚡ Real-Time Protection
Scans pages as you browse with minimal performance impact using smart caching, debouncing, and efficient content extraction.

### 🎨 Modern UI
Beautiful glassmorphism design with:
- Dark/Light theme support (auto-detects system preference)
- Collapsible sections with persistent state
- Compact 340px popup with instant data loading
- Animated status indicators and smooth transitions

### 📊 Analytics Dashboard
Track your browsing safety with:
- Interactive timeline charts (24-hour activity)
- Allow vs. Block pie charts
- Paginated scan history with timestamps
- Works offline using local audit logs

### 🔒 Security Hardened
Built with security in mind:
- Input validation and sanitization (XSS prevention)
- Rate limiting on API requests
- CSP-compliant code (no unsafe-eval or inline scripts)
- Sensitive page detection (skips login/payment pages)
- Data redaction for passwords, emails, credit cards

### 📋 Whitelist Management
Easy domain management:
- View all trusted domains in popup
- Add domains manually or via appeals
- One-click removal
- Instant sync across extension and backend

### 🎯 Smart Caching
Triple-layer caching system:
- **Layer 1:** In-memory Map (fastest, 5-minute TTL)
- **Layer 2:** Chrome Storage (persistent, offline-capable)
- **Layer 3:** MongoDB Backend (permanent, analytics)

### 📝 Audit Logging
Complete transparency with:
- Detailed logs of all AI decisions
- Confidence scores for every analysis
- Timestamps and reasoning
- Exportable via console

### 🔄 Appeal System
User empowerment features:
- Request review on blocked pages
- Automatic whitelisting on appeal
- Optional feedback submission
- Appeal history tracking

### 🏛️ AI Governance & Compliance
**Built-in transparency and accountability features:**

#### Audit Logging
- **Complete History:** Every AI decision is logged with timestamp, URL, result, and reasoning
- **Confidence Scores:** View the AI's confidence level (0-100%) for each decision
- **Exportable Data:** Access audit logs via console or API for compliance reporting
- **Local Storage:** Logs persist in chrome.storage.local for privacy

#### Transparency Dashboard
- **AI Usage Disclosure:** Clear explanation of what data is processed and how
- **Local Processing Notice:** Explicit statement that no data leaves your machine
- **View Audit Logs:** One-click access to all AI decisions from the popup
- **Decision Reasoning:** Full AI explanations for why content was allowed or blocked

#### User Control & Appeals
- **Appeal Mechanism:** Users can dispute AI decisions on blocked pages
- **Automatic Whitelisting:** Appeals instantly whitelist the domain
- **Feedback Loop:** Optional reason submission for improving accuracy
- **User Override:** Complete control - users can always access content via appeal

#### Compliance Features
- **GDPR-Ready:** All processing is local, no data transfer to third parties
- **Audit Trail:** Complete decision history for regulatory requirements
- **Configurable Models:** Use different AI models based on jurisdiction needs
- **Data Minimization:** Only visible text is analyzed, sensitive data redacted

---

## 📦 Installation

### Prerequisites

Before installing, ensure you have:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | v16+ | Backend server runtime |
| **MongoDB** | v5+ | Data persistence |
| **Ollama** | Latest | Local AI model hosting |
| **Chrome** | v100+ | Browser compatibility |

### Step 1: Install Ollama

1. Download Ollama from [https://ollama.ai](https://ollama.ai)
2. Install and start the Ollama service
3. Pull your preferred model:

```bash
# Recommended model (default)
ollama pull gpt-oss:120b-cloud

# Alternative models
ollama pull llama3.2:3b
ollama pull mistral:latest

# Verify installation
ollama list
```

### Step 2: Set Up MongoDB

```bash
# Start MongoDB (Windows)
mongod --dbpath=C:\data\db

# Start MongoDB (Linux/Mac)
sudo systemctl start mongod

# Verify connection
mongosh
```

### Step 3: Configure Backend Server

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

### Step 4: Load Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `d:\Extension` folder
5. Grant **"On all sites"** permission when prompted

⚠️ **Important:** The extension requires "On all sites" permission to scan web content. This is essential for the AI analysis feature.

### Step 5: Verify Installation

1. Click the extension icon in Chrome toolbar
2. Check the status dot in popup (should be green 🟢)
3. Click **"Test Connection"** button
4. Verify stats are loading

---

## 🌐 Cross-Browser Support

### Brave & Microsoft Edge
These browsers are Chromium-based and use the standard `manifest.json`.

1. **Brave:**
   - Go to `brave://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select `d:\Extension`

2. **Microsoft Edge:**
   - Go to `edge://extensions`
   - Enable "Developer mode"
   - Enable "Allow extensions from other stores" (if prompted)
   - Click "Load unpacked" and select `d:\Extension`

3. **Load in Firefox:**
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on..."
   - Select the `manifest.json` (the Firefox version) inside `d:\Extension`

---

### 🚀 Quick Start with Batch File (Windows)

For convenience, use the provided batch files to manage all services:

#### Prerequisites for PM2

First, install PM2 globally (process manager):

```bash
npm install -g pm2
```

#### Start Services with `start-services.bat`

The batch file automatically:
- Installs npm dependencies
- Starts MongoDB
- Starts Ollama
- Starts backend server with PM2 (auto-restart, watch mode, memory limits)

```batch
@echo off
echo [1/4] Installing dependencies...
cd server
call npm install

echo [2/4] Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath=C:\data\db"

echo [3/4] Starting Ollama...
start "Ollama" cmd /k "ollama serve"

echo [4/4] Starting Backend Server with PM2...
call pm2 start index.js --name content-blocker --watch --max-memory-restart 200M
call pm2 save
```

#### Usage:

1. **One-time setup:** Install PM2 globally
   ```bash
   npm install -g pm2
   ```

2. **Start all services:**
   ```bash
   cd d:\Extension
   start-services.bat
   ```

3. **Check backend status:**
   ```bash
   pm2 status
   ```

4. **View backend logs:**
   ```bash
   pm2 logs content-blocker
   ```

💡 **PM2 Benefits:**
- ✅ Auto-restart on crash
- ✅ Watch mode (restarts on file changes)
- ✅ Memory limit (restarts if > 200MB)
- ✅ Persistent across reboots (`pm2 startup` & `pm2 save`)

#### Stop Services with `stop-services.bat`

```batch
@echo off
echo Stopping MindShield backend...
call pm2 stop content-blocker
call pm2 delete content-blocker

echo Stopping MongoDB and Ollama...
taskkill /F /FI "WINDOWTITLE eq MongoDB*" /T
taskkill /F /FI "WINDOWTITLE eq Ollama*" /T
```

#### PM2 Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | View all running processes |
| `pm2 logs content-blocker` | Stream backend logs |
| `pm2 restart content-blocker` | Restart backend server |
| `pm2 stop content-blocker` | Stop backend (keep in PM2 list) |
| `pm2 delete content-blocker` | Remove from PM2 |
| `pm2 monit` | Real-time monitoring dashboard |

---

### 🔄 Enable Auto-Start on Windows Login

To make services start automatically when you log in to Windows:

#### Setup Autostart with `setup-autostart.bat`

**Run as Administrator:**

```bash
# Right-click setup-autostart.bat → Run as administrator
```

**What it does:**
1. Creates a **Windows Scheduled Task**
2. Task runs `start-services.bat` with Admin privileges automatically on login
3. `start-services.bat` then starts monitoring with PM2

**After setup:**
- ✅ Services start silently when you log in
- ✅ PM2 handles auto-restarts and logging
- ✅ No manual console windows to manage

#### Verify Autostart Works

1. **Run setup:**
   ```bash
   # As Administrator
   setup-autostart.bat
   ```

2. **Reboot and Login:**
   ```bash
   shutdown /r /t 0
   ```

3. **Wait 10-20 seconds** after login, then check:
   ```bash
   pm2 status
   ```

#### Remove Autostart with `remove-autostart.bat`

To disable boot-time startup:

```bash
# Right-click remove-autostart.bat → Run as administrator
```

This will:
- Remove PM2 startup configuration
- Stop all PM2 processes
- Services will NOT start on next boot

#### Stop Services Temporarily

To stop services WITHOUT removing autostart:

```bash
stop-services.bat
```

Services will:
- ✅ Stop immediately
- ✅ Restart on next boot (autostart still enabled)



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

### Advanced Configuration

Edit `utils/constants.js` for advanced customization:

```javascript
// API Configuration
API_CONFIG: {
    BACKEND_URL: 'http://localhost:3001/api',
    OLLAMA_URL: 'http://localhost:11434/api/generate',
    DEFAULT_MODEL: 'gpt-oss:120b-cloud'
}

// Timeouts (milliseconds)
TIMEOUTS: {
    OLLAMA_REQUEST: 30000,
    BACKEND_REQUEST: 5000,
    CONNECTION_TEST: 3000
}

// Cache Configuration
CACHE_CONFIG: {
    EXPIRY_MS: 300000,        // 5 minutes
    MAX_ENTRIES: 1000,
    CLEANUP_INTERVAL: 600000  // 10 minutes
}

// Rate Limiting
RATE_LIMITS: {
    MAX_REQUESTS_PER_MINUTE: 60,
    WINDOW_MS: 60000
}
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
View at a glance:
- **Scans Today** - Total pages analyzed
- **Blocked Today** - Pages blocked by AI
- **Whitelist** - Number of trusted domains

#### ⚙️ Settings Section (Collapsible)
- Toggle protection on/off
- Toggle block reason display
- Change AI model (any Ollama model)
- Quick actions:
  - 🗑️ **Clear Cache** - Reset all cached decisions
  - 🔌 **Test Connection** - Verify Ollama and backend
  - 📊 **View Stats** - Open analytics dashboard

#### 📋 Whitelist Section (Collapsible)
- View all whitelisted domains
- Add domains manually (validates format)
- Remove domains with one-click
- Auto-syncs with backend

💡 **Tip:** Section collapse states persist across sessions for a cleaner UI.

### Blocked Page Actions

When content is blocked, users can:

| Action | Description |
|--------|-------------|
| **🔙 Go Back** | Return to previous page |
| **🏠 Go Home** | Navigate to homepage |
| **📝 Request Review** | Submit appeal (auto-whitelists domain) |

The blocked page displays:
- 🛡️ Animated shield icon
- 📊 AI confidence meter (animated)
- 📝 Block reason (if enabled)
- ⌨️ Keyboard shortcuts (B for back, H for home)

### Analytics Dashboard

Access: Popup → **📊 View Analytics Dashboard**

Features:
- **📈 Timeline Chart:** 24-hour scan/block activity (line chart)
- **🍩 Pie Chart:** Allow vs. Block ratio (doughnut chart)
- **📜 History Table:** Paginated scan history with:
  - Domain name (truncated)
  - Status badge (✅ Allow / 🚫 Block)
  - Timestamp
- **⏮️ ⏭️ Pagination:** Navigate through history

✅ **Offline Mode:** Dashboard automatically falls back to local audit logs when backend is unavailable.

---

## 🏗️ Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│                   Chrome Extension                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌──────────────┐               │
│  │ Content      │───▶│ Background   │              │
│  │ Script       │◀───│ Worker       │              │
│  └──────────────┘    └──────┬───────┘               │
│                             │                       │
│  ┌──────────────┐           │                       │
│  │ Popup UI     │───────────┤                       │
│  └──────────────┘           │                       │
│                             │                       │
│  ┌──────────────┐           │                       │
│  │ Blocked Page │───────────┘                       │
│  └──────────────┘                                   │
│                                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 │ HTTP/REST
                 │
        ┌────────▼────────┐         ┌──────────────┐
        │  Backend Server │────────▶│   MongoDB    │
        │   (Express.js)  │◀────────│   Database   │
        └────────┬────────┘         └──────────────┘
                 │
                 │ HTTP
                 │
        ┌────────▼────────┐
        │     Ollama      │
        │   (Local LLM)   │
        └─────────────────┘
```

### Component Details

#### 🎯 Background Service Worker (`background.js`)
**Purpose:** Core logic and orchestration

**Responsibilities:**
- Handle content analysis requests from content scripts
- Manage triple-layer caching (memory, storage, database)
- Communicate with Ollama API for AI analysis
- Implement rate limiting (60 requests/minute)
- Maintain audit log for transparency
- Input validation and sanitization
- Block page navigation

**Key Functions:**
```javascript
handleContentCheck(request, sender)  // Main analysis handler
checkCacheInBackend(url)             // Cache lookup
saveToCacheInBackend(...)            // Cache storage
analyzeWithOllama(text)              // AI analysis
addToWhitelist(url)                  // Whitelist management
```

#### 📄 Content Script (`content.js`)
**Purpose:** Extract and sanitize webpage content

**Responsibilities:**
- Extract visible text from DOM (excludes scripts, styles)
- Detect sensitive pages (login, payment, checkout)
- Redact sensitive data (passwords, emails, credit cards)
- Debounce analysis on dynamic content (500ms)
- Handle MutationObserver for SPAs
- Proper cleanup on page navigation (uses `pagehide`)

**Security Features:**
- Maximum text extraction: 100,000 characters
- URL validation before sending
- Sensitive page detection patterns
- Data sanitization regex

#### 🎨 Popup UI (`popup.html`, `popup.js`)
**Purpose:** User interface and settings management

**Features:**
- **Compact Design:** 340px width, collapsible sections
- **Cache-First Loading:** Instant display from chrome.storage
- **Real-Time Status:** Connection indicator with dot animation
- **Theme Management:** Light/Dark/System with persistence
- **Settings Panel:** Model input, toggles, quick actions
- **Whitelist CRUD:** Add/remove domains with validation
- **Toast Notifications:** User feedback for actions

**UI Components:**
```
Header (Logo + Status Dot + Theme Toggle)
   ↓
Stats Row (Scans | Blocked | Whitelist)
   ↓
⚙️ Settings Section (Collapsible)
   ↓
📋 Whitelist Section (Collapsible)
   ↓
Footer (AI Transparency + Audit Log Link)
```

#### 🚫 Blocked Page (`blocked.html`, `blocked.js`)
**Purpose:** Display block information and allow appeals

**Features:**
- Animated shield icon (CSS keyframes)
- AI confidence meter with smooth animation
- Reason display (sanitized from AI)
- Navigation buttons (Go Back, Home)
- Appeal modal with form submission
- Keyboard shortcuts (customizable)
- Glassmorphism design matching popup

#### 📊 Dashboard (`survey.html`, `survey.js`)
**Purpose:** Analytics and history visualization

**Features:**
- Chart.js integration for visualizations
- Paginated history table (5 items per page)
- Offline fallback using audit logs
- Auto-refresh every 30 seconds
- Stats cards with block rate calculation
- Exportable data (via console)

#### 🖥️ Backend Server (`server/index.js`)
**Purpose:** API and data persistence

**Stack:**
- Express.js 4.x (web framework)
- Mongoose 7.x (MongoDB ODM)
- express-rate-limit (API protection)

**Security Measures:**
- Rate limiting: 100 requests per 15 minutes
- Security headers (X-Content-Type, X-Frame, X-XSS)
- CORS configuration for extension
- Request body size limit (10MB)
- Input validation on all endpoints
- Graceful shutdown handling

### Data Flow

```
1. User visits webpage
        ↓
2. Content Script extracts visible text
        ↓
3. Checks for sensitive page → SKIP if true
        ↓
4. Sanitizes data (redact passwords, emails, etc.)
        ↓
5. Sends to Background Worker via chrome.runtime.sendMessage
        ↓
6. Background checks local cache (Map)
   └─ HIT → Return cached result
   └─ MISS → Continue
        ↓
7. Background checks chrome.storage.local
   └─ HIT → Return cached result, save to Map
   └─ MISS → Continue
        ↓
8. Background queries MongoDB via backend API
   └─ HIT → Return cached result, save to storage & Map
   └─ MISS → Continue
        ↓
9. Background sends text to Ollama for analysis
        ↓
10. Ollama returns: { result: 'allow'|'block', confidence, reason }
        ↓
11. Result cached in all layers (Map, Storage, MongoDB)
        ↓
12. Audit log entry created
        ↓
13. Action taken:
    ├─ ALLOW → Page loads normally
    └─ BLOCK → Redirect to blocked.html with params
```

### Caching Strategy

| Layer | Storage | TTL | Size Limit | Purpose |
|-------|---------|-----|------------|---------|
| **L1: Memory** | JavaScript Map | 5 minutes | 1000 entries | Fastest access, session-based |
| **L2: Chrome Storage** | chrome.storage.local | Persistent | ~10MB | Offline capability, instant UI |
| **L3: Backend DB** | MongoDB | Permanent | Unlimited | Cross-session, analytics, sync |

**Cache Priority:**
1. Check L1 (Map) → Return if hit
2. Check L2 (Storage) → Save to L1 if hit
3. Check L3 (MongoDB) → Save to L1 & L2 if hit
4. Query Ollama → Save to L1, L2, L3

**Cache Invalidation:**
- L1: Auto-expires after 5 minutes or on cleanup
- L2: Manual clear via popup button
- L3: Manual clear via API call

---

## 📡 API Reference

### Extension Message API

All messages use `chrome.runtime.sendMessage()` with safe wrapper:

#### Check Content
```javascript
chrome.runtime.sendMessage({
    action: 'checkContent',
    text: 'Extracted page text...',
    url: 'https://example.com'
}, (response) => {
    // response: { action: 'allow'|'block', confidence, reason }
});
```

#### Get Statistics
```javascript
chrome.runtime.sendMessage({
    action: 'getStats'
}, (response) => {
    // response: { scansToday, blockedToday, auditLog }
});
```

#### Test Connection
```javascript
chrome.runtime.sendMessage({
    action: 'testConnection'
}, (response) => {
    // response: { connected: true, version: '0.1.0' }
});
```

#### Clear Cache
```javascript
chrome.runtime.sendMessage({
    action: 'clearCache'
}, (response) => {
    // response: { success: true }
});
```

#### Get Audit Log
```javascript
chrome.runtime.sendMessage({
    action: 'getAuditLog'
}, (response) => {
    // response: [{ url, result, timestamp, reason, confidence }]
});
```

#### Whitelist URL
```javascript
chrome.runtime.sendMessage({
    action: 'whitelistUrl',
    url: 'example.com'
}, (response) => {
    // response: { success: true }
});
```

#### Submit Appeal
```javascript
chrome.runtime.sendMessage({
    action: 'appealDecision',
    url: 'example.com',
    reason: 'This is a safe site'
}, (response) => {
    // response: { success: true }
});
```

### Backend REST API

Base URL: `http://localhost:3001/api`

#### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "ok"
}
```

#### Get Settings
```http
GET /api/settings
```
**Response:**
```json
{
  "model": "gpt-oss:120b-cloud",
  "enabled": true,
  "whitelist": ["trusted.com", "safe.org"],
  "showWarning": true
}
```

#### Update Settings
```http
POST /api/settings
Content-Type: application/json

{
  "model": "llama3.2:3b",
  "whitelist": ["example.com"]
}
```

#### Check Cache
```http
GET /api/cache?url=https://example.com
```
**Response:**
```json
{
  "hit": true,
  "result": "allow"
}
```

#### Save to Cache
```http
POST /api/cache
Content-Type: application/json

{
  "url": "https://example.com",
  "content": "Page text...",
  "result": "allow",
  "reason": "Safe content"
}
```

#### Get Statistics
```http
GET /api/cache/stats
```
**Response:**
```json
{
  "total": 150,
  "allowed": 142,
  "blocked": 8
}
```

#### Get All Cache Entries
```http
GET /api/cache/all
```
**Response:**
```json
[
  {
    "url": "https://example.com",
    "result": "allow",
    "scannedAt": "2024-01-15T10:30:00Z",
    "reason": "Safe content"
  }
]
```

#### Clear Cache
```http
DELETE /api/cache
```
**Response:**
```json
{
  "success": true,
  "deleted": 150
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ "Services offline" in popup

**Symptoms:**
- Red status dot in popup
- "Services offline" or "Disconnected" message

**Causes:**
- Ollama not running
- Backend server not started
- Port conflicts

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

3. Verify ports:
   - Ollama: http://localhost:11434
   - Backend: http://localhost:3001

4. Test connection:
   - Click "🔌 Test" button in popup
   - Check browser console for errors

---

#### ❌ "Message port closed" errors

**Symptoms:**
- Console error: "Unchecked runtime.lastError: The message port closed before a response was received"

**Cause:**
- Async messaging timing issues

**Solution:**
✅ **Fixed in v3.0** with `sendMessageSafe()` wrapper
- Reload extension: `chrome://extensions` → Click refresh icon
- If persists, restart Chrome

---

#### ❌ "Permissions policy violation: unload"

**Symptoms:**
- Console warning about `unload` event

**Cause:**
- Deprecated `beforeunload`/`unload` events

**Solution:**
✅ **Fixed in v3.0** by using `pagehide` event
- Update to latest version

---

#### ❌ Dashboard shows "Failed to fetch"

**Symptoms:**
- Analytics dashboard blank or shows error
- "Failed to fetch" in console

**Cause:**
- Backend server unreachable

**Solution:**
✅ **Works in offline mode as of v3.0**
- Dashboard uses local audit logs when backend is down
- Look for "(Offline Mode)" indicator in header
- To restore full history: Start backend server

---

#### ❌ Data resets on popup open

**Symptoms:**
- Stats show 0 briefly before loading
- Whitelist flickers empty

**Cause:**
- Network-first loading strategy

**Solution:**
✅ **Fixed in v3.0** with cache-first loading
- All data now loads instantly from chrome.storage
- Background refresh happens silently
- Reload extension to apply fix

---

#### ❌ Whitelist not persisting

**Symptoms:**
- Added domains disappear
- Whitelist resets

**Cause:**
- Storage sync failure
- Backend offline during save

**Solution:**
✅ **Fixed in v3.0** with dual storage
- Whitelist now saves to both chrome.storage AND backend
- Works offline with automatic sync when backend reconnects
- Verify: Add domain, close popup, reopen → Should persist

---

#### ❌ Sections collapse on every popup open

**Symptoms:**
- Settings/Whitelist sections always expanded
- Collapse state not saved

**Cause:**
- No state persistence

**Solution:**
✅ **Fixed in v3.0** with localStorage persistence
- Section states now saved to chrome.storage.local
- Reload extension to apply

---

#### ❌ Slow page loading

**Symptoms:**
- Websites load slowly
- Extension causes delays

**Causes:**
- Large text extraction
- Frequent API calls
- No caching

**Solutions:**
1. Check cache is working:
   - Visit a site twice → Should be instant on 2nd visit

2. Verify rate limiting isn't triggered:
   - Check console for "Rate limited" messages

3. Optimize model:
   - Use smaller/faster model for better performance
   - Example: `llama3.2:3b` instead of `gpt-oss:120b`

4. Whitelist frequently visited sites:
   - Popup → Whitelist → Add trusted domains

---

### Debugging Tools

#### Chrome DevTools
- **Popup Console:** Right-click extension icon → Inspect → Console tab
- **Background Worker:** `chrome://extensions` → MindShield Pro → "Inspect views: service worker"
- **Content Script:** F12 on any webpage → Console → Filter by "content.js"

#### Audit Log
```javascript
// In popup
chrome.runtime.sendMessage({ action: 'getAuditLog' }, (log) => {
    console.table(log);
});
```

#### Manual Cache Check
```javascript
// In background worker console
console.log('Local Cache:', Array.from(localCache.entries()));

// In chrome storage
chrome.storage.local.get(null, (data) => {
    console.log('Storage:', data);
});
```

#### Backend Logs
```bash
# Check server logs
cd d:\Extension\server
npm start

# Logs will show:
# - MongoDB connection status
# - API requests with status codes
# - Errors and warnings
```

---

## 👨‍💻 Development

### Project Structure

```
d:\Extension\
├── manifest.json              # Extension configuration (Manifest V3)
├── background.js              # Service worker (main logic)
├── content.js                 # Content script (page analysis)
├── popup.html                 # Popup UI structure
├── popup.js                   # Popup logic
├── blocked.html               # Block page UI
├── blocked.js                 # Block page logic
├── survey.html                # Analytics dashboard UI
├── survey.js                  # Dashboard logic (Chart.js)
├── icons/                     # Extension icons (16, 48, 128)
├── utils/
│   ├── constants.js           # Configuration constants
│   └── validators.js          # Input validation utilities
└── server/
    ├── index.js               # Express server
    ├── package.json           # Dependencies
    ├── .env                   # Environment variables
    └── models/
        ├── Settings.js        # Mongoose schema for settings
        └── Cache.js           # Mongoose schema for cache
```

### Code Standards

This project follows professional coding standards:

✅ **SonarQube Compliant**
- No magic numbers (all constants in `constants.js`)
- No code duplication
- Proper error handling
- Cognitive complexity < 15

✅ **JSDoc Documentation**
```javascript
/**
 * Analyze content using Ollama AI
 * @param {string} text - Text to analyze
 * @returns {Promise<{result: string, confidence: number, reason: string}>}
 */
async function analyzeWithOllama(text) { ... }
```

✅ **IIFE Pattern** (Prevents global pollution)
```javascript
(() => {
    'use strict';
    // All code wrapped
})();
```

✅ **CSP Compliant**
- No inline event handlers
- No `eval()` or `new Function()`
- No inline `<script>` tags
- All event listeners via `addEventListener()`

✅ **Security Best Practices**
- Input validation on all user inputs
- XSS prevention (sanitization)
- Rate limiting
- HTTPS-only for production

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
| express-rate-limit | v6+ | API rate limiting |

### Dependencies

**Backend (`server/package.json`):**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

**Extension:**
- No external dependencies (vanilla JavaScript)
- CDN: Chart.js v4 (for dashboard only)

### Development Workflow

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/content-blocker-pro.git
   cd content-blocker-pro
   ```

2. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Start Development**
   ```bash
   # Terminal 1: Start MongoDB
   mongod

   # Terminal 2: Start Ollama
   ollama serve

   # Terminal 3: Start Backend (with auto-reload)
   cd server
   npm run dev

   # Load extension in Chrome
   chrome://extensions → Load unpacked → Select 'Extension' folder
   ```

4. **Make Changes**
   - Edit code
   - Reload extension: `chrome://extensions` → Click refresh
   - Test thoroughly

5. **Test Checklist**
   - [ ] Extension loads without errors
   - [ ] Popup displays data instantly
   - [ ] Content scanning works on various sites
   - [ ] Blocked page shows correctly
   - [ ] Whitelist add/remove works
   - [ ] Dashboard loads (online and offline)
   - [ ] Theme toggle persists
   - [ ] Collapsed sections persist
   - [ ] No console errors
   - [ ] Backend API responds
   - [ ] Cache system works (3 layers)

### Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/content-blocker-pro.git
   cd content-blocker-pro
   git checkout -b feature/your-feature-name
   ```

2. **Follow Code Standards**
   - Add JSDoc comments to all functions
   - Use constants from `constants.js`
   - Validate all user inputs
   - Ensure CSP compliance
   - Test on multiple websites

3. **Write Tests** (if applicable)
   - Unit tests for utility functions
   - Integration tests for API endpoints

4. **Commit with Clear Messages**
   ```bash
   git commit -m "feat: Add whitelist import/export functionality"
   git commit -m "fix: Resolve cache expiry issue"
   git commit -m "docs: Update installation instructions"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Then create Pull Request on GitHub
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Credits & Acknowledgments

### Open Source Libraries
- **[Ollama](https://ollama.ai)** - Local LLM runtime
- **[Chart.js](https://www.chartjs.org)** - Beautiful charts
- **[MongoDB](https://www.mongodb.com)** - Reliable database
- **[Express.js](https://expressjs.com)** - Fast web framework
- **[Mongoose](https://mongoosejs.com)** - Elegant MongoDB ODM

### Inspiration
- Chrome Extensions Team - Manifest V3 architecture
- Privacy-focused browser extensions community
- AI safety and content moderation research

---

## 📧 Support & Contact

### Get Help
- 📝 **Issues:** [GitHub Issues](https://github.com/yourusername/content-blocker-pro/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/yourusername/content-blocker-pro/discussions)
- 📧 **Email:** sasitharun011996@hotmail.com

### Contributing
- 🤝 **Pull Requests:** Always welcome!
- 💡 **Feature Requests:** Open an issue with the `enhancement` label
- 🐛 **Bug Reports:** Use the bug report template

### Roadmap
- [ ] Browser extension for Firefox
- [ ] Safari version (Manifest V3 port)
- [ ] Advanced AI fine-tuning options
- [ ] Cloud sync for settings (optional)
- [ ] Multi-language support
- [ ] Export/import configuration
- [ ] Custom block page templates
- [ ] Integration with parental control systems

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/content-blocker-pro&type=Date)](https://star-history.com/#yourusername/content-blocker-pro&Date)

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/content-blocker-pro?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/content-blocker-pro?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/content-blocker-pro?style=social)

---

<div align="center">

### 🎉 Thank you for using MindShield Pro!

**Made with ❤️ by the MindShield Pro Team**

*Your privacy and security are our top priorities.*

[⬆ Back to Top](#️-content-blocker-pro)

</div>
