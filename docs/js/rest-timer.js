// rest-timer.js — cronômetro de descanso entre séries.
// Baseado em timestamp (não em contagem de ticks): resiste a aba em segundo
// plano / tela bloqueada. O estado vive no módulo e segue valendo se a tela
// de Força re-renderiza.

let target = 90; // duração do último preset, em segundos
let endAt = null; // timestamp (ms) do fim, quando rodando
let pausedRemaining = 0; // segundos restantes, quando pausado
let running = false;
let finished = false; // true só depois que a contagem chega a zero
let handle = null;
let audio = null; // AudioContext criado no primeiro toque (iOS exige gesto)
const listeners = new Set();

function ensureAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audio && Ctx) audio = new Ctx();
    if (audio && audio.state === 'suspended') audio.resume();
  } catch (e) {
    /* sem áudio — vibração e visual bastam */
  }
}

function currentRemaining() {
  if (running) return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  return Math.max(0, Math.round(pausedRemaining));
}

function emit() {
  const state = getState();
  for (const fn of listeners) fn(state);
}

// Verifica se a contagem terminou (inclusive após a aba voltar do segundo plano).
function checkExpiry() {
  if (running && Date.now() >= endAt) {
    running = false;
    finished = true;
    pausedRemaining = 0;
    clearInterval(handle);
    handle = null;
    alarm();
    emit(); // avisa a UI: 0:00 + estado "terminou"
    return true;
  }
  return false;
}

function tickLoop() {
  if (!checkExpiry()) emit();
}

function run() {
  clearInterval(handle);
  handle = setInterval(tickLoop, 250);
}

function alarm() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  ensureAudio();
  if (!audio) return;
  try {
    const beep = (t, freq) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.connect(g);
      g.connect(audio.destination);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, audio.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.28);
      o.start(audio.currentTime + t);
      o.stop(audio.currentTime + t + 0.3);
    };
    beep(0, 880);
    beep(0.35, 880);
    beep(0.7, 1175);
  } catch (e) {
    /* ignora */
  }
}

export function getState() {
  return { remaining: currentRemaining(), target, running, finished };
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

export function startPreset(seconds) {
  ensureAudio();
  target = seconds;
  endAt = Date.now() + seconds * 1000;
  pausedRemaining = 0;
  running = true;
  finished = false;
  run();
  emit();
}

export function toggle() {
  ensureAudio();
  if (running) {
    pausedRemaining = currentRemaining();
    running = false;
    endAt = null;
    clearInterval(handle);
    handle = null;
  } else {
    const secs = pausedRemaining > 0 ? pausedRemaining : target;
    endAt = Date.now() + secs * 1000;
    pausedRemaining = 0;
    running = true;
    finished = false;
    run();
  }
  emit();
}

export function reset() {
  running = false;
  finished = false;
  endAt = null;
  pausedRemaining = 0;
  clearInterval(handle);
  handle = null;
  emit();
}

export function bump(seconds) {
  if (running) {
    endAt += seconds * 1000;
  } else if (finished) {
    // Terminou e você quer mais um pouco: recomeça uma contagem curta.
    endAt = Date.now() + Math.max(1, seconds) * 1000;
    pausedRemaining = 0;
    running = true;
    finished = false;
    run();
  } else {
    pausedRemaining = Math.max(0, pausedRemaining + seconds);
  }
  emit();
}

export function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Quando a aba volta do segundo plano, recalcula na hora (o setInterval pode
// ter sido pausado pelo sistema).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && running) {
      if (!checkExpiry()) emit();
    }
  });
}
