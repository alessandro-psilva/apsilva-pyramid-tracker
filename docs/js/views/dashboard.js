// views/dashboard.js — primeira tela após login.
import { listWeighIns, listMeasurements } from '../store.js';
import {
  weeklyStatus,
  weeklyAverages,
  computeSupplements,
  fmt,
} from '../calc.js';
import { h, card, emptyState } from '../ui.js';
import { weightChart, macroChart, waistChart } from '../charts.js';

function stat(label, value, tone) {
  return h('div', { class: `stat${tone ? ' stat--' + tone : ''}` }, [
    h('span', { class: 'stat__value', text: value }),
    h('span', { class: 'stat__label', text: label }),
  ]);
}

function macroBar(t) {
  const total = t.protein.kcal + t.fat.kcal + t.carb.kcal || 1;
  const seg = (kcal, cls) =>
    h('span', { class: `mbar__seg mbar__seg--${cls}`, style: `flex:${kcal / total}` });
  return h('div', {}, [
    h('div', { class: 'mbar' }, [
      seg(t.protein.kcal, 'p'),
      seg(t.fat.kcal, 'f'),
      seg(t.carb.kcal, 'c'),
    ]),
    h('div', { class: 'mbar__legend' }, [
      h('span', { text: `P ${fmt.g(t.protein.g)}` }),
      h('span', { text: `G ${fmt.g(t.fat.g)}` }),
      h('span', { text: `C ${fmt.g(t.carb.g)}` }),
    ]),
  ]);
}

export async function render(ctx) {
  const { profile, targets } = ctx;

  if (profile._isNew) {
    return card(
      'Bem-vindo 🌴',
      h('p', { text: 'Antes de tudo, preencha seu perfil para calcular as metas.' }),
      h('button', { class: 'btn btn--block', onclick: () => ctx.navigate('/perfil') }, 'Preencher perfil'),
    );
  }

  const [weighIns, measurements] = await Promise.all([
    listWeighIns(),
    listMeasurements(),
  ]);

  const weeks = weeklyAverages(weighIns);
  const currentWeek = weeks[weeks.length - 1];
  const currentWeight = weighIns.length ? weighIns[weighIns.length - 1].weightKg : profile.weightKg;
  const status = weeklyStatus(profile, weighIns);
  const supps = computeSupplements(profile.weightKg);

  const frag = document.createDocumentFragment();

  // --- Resumo rápido ---
  frag.append(
    card(
      null,
      h('div', { class: 'stat-row' }, [
        stat('Peso atual', fmt.kg(currentWeight)),
        stat('Fase', profile.phase, profile.phase === 'Corte' ? 'amber' : 'green'),
        stat('Meta diária', fmt.kcal(targets.targetKcal)),
      ]),
      h('p', {
        class: 'muted',
        text: `Manutenção ${fmt.kcal(targets.maintenanceKcal)} · ${
          targets.deltaKcal >= 0 ? 'superávit' : 'déficit'
        } ${fmt.kcal(targets.deltaKcal)}`,
      }),
      macroBar(targets),
      ...targets.warnings.map((w) => h('p', { class: 'alert', text: '⚠ ' + w })),
    ),
  );

  // --- Status da semana ---
  const statusCard = h('div');
  if (!status.hasData) {
    statusCard.append(h('p', { class: 'muted', text: status.message }));
  } else {
    statusCard.append(
      h('div', { class: `banner banner--${status.tone}` }, [
        h('strong', { text: status.label }),
        h('span', { text: ' — ' + status.action }),
      ]),
      h('div', { class: 'stat-row' }, [
        stat('Semana atual', fmt.kg(status.current.avgKg)),
        stat('Semana anterior', fmt.kg(status.previous.avgKg)),
        stat('Variação', fmt.pctSigned(status.variationPct)),
      ]),
      h('p', {
        class: 'muted',
        text: `Faixa esperada p/ ${profile.phase.toLowerCase()}: ${fmt.pctSigned(status.rate.min)} a ${fmt.pctSigned(status.rate.max)} por semana.`,
      }),
      status.lowDays &&
        h('p', { class: 'alert', text: '⚠ Menos de 3 pesagens em uma das semanas — média pouco confiável.' }),
    );
  }
  frag.append(card('Status da última semana', statusCard));

  // --- Água / fibra / frutas ---
  frag.append(
    card(
      'Hidratação & fibra (hoje)',
      h('div', { class: 'stat-row' }, [
        stat('Água', fmt.liters(targets.water.liters)),
        stat('Fibra', `${targets.fiber.minG}–${targets.fiber.maxG} g`),
        stat('Frutas/vegetais', `${targets.fruitServings} porções`),
      ]),
    ),
  );

  // --- Suplementos do dia ---
  frag.append(
    card(
      'Suplementos de hoje',
      h(
        'ul',
        { class: 'list' },
        supps.map((s) =>
          h('li', { class: 'list__row' }, [
            h('span', { text: s.name }),
            h('strong', { class: s.warn ? 'muted' : '', text: s.dose }),
          ]),
        ),
      ),
      h('button', {
        class: 'btn btn--ghost btn--block',
        onclick: () => ctx.navigate('/suplementos'),
      }, 'Ver detalhes'),
    ),
  );

  // --- Atalhos p/ telas secundárias ---
  frag.append(
    card(
      null,
      h('div', { class: 'segmented' }, [
        h('button', { class: 'segmented__btn', onclick: () => ctx.navigate('/medidas') }, '📏 Medidas'),
        h('button', { class: 'segmented__btn', onclick: () => ctx.navigate('/forca') }, '🏋️ Força'),
      ]),
    ),
  );

  // --- Gráficos ---
  const chartCard = (title, canvasId, hasData, drawFn) => {
    const box = h('div', { class: 'chart-box' });
    if (!hasData) {
      box.append(emptyState('Sem dados suficientes ainda.', '📈'));
    } else {
      const canvas = h('canvas', { id: canvasId });
      box.append(canvas);
      requestAnimationFrame(() => drawFn(canvas));
    }
    return card(title, box);
  };

  frag.append(
    chartCard('Peso ao longo do tempo', 'dash-weight', weighIns.length >= 2, (c) =>
      weightChart(c, weighIns, weeks),
    ),
    chartCard('Distribuição de macros', 'dash-macro', true, (c) => macroChart(c, targets)),
    chartCard(
      'Cintura ao longo do tempo',
      'dash-waist',
      measurements.some((m) => m.waistNavel != null || m.waistAbove != null || m.waistBelow != null),
      (c) => waistChart(c, measurements),
    ),
  );

  return frag;
}
