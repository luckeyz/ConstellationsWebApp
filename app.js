// ConstellationsWebApp — main app logic
// No external API calls. All data from local files. User data in IndexedDB.

'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const startScreen        = document.getElementById('start-screen');
const startBtn           = document.getElementById('start-btn');
const gpsEl              = document.getElementById('gps-data');
const headingEl          = document.getElementById('heading-data');
const tiltEl             = document.getElementById('tilt-data');
const targetLabel        = document.getElementById('target-label');
const constellationBadge = document.getElementById('constellation-badge');
const logBtn             = document.getElementById('log-btn');
const logPanel           = document.getElementById('log-panel');
const logList            = document.getElementById('log-list');
const logEmpty           = document.getElementById('log-empty');
const logClose           = document.getElementById('log-close');
const settingsPanel      = document.getElementById('settings-panel');
const settingsClose      = document.getElementById('settings-close');
const fovRange           = document.getElementById('fov-range');
const fovOutput          = document.getElementById('fov-output');
const magRange           = document.getElementById('mag-range');
const magOutput          = document.getElementById('mag-output');
const toolbarSky         = document.getElementById('toolbar-sky');
const toolbarLog         = document.getElementById('toolbar-log');
const toolbarSettings    = document.getElementById('toolbar-settings');
const canvas             = document.getElementById('sky-canvas');
const ctx                = canvas.getContext('2d');

// ── State ─────────────────────────────────────────────────────────────────────
let userLat       = null;
let userLon       = null;
let currentTarget = null;   // locked star object
let phoneAz       = 0;      // current compass heading
let phoneAlt      = 45;     // current tilt (degrees above horizon)
let fovDeg        = 10;     // field-of-view threshold for matching
let magLimit      = 3.5;    // hide stars fainter than this
let canvasW       = 0;
let canvasH       = 0;

// ── Constants ─────────────────────────────────────────────────────────────────
const D2R       = Math.PI / 180;
const R2D       = 180 / Math.PI;
const VIEW_DEG  = 60;     // total degrees visible across screen width

// ── Canvas sizing ─────────────────────────────────────────────────────────────
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvasW = canvas.width;
  canvasH = canvas.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Settings persistence ──────────────────────────────────────────────────────
async function loadSettings() {
  fovDeg   = await DB.getSetting('fovDegrees', 10);
  magLimit = await DB.getSetting('magLimit',  3.5);
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
  requestAnimationFrame(renderFrame);
}

// ── Astronomy math ────────────────────────────────────────────────────────────
function getAltAz(ra, dec, lat, lon) {
  const now  = new Date();
  const jd   = now.getTime() / 86400000.0 + 2440587.5;
  const t    = (jd - 2451545.0) / 36525.0;

  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t;
  gmst = ((gmst % 360) + 360) % 360;

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

function angularDistance(az1, alt1, az2, alt2) {
  const a1 = alt1 * D2R, a2 = alt2 * D2R;
  const dAz = (az1 - az2) * D2R;
  const cosD = Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dAz);
  return Math.acos(Math.max(-1, Math.min(1, cosD))) * R2D;
}

// ── Project a sky coordinate onto screen pixels ───────────────────────────────
// Returns {x, y} in pixels, or null if outside visible area.
function project(starAz, starAlt) {
  // Angular offset from phone pointing direction
  let dAz = starAz - phoneAz;
  // Wrap dAz to -180..180
  if (dAz >  180) dAz -= 360;
  if (dAz < -180) dAz += 360;
  const dAlt = starAlt - phoneAlt;

  // Scale: VIEW_DEG spans the full canvas width
  const scale = canvasW / VIEW_DEG;

  const x = canvasW / 2 + dAz  * scale;
  const y = canvasH / 2 - dAlt * scale;

  // Cull stars well outside the screen
  const margin = 60;
  if (x < -margin || x > canvasW + margin ||
      y < -margin || y > canvasH + margin) return null;

  return { x, y };
}

// ── Build a lookup: starName → {x, y} for the current frame ──────────────────
function buildStarPositions(lat, lon) {
  const positions = {};
  for (const star of STARS) {
    const pos = getAltAz(star.ra, star.dec, lat, lon);
    if (pos.alt < -5) continue;                   // skip well below horizon
    const screen = project(pos.az, pos.alt);
    if (!screen) continue;
    positions[star.name] = { ...screen, alt: pos.alt, az: pos.az, star };
  }
  return positions;
}

