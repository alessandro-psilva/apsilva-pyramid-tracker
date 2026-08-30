// app.js — bootstrap, gate de autenticação, shell e roteador por hash.
import {
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { auth } from './firebase.js';
import { getProfile } from './store.js';
import { computeTargets } from './calc.js';
import { h, $, toast } from './ui.js';
import { destroyAll } from './charts.js';

import * as login from './views/login.js';
import * as dashboard from './views/dashboard.js';
import * as weighIn from './views/weigh-in.js';
import * as profileView from './views/profile.js';
import * as strength from './views/strength.js';
import * as measurements from './views/measurements.js';
import * as supplements from './views/supplements.js';
import * as chartsView from './views/charts-view.js';
import * as guide from './views/guide.js';
import * as food from './views/food.js';
import * as restTimer from './rest-timer.js';

const ROUTES = {
  '/dashboard': { view: dashboard, label: 'Resumo', icon: '🏠', title: 'Resumo' },
  '/comida': { view: food, label: 'Comida', icon: '🍽️', title: 'Comida de hoje' },
  '/peso': { view: weighIn, label: 'Peso', icon: '⚖️', title: 'Peso de hoje' },
  '/forca': { view: strength, label: 'Força', icon: '🏋️', title: 'Força' },
  '/medidas': { view: measurements, label: 'Medidas', icon: '📏', title: 'Medidas corporais' },
  '/suplementos': { view: supplements, label: 'Suplementos', icon: '💊', title: 'Suplementação' },
  '/graficos': { view: chartsView, label: 'Gráficos', icon: '📈', title: 'Gráficos' },
  '/guia': { view: guide, label: 'Guia', icon: '📖', title: 'Guia', hasParam: true },
  '/perfil': { view: profileView, label: 'Perfil', icon: '⚙️', title: 'Perfil' },
};

const NAV = ['/dashboard', '/comida', '/forca', '/guia', '/perfil'];
// Telas em que o botão flutuante de peso não faz sentido.
const FAB_HIDDEN = new Set(['/peso', '/perfil']);

// Contexto compartilhado entre as telas.
const ctx = {
  profile: null,
  targets: null,
  routeParam: '',
  async reloadProfile() {
    ctx.profile = await getProfile();
    ctx.targets = safeTargets(ctx.profile);
  },
  navigate(path) {
    location.hash = `#${path}`;
  },
  goProfile() {
    ctx.navigate('/perfil');
  },
};

function safeTargets(profile) {
  try {
    return computeTargets(profile);
  } catch (e) {
    console.error('Erro ao calcular metas:', e);
    return null;
  }
}

// "/guia/nivel-1" -> { base: "/guia", param: "nivel-1" }
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/dashboard';
  const [, seg1 = '', seg2 = ''] = raw.split('/');
  const base = `/${seg1}`;
  return ROUTES[base] ? { base, param: seg2 } : { base: '/dashboard', param: '' };
}

const appEl = () => $('#app');

function greeting() {
  const hr = new Date().getHours();
  if (hr < 12) return 'Bom dia';
  if (hr < 18) return 'Boa tarde';
  return 'Boa noite';
}

function renderShell() {
  document.body.innerHTML = '';

  const back = h('button', {
    class: 'appbar__back',
    id: 'appbar-back',
    'aria-label': 'Voltar',
    html: '‹',
    onclick: () => (history.length > 1 ? history.back() : ctx.navigate('/dashboard')),
  });
  const header = h('header', { class: 'appbar', id: 'appbar' }, [
    back,
    h('h1', { class: 'appbar__title', id: 'appbar-title', tabindex: '-1', text: 'Resumo' }),
    h('span', { class: 'appbar__spacer' }),
  ]);

  const main = h('main', { id: 'app', class: 'app' });

  const nav = h(
    'nav',
    { class: 'tabbar', 'aria-label': 'Navegação principal' },
    NAV.map((path) =>
      h(
        'a',
        { href: `#${path}`, class: 'tabbar__item', 'data-path': path },
        [
          h('span', { class: 'tabbar__icon', text: ROUTES[path].icon }),
          h('span', { class: 'tabbar__label', text: ROUTES[path].label }),
        ],
      ),
    ),
  );

  const fab = h(
    'button',
    { class: 'fab', id: 'fab', 'aria-label': 'Registrar peso de hoje', onclick: () => ctx.navigate('/peso') },
    [h('span', { class: 'fab__plus', text: '＋' }), h('span', { text: 'Peso' })],
  );

  const pill = h(
    'button',
    { class: 'timer-pill', id: 'timer-pill', hidden: true, onclick: () => ctx.navigate('/forca') },
    [h('span', { text: '⏱' }), h('span', { class: 'timer-pill__t', id: 'timer-pill-t', text: '0:00' })],
  );

  document.body.append(header, main, fab, pill, nav);
}

