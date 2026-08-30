// views/guide.js — guia de consulta baseado no livro (Eric Helms).
// Rota "#/guia" mostra o índice; "#/guia/<id>" mostra um capítulo.
import { CHAPTERS, GUIDE_INTRO, chapterById } from '../guide-content.js';
import { h, card } from '../ui.js';

// **negrito** -> <strong>
function rich(text) {
  const span = h('span');
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  for (const p of parts) {
    if (p.startsWith('**') && p.endsWith('**')) {
      span.append(h('strong', { text: p.slice(2, -2) }));
    } else if (p) {
      span.append(document.createTextNode(p));
    }
  }
  return span;
}

export const title = 'Guia';

export async function render(ctx) {
  const id = (ctx.routeParam || '').trim();
  return id ? renderChapter(ctx, id) : renderIndex(ctx);
}

function renderIndex(ctx) {
  const frag = document.createDocumentFragment();

  frag.append(
    card(
      'A Pirâmide da Nutrição',
      h('p', { class: 'guide-intro' }, rich(GUIDE_INTRO)),
    ),
  );

  const list = h(
    'ul',
    { class: 'guide-index' },
    CHAPTERS.map((c, i) =>
      h(
        'li',
        {},
        h(
          'button',
          {
            class: 'guide-index__item',
            onclick: () => ctx.navigate(`/guia/${c.id}`),
          },
          [
            h('span', { class: 'guide-index__icon', text: c.icon }),
            h('span', { class: 'guide-index__text' }, [
              h('span', { class: 'guide-index__title', text: c.title }),
              h('span', { class: 'guide-index__tag', text: c.tagline }),
            ]),
            h('span', { class: 'guide-index__chev', text: '›' }),
          ],
        ),
      ),
    ),
  );
  frag.append(list);

  frag.append(
    h('p', {
      class: 'guide-src',
      text: 'Resumo em português de "The Muscle & Strength Pyramid: Nutrition" (Eric Helms, 2ª ed.). Notas de estudo — leia o livro para o argumento completo.',
    }),
  );

  return frag;
}

function renderChapter(ctx, id) {
  const chapter = chapterById(id);
  if (!chapter) {
    ctx.navigate('/guia');
    return h('div');
  }
  const idx = CHAPTERS.findIndex((c) => c.id === id);
  const prev = CHAPTERS[idx - 1];
  const next = CHAPTERS[idx + 1];

  const frag = document.createDocumentFragment();

  frag.append(
    h('button', {
      class: 'guide-back',
      onclick: () => ctx.navigate('/guia'),
      html: '‹ Todos os capítulos',
    }),
  );

  const head = h('div', { class: 'guide-head' }, [
    h('span', { class: 'guide-head__icon', text: chapter.icon }),
    h('div', {}, [
      h('h1', { class: 'guide-head__title', text: chapter.title }),
      h('p', { class: 'guide-head__tag', text: chapter.tagline }),
    ]),
  ]);

  const body = h('article', { class: 'guide-body' });
  for (const s of chapter.sections) {
    const sec = h('section', { class: 'guide-sec' + (s.warn ? ' guide-sec--warn' : '') });
    sec.append(h('h2', { text: s.h }));
    for (const p of s.body || []) sec.append(h('p', {}, rich(p)));
    if (s.formula) sec.append(h('p', { class: 'guide-formula', text: s.formula }));
    if (s.list) {
      sec.append(
        h('ul', { class: 'guide-list' }, s.list.map((li) => h('li', {}, rich(li)))),
      );
    }
    if (s.note) sec.append(h('p', { class: 'guide-note', text: s.note }));
    body.append(sec);
  }

  if (chapter.appTie) {
    body.append(
      h('div', { class: 'guide-tie' }, [
        h('strong', { text: '📱 No app: ' }),
        h('span', { text: chapter.appTie }),
      ]),
    );
  }

  const nav = h('div', { class: 'guide-nav' }, [
    prev
      ? h('button', { class: 'guide-nav__btn', onclick: () => ctx.navigate(`/guia/${prev.id}`) }, [
          h('span', { class: 'guide-nav__dir', text: '‹ Anterior' }),
          h('span', { class: 'guide-nav__name', text: prev.title }),
        ])
      : h('span'),
    next
      ? h('button', { class: 'guide-nav__btn guide-nav__btn--next', onclick: () => ctx.navigate(`/guia/${next.id}`) }, [
          h('span', { class: 'guide-nav__dir', text: 'Próximo ›' }),
          h('span', { class: 'guide-nav__name', text: next.title }),
        ])
      : h('span'),
  ]);

  frag.append(card(null, head, body), nav);
  return frag;
}
