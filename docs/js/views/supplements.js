// views/supplements.js — somente leitura. Doses da Lista A calculadas pelo peso.
import { computeSupplements, fmt } from '../calc.js';
import { h, card } from '../ui.js';

function guideLink(ctx, text) {
  return h('button', {
    class: 'guide-link',
    onclick: () => ctx.navigate('/guia/nivel-5'),
    text: `${text} ›`,
  });
}

export async function render(ctx) {
  const p = ctx.profile;
  const items = computeSupplements(p.weightKg);

  const list = h(
    'ul',
    { class: 'supp-list' },
    items.map((s) =>
      h('li', { class: `supp${s.warn ? ' supp--warn' : ''}` }, [
        h('div', { class: 'supp__head' }, [
          h('strong', { text: s.name }),
          h('span', { class: 'supp__dose', text: s.dose }),
        ]),
        h('p', { class: 'muted', text: s.timing }),
      ]),
    ),
  );

  const frag = document.createDocumentFragment();
  frag.append(
    card(
      'Suplementação (Lista A)',
      h('p', {
        class: 'muted',
        text: `Doses calculadas para ${fmt.kg(p.weightKg)}. Atualize o peso no Perfil para recalcular.`,
      }),
      list,
    ),
    card(
      null,
      h('p', {
        class: 'alert',
        text: '⚠ Vitamina D3 só deve ser suplementada se um exame de sangue confirmar deficiência.',
      }),
      h('p', {
        class: 'muted',
        text: 'Suplemento é o nível MENOS importante da pirâmide. Nada aqui é obrigatório — prefira marcas com selo de teste independente e evite "blends proprietários".',
      }),
      guideLink(ctx, 'O que é cada um e por que entra na lista'),
    ),
  );
  return frag;
}