// Pílula flutuante com o tempo de descanso, visível em qualquer tela menos Força.
function refreshTimerPill(state = restTimer.getState()) {
  const pill = $('#timer-pill');
  if (!pill) return;
  const onForca = parseHash().base === '/forca';
  pill.hidden = onForca || (!state.running && !state.finished);
  $('#timer-pill-t').textContent = restTimer.fmtClock(state.remaining);
  pill.classList.toggle('timer-pill--done', state.finished);
}

function setChrome(base, param) {
  const r = ROUTES[base];
  for (const a of document.querySelectorAll('.tabbar__item')) {
    a.classList.toggle('is-active', a.dataset.path === base);
  }

  const titleEl = $('#appbar-title');
  const backEl = $('#appbar-back');
  const isSub = base === '/guia' && param;
  const onTab = NAV.includes(base) && !isSub;

  titleEl.textContent = base === '/dashboard' ? `${greeting()} 🌴` : r.title;
  backEl.hidden = onTab;

  $('#fab').hidden = FAB_HIDDEN.has(base) || isSub;
  refreshTimerPill();
}

let routeSeq = 0;
let currentView = null;
async function route() {
  if (!auth.currentUser) return;
  const myTurn = ++routeSeq;

  const { base, param } = parseHash();
  ctx.routeParam = param;
  const { view } = ROUTES[base];

  // Deixa a tela anterior soltar timers/inscrições antes de trocar.
  if (currentView && currentView !== view && typeof currentView.teardown === 'function') {
    try { currentView.teardown(); } catch (e) { console.error(e); }
  }
  currentView = view;

  setChrome(base, param);
  destroyAll();

  const host = appEl();
  host.innerHTML = '';
  host.append(skeleton());

  try {
    await ctx.reloadProfile();
    const node = await view.render(ctx);
    if (myTurn !== routeSeq) return; // navegação mais nova já começou
    host.innerHTML = '';
    const wrap = h('div', { class: 'view' });
    wrap.append(node);
    host.append(wrap);
    window.scrollTo(0, 0);
    // Acessibilidade: leva o foco pro título ao trocar de tela.
    requestAnimationFrame(() => $('#appbar-title')?.focus({ preventScroll: true }));
  } catch (e) {
    if (myTurn !== routeSeq) return;
    console.error(e);
    host.innerHTML = '';
    host.append(
      h('div', { class: 'card' }, [
        h('h2', { text: 'Algo deu errado' }),
        h('p', { class: 'muted', text: String(e.message || e) }),
        h('button', { class: 'btn', onclick: () => route() }, 'Tentar de novo'),
      ]),
    );
  }
}

function skeleton() {
  return h('div', { class: 'skeleton' }, [
    h('div', { class: 'skeleton__card' }),
    h('div', { class: 'skeleton__card skeleton__card--sm' }),
    h('div', { class: 'skeleton__card' }),
  ]);
}

let shellReady = false;
function startApp() {
  renderShell();
  if (!shellReady) {
    window.addEventListener('hashchange', route);
    restTimer.subscribe(refreshTimerPill);
    shellReady = true;
  }
  if (!location.hash || !ROUTES[parseHash().base]) {
    history.replaceState(null, '', '#/dashboard');
  }
  route();
}

ctx.signOut = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  if (user) {
    startApp();
  } else {
    destroyAll();
    document.body.innerHTML = '';
    document.body.append(h('main', { class: 'app app--auth', id: 'app' }));
    login.render(ctx).then((node) => $('#app').append(node));
  }
});

// Service worker (instalação / "adicionar à tela inicial").
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && /permission|insufficient/i.test(String(e.reason))) {
    toast('Sem permissão no Firestore. Publique as regras.', 'warn');
  }
});
