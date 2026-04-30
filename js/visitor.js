document.addEventListener('DOMContentLoaded', () => {
    const ipElement = document.getElementById('visitor-ip');
    const locationElement = document.getElementById('visitor-location');
    const ispElement = document.getElementById('visitor-isp');
    const osElement = document.getElementById('visitor-os');
    const batteryElement = document.getElementById('visitor-battery');
    const browserElement = document.getElementById('visitor-browser');

    // --- OS Detection ---
    if (osElement) {
        const userAgent = navigator.userAgent;
        let osName = "Unknown OS";

        if (userAgent.indexOf("Win") !== -1) osName = "Windows";
        if (userAgent.indexOf("Mac") !== -1) osName = "macOS";
        if (userAgent.indexOf("Linux") !== -1) osName = "Linux";
        if (userAgent.indexOf("Android") !== -1) osName = "Android";
        if (userAgent.indexOf("like Mac") !== -1) osName = "iOS";

        osElement.textContent = osName;
    }

    // --- Browser Info ---
    if (browserElement) {
        const userAgent = navigator.userAgent;
        let browserName = "Unknown";

        if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Firefox";
        } else if (userAgent.indexOf("SamsungBrowser") > -1) {
            browserName = "Samsung Internet";
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
            browserName = "Opera";
        } else if (userAgent.indexOf("Trident") > -1) {
            browserName = "Internet Explorer";
        } else if (userAgent.indexOf("Edge") > -1) {
            browserName = "Edge";
        } else if (userAgent.indexOf("Chrome") > -1) {
            browserName = "Chrome";
        } else if (userAgent.indexOf("Safari") > -1) {
            browserName = "Safari";
        }

        browserElement.textContent = browserName;
    }

    // --- Battery Info ---
    if (batteryElement) {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(function (battery) {
                function updateBattery() {
                    const level = Math.round(battery.level * 100);
                    const charging = battery.charging ? "⚡" : "";
                    batteryElement.textContent = `${level}% ${charging}`;
                }

                updateBattery();

                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            });
        } else {
            batteryElement.textContent = "Not Supported";
        }
    }

    // --- IP, Location and ISP Info ---
    fetch('https://log.parzi.dev/api/ip')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (ipElement) {
                ipElement.textContent = data.ip || 'Unknown';

                // Click-to-copy IP
                ipElement.addEventListener('click', () => {
                    const ipText = ipElement.textContent.trim();
                    if (!ipText || ipText === 'Loading...' || ipText === 'Error') return;

                    copyText(ipText).then(() => {
                        showCopyFeedback(ipElement);
                    }).catch(error => {
                        console.warn('IP could not be copied:', error.message);
                    });
                });
            }

            if (locationElement) {
                const parts = [];
                if (data.location && data.location.city) {
                    parts.push(data.location.city);
                }
                if (data.location && data.location.country_code) {
                    parts.push(data.location.country_code);
                } else if (data.location && data.location.country) {
                    parts.push(data.location.country);
                }

                locationElement.textContent = parts.length > 0 ? parts.join(', ') : 'Unknown';
                locationElement.title = locationElement.textContent;
            }

            if (ispElement) {
                // Try to get ISP from Company data first, then ASN, then Org
                let isp = 'Unknown';
                if (data.company && data.company.name) {
                    isp = data.company.name;
                } else if (data.asn && data.asn.name) {
                    isp = data.asn.name;
                } else if (data.org) {
                    isp = data.org;
                }
                ispElement.textContent = isp;
                ispElement.title = isp;
            }
        })
        .catch(error => {
            console.error('Error fetching visitor info:', error);
            if (ipElement) ipElement.textContent = 'Error';
            if (locationElement) locationElement.textContent = 'Error';
            if (ispElement) ispElement.textContent = 'Error';
        });
});

function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    return new Promise((resolve, reject) => {
        try {
            document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'));
        } catch (error) {
            reject(error);
        } finally {
            textarea.remove();
        }
    });
}

function showCopyFeedback(ipElement) {
    const tooltip = ipElement.parentElement.querySelector('.copy-tooltip');
    ipElement.classList.add('copied');

    if (tooltip) {
        tooltip.classList.remove('show');
        void tooltip.offsetWidth; // reflow to restart animation
        tooltip.classList.add('show');
    }

    window.clearTimeout(ipElement.copyFeedbackTimeout);
    ipElement.copyFeedbackTimeout = window.setTimeout(() => {
        ipElement.classList.remove('copied');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }, 1200);
}
