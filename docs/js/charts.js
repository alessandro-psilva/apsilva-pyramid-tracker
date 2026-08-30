// charts.js — wrappers finos sobre o Chart.js (carregado como global no index.html).
// Usamos eixo X de categoria (labels) para não depender de adaptador de datas.
import { mondayOf } from './calc.js';

const GREEN = '#006437';
const GREEN_DARK = '#004225';
const AMBER = '#B7791F';
const GREY = '#6B6B6B';

const activeCharts = new Map();

function mount(canvas, config) {
  if (activeCharts.has(canvas.id)) activeCharts.get(canvas.id).destroy();
  // eslint-disable-next-line no-undef
  const chart = new Chart(canvas.getContext('2d'), config);
  activeCharts.set(canvas.id, chart);
  return chart;
}

export function destroyAll() {
  for (const c of activeCharts.values()) c.destroy();
  activeCharts.clear();
}

function fmtLabel(iso) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { labels: { color: GREY, boxWidth: 12 } } },
  scales: {
    x: { ticks: { color: GREY, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } },
    y: { ticks: { color: GREY }, grid: { color: 'rgba(0,0,0,0.06)' } },
  },
};

// weighIns: [{date, weightKg}] ordenado; weeklyAvg: [{weekStart, avgKg}]
export function weightChart(canvas, weighIns, weeklyAvg = []) {
  const labels = weighIns.map((w) => fmtLabel(w.date));
  const avgByWeek = new Map(weeklyAvg.map((w) => [w.weekStart, w.avgKg]));
  const avgLine = weighIns.map((w) => avgByWeek.get(mondayOf(w.date)) ?? null);

  return mount(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pesagem diária',
          data: weighIns.map((w) => w.weightKg),
          borderColor: 'rgba(0,100,55,0.35)',
          backgroundColor: 'rgba(0,100,55,0.08)',
          pointRadius: 2,
          borderWidth: 1.5,
          tension: 0.2,
          fill: true,
        },
        {
          label: 'Média semanal',
          data: avgLine,
          borderColor: GREEN,
          backgroundColor: 'transparent',
          pointRadius: 4,
          borderWidth: 2.5,
          spanGaps: true,
        },
      ],
    },
    options: baseOptions,
  });
}

export function macroChart(canvas, targets) {
  return mount(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Proteína', 'Gordura', 'Carboidrato'],
      datasets: [
        {
          data: [
            Math.round(targets.protein.kcal),
            Math.round(targets.fat.kcal),
            Math.round(targets.carb.kcal),
          ],
          backgroundColor: [GREEN, AMBER, GREEN_DARK],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: GREY, boxWidth: 12 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} kcal` } },
      },
    },
  });
}

// measurements: [{date, waistNavel, ...}]
export function waistChart(canvas, measurements) {
  const rows = [...measurements].sort((a, b) => (a.date < b.date ? -1 : 1));
  const labels = rows.map((r) => fmtLabel(r.date));
  const series = [
    ['waistAbove', 'Cintura acima', 'rgba(0,100,55,0.5)'],
    ['waistNavel', 'Cintura umbigo', GREEN],
    ['waistBelow', 'Cintura abaixo', GREEN_DARK],
  ];
  const datasets = series
    .map(([key, label, color]) => ({
      label,
      data: rows.map((r) => r[key] ?? null),
      borderColor: color,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.2,
      spanGaps: true,
    }))
    .filter((d) => d.data.some((v) => v != null));

  return mount(canvas, { type: 'line', data: { labels, datasets }, options: baseOptions });
}
