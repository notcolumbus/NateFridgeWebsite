// Janney fridge dashboard — vanilla JS, no build step.

const TZ = 'America/New_York';
const NAME = 'Mr. Janney';

// Weather location. Open-Meteo, free, no API key.
const WEATHER = {
  lat: 38.9072,
  lon: -77.0369,
};

// Next Rockets game (hardcoded — edit when the schedule moves).
const NEXT_GAME = {
  title: 'Houston Rockets vs. Dallas Mavericks',
  when: 'Sun, Apr 26 • 8:30 PM CDT',
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

// Build the digit/colon slots once. Then we mutate each slot's glyph in place,
// using an enter/exit pair so digits blur-morph into each other.
const TIME_PATTERN = ['d', 'd', ':', 'd', 'd']; // hh:mm

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
  // No-op when the character hasn't changed.
  const cur = slot.querySelector('.glyph.cur');
  if (cur && cur.textContent === ch) return;

  // Update slot width hint for digits 0-9 vs colons.
  slot.dataset.char = ch;

  // Outgoing copy: clone what's there, layer it on top, animate it out.
  if (cur) {
    const out = cur.cloneNode(true);
    out.classList.remove('cur');
    out.classList.add('stack', 'exit');
    slot.appendChild(out);
    requestAnimationFrame(() => out.classList.add('exit-active'));
    setTimeout(() => out.remove(), 600);
    cur.remove();
  }

  // Incoming copy: starts blurred + below, settles into place.
  const next = document.createElement('span');
  next.className = 'glyph cur enter';
  next.textContent = ch;
  slot.appendChild(next);
  requestAnimationFrame(() => {
    // Two RAFs so the initial 'enter' state actually paints before transition.
    requestAnimationFrame(() => next.classList.add('enter-active'));
  });
}

function renderTime(root, str) {
  const slots = root.querySelectorAll('.slot');
  for (let i = 0; i < slots.length && i < str.length; i++) {
    setSlot(slots[i], str[i]);
  }
}

function partsInTZ(date, tz) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const out = {};
  for (const p of f) out[p.type] = p.value;
  return out;
}

function tick() {
  const now = new Date();
  const p = partsInTZ(now, TZ);

  // Display hours in 12-hour, zero-padded, no AM/PM marker (matches mock).
  let h = parseInt(p.hour, 10);
  const display12 = ((h + 11) % 12) + 1; // 0->12, 13->1
  const hh = String(display12).padStart(2, '0');
  renderTime($('time'), `${hh}:${p.minute}`);

  $('greeting').textContent = `${greetingFor(h)}, ${NAME}`;
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
      return `<svg viewBox="0 0 24 24" ${s}>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>`;
    case 'cloud-sun':
      return `<svg viewBox="0 0 24 24" ${s}>
        <circle cx="8" cy="8" r="3"/>
        <path d="M8 1v1M1 8h1M2.5 2.5l.7.7M13.5 2.5l-.7.7"/>
        <path d="M17 18a4 4 0 0 0-7.8-1.2A3 3 0 1 0 9 22h8a3 3 0 0 0 0-6h0z"/>
      </svg>`;
    case 'cloud':
      return `<svg viewBox="0 0 24 24" ${s}>
        <path d="M17 18a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 22h9a3 3 0 0 0 0-6h0z"/>
      </svg>`;
    case 'rain':
      return `<svg viewBox="0 0 24 24" ${s}>
        <path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/>
        <path d="M8 20l-1 2M12 20l-1 2M16 20l-1 2"/>
      </svg>`;
    case 'snow':
      return `<svg viewBox="0 0 24 24" ${s}>
        <path d="M17 14a4 4 0 0 0-7.8-1.2A3.5 3.5 0 1 0 8 18h9a3 3 0 0 0 0-6h0z"/>
        <path d="M9 21h.01M13 21h.01M17 21h.01"/>
      </svg>`;
    case 'storm':
      return `<svg viewBox="0 0 24 24" ${s}>
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
    `&temperature_unit=fahrenheit&timezone=${encodeURIComponent(TZ)}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('weather http ' + res.status);
    const data = await res.json();
    const t = Math.round(data.current.temperature_2m);
    const desc = describeWeather(data.current.weather_code);
    $('weather-temp').innerHTML = `${t}&deg;`;
    $('weather-icon').innerHTML = iconSvg(desc.icon);
  } catch {
    $('weather-icon').innerHTML = iconSvg('cloud');
  }
}

// ---- start ------------------------------------------------------------------

buildClock($('time'));

// Render the next-game text from config (overrides the static fallback).
$('game-title').textContent = NEXT_GAME.title;
$('game-when').textContent = NEXT_GAME.when;

tick();
loadWeather();

setInterval(tick, 1000);
setInterval(loadWeather, 15 * 60 * 1000);
