// ConstellationsWebApp — main app logic
// No external API calls. All data from local files. User data in IndexedDB.

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const startScreen       = document.getElementById('start-screen');
const startBtn          = document.getElementById('start-btn');
const gpsEl             = document.getElementById('gps-data');
const headingEl         = document.getElementById('heading-data');
const tiltEl            = document.getElementById('tilt-data');
const targetLabel       = document.getElementById('target-label');
const constellationBadge= document.getElementById('constellation-badge');
const logBtn            = document.getElementById('log-btn');
const logPanel          = document.getElementById('log-panel');
const logList           = document.getElementById('log-list');
const logEmpty          = document.getElementById('log-empty');
const logClose          = document.getElementById('log-close');
const settingsPanel     = document.getElementById('settings-panel');
const settingsClose     = document.getElementById('settings-close');
const fovRange          = document.getElementById('fov-range');
const fovOutput         = document.getElementById('fov-output');
const magRange          = document.getElementById('mag-range');
const magOutput         = document.getElementById('mag-output');
const toolbarSky        = document.getElementById('toolbar-sky');
const toolbarLog        = document.getElementById('toolbar-log');
const toolbarSettings   = document.getElementById('toolbar-settings');

// ── State ─────────────────────────────────────────────────────────────────────
let userLat      = null;
let userLon      = null;
let currentTarget = null;   // currently locked star object
let fovDeg       = 10;      // field-of-view threshold in degrees
let magLimit     = 3.5;     // hide stars fainter than this magnitude

// ── Constants ─────────────────────────────────────────────────────────────────
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// ── Settings persistence ──────────────────────────────────────────────────────
async function loadSettings() {
  fovDeg   = await DB.getSetting('fovDegrees',  10);
  magLimit = await DB.getSetting('magLimit',   3.5);
  fovRange.value  = fovDeg;
  magRange.value  = magLimit;
  fovOutput.value = fovDeg + '°';
  magOutput.value = magLimit;
}

fovRange.addEventListener('input', async () => {
  fovDeg = parseFloat(fovRange.value);
  fovOutput.value = fovDeg + '°';
  await DB.setSetting('fovDegrees', fovDeg);
});

magRange.addEventListener('input', async () => {
  magLimit = parseFloat(magRange.value);
  magOutput.value = magLimit;
  await DB.setSetting('magLimit', magLimit);
});

// ── Sensor startup ────────────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const state = await DeviceOrientationEvent.requestPermission();
      if (state === 'granted') startSensors();
      else alert('Gyroscope permission denied. Cannot point at sky.');
    } catch (err) { console.error(err); }
  } else {
    startSensors();
  }
});

function startSensors() {
  startScreen.style.display = 'none';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;
      gpsEl.textContent = `${userLat.toFixed(2)}°, ${userLon.toFixed(2)}°`;
    },
    () => {
      gpsEl.textContent = 'GPS unavailable — using Seattle';
      userLat = 47.60;
      userLon = -122.33;
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
  window.addEventListener('deviceorientation', handleOrientation);
}

// ── Astronomy math ────────────────────────────────────────────────────────────
function getAltAz(ra, dec, lat, lon) {
  const now  = new Date();
  const jd   = now.getTime() / 86400000.0 + 2440587.5;
  const t    = (jd - 2451545.0) / 36525.0;

  // Greenwich Mean Sidereal Time (degrees)
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t;
  gmst = ((gmst % 360) + 360) % 360;

  // Local Hour Angle
  let ha = ((gmst + lon - ra) % 360 + 360) % 360;

  const latR = lat * D2R;
  const decR = dec * D2R;
  const haR  = ha  * D2R;

  const sinAlt = Math.sin(decR) * Math.sin(latR) +
                 Math.cos(decR) * Math.cos(latR) * Math.cos(haR);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * R2D;

  const cosAlt = Math.cos(alt * D2R);
  let az = 0;
  if (cosAlt > 0.0001) {
    const cosAz = (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * cosAlt);
    az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * R2D;
    if (Math.sin(haR) > 0) az = 360 - az;
  }

  return { alt, az };
}

