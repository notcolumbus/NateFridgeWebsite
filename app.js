// Janney fridge dashboard — vanilla JS, no build step.

const TZ = 'America/New_York';
const NAME = 'Mr. Janney';

// Open-Meteo: free, no API key. Default location is Washington, DC.
const WEATHER = { lat: 38.9072, lon: -77.0369 };

// ESPN team id for the Houston Rockets.
const TEAM_ID = 10;
const ESPN = {
  schedule: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${TEAM_ID}/schedule`,
  summary: (id) =>
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${id}`,
};

const $ = (id) => document.getElementById(id);

// ---- greeting ---------------------------------------------------------------

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
}

// ---- morphing clock ---------------------------------------------------------

const TIME_PATTERN = ['d', 'd', ':', 'd', 'd'];

function buildClock(root) {
  root.innerHTML = '';
  for (let i = 0; i < TIME_PATTERN.length; i++) {
    const slot = document.createElement('span');
    slot.className = 'slot';
    slot.dataset.char = TIME_PATTERN[i] === ':' ? ':' : '';
    const glyph = document.createElement('span');
    glyph.className = 'glyph cur';
    glyph.textContent = TIME_PATTERN[i] === ':' ? ':' : '0';
    slot.appendChild(glyph);
    root.appendChild(slot);
  }
}

function setSlot(slot, ch) {
  const cur = slot.querySelector('.glyph.cur');
  if (cur && cur.textContent === ch) return;
  slot.dataset.char = ch;

  if (cur) {
    const out = cur.cloneNode(true);
    out.classList.remove('cur');
    out.classList.add('stack', 'exit');
    slot.appendChild(out);
    requestAnimationFrame(() => out.classList.add('exit-active'));
    setTimeout(() => out.remove(), 600);
    cur.remove();
  }

  const next = document.createElement('span');
  next.className = 'glyph cur enter';
  next.textContent = ch;
  slot.appendChild(next);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => next.classList.add('enter-active'))
  );
}

function renderTime(root, str) {
  const slots = root.querySelectorAll('.slot');
  for (let i = 0; i < slots.length && i < str.length; i++) setSlot(slots[i], str[i]);
}

function partsInTZ(date, tz, opts) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).formatToParts(date);
  const out = {};
  for (const p of f) out[p.type] = p.value;
  return out;
}

function tick() {
  const now = new Date();
  const t = partsInTZ(now, TZ, { hour12: false, hour: '2-digit', minute: '2-digit' });
  const h24 = parseInt(t.hour, 10);
  const display12 = ((h24 + 11) % 12) + 1;
  const hh = String(display12).padStart(2, '0');
  renderTime($('time'), `${hh}:${t.minute}`);

  $('greeting').textContent = `${greetingFor(h24)}, ${NAME}`;

  const d = partsInTZ(now, TZ, { weekday: 'long', month: 'long', day: 'numeric' });
  $('date').textContent = `${d.weekday}, ${d.month} ${d.day}`;
}

// ---- weather ----------------------------------------------------------------

function describeWeather(code) {
  if (code === 0) return { label: 'Clear', icon: 'sun' };
  if (code === 1) return { label: 'Mostly clear', icon: 'sun' };
  if (code === 2) return { label: 'Partly cloudy', icon: 'cloud-sun' };
  if (code === 3) return { label: 'Overcast', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'cloud' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'rain' };
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: 'rain' };
  if (code === 85 || code === 86) return { label: 'Snow', icon: 'snow' };
  if (code >= 95) return { label: 'Storms', icon: 'storm' };
  return { label: '—', icon: 'cloud' };
}

