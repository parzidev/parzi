// Server Stats - dashboard.parzi.dev/api
(function () {
    const API_URL = 'https://dashboard.parzi.dev/api';

    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    function setProgressColor(percent) {
        if (percent < 50) return '#1DB954';
        if (percent < 75) return '#ffaa00';
        return '#ff4444';
    }

    function updateStats(data) {
        // CPU
        const cpuEl = document.getElementById('server-cpu');
        const cpuBar = document.getElementById('server-cpu-bar');
        if (cpuEl) cpuEl.textContent = data.cpu_percent.toFixed(1) + '%';
        if (cpuBar) {
            cpuBar.style.width = Math.max(data.cpu_percent, 2) + '%';
            cpuBar.style.background = setProgressColor(data.cpu_percent);
        }

        // RAM
        const ramEl = document.getElementById('server-ram');
        const ramBar = document.getElementById('server-ram-bar');
        if (ramEl) ramEl.textContent = `${data.ram_used} / ${data.ram_total} (${data.ram_percent.toFixed(1)}%)`;
        if (ramBar) {
            ramBar.style.width = data.ram_percent + '%';
            ramBar.style.background = setProgressColor(data.ram_percent);
        }

        // Disk
        const diskEl = document.getElementById('server-disk');
        const diskBar = document.getElementById('server-disk-bar');
        if (diskEl) diskEl.textContent = `${data.disk_used} / ${data.disk_total} (${data.disk_percent.toFixed(1)}%)`;
        if (diskBar) {
            diskBar.style.width = data.disk_percent + '%';
            diskBar.style.background = setProgressColor(data.disk_percent);
        }

        // Uptime
        const uptimeEl = document.getElementById('server-uptime');
        if (uptimeEl) uptimeEl.textContent = formatUptime(data.uptime_seconds);

        // Network
        const netEl = document.getElementById('server-network');
        if (netEl) netEl.textContent = `↑ ${data.network.sent_human}  ↓ ${data.network.recv_human}`;

        // Status indicator
        const statusEl = document.getElementById('server-status-dot');
        if (statusEl) statusEl.textContent = '🟢';
    }

    function fetchStats() {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => updateStats(data))
            .catch(() => {
                const statusEl = document.getElementById('server-status-dot');
                if (statusEl) statusEl.textContent = '🔴';
            });
    }

    // Initial fetch + refresh every 30 seconds
    fetchStats();
    setInterval(fetchStats, 30000);
})();