// ── Angular distance between two az/alt vectors ───────────────────────────────
function angularDistance(az1, alt1, az2, alt2) {
  const a1 = alt1 * D2R, a2 = alt2 * D2R;
  const dAz = (az1 - az2) * D2R;
  const cosD = Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dAz);
  return Math.acos(Math.max(-1, Math.min(1, cosD))) * R2D;
}

// ── Device orientation handler ────────────────────────────────────────────────
function handleOrientation(event) {
  if (userLat === null) return;

  const phoneAz  = event.webkitCompassHeading != null
    ? event.webkitCompassHeading
    : (360 - event.alpha) % 360;
  const phoneAlt = event.beta ?? 0;

  headingEl.textContent = Math.round(phoneAz);
  tiltEl.textContent    = Math.round(phoneAlt);

  let bestStar = null;
  let bestDist = Infinity;

  for (const star of STARS) {
    if (star.mag > magLimit) continue;             // magnitude filter
    const pos = getAltAz(star.ra, star.dec, userLat, userLon);
    if (pos.alt < 0) continue;                     // below horizon

    const dist = angularDistance(phoneAz, phoneAlt, pos.az, pos.alt);
    if (dist < fovDeg && dist < bestDist) {
      bestDist = dist;
      bestStar = star;
    }
  }

  if (bestStar) {
    currentTarget = bestStar;
    targetLabel.textContent = `🎯 ${bestStar.name}`;
    targetLabel.classList.add('locked');
    constellationBadge.textContent = bestStar.constellation;
    logBtn.classList.add('visible');
  } else {
    currentTarget = null;
    targetLabel.textContent = 'Scan the sky…';
    targetLabel.classList.remove('locked');
    constellationBadge.textContent = '';
    logBtn.classList.remove('visible');
  }
}

// ── Log observation ───────────────────────────────────────────────────────────
logBtn.addEventListener('click', async () => {
  if (!currentTarget) return;
  const pos = getAltAz(currentTarget.ra, currentTarget.dec, userLat, userLon);
  await DB.logObservation(
    currentTarget.name,
    userLat, userLon,
    Math.round(pos.az),
    Math.round(pos.alt)
  );
  logBtn.textContent = '✓ Logged!';
  setTimeout(() => { logBtn.textContent = '+ Log Observation'; }, 1500);
});

// ── Log panel ─────────────────────────────────────────────────────────────────
async function openLogPanel() {
  logPanel.classList.add('open');
  logList.innerHTML = '';
  const entries = await DB.getObservations(100);
  if (entries.length === 0) {
    logEmpty.style.display = 'block';
  } else {
    logEmpty.style.display = 'none';
    for (const e of entries) {
      const d = new Date(e.timestamp);
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `
        <div class="log-name">${e.objectName}</div>
        <div class="log-meta">
          ${d.toLocaleDateString()} ${d.toLocaleTimeString()} &nbsp;|&nbsp;
          Az ${e.az}° Alt ${e.alt}° &nbsp;|&nbsp;
          ${e.lat.toFixed(2)}°, ${e.lon.toFixed(2)}°
        </div>`;
      logList.appendChild(div);
    }
  }
}

toolbarLog.addEventListener('click', () => openLogPanel());
logClose.addEventListener('click', () => logPanel.classList.remove('open'));

// ── Settings panel ────────────────────────────────────────────────────────────
toolbarSettings.addEventListener('click', () => settingsPanel.classList.add('open'));
settingsClose.addEventListener('click', () => settingsPanel.classList.remove('open'));

// ── Sky view (close panels) ───────────────────────────────────────────────────
toolbarSky.addEventListener('click', () => {
  logPanel.classList.remove('open');
  settingsPanel.classList.remove('open');
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadSettings();
