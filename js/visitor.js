document.addEventListener('DOMContentLoaded', () => {
    const ipElement = document.getElementById('visitor-ip');
    const locationElement = document.getElementById('visitor-location');
    const ispElement = document.getElementById('visitor-isp');
    const osElement = document.getElementById('visitor-os');
    const batteryElement = document.getElementById('visitor-battery');
    const browserElement = document.getElementById('visitor-browser');
    const deviceElement = document.getElementById('visitor-device');
    const screenElement = document.getElementById('visitor-screen');
    const facingElement = document.getElementById('visitor-facing');
    const postureElement = document.getElementById('visitor-posture');
    const tiltElement = document.getElementById('visitor-tilt');
    const motionTrigger = document.getElementById('visitor-motion-trigger');
    const phoneHoldRow = document.getElementById('visitor-phone-hold-row');
    const localTimeElement = document.getElementById('visitor-local-time');
    const timezoneElement = document.getElementById('visitor-timezone');
    const languageElement = document.getElementById('visitor-language');
    const networkElement = document.getElementById('visitor-network');
    const sessionElement = document.getElementById('visitor-session');
    const scanTextElement = document.getElementById('visitor-scan-text');
    const threatLevelElement = document.getElementById('visitor-threat-level');
    const commandElement = document.getElementById('visitor-command');
    const sessionStartedAt = Date.now();
    const scanSteps = [
        'mapping session...',
        'probing viewport...',
        'fingerprint cached',
        'network pulse found',
        'gravity channel armed',
        'timezone locked',
        'session mapped'
    ];
    const commandSteps = [
        'trace --visitor --live',
        'resolve --node location',
        'scan --display --ratio',
        'read --gravity x y z',
        'read --battery --network',
        'watch --session-clock'
    ];
    const GRAVITY_SMOOTHING = 0.18;
    const GRAVITY_STRONG = 7.0;
    const GRAVITY_MINIMUM = 5.5;
    const INVERT_SHOULDER_SIDE = false;
    const gravity = {
        x: null,
        y: null,
        z: null
    };
    let motionListenerStarted = false;
    let orientationListenerStarted = false;
    let receivedMotionData = false;
    let receivedOrientationData = false;
    const phonePositionMessages = {
        display_up: 'Phone is flat, display up',
        upright: 'You are holding the phone upright',
        lying_right_shoulder: 'Looks like you are lying on your right shoulder',
        lying_left_shoulder: 'Looks like you are lying on your left shoulder',
        lying_on_back: 'Looks like you are lying on your back',
        face_down: 'The display is facing down',
        unknown_tilted: 'You are holding the phone at an angle'
    };
    const phonePositionStates = [
        {
            key: 'display_up',
            axis: 'z',
            facing: 'display up',
            label: phonePositionMessages.display_up,
            detail: 'The phone appears to be flat on a surface with the display facing up.',
            matches: ({ ax, ay, az, z }) => az > GRAVITY_STRONG && az > ax && az > ay && z >= 0
        },
        {
            key: 'face_down',
            axis: 'z',
            facing: 'display down',
            label: phonePositionMessages.face_down,
            detail: 'The phone appears to be flat with the display facing down.',
            matches: ({ ax, ay, az, z }) => az > GRAVITY_STRONG && az > ax && az > ay && z < 0
        },
        {
            key: 'lying_on_back',
            axis: null,
            facing: 'screen toward face',
            label: phonePositionMessages.lying_on_back,
            detail: 'The phone looks parallel to your face, so this is a body-position guess.'
        },
        {
            key: 'upright',
            axis: 'y',
            facing: 'upright portrait',
            label: phonePositionMessages.upright,
            detail: 'The phone is close to a normal upright portrait hold.',
            matches: ({ ax, ay, az }) => ay > GRAVITY_STRONG && ay > ax && ay > az
        },
        {
            key: 'lying_right_shoulder',
            axis: 'x',
            facing: 'right shoulder guess',
            label: phonePositionMessages.lying_right_shoulder,
            detail: 'If the phone is parallel to your face, the side tilt suggests a right-shoulder position.',
            matches: ({ ax, ay, az, x }) => ax > GRAVITY_STRONG && ax > ay && ax > az && getShoulderSide(x) === 'right'
        },
        {
            key: 'lying_left_shoulder',
            axis: 'x',
            facing: 'left shoulder guess',
            label: phonePositionMessages.lying_left_shoulder,
            detail: 'If the phone is parallel to your face, the side tilt suggests a left-shoulder position.',
            matches: ({ ax, ay, az, x }) => ax > GRAVITY_STRONG && ax > ay && ax > az && getShoulderSide(x) === 'left'
        },
        {
            key: 'unknown_tilted',
            axis: null,
            facing: 'angled',
            label: phonePositionMessages.unknown_tilted,
            detail: 'No single axis is dominant enough, so the phone is in an angled or unclear position.'
        }
    ];

    // --- OS Detection ---
    if (osElement) {
        osElement.textContent = detectOS();
    }

    // --- Browser Info ---
    if (browserElement) {
        browserElement.textContent = detectBrowser();
    }

    if (deviceElement) {
        deviceElement.textContent = detectDeviceType();
    }

    const showPhoneHoldInfo = isMobileVisitor();
    if (phoneHoldRow) {
        if (showPhoneHoldInfo) {
            phoneHoldRow.classList.add('is-visible');
        } else {
            phoneHoldRow.remove();
        }
    }

    updateDisplayInfo();
    updateFacingFallback();
    if (showPhoneHoldInfo) {
        setupMotionScan();
    }
    updateLocaleInfo();
    updateNetworkInfo();
    updateSessionInfo();
    updateScanText();
    updateCommandLine();

    window.addEventListener('resize', updateDisplayInfo);
    window.addEventListener('resize', updateFacingFallback);
    window.addEventListener('orientationchange', updateFacingFallback);
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
        screen.orientation.addEventListener('change', updateFacingFallback);
    }

    const connection = getConnection();
    if (connection && typeof connection.addEventListener === 'function') {
        connection.addEventListener('change', updateNetworkInfo);
    }

    window.setInterval(updateLocalTime, 1000);
    window.setInterval(updateSessionInfo, 1000);
    window.setInterval(updateScanText, 1700);
    window.setInterval(updateCommandLine, 2400);

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

    function detectOS() {
        const userAgent = navigator.userAgent;

        if (/Android/i.test(userAgent)) return 'Android';
        if (/iPhone|iPad|iPod|like Mac/i.test(userAgent)) return 'iOS';
        if (/Win/i.test(userAgent)) return 'Windows';
        if (/Mac/i.test(userAgent)) return 'macOS';
        if (/Linux/i.test(userAgent)) return 'Linux';

        return 'Unknown OS';
    }

    function detectBrowser() {
        const userAgent = navigator.userAgent;

        if (/Firefox/i.test(userAgent)) return 'Firefox';
        if (/SamsungBrowser/i.test(userAgent)) return 'Samsung Internet';
        if (/OPR|Opera/i.test(userAgent)) return 'Opera';
        if (/Edg/i.test(userAgent)) return 'Edge';
        if (/Chrome|CriOS/i.test(userAgent)) return 'Chrome';
        if (/Safari/i.test(userAgent)) return 'Safari';
        if (/Trident/i.test(userAgent)) return 'Internet Explorer';

        return 'Unknown';
    }

    function detectDeviceType() {
        const userAgent = navigator.userAgent;
        const hasTouch = navigator.maxTouchPoints > 0;
        const isTablet = /iPad|Tablet/i.test(userAgent) || (hasTouch && Math.min(screen.width, screen.height) >= 768);
        const isMobile = /Mobi|Android|iPhone|iPod/i.test(userAgent);

        if (isTablet) return 'Tablet';
        if (isMobile) return 'Mobile';

        return hasTouch ? 'Touch desktop' : 'Desktop';
    }

    function isMobileVisitor() {
        const userAgent = navigator.userAgent;
        const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);
        const iPadDesktopMode = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;
        const coarsePointerQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null;
        const hasCoarsePointer = coarsePointerQuery ? coarsePointerQuery.matches : false;
        const compactScreen = Math.min(window.innerWidth, screen.width || window.innerWidth) <= 900;

        return mobileUserAgent || iPadDesktopMode || (hasCoarsePointer && compactScreen);
    }

    function updateDisplayInfo() {
        if (!screenElement) return;

        const ratio = Number(window.devicePixelRatio || 1).toFixed(1).replace('.0', '');
        const viewport = `${window.innerWidth}x${window.innerHeight}`;
        const display = `${screen.width}x${screen.height} @${ratio}x`;
        screenElement.textContent = `${display} / ${viewport}`;
        screenElement.title = `Screen ${display}, viewport ${viewport}`;
    }

    function updateFacingFallback() {
        if (!facingElement) return;

        const orientation = screen.orientation;
        const type = orientation?.type || (window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait');
        const angle = Number.isFinite(orientation?.angle) ? ` / ${orientation.angle}deg` : '';
        const readableType = type.replace('-', ' ');
        facingElement.textContent = `${readableType}${angle}`;
        facingElement.title = 'Screen orientation fallback; physical tilt needs motion access';
    }

    function setupMotionScan() {
        if (!postureElement && !tiltElement && !facingElement) return;

        if (!hasDeviceMotion() && !hasDeviceOrientation()) {
            setMotionCopy('No motion sensor', 'no sensor');
            return;
        }

        if (needsMotionPermission() || needsOrientationPermission()) {
            if (motionTrigger) {
                motionTrigger.classList.add('is-visible');
                motionTrigger.addEventListener('click', requestMotionAccess);
            }
            setMotionCopy('Motion permission needed', 'locked');
            return;
        }

        startMotionListener();
    }

    async function requestMotionAccess() {
        if (!motionTrigger) return;

        motionTrigger.disabled = true;
        motionTrigger.classList.add('is-loading');

        try {
            const permissions = await requestSensorPermissions();

            if (permissions.some(permission => permission === 'granted')) {
                motionTrigger.classList.remove('is-visible');
                motionTrigger.classList.remove('is-loading');
                startMotionListener();
            } else {
                setMotionCopy('Motion permission denied', 'blocked');
                motionTrigger.disabled = false;
                motionTrigger.classList.remove('is-loading');
            }
        } catch (error) {
            setMotionCopy('Sensor unavailable', 'blocked');
            motionTrigger.disabled = false;
            motionTrigger.classList.remove('is-loading');
        }
    }

    function startMotionListener() {
        if (!motionListenerStarted && hasDeviceMotion()) {
            window.addEventListener('devicemotion', handleDeviceMotion, true);
            motionListenerStarted = true;
        }

        if (!orientationListenerStarted && hasDeviceOrientation()) {
            window.addEventListener('deviceorientation', handleDeviceOrientationFallback, true);
            orientationListenerStarted = true;
        }

        setMotionCopy('Reading phone position...', 'arming');

        window.setTimeout(() => {
            const isStillArming = (tiltElement && tiltElement.textContent === 'arming')
                || (!tiltElement && postureElement && postureElement.textContent === 'Reading phone position...');

            if (isStillArming && !receivedMotionData && !receivedOrientationData) {
                setMotionCopy('No sensor data', 'no data');
            }
        }, 1800);
    }

    function handleDeviceMotion(event) {
        const acceleration = event.accelerationIncludingGravity;
        if (!hasValidGravity(acceleration)) return;

        gravity.x = smoothGravity(gravity.x, acceleration.x);
        gravity.y = smoothGravity(gravity.y, acceleration.y);
        gravity.z = smoothGravity(gravity.z, acceleration.z);
        receivedMotionData = true;

        const position = classifyBodyPositionGuess();
        const axisTitle = `x ${formatAcceleration(gravity.x)}, y ${formatAcceleration(gravity.y)}, z ${formatAcceleration(gravity.z)}`;
        renderPhonePosition(position, axisTitle);
    }

    function handleDeviceOrientationFallback(event) {
        if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;

        receivedOrientationData = true;
        const position = classifyOrientationFallback(event.beta, event.gamma);
        const axisTitle = `beta ${formatAngle(event.beta)}, gamma ${formatAngle(event.gamma)}`;
        renderPhonePosition(position, axisTitle);
    }

    function renderPhonePosition(position, axisTitle) {
        if (facingElement) {
            facingElement.textContent = position.facing;
            facingElement.title = `${position.key} / ${axisTitle}`;
        }

        if (postureElement) {
            postureElement.textContent = position.label;
            postureElement.dataset.position = position.key;
            postureElement.title = `${position.detail} ${axisTitle}`;
        }

        if (tiltElement) {
            tiltElement.textContent = axisTitle;
            tiltElement.title = `${position.key} / ${position.detail}`;
        }
    }

    function classifyOrientationFallback(beta, gamma) {
        const absBeta = Math.abs(beta);
        const absGamma = Math.abs(gamma);

        if (absBeta < 24 && absGamma < 24) {
            return getPositionState('display_up', 'orientation fallback: beta 0 / gamma 0, flat display up');
        }

        if (absBeta > 156 && absGamma < 24) {
            return getPositionState('lying_on_back', 'orientation fallback: screen toward face');
        }

        if (absBeta > 58 && absBeta < 124 && absGamma < 34) {
            return getPositionState('upright', 'orientation fallback: upright portrait');
        }

        if (Math.abs(gamma) > 42) {
            const side = getShoulderSide(gamma);
            return getPositionState(`lying_${side}_shoulder`, `orientation fallback: ${side} edge down`);
        }

        return getPositionState('unknown_tilted', 'orientation fallback: tilted/unclear');
    }

    function classifyBodyPositionGuess() {
        const { x, y, z } = gravity;

        if (![x, y, z].every(Number.isFinite)) {
            return getPositionState('unknown_tilted', 'The gravity vector is not fully readable yet.');
        }

        const sample = {
            x,
            y,
            z,
            ax: Math.abs(x),
            ay: Math.abs(y),
            az: Math.abs(z)
        };
        const maxAxis = Math.max(sample.ax, sample.ay, sample.az);

        if (maxAxis < GRAVITY_MINIMUM) {
            return getPositionState('unknown_tilted', 'The gravity vector is not clear enough.');
        }

        return phonePositionStates.find(({ matches }) => matches && matches(sample))
            || getPositionState('unknown_tilted');
    }

    function getPositionState(key, detail) {
        const state = phonePositionStates.find(position => position.key === key);

        if (!state) {
            return {
                key,
                axis: null,
                facing: key,
                label: phonePositionMessages[key] || key,
                detail
            };
        }

        return {
            ...state,
            detail: detail || state.detail
        };
    }

    function getShoulderSide(x) {
        const detectedSide = x > 0 ? 'right' : 'left';

        if (!INVERT_SHOULDER_SIDE) return detectedSide;

        return detectedSide === 'right' ? 'left' : 'right';
    }

    function smoothGravity(oldValue, newValue) {
        if (!Number.isFinite(newValue)) return oldValue;
        if (oldValue == null) return newValue;

        return oldValue + GRAVITY_SMOOTHING * (newValue - oldValue);
    }

    function setMotionCopy(posture, tilt, facing) {
        if (postureElement) {
            postureElement.textContent = posture;
            delete postureElement.dataset.position;
        }
        if (tiltElement) tiltElement.textContent = tilt;
        if (facingElement && facing) facingElement.textContent = facing;
    }

    function formatAcceleration(value) {
        return Number.isFinite(value) ? value.toFixed(2) : '-';
    }

    function formatAngle(value) {
        return Number.isFinite(value) ? `${Math.round(value)}deg` : '-';
    }

    function hasValidGravity(acceleration) {
        return acceleration
            && Number.isFinite(acceleration.x)
            && Number.isFinite(acceleration.y)
            && Number.isFinite(acceleration.z);
    }

    function hasDeviceMotion() {
        return 'DeviceMotionEvent' in window;
    }

    function hasDeviceOrientation() {
        return 'DeviceOrientationEvent' in window;
    }

    function needsMotionPermission() {
        return hasDeviceMotion() && typeof DeviceMotionEvent.requestPermission === 'function';
    }

    function needsOrientationPermission() {
        return hasDeviceOrientation() && typeof DeviceOrientationEvent.requestPermission === 'function';
    }

    async function requestSensorPermissions() {
        const permissions = [];

        if (needsMotionPermission()) {
            try {
                permissions.push(await DeviceMotionEvent.requestPermission());
            } catch (error) {
                permissions.push('denied');
            }
        }

        if (needsOrientationPermission()) {
            try {
                permissions.push(await DeviceOrientationEvent.requestPermission());
            } catch (error) {
                permissions.push('denied');
            }
        }

        return permissions.length ? permissions : ['granted'];
    }

    function updateLocaleInfo() {
        if (timezoneElement) {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
            timezoneElement.textContent = timezone;
            timezoneElement.title = timezone;
        }

        if (languageElement) {
            const languages = navigator.languages?.length ? navigator.languages.join(', ') : navigator.language || 'Unknown';
            languageElement.textContent = navigator.language || 'Unknown';
            languageElement.title = languages;
        }

        updateLocalTime();
    }

    function updateLocalTime() {
        if (!localTimeElement) return;

        localTimeElement.textContent = new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date());
    }

    function updateNetworkInfo() {
        if (!networkElement) return;

        const connection = getConnection();

        if (!navigator.onLine) {
            networkElement.textContent = 'Offline';
            networkElement.title = 'Offline';
            return;
        }

        if (!connection) {
            networkElement.textContent = 'Online';
            networkElement.title = 'Network details not exposed by this browser';
            return;
        }

        const parts = [];
        if (connection.effectiveType) parts.push(connection.effectiveType.toUpperCase());
        if (connection.downlink) parts.push(`${connection.downlink} Mbps`);
        if (connection.rtt) parts.push(`${connection.rtt}ms`);
        if (connection.saveData) parts.push('save-data');

        networkElement.textContent = parts.length ? parts.join(' / ') : 'Online';
        networkElement.title = networkElement.textContent;
    }

    function updateSessionInfo() {
        if (!sessionElement) return;

        sessionElement.textContent = formatDuration(Date.now() - sessionStartedAt);
    }

    function updateScanText() {
        if (!scanTextElement) return;

        const index = Math.floor((Date.now() - sessionStartedAt) / 1700) % scanSteps.length;
        scanTextElement.textContent = scanSteps[index];

        if (threatLevelElement && Date.now() - sessionStartedAt > 6500) {
            threatLevelElement.textContent = 'profile locked';
        }
    }

    function updateCommandLine() {
        if (!commandElement) return;

        const index = Math.floor((Date.now() - sessionStartedAt) / 2400) % commandSteps.length;
        commandElement.textContent = commandSteps[index];
    }

    function getConnection() {
        return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    }

    function formatDuration(durationMs) {
        const totalSeconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');

        return `${minutes}:${seconds}`;
    }
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
