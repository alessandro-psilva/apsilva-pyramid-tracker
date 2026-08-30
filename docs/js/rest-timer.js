// rest-timer.js — cronômetro de descanso entre séries.
// Estado no escopo do módulo: segue rodando mesmo se a tela de Força re-renderiza.

let remaining = 0; // segundos
let target = 90;
let running = false;
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

function emit() {
  for (const fn of listeners) fn({ remaining, target, running });
}

function tick() {
  remaining -= 1;
  if (remaining <= 0) {
    remaining = 0;
    running = false;
    clearInterval(handle);
    alarm();
  }
  emit();
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
  return { remaining, target, running };
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

export function startPreset(seconds) {
  ensureAudio();
  target = seconds;
  remaining = seconds;
  running = true;
  clearInterval(handle);
  handle = setInterval(tick, 1000);
  emit();
}

export function toggle() {
  ensureAudio();
  if (running) {
    running = false;
    clearInterval(handle);
  } else {
    if (remaining <= 0) remaining = target;
    running = true;
    clearInterval(handle);
    handle = setInterval(tick, 1000);
  }
  emit();
}

export function reset() {
  running = false;
  clearInterval(handle);
  remaining = 0;
  emit();
}

export function bump(seconds) {
  remaining = Math.max(0, remaining + seconds);
  if (remaining === 0) running = false;
  emit();
}

export function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
