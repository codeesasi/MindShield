const BACKEND_URL = 'http://localhost:3001/api';
let timelineChart, pieChart;

// Pagination state
let allHistoryData = [];
let currentPage = 1;
const itemsPerPage = 5;

// Setup accordion event listeners (CSP-safe)
function setupAccordions() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        header.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const accordion = document.getElementById(targetId);
            if (accordion) {
                accordion.classList.toggle('open');
            }
        });
    });
}

// Setup pagination event listeners
function setupPagination() {
    document.getElementById('prevBtn').addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            renderHistoryPage();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', function () {
        const totalPages = Math.ceil(allHistoryData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderHistoryPage();
        }
    });
}

// Safe message wrapper
function sendMessageSafe(message) {
    return new Promise((resolve) => {
        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Extension message error:', chrome.runtime.lastError.message);
                    resolve(null);
                    return;
                }
                resolve(response);
            });
        } catch (error) {
            resolve(null);
        }
    });
}

async function loadData() {
    try {
        // 1. Try fetching from Backend
        const [statsRes, cacheRes] = await Promise.allSettled([
            fetch(`${BACKEND_URL}/cache/stats`),
            fetch(`${BACKEND_URL}/cache/all`)
        ]);

        let stats = { total: 0, allowed: 0, blocked: 0 };
        let historyData = [];

        // Process Stats
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
            stats = await statsRes.value.json();
        } else {
            throw new Error('Backend offline'); // Trigger fallback
        }

        // Process History/Charts
        if (cacheRes.status === 'fulfilled' && cacheRes.value.ok) {
            historyData = await cacheRes.value.json();
        }

        updateDashboard(stats, historyData);

    } catch (error) {
        console.log('Backend unavailable, switching to local mode:', error);

        // 2. Fallback to Local Extension Data
        const localData = await sendMessageSafe({ action: 'getStats' });

        if (localData) {
            const stats = {
                total: localData.scansToday || 0,
                blocked: localData.blockedToday || 0,
                allowed: (localData.scansToday || 0) - (localData.blockedToday || 0)
            };

            // Use audit log as history data
            // Map audit log format to dashboard format if needed
            // Audit log: { url, result, timestamp, reason }
            // Dashboard expects: { url, result, scannedAt, ... }
            const historyData = (localData.auditLog || []).map(item => ({
                url: item.url,
                result: item.result,
                scannedAt: item.timestamp,
                reason: item.reason
            }));

            updateDashboard(stats, historyData);

            // Show offline indicator (only once)
            const title = document.querySelector('.header p');
            if (title && !title.dataset.offlineMode) {
                const originalTitle = title.textContent;
                title.textContent = originalTitle + ' (Offline Mode - Local Data Only)';
                title.style.color = '#f59e0b';
                title.dataset.offlineMode = 'true'; // Mark as set
            }
        } else {
            document.getElementById('historyBody').innerHTML =
                '<tr><td colspan="3" class="no-data">⚠️ Unable to load data. Is the extension running?</td></tr>';
        }
    }
}

function updateDashboard(stats, historyData) {
    // Update Counters
    document.getElementById('totalScans').textContent = stats.total || 0;
    document.getElementById('allowedCount').textContent = stats.allowed || 0;
    document.getElementById('blockedCount').textContent = stats.blocked || 0;

    const blockRate = stats.total > 0
        ? Math.round((stats.blocked / stats.total) * 100)
        : 0;
    document.getElementById('blockRate').textContent = blockRate + '%';

    // Update Charts & Table
    renderCharts(historyData, stats);

    // Store for pagination
    allHistoryData = historyData.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));

    // Only reset page if it's 1 or invalid
    if (currentPage < 1) currentPage = 1;
    renderHistoryPage();
}

function renderCharts(data, stats) {
    const hourlyData = {};
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
        const hour = new Date(now - i * 3600000);
        const key = hour.getHours() + ':00';
        hourlyData[key] = { allow: 0, block: 0 };
    }

    data.forEach(item => {
        const date = new Date(item.scannedAt);
        const key = date.getHours() + ':00';
        if (hourlyData[key]) {
            if (item.result === 'allow') {
                hourlyData[key].allow++;
            } else {
                hourlyData[key].block++;
            }
        }
    });

    const labels = Object.keys(hourlyData);
    const allowData = labels.map(l => hourlyData[l].allow);
    const blockData = labels.map(l => hourlyData[l].block);

    if (timelineChart) timelineChart.destroy();
    if (pieChart) pieChart.destroy();

    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Allowed',
                    data: allowData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Blocked',
                    data: blockData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });

    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Allowed', 'Blocked'],
            datasets: [{
                data: [stats.allowed || 0, stats.blocked || 0],
                backgroundColor: ['rgba(40, 167, 69, 0.8)', 'rgba(220, 53, 69, 0.8)'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}

function renderHistoryPage() {
    const tbody = document.getElementById('historyBody');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    if (!allHistoryData || allHistoryData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">No scan history yet</td></tr>';
        pageInfo.textContent = 'Page 0 of 0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const totalPages = Math.ceil(allHistoryData.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = allHistoryData.slice(startIdx, endIdx);

    tbody.innerHTML = pageData.map(item => {
        const date = new Date(item.scannedAt);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const statusClass = item.result === 'allow' ? 'status-allow' : 'status-block';
        const statusText = item.result === 'allow' ? '✅' : '🚫';

        let displayUrl = item.url;
        try {
            const urlObj = new URL(item.url);
            displayUrl = urlObj.hostname;
            if (displayUrl.length > 35) displayUrl = displayUrl.slice(0, 32) + '...';
        } catch (e) { }

        return `
            <tr>
                <td title="${item.url}">${displayUrl}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${dateStr} ${timeStr}</td>
            </tr>
        `;
    }).join('');

    // Update pagination controls
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    setupAccordions();
    setupPagination();
    loadData();
});

// Refresh every 30 seconds
setInterval(loadData, 30000);
