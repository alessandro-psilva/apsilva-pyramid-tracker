// views/charts-view.js — versão ampliada dos 3 gráficos, com seletor de período.
import { listWeighIns, listMeasurements } from '../store.js';
import { weeklyAverages, todayISO, addDaysISO } from '../calc.js';
import { h, card, emptyState } from '../ui.js';
import { weightChart, macroChart, waistChart } from '../charts.js';

const PERIODS = [
  { weeks: 4, label: '4 sem' },
  { weeks: 8, label: '8 sem' },
  { weeks: 12, label: '12 sem' },
];

export async function render(ctx) {
  let periodWeeks = 8;

  const [allWeighIns, allMeasurements] = await Promise.all([
    listWeighIns(),
    listMeasurements(),
  ]);

  const weightBox = h('div', { class: 'chart-box chart-box--lg' });
  const waistBox = h('div', { class: 'chart-box chart-box--lg' });
  const macroBox = h('div', { class: 'chart-box chart-box--lg' });

  function cutoff() {
    return addDaysISO(todayISO(), -7 * periodWeeks);
  }

  function draw() {
    const from = cutoff();
    const weighIns = allWeighIns.filter((w) => w.date >= from);
    const measurements = allMeasurements.filter((m) => m.date >= from);
    const weeks = weeklyAverages(weighIns);

    weightBox.innerHTML = '';
    if (weighIns.length >= 2) {
      const c = h('canvas', { id: 'cv-weight' });
      weightBox.append(c);
      requestAnimationFrame(() => weightChart(c, weighIns, weeks));
    } else {
      weightBox.append(emptyState('Sem pesagens suficientes nesse período.', '📈'));
    }

    waistBox.innerHTML = '';
    if (measurements.some((m) => m.waistNavel != null || m.waistAbove != null || m.waistBelow != null)) {
      const c = h('canvas', { id: 'cv-waist' });
      waistBox.append(c);
      requestAnimationFrame(() => waistChart(c, measurements));
    } else {
      waistBox.append(emptyState('Sem medidas de cintura nesse período.', '📏'));
    }

    macroBox.innerHTML = '';
    if (ctx.targets) {
      const c = h('canvas', { id: 'cv-macro' });
      macroBox.append(c);
      requestAnimationFrame(() => macroChart(c, ctx.targets));
    } else {
      macroBox.append(emptyState('Preencha o perfil para ver os macros.', '🍽️'));
    }
  }

  const selector = h(
    'div',
    { class: 'segmented' },
    PERIODS.map((p) =>
      h(
        'button',
        {
          class: 'segmented__btn' + (p.weeks === periodWeeks ? ' is-active' : ''),
          onclick: (ev) => {
            periodWeeks = p.weeks;
            for (const b of ev.target.parentElement.children) b.classList.remove('is-active');
            ev.target.classList.add('is-active');
            draw();
          },
        },
        p.label,
      ),
    ),
  );

  draw();

  const frag = document.createDocumentFragment();
  frag.append(
    card('Período', selector),
    card('Peso ao longo do tempo', weightBox),
    card('Cintura ao longo do tempo', waistBox),
    card('Distribuição de macros', macroBox),
  );
  return frag;
}