function iconSvg(name) {
  const s =
    'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  switch (name) {
    case 'sun':
      return `<svg viewBox="0 0 24 24" ${s}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
    case 'cloud-sun':
      return `<svg viewBox="0 0 24 24" ${s}><circle cx="8" cy="8" r="3"/><path d="M8 1v1M1 8h1M2.5 2.5l.7.7M13.5 2.5l-.7.7"/><path d="M17 18a4 4 0 0 0-7.8-1.2A3 3 0 1 0 9 22h8a3 3 0 0 0 0-6h0z"/></svg>`;
    case 'cloud':
      return `<svg viewBox="0 0 24 24" ${s}><path d="M17 18a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 22h9a3 3 0 0 0 0-6h0z"/></svg>`;
    case 'rain':
      return `<svg viewBox="0 0 24 24" ${s}><path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/><path d="M8 20l-1 2M12 20l-1 2M16 20l-1 2"/></svg>`;
    case 'snow':
      return `<svg viewBox="0 0 24 24" ${s}><path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/><path d="M9 21h.01M13 21h.01M17 21h.01"/></svg>`;
    case 'storm':
      return `<svg viewBox="0 0 24 24" ${s}><path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/><path d="M12 18l-2 4h3l-1 2"/></svg>`;
    default:
      return '';
  }
}

async function loadWeather() {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${WEATHER.lat}&longitude=${WEATHER.lon}` +
    `&current=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=${encodeURIComponent(TZ)}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('weather http ' + res.status);
    const data = await res.json();
    const t = Math.round(data.current.temperature_2m);
    const hi = Math.round(data.daily.temperature_2m_max[0]);
    const lo = Math.round(data.daily.temperature_2m_min[0]);
    const desc = describeWeather(data.current.weather_code);
    $('weather-temp').innerHTML = `${t}&deg;`;
    $('weather-icon').innerHTML = iconSvg(desc.icon);
    $('weather-range').innerHTML = `H ${hi}&deg; &nbsp; L ${lo}&deg;`;
  } catch {
    $('weather-icon').innerHTML = iconSvg('cloud');
  }
}

// ---- rockets schedule + stats ----------------------------------------------

function fmtGameWhen(iso) {
  // "Sun, Apr 26 · 8:30 PM EDT"
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return `${date} · ${time}`;
}

function pickGame(events) {
  // Prefer the next upcoming game; fall back to the most recent past game.
  const now = Date.now();
  const sorted = [...(events || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const upcoming = sorted.find((e) => new Date(e.date).getTime() > now - 3 * 3600_000);
  return upcoming || sorted[sorted.length - 1] || null;
}

async function loadGame() {
  try {
    const res = await fetch(ESPN.schedule, { cache: 'no-store' });
    if (!res.ok) throw new Error('schedule http ' + res.status);
    const data = await res.json();
    const game = pickGame(data.events);
    if (!game) return;

    const comp = game.competitions?.[0];
    if (!comp) return;
    const us = comp.competitors.find((c) => c.team.id === String(TEAM_ID));
    const them = comp.competitors.find((c) => c.team.id !== String(TEAM_ID));
    const completed = comp.status?.type?.completed;

    const card = $('game-card');
    card.dataset.eventId = game.id;

    if (completed) {
      const won = parseInt(us.score, 10) > parseInt(them.score, 10);
      $('game-label').textContent = 'Last Game';
      $('game-title').textContent =
        `${us.team.displayName} ${us.score} – ${them.score} ${them.team.displayName}`;
      const d = new Date(game.date).toLocaleDateString('en-US', {
        timeZone: TZ,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      $('game-when').textContent = `${won ? 'W' : 'L'} · ${d}`;
    } else {
      const sep = us.homeAway === 'home' ? 'vs.' : '@';
      $('game-label').textContent = 'Next Game';
      $('game-title').textContent =
        `${us.team.displayName} ${sep} ${them.team.displayName}`;
      $('game-when').textContent = fmtGameWhen(game.date);
    }
  } catch {
    // Keep the static fallback already in the markup.
  }
}

// ---- stats overlay ----------------------------------------------------------

function openOverlay() {
  const ov = $('overlay');
  ov.classList.remove('hidden');
  ov.classList.add('flex');
  requestAnimationFrame(() => ov.classList.add('is-open'));
}
function closeOverlay() {
  const ov = $('overlay');
  ov.classList.remove('is-open');
  setTimeout(() => {
    ov.classList.add('hidden');
    ov.classList.remove('flex');
  }, 200);
}

function renderStats(data) {
  const comp = data?.header?.competitions?.[0];
  if (!comp) {
    $('overlay-content').innerHTML =
      `<p class="text-ink-500">Stats unavailable for this game.</p>`;
    return;
  }
  const home = comp.competitors.find((c) => c.homeAway === 'home');
  const away = comp.competitors.find((c) => c.homeAway === 'away');
  const status = comp.status?.type;
  const detail = status?.shortDetail || status?.description || '';

  // Linescore — only present once a game has tipped off.
  let linescore = '';
  const hasLines =
    Array.isArray(home.linescores) && home.linescores.length > 0 &&
    Array.isArray(away.linescores) && away.linescores.length > 0;
  if (hasLines) {
    const cols = home.linescores.length;
    const head = Array.from({ length: cols }, (_, i) =>
      i < 4 ? `Q${i + 1}` : `OT${i - 3}`
    );
    const row = (team) => `
      <tr>
        <td class="abbr">${team.team.abbreviation}</td>
        ${team.linescores.map((l) => `<td>${l.value}</td>`).join('')}
        <td class="total">${team.score}</td>
      </tr>`;
    linescore = `
      <table class="linescore">
        <thead>
          <tr><th></th>${head.map((h) => `<th>${h}</th>`).join('')}<th>T</th></tr>
        </thead>
        <tbody>${row(away)}${row(home)}</tbody>
      </table>`;
  }

  // Top performers, when ESPN provides them.
  let leaders = '';
  if (Array.isArray(data.leaders) && data.leaders.length) {
    const lines = [];
    for (const teamLead of data.leaders) {
      const ptsLead = teamLead.leaders?.find((l) => l.name === 'points');
      const top = ptsLead?.leaders?.[0];
      if (top?.athlete) {
        lines.push(
          `<div class="leader-row">
            <span class="abbr">${teamLead.team.abbreviation}</span>
            <span class="who">${top.athlete.shortName}</span>
            <span class="line">${top.displayValue}</span>
          </div>`
        );
      }
    }
    if (lines.length) {
      leaders = `<div class="leaders">
        <p class="section-label">Top Performers</p>
        ${lines.join('')}
      </div>`;
    }
  }

  // Header line: scheduled vs final.
  const scoreLine = comp.status?.type?.completed || hasLines
    ? `<span class="score">${away.score}</span>
       <span class="sep">–</span>
       <span class="score">${home.score}</span>`
    : `<span class="vs">${away.homeAway === 'away' ? '@' : 'vs.'}</span>`;

  $('overlay-content').innerHTML = `
    <p class="status-line">${detail}</p>
    <div class="matchup">
      <span class="team">${away.team.displayName}</span>
      ${scoreLine}
      <span class="team">${home.team.displayName}</span>
    </div>
    ${linescore}
    ${leaders}
  `;
}

async function openStats() {
  const eventId = $('game-card').dataset.eventId;
  openOverlay();
  $('overlay-content').innerHTML = `<p class="text-ink-500">Loading stats…</p>`;
  if (!eventId) {
    $('overlay-content').innerHTML =
      `<p class="text-ink-500">No game data available.</p>`;
    return;
  }
  try {
    const res = await fetch(ESPN.summary(eventId), { cache: 'no-store' });
    if (!res.ok) throw new Error('summary http ' + res.status);
    const data = await res.json();
    renderStats(data);
  } catch {
    $('overlay-content').innerHTML =
      `<p class="text-ink-500">Couldn't load stats — try again later.</p>`;
  }
}

