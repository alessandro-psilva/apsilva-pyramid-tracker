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

const ROUTES = {
  '/dashboard': { view: dashboard, label: 'Resumo', icon: '🏠' },
  '/peso': { view: weighIn, label: 'Peso', icon: '⚖️' },
  '/forca': { view: strength, label: 'Força', icon: '🏋️' },
  '/medidas': { view: measurements, label: 'Medidas', icon: '📏' },
  '/suplementos': { view: supplements, label: 'Suplementos', icon: '💊' },
  '/graficos': { view: chartsView, label: 'Gráficos', icon: '📈' },
  '/perfil': { view: profileView, label: 'Perfil', icon: '⚙️' },
};

const NAV = ['/dashboard', '/peso', '/forca', '/graficos', '/perfil'];

// Contexto compartilhado entre as telas.
const ctx = {
  profile: null,
  targets: null,
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

const appEl = () => $('#app');

function renderShell() {
  document.body.innerHTML = '';
  const main = h('main', { id: 'app', class: 'app' });

  const nav = h(
    'nav',
    { class: 'tabbar' },
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
    {
      class: 'fab',
      title: 'Registrar peso de hoje',
      onclick: () => ctx.navigate('/peso'),
    },
    '＋ Peso',
  );

  document.body.append(main, fab, nav);
}

function setActiveTab(path) {
  for (const a of document.querySelectorAll('.tabbar__item')) {
    a.classList.toggle('is-active', a.dataset.path === path);
  }
}

async function route() {
  if (!auth.currentUser) return;

  let path = location.hash.replace(/^#/, '') || '/dashboard';
  if (!ROUTES[path]) path = '/dashboard';

  const { view } = ROUTES[path];
  setActiveTab(path);
  destroyAll();

  const host = appEl();
  host.innerHTML = '';
  host.append(h('div', { class: 'loading', text: 'Carregando…' }));

  try {
    await ctx.reloadProfile();
    const node = await view.render(ctx);
    host.innerHTML = '';
    host.append(node);
    host.scrollTo(0, 0);
    window.scrollTo(0, 0);
  } catch (e) {
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

let shellReady = false;
function startApp() {
  renderShell();
  if (!shellReady) {
    window.addEventListener('hashchange', route);
    shellReady = true;
  }
  if (!location.hash || !ROUTES[location.hash.replace(/^#/, '')]) {
    // Ajusta a hash sem disparar hashchange duas vezes; o route() abaixo cuida do render.
    history.replaceState(null, '', '#/dashboard');
  }
  route();
}

// Exposto para a tela de perfil / logout.
ctx.signOut = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  if (user) {
    startApp();
  } else {
    destroyAll();
    document.body.innerHTML = '';
    document.body.append(h('main', { class: 'app app--auth', id: 'app' }));
    login.render(ctx).then((node) => {
      $('#app').append(node);
    });
  }
});

// Registro do service worker (instalação / "adicionar à tela inicial").
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
