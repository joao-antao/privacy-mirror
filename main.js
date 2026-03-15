/* ============================================================
   Privacy Mirror — main.js
   Sections:
     1. Time on Page
     2. Scroll Depth
     3. Mouse Position
     4. Device & Browser Detection
     5. Referrer
     6. Cookies & Local Storage
     7. Network Connection
     8. Battery
     9. IP Address & Geolocation
    10. Browser Fingerprint
    11. GPS (permission-gated)
   ============================================================ */


/* ── 1. Time on Page ─────────────────────────────────────── */
const startTime = Date.now();

setInterval(() => {
  const totalSecs = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;

  document.getElementById('time-value').textContent = mins > 0
    ? `${mins} minute${mins > 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}`
    : `${totalSecs} second${totalSecs !== 1 ? 's' : ''}`;
}, 1000);


/* ── 2. Scroll Depth ─────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const el  = document.documentElement;
  const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
  document.getElementById('scroll-value').textContent = `${pct}% of the page`;
});


/* ── 3. Mouse Position ───────────────────────────────────── */
document.addEventListener('mousemove', e => {
  document.getElementById('mouse-value').textContent =
    `X: ${e.clientX}px, Y: ${e.clientY}px from the top-left of your screen`;
});


/* ── 4. Device & Browser Detection ──────────────────────── */
(function detectDevice() {
  const ua = navigator.userAgent;

  function getBrowser(ua) {
    if (/Edg\//.test(ua))     return 'Microsoft Edge';
    if (/OPR\//.test(ua))     return 'Opera';
    if (/Chrome\//.test(ua))  return 'Google Chrome';
    if (/Firefox\//.test(ua)) return 'Mozilla Firefox';
    if (/Safari\//.test(ua))  return 'Apple Safari';
    return 'Unknown Browser';
  }

  function getOS(ua) {
    if (/Windows NT 10/.test(ua)) return 'Windows 10 or 11';
    if (/Windows NT/.test(ua))    return 'Windows (older)';
    if (/Mac OS X/.test(ua))      return 'macOS (Apple Mac)';
    if (/iPhone/.test(ua))        return 'iPhone (iOS)';
    if (/iPad/.test(ua))          return 'iPad (iPadOS)';
    if (/Android/.test(ua))       return 'Android Phone or Tablet';
    if (/Linux/.test(ua))         return 'Linux';
    return 'Unknown OS';
  }

  function getDeviceType(ua) {
    if (/iPhone|Android.*Mobile/.test(ua)) return '📱 Mobile phone';
    if (/iPad|Android/.test(ua))           return '📲 Tablet';
    return '💻 Desktop or laptop computer';
  }

  document.getElementById('browser-value').textContent = getBrowser(ua);
  document.getElementById('os-value').textContent      = getOS(ua);
  document.getElementById('device-value').textContent  = getDeviceType(ua);

  document.getElementById('screen-value').textContent =
    `${screen.width} × ${screen.height} pixels (your visible area: ${window.innerWidth} × ${window.innerHeight})`;

  document.getElementById('lang-value').textContent =
    navigator.language || 'Unknown';

  document.getElementById('tz-value').textContent =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
})();


/* ── 5. Referrer ─────────────────────────────────────────── */
(function showReferrer() {
  const ref = document.referrer;
  document.getElementById('referrer-value').textContent = ref
    ? ref
    : 'None detected — you typed the address directly, or opened it as a file';
})();


/* ── 6. Cookies & Local Storage ─────────────────────────── */
(function showStorage() {
  document.getElementById('cookie-value').textContent = navigator.cookieEnabled
    ? 'Cookies are ENABLED on your browser (most websites can set them)'
    : 'Cookies are disabled on your browser';

  try {
    localStorage.setItem('_pm_test', '1');
    localStorage.removeItem('_pm_test');
    document.getElementById('storage-value').textContent =
      'Local storage is ENABLED (websites can save data on your device)';
  } catch (e) {
    document.getElementById('storage-value').textContent =
      'Local storage is disabled';
  }
})();


/* ── 7. Network Connection ───────────────────────────────── */
(function showConnection() {
  const conn = navigator.connection
    || navigator.mozConnection
    || navigator.webkitConnection;

  if (!conn) {
    document.getElementById('connection-value').textContent =
      'Connection info not available in this browser';
    return;
  }

  const typeLabels = {
    wifi:      'WiFi',
    cellular:  'Mobile Data (4G/5G)',
    ethernet:  'Wired (Ethernet)',
    bluetooth: 'Bluetooth',
    none:      'No connection',
    other:     'Other',
  };

  const label   = typeLabels[conn.type] || conn.effectiveType || 'Unknown';
  const speedPart = conn.downlink ? ` — roughly ${conn.downlink} Mbps` : '';

  document.getElementById('connection-value').textContent = label + speedPart;
})();


/* ── 8. Battery ──────────────────────────────────────────── */
(function showBattery() {
  const el = document.getElementById('battery-value');

  if (!navigator.getBattery) {
    el.textContent = 'Battery info not available in this browser';
    return;
  }

  navigator.getBattery()
    .then(battery => {
      const pct    = Math.round(battery.level * 100);
      const status = battery.charging ? '⚡ Charging' : '🔋 On battery';
      el.textContent = `${pct}% — ${status}`;
    })
    .catch(() => {
      el.textContent = 'Battery info not available in this browser';
    });
})();


/* ── 9. IP Address, Geolocation & ISP ───────────────────── */
async function fetchIPInfo() {
  // Strategy: try multiple CORS-open services in order of reliability.
  // Every path tries to return: ip, location, isp.

  // 1. Cloudflare trace for IP, then ipwho.is for geo + ISP
  try {
    const res  = await fetch('https://cloudflare.com/cdn-cgi/trace');
    const text = await res.text();
    const get  = key => { const m = text.match(new RegExp(key + '=(.+)')); return m ? m[1].trim() : null; };
    const ip   = get('ip');
    const loc  = get('loc');

    if (ip) {
      let location = loc ? `Country code: ${loc}` : '';
      let isp      = null;

      try {
        const geo = await fetch(`https://ipwho.is/${ip}`).then(r => r.json());
        if (geo.success !== false && geo.city) {
          location = [geo.city, geo.region, geo.country].filter(Boolean).join(', ');
          isp      = geo.connection?.isp || geo.org || null;
        }
      } catch (_) { /* use country-code fallback */ }

      return { ip, location, isp };
    }
  } catch (_) {}

  // 2. ipwho.is (returns IP + geo + ISP in one call)
  try {
    const d = await fetch('https://ipwho.is/').then(r => r.json());
    if (d.ip) {
      return {
        ip:       d.ip,
        location: [d.city, d.region, d.country].filter(Boolean).join(', '),
        isp:      d.connection?.isp || d.org || null,
      };
    }
  } catch (_) {}

  // 3. ipapi.co (includes org field)
  try {
    const d = await fetch('https://ipapi.co/json/').then(r => r.json());
    if (d.ip) {
      return {
        ip:       d.ip,
        location: [d.city, d.region, d.country_name].filter(Boolean).join(', '),
        isp:      d.org || null,
      };
    }
  } catch (_) {}

  // 4. ipify — IP only, no geo or ISP
  try {
    const d = await fetch('https://api.ipify.org?format=json').then(r => r.json());
    if (d.ip) return { ip: d.ip, location: 'Location lookup unavailable', isp: null };
  } catch (_) {}

  return null;
}

fetchIPInfo().then(result => {
  if (result) {
    document.getElementById('ip-value').textContent       = result.ip;
    document.getElementById('location-value').textContent = result.location || 'Could not detect';
    document.getElementById('isp-value').textContent      = result.isp     || 'Could not detect';
  } else {
    document.getElementById('ip-value').textContent       = 'Could not detect';
    document.getElementById('location-value').textContent = 'Could not detect';
    document.getElementById('isp-value').textContent      = 'Could not detect';
  }
});


/* ── 10. Browser Fingerprint ─────────────────────────────── */
async function buildFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    navigator.deviceMemory || 'unknown',
    navigator.cookieEnabled,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.platform,
  ];

  // Canvas fingerprint — subtle rendering differences per GPU/driver/OS
  try {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font         = '14px Arial';
    ctx.fillStyle    = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser fingerprint 🖐', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('Browser fingerprint 🖐', 4, 17);
    parts.push(canvas.toDataURL().slice(-50));
  } catch (_) {}

  // djb2-style hash
  const str = parts.join('||');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // convert to 32-bit int
  }

  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const suffix = Date.now().toString(16).toUpperCase().slice(-6);

  return hex.match(/.{1,4}/g).join('-') + '-' + suffix;
}

buildFingerprint().then(fp => {
  document.getElementById('fingerprint-value').textContent = fp;
});


/* ── 11. GPS (permission-gated) ──────────────────────────── */
function testGPS() {
  const el = document.getElementById('gps-value');
  el.textContent = 'Asking your browser for permission…';

  if (!navigator.geolocation) {
    el.textContent = 'GPS not supported in this browser';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(5);
      const lon = pos.coords.longitude.toFixed(5);
      const acc = Math.round(pos.coords.accuracy);
      el.textContent = `Latitude: ${lat}, Longitude: ${lon} — accurate to within ${acc} metres!`;

      const mapsLink = document.getElementById('maps-link');
      mapsLink.href = `https://www.openstreetmap.org/search?query=${lat},${lon}`;
      mapsLink.style.display = 'inline-block';
    },
    err => {
      const messages = {
        1: 'You said no — good choice! You are in control.',
        2: 'Could not get your location.',
        3: 'Timed out.',
      };
      el.textContent = messages[err.code] || 'Error getting location';
    }
  );
}
