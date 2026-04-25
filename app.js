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

// ESPN sometimes returns competitor.score as a string ("112") and sometimes as
// an object ({ value: 112, displayValue: "112" }). Normalize to a string.
function scoreOf(s) {
  if (s == null) return '';
  if (typeof s === 'number' || typeof s === 'string') return String(s);
  if (typeof s === 'object') return String(s.displayValue ?? s.value ?? '');
  return '';
}
function scoreNum(s) {
  const n = parseInt(scoreOf(s), 10);
  return Number.isFinite(n) ? n : 0;
}

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

function competitorOf(comp, teamId) {
  return comp?.competitors?.find((c) => c.team.id === String(teamId));
}
function opponentOf(comp, teamId) {
  return comp?.competitors?.find((c) => c.team.id !== String(teamId));
}

function pickGames(events) {
  // Returns { featured, recent[] } — the next game (or most recent if season is
  // over) plus the last 2 *completed* games before today.
  const now = Date.now();
  const sorted = [...(events || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const completed = sorted.filter(
    (e) => e.competitions?.[0]?.status?.type?.completed
  );
  const upcoming = sorted.find(
    (e) =>
      !e.competitions?.[0]?.status?.type?.completed &&
      new Date(e.date).getTime() > now - 3 * 3600_000
  );
  const featured = upcoming || completed[completed.length - 1] || null;
  // Last 2 completed games, most recent first; skip the featured one if it
  // happens to be the most recent completed game.
  const recent = completed
    .slice(-3)
    .reverse()
    .filter((e) => e.id !== featured?.id)
    .slice(0, 2);
  return { featured, recent };
}

function renderRecents(games) {
  const root = $('recents');
  root.innerHTML = '';
  for (const g of games) {
    const comp = g.competitions?.[0];
    if (!comp) continue;
    const us = competitorOf(comp, TEAM_ID);
    const them = opponentOf(comp, TEAM_ID);
    if (!us || !them) continue;
    const usScore = scoreOf(us.score);
    const themScore = scoreOf(them.score);
    const won = scoreNum(us.score) > scoreNum(them.score);
    const sep = us.homeAway === 'home' ? 'vs' : '@';

    const chip = document.createElement('button');
    chip.className = 'recent-chip';
    chip.dataset.eventId = g.id;
    chip.setAttribute('aria-label', 'Show stats for previous game');
    chip.innerHTML = `
      <span class="rc-result ${won ? 'w' : 'l'}">${won ? 'W' : 'L'}</span>
      <span class="rc-score">${usScore}<span class="rc-dash">–</span>${themScore}</span>
      <span class="rc-opp">${sep} ${them.team.abbreviation}</span>
    `;
    chip.addEventListener('click', () => openStats(g.id));
    root.appendChild(chip);
  }
}

async function loadGame() {
  try {
    const res = await fetch(ESPN.schedule, { cache: 'no-store' });
    if (!res.ok) throw new Error('schedule http ' + res.status);
    const data = await res.json();
    const { featured, recent } = pickGames(data.events);

    if (featured) {
      const comp = featured.competitions?.[0];
      const us = competitorOf(comp, TEAM_ID);
      const them = opponentOf(comp, TEAM_ID);
      const completed = comp?.status?.type?.completed;

      const card = $('game-card');
      card.dataset.eventId = featured.id;

      if (completed) {
        const usScore = scoreOf(us.score);
        const themScore = scoreOf(them.score);
        const won = scoreNum(us.score) > scoreNum(them.score);
        $('game-label-text').textContent = 'Last Game';
        $('game-title').textContent =
          `${us.team.displayName} ${usScore} – ${themScore} ${them.team.displayName}`;
        const d = new Date(featured.date).toLocaleDateString('en-US', {
          timeZone: TZ,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        $('game-when').textContent = `${won ? 'W' : 'L'} · ${d}`;
      } else {
        const sep = us.homeAway === 'home' ? 'vs.' : '@';
        $('game-label-text').textContent = 'Next Game';
        $('game-title').textContent =
          `${us.team.displayName} ${sep} ${them.team.displayName}`;
        $('game-when').textContent = fmtGameWhen(featured.date);
      }
    }

    renderRecents(recent);
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

// Tiny inline icons used inside the stats overlay.
const STAT_ICON = {
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 6H3a3 3 0 0 0 4 3M19 6h2a3 3 0 0 1-4 3"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  dot: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>`,
};

const PERF_CATS = [
  { key: 'points', label: 'PTS' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AST' },
];

const TEAM_STAT_FIELDS = [
  { name: 'fieldGoalPct', label: 'FG%' },
  { name: 'threePointFieldGoalPct', label: '3P%' },
  { name: 'freeThrowPct', label: 'FT%' },
  { name: 'rebounds', label: 'REB' },
  { name: 'assists', label: 'AST' },
  { name: 'turnovers', label: 'TO' },
];

function findStat(team, name) {
  return team?.statistics?.find((s) => s.name === name);
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
  const isLive = status?.state === 'in';
  const completed = status?.completed;

  const teamCell = (t) => `
    <div class="team-cell">
      <img class="team-logo" alt="" src="${t.team.logo || ''}" onerror="this.style.display='none'" />
      <div class="team-name-wrap">
        <span class="team-name">${t.team.shortDisplayName || t.team.name}</span>
        ${t.records?.[0]?.summary
          ? `<span class="team-record">${t.records[0].summary}</span>`
          : ''}
      </div>
    </div>`;

  const awayScore = scoreOf(away.score);
  const homeScore = scoreOf(home.score);
  const showScore = completed || awayScore || homeScore;
  const matchupHTML = `
    <div class="matchup">
      ${teamCell(away)}
      <div class="score-block">
        ${
          showScore
            ? `<span class="score">${awayScore}</span>
               <span class="sep">–</span>
               <span class="score">${homeScore}</span>`
            : `<span class="vs">@</span>`
        }
      </div>
      ${teamCell(home)}
    </div>`;

  // Linescore — only present once a game has tipped off.
  let linescoreHTML = '';
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
        <td class="total">${scoreOf(team.score)}</td>
      </tr>`;
    linescoreHTML = `
      <table class="linescore">
        <thead>
          <tr><th></th>${head.map((h) => `<th>${h}</th>`).join('')}<th>T</th></tr>
        </thead>
        <tbody>${row(away)}${row(home)}</tbody>
      </table>`;
  }

  // Top performers across PTS / REB / AST per team.
  let performersHTML = '';
  if (Array.isArray(data.leaders) && data.leaders.length === 2) {
    const findTopFor = (teamId, key) => {
      const teamLead = data.leaders.find((l) => l.team.id === String(teamId));
      const cat = teamLead?.leaders?.find((c) => c.name === key);
      return cat?.leaders?.[0];
    };
    const rows = PERF_CATS.map(({ key, label }) => {
      const a = findTopFor(away.team.id, key);
      const h = findTopFor(home.team.id, key);
      if (!a?.athlete || !h?.athlete) return '';
      return `
        <div class="perf-row">
          <div class="perf-side">
            <span class="who">${a.athlete.shortName}</span>
            <span class="line">${a.displayValue}</span>
          </div>
          <div class="perf-cat">${label}</div>
          <div class="perf-side right">
            <span class="line">${h.displayValue}</span>
            <span class="who">${h.athlete.shortName}</span>
          </div>
        </div>`;
    })
      .filter(Boolean)
      .join('');
    if (rows) {
      performersHTML = `
        <div class="perf-block">
          <p class="section-label">${STAT_ICON.trophy}<span>Top Performers</span></p>
          ${rows}
        </div>`;
    }
  }

  // Team stats comparison.
  let teamStatsHTML = '';
  const boxTeams = data.boxscore?.teams;
  if (Array.isArray(boxTeams) && boxTeams.length === 2) {
    const awayBox = boxTeams.find((t) => t.team.id === away.team.id) || boxTeams[0];
    const homeBox = boxTeams.find((t) => t.team.id === home.team.id) || boxTeams[1];
    const rows = TEAM_STAT_FIELDS.map(({ name, label }) => {
      const a = findStat(awayBox, name);
      const h = findStat(homeBox, name);
      if (!a || !h) return '';
      return `
        <div class="ts-row">
          <span class="val">${a.displayValue}</span>
          <span class="lbl">${label}</span>
          <span class="val right">${h.displayValue}</span>
        </div>`;
    })
      .filter(Boolean)
      .join('');
    if (rows) {
      teamStatsHTML = `
        <div class="ts-block">
          <p class="section-label">${STAT_ICON.chart}<span>Team Stats</span></p>
          <div class="ts-grid">${rows}</div>
        </div>`;
    }
  }

  // Venue / location.
  const venue = data.gameInfo?.venue?.fullName;
  const city = data.gameInfo?.venue?.address?.city;
  const venueText = [venue, city].filter(Boolean).join(' · ');
  const venueHTML = venueText
    ? `<p class="venue">${STAT_ICON.pin}<span>${venueText}</span></p>`
    : '';

  // Status pill (LIVE / FINAL / scheduled).
  const statusClass = isLive ? 'live' : completed ? 'final' : 'sched';
  const statusHTML = `
    <p class="status-line ${statusClass}">
      ${isLive ? STAT_ICON.dot : ''}
      <span>${detail}</span>
    </p>`;

  $('overlay-content').innerHTML = `
    ${statusHTML}
    ${matchupHTML}
    ${linescoreHTML}
    ${performersHTML}
    ${teamStatsHTML}
    ${venueHTML}
  `;
}

async function openStats(eventIdArg) {
  const eventId =
    (typeof eventIdArg === 'string' && eventIdArg) ||
    $('game-card').dataset.eventId;
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

$('game-card').addEventListener('click', () => openStats());
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