// ── Canvas render loop ────────────────────────────────────────────────────────
function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (userLat === null) {
    drawWaitingState();
    return;
  }

  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background gradient — deep space
  const grad = ctx.createRadialGradient(canvasW/2, canvasH/2, 0, canvasW/2, canvasH/2, canvasH);
  grad.addColorStop(0, '#0d1520');
  grad.addColorStop(1, '#080b12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const positions = buildStarPositions(userLat, userLon);
  const lockedConst = currentTarget ? currentTarget.constellation : null;

  // ── Draw constellation lines ──
  for (const cons of CONSTELLATIONS) {
    const isActive = cons.name === lockedConst;
    for (const [nameA, nameB] of cons.links) {
      const a = positions[nameA];
      const b = positions[nameB];
      if (!a || !b) continue;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      if (isActive) {
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.55)';
        ctx.lineWidth   = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(100, 160, 200, 0.18)';
        ctx.lineWidth   = 1;
      }
      ctx.stroke();
    }
  }

  // ── Draw stars ──
  for (const [name, p] of Object.entries(positions)) {
    const { star } = p;
    if (star.mag > magLimit) continue;

    // Radius based on brightness (mag scale is inverted — lower = brighter)
    const radius = Math.max(1.2, 5.5 - star.mag * 0.9);
    const isLocked   = currentTarget && star.name === currentTarget.name;
    const inConstellation = lockedConst && star.constellation === lockedConst;

    // Glow for bright or locked stars
    if (isLocked || star.mag < 2.0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 3.5, 0, Math.PI * 2);
      const glowColor = isLocked ? 'rgba(255, 220, 0,' : 'rgba(180, 220, 255,';
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.5);
      glow.addColorStop(0, glowColor + '0.25)');
      glow.addColorStop(1, glowColor + '0)');
      ctx.fillStyle = glow;
      ctx.fill();
    }

    // Star dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

    if (isLocked) {
      ctx.fillStyle = '#ffdd00';
    } else if (inConstellation) {
      ctx.fillStyle = '#88eedd';
    } else {
      // Color by temperature approximation — bluer for hot, redder for cool
      const brightness = Math.min(1, (magLimit - star.mag + 1) / (magLimit + 2));
      ctx.fillStyle = `rgba(200, 220, 255, ${0.55 + brightness * 0.45})`;
    }
    ctx.fill();

    // Label — only for locked or bright stars nearby
    const distFromCenter = angularDistance(phoneAz, phoneAlt, p.az, p.alt);
    if (isLocked || (star.mag < 1.5 && distFromCenter < VIEW_DEG * 0.45)) {
      ctx.font      = isLocked ? 'bold 13px Courier New' : '11px Courier New';
      ctx.fillStyle = isLocked ? '#ffdd00' : 'rgba(160, 210, 255, 0.75)';
      ctx.fillText(star.name, p.x + radius + 5, p.y + 4);
    }
  }

  // ── Horizon line (if near horizon) ──
  if (phoneAlt < VIEW_DEG / 2 + 10) {
    const horizonY = canvasH / 2 + phoneAlt * (canvasW / VIEW_DEG);
    if (horizonY < canvasH + 30) {
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(canvasW, horizonY);
      ctx.strokeStyle = 'rgba(60, 120, 60, 0.35)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(60, 120, 60, 0.2)';
      ctx.fillRect(0, horizonY, canvasW, canvasH - horizonY);
    }
  }
}

function drawWaitingState() {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#080b12';
  ctx.fillRect(0, 0, canvasW, canvasH);
  // Faint static stars for atmosphere
  const seed = [0.12,0.37,0.55,0.71,0.84,0.23,0.66,0.49,0.91,0.08,
                0.33,0.78,0.15,0.62,0.44,0.97,0.28,0.53,0.87,0.19];
  for (let i = 0; i < seed.length; i++) {
    const x = seed[i] * canvasW;
    const y = seed[(i + 7) % seed.length] * canvasH;
    const r = 0.8 + seed[(i + 3) % seed.length] * 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${0.2 + seed[(i+1)%seed.length] * 0.35})`;
    ctx.fill();
  }
}

// ── Device orientation handler ────────────────────────────────────────────────
function handleOrientation(event) {
  if (userLat === null) return;

  phoneAz  = event.webkitCompassHeading != null
    ? event.webkitCompassHeading
    : (360 - event.alpha) % 360;
  phoneAlt = event.beta ?? 45;

  headingEl.textContent = Math.round(phoneAz);
  tiltEl.textContent    = Math.round(phoneAlt);

  // Find best matching star
  let bestStar = null;
  let bestDist = Infinity;

  for (const star of STARS) {
    if (star.mag > magLimit) continue;
    const pos = getAltAz(star.ra, star.dec, userLat, userLon);
    if (pos.alt < 0) continue;

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
// Start render loop immediately so the waiting state shows on the start screen
requestAnimationFrame(renderFrame);
