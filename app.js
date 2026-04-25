// Janney fridge dashboard — vanilla JS, no build step.

const TZ = 'America/New_York';
const NAME = 'Mr. Janney';

// Where to pull weather from. Open-Meteo is free & needs no API key.
// Default: Washington, DC area. Edit lat/lon/label to taste.
const WEATHER = {
  lat: 38.9072,
  lon: -77.0369,
  label: 'Washington, DC',
};

// Next Rockets game (hardcoded per request).
const NEXT_GAME = {
  // Sun, Apr 26 2026 @ 8:30 PM CDT  ->  ISO with -05:00 offset
  iso: '2026-04-26T20:30:00-05:00',
  dayLabel: 'Sun, Apr 26',
  timeLabel: '8:30 PM CDT',
};

// ---- helpers ----------------------------------------------------------------

const $ = (id) => document.getElementById(id);

function partsInTZ(date, tz) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: true,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const out = {};
  for (const p of f) out[p.type] = p.value;
  return out;
}

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
}

// ---- clock + greeting -------------------------------------------------------

function tick() {
  const now = new Date();
  const p = partsInTZ(now, TZ);

  // 8:42 — drop AM/PM into a small superscript so the digits dominate.
  const hour = parseInt(p.hour, 10);
  const ampm = p.dayPeriod || (hour >= 12 ? 'PM' : 'AM');
  $('time').innerHTML =
    `${p.hour}:${p.minute}` +
    `<span class="text-ink-300 font-light text-3xl align-top ml-4 tracking-widest">${ampm}</span>`;

  $('date').textContent = `${p.weekday} · ${p.month} ${p.day}`;

  // Greeting needs the local hour in 24h form.
  const h24 = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    hour12: false,
  }).format(now);
  $('greeting').textContent = `${greetingFor(parseInt(h24, 10))}, ${NAME}.`;
}

// ---- next game countdown ----------------------------------------------------

function updateGameRel() {
  const tip = new Date(NEXT_GAME.iso).getTime();
  const diff = tip - Date.now();
  const el = $('game-rel');
  if (!el) return;

  if (diff <= 0) {
    el.textContent = 'live now';
    return;
  }
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const m = mins % 60;

  if (days >= 1) el.textContent = `in ${days}d ${hours}h`;
  else if (hours >= 1) el.textContent = `in ${hours}h ${m}m`;
  else el.textContent = `in ${m}m`;

  $('game-day').textContent = NEXT_GAME.dayLabel;
  $('game-time').textContent = NEXT_GAME.timeLabel;
}

// ---- weather ----------------------------------------------------------------

// Map Open-Meteo WMO weather codes to (label, svg name).
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
  if (code === 85 || code === 86) return { label: 'Snow showers', icon: 'snow' };
  if (code >= 95) return { label: 'Thunderstorms', icon: 'storm' };
  return { label: '—', icon: 'cloud' };
}

function iconSvg(name) {
  const stroke =
    'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
  switch (name) {
    case 'sun':
      return `<svg viewBox="0 0 24 24" class="w-10 h-10 text-accent" ${stroke}>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>`;
    case 'cloud-sun':
      return `<svg viewBox="0 0 24 24" class="w-10 h-10 text-accent" ${stroke}>
        <circle cx="8" cy="8" r="3"/>
        <path d="M8 1v1M1 8h1M2.5 2.5l.7.7M13.5 2.5l-.7.7"/>
        <path d="M17 18a4 4 0 0 0-7.8-1.2A3 3 0 1 0 9 22h8a3 3 0 0 0 0-6h0z"/>
      </svg>`;
    case 'cloud':
      return `<svg viewBox="0 0 24 24" class="w-10 h-10 text-ink-300" ${stroke}>
        <path d="M17 18a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 22h9a3 3 0 0 0 0-6h0z"/>
      </svg>`;
    case 'rain':
      return `<svg viewBox="0 0 24 24" class="w-10 h-10 text-sky-300" ${stroke}>
        <path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/>
        <path d="M8 20l-1 2M12 20l-1 2M16 20l-1 2"/>
      </svg>`;
    case 'snow':
      return `<svg viewBox="0 0 24 24" class="w-10 h-10 text-sky-200" ${stroke}>
        <path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/>
        <path d="M9 21h.01M13 21h.01M17 21h.01"/>
      </svg>`;
    case 'storm':
      return `<svg viewBox="0 0 24 24" class="w-10 h-10 text-amber-300" ${stroke}>
        <path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/>
        <path d="M12 18l-2 4h3l-1 2"/>
      </svg>`;
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
    const code = data.current.weather_code;
    const hi = Math.round(data.daily.temperature_2m_max[0]);
    const lo = Math.round(data.daily.temperature_2m_min[0]);
    const desc = describeWeather(code);

    $('weather-temp').innerHTML = `${t}&deg;`;
    $('weather-desc').textContent = desc.label;
    $('weather-icon').innerHTML = iconSvg(desc.icon);
    $('weather-range').innerHTML = `H ${hi}&deg; &nbsp; L ${lo}&deg;`;
    $('weather-loc').textContent = WEATHER.label;
  } catch (err) {
    $('weather-desc').textContent = 'offline';
    $('weather-loc').textContent = WEATHER.label;
  }
}

// ---- start ------------------------------------------------------------------

tick();
updateGameRel();
loadWeather();

setInterval(tick, 1000);
setInterval(updateGameRel, 60 * 1000);
setInterval(loadWeather, 15 * 60 * 1000);