$('game-card').addEventListener('click', openStats);
$('game-card').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openStats();
  }
});
$('overlay-backdrop').addEventListener('click', closeOverlay);
$('overlay-close').addEventListener('click', closeOverlay);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeOverlay();
});

// ---- fullscreen toggle ------------------------------------------------------

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

function syncFsIcon() {
  const enter = $('fs-icon-enter');
  const exit = $('fs-icon-exit');
  if (isFullscreen()) {
    enter.classList.add('hidden');
    exit.classList.remove('hidden');
  } else {
    enter.classList.remove('hidden');
    exit.classList.add('hidden');
  }
}

$('fs-btn').addEventListener('click', async () => {
  try {
    if (!isFullscreen()) {
      const el = document.documentElement;
      await (el.requestFullscreen?.() ||
        el.webkitRequestFullscreen?.() ||
        el.msRequestFullscreen?.());
    } else {
      await (document.exitFullscreen?.() ||
        document.webkitExitFullscreen?.() ||
        document.msExitFullscreen?.());
    }
  } catch {
    /* user canceled or browser blocked it */
  }
});

document.addEventListener('fullscreenchange', syncFsIcon);
document.addEventListener('webkitfullscreenchange', syncFsIcon);

// ---- start ------------------------------------------------------------------

buildClock($('time'));
tick();
loadWeather();
loadGame();

setInterval(tick, 1000);
setInterval(loadWeather, 15 * 60 * 1000);
setInterval(loadGame, 5 * 60 * 1000);
