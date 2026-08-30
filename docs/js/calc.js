// calc.js
// Toda a lógica de negócio do sistema. Funções puras, sem I/O.
// Fonte: "The Muscle & Strength Pyramid: Nutrition" (Eric Helms), v2.0.
// As fórmulas foram implementadas exatamente como especificado no briefing do projeto.

export const LBS_PER_KG = 2.20462;
export const KCAL_PER_KG_FAT = 7700;
export const WEEKS_PER_MONTH = 4.345;

const avg = (a, b) => (a + b) / 2;
const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

// ---------------------------------------------------------------------------
// Tabelas de referência
// ---------------------------------------------------------------------------

// Multiplicadores de atividade [mínimo, máximo] — usamos a média.
export const ACTIVITY_MULTIPLIERS = {
  'Sedentário': [1.3, 1.6],
  'Levemente ativo': [1.5, 1.8],
  'Ativo': [1.7, 2.0],
  'Muito ativo': [1.9, 2.2],
};

export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS);
export const EXPERIENCE_LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];
export const PHASES = ['Ganho', 'Corte'];

// Fase de Ganho — taxa em % do peso corporal por MÊS + superávit sugerido.
export const GAIN_TABLE = {
  'Iniciante': { monthlyMinPct: 0.010, monthlyMaxPct: 0.015, surplusKcal: 300 },
  'Intermediário': { monthlyMinPct: 0.005, monthlyMaxPct: 0.010, surplusKcal: 200 },
  'Avançado': { monthlyMinPct: 0.000, monthlyMaxPct: 0.005, surplusKcal: 100 },
};

// Fase de Corte — regra universal (não depende do nível): 0,5%–1,0% do peso por SEMANA.
export const CUT_RATE = { weeklyMinPct: 0.005, weeklyMaxPct: 0.010 };

// Defaults de macros por fase.
export const PHASE_DEFAULTS = {
  'Ganho': { proteinGPerLb: 0.8, fatPercent: 0.25 },
  'Corte': { proteinGPerLb: 1.1, fatPercent: 0.20 },
};

// Faixas recomendadas (apenas dica visual — não travam o input).
export const MACRO_RANGES = {
  'Ganho': { proteinGPerLb: [0.7, 1.0], fatPercent: [0.20, 0.30] },
  'Corte': { proteinGPerLb: [1.0, 1.2], fatPercent: [0.15, 0.25] },
};

// Pisos mínimos absolutos (mostrar aviso se ultrapassar).
export const FLOORS = { fatGPerLb: 0.25, carbGPerLb: 0.5 };

// ---------------------------------------------------------------------------
// 1. Calorias de manutenção
// ---------------------------------------------------------------------------
export function maintenanceKcal(weightKg, activity) {
  const baseline = weightKg * 22;
  const mult = ACTIVITY_MULTIPLIERS[activity] || ACTIVITY_MULTIPLIERS['Ativo'];
  return baseline * avg(mult[0], mult[1]);
}

// ---------------------------------------------------------------------------
// 2 + 3. Ajuste da fase (superávit em Ganho, déficit em Corte) e taxa alvo
// ---------------------------------------------------------------------------
export function phaseAdjustment(profile) {
  const { phase, level, weightKg } = profile;

  if (phase === 'Ganho') {
    const t = GAIN_TABLE[level] || GAIN_TABLE['Intermediário'];
    return {
      deltaKcal: t.surplusKcal,
      rate: { minPct: t.monthlyMinPct, maxPct: t.monthlyMaxPct, per: 'mês' },
    };
  }

  // Corte
  const { weeklyMinPct, weeklyMaxPct } = CUT_RATE;
  const deficitKcal = -round(
    (avg(weeklyMinPct, weeklyMaxPct) * weightKg * KCAL_PER_KG_FAT) / 7,
  );
  return {
    deltaKcal: deficitKcal,
    rate: { minPct: weeklyMinPct, maxPct: weeklyMaxPct, per: 'semana' },
  };
}

// ---------------------------------------------------------------------------
// 9. Faixa de variação semanal esperada (a lógica INVERTE por fase)
// ---------------------------------------------------------------------------
export function weeklyRate(profile) {
  const adj = phaseAdjustment(profile);
  if (profile.phase === 'Ganho') {
    // Converte taxa mensal -> semanal. Ambos positivos.
    return {
      min: adj.rate.minPct / WEEKS_PER_MONTH,
      max: adj.rate.maxPct / WEEKS_PER_MONTH,
    };
  }
  // Corte: ambos negativos, com min < max.
  return { min: -adj.rate.maxPct, max: -adj.rate.minPct };
}

// ---------------------------------------------------------------------------
// 4 + 5 + 6. Metas diárias completas
// ---------------------------------------------------------------------------
export function computeTargets(profile) {
  const maintenance = maintenanceKcal(profile.weightKg, profile.activity);
  const adj = phaseAdjustment(profile);
  const targetKcal = maintenance + adj.deltaKcal;

  const weightLb = profile.weightKg * LBS_PER_KG;

  const proteinG = profile.proteinGPerLb * weightLb;
  const proteinKcal = proteinG * 4;

  const fatKcal = targetKcal * profile.fatPercent;
  const fatG = fatKcal / 9;

  const carbKcal = targetKcal - proteinKcal - fatKcal;
  const carbG = carbKcal / 4;

  // Hidratação e fibra
  const waterLiters = profile.weightKg / 23;
  const fiberMinG = round((targetKcal / 1000) * 14);
  const fiberMaxG = round(carbG * 0.20);
  const fruitServings = round(targetKcal / 1000); // mesma regra para vegetais fibrosos

  // Avisos de piso mínimo
  const warnings = [];
  if (fatG < FLOORS.fatGPerLb * weightLb) {
    warnings.push(
      `Gordura abaixo do piso mínimo (${round(FLOORS.fatGPerLb * weightLb)} g). Aumente a % de gordura.`,
    );
  }
  if (carbG < FLOORS.carbGPerLb * weightLb) {
    warnings.push(
      `Carboidrato abaixo do piso mínimo (${round(FLOORS.carbGPerLb * weightLb)} g). Reduza proteína ou gordura.`,
    );
  }
  if (carbG < 0) {
    warnings.push('Proteína + gordura já excedem a meta calórica. Revise o perfil.');
  }

  // Faixa recomendada da fase (dica)
  const range = MACRO_RANGES[profile.phase];

  return {
    maintenanceKcal: maintenance,
    deltaKcal: adj.deltaKcal,
    targetKcal,
    rate: adj.rate,
    protein: { g: proteinG, kcal: proteinKcal },
    fat: { g: fatG, kcal: fatKcal, pct: profile.fatPercent },
    carb: { g: Math.max(carbG, 0), kcal: Math.max(carbKcal, 0) },
    proteinGPerLb: profile.proteinGPerLb,
    recommended: {
      proteinGPerLb: range.proteinGPerLb,
      fatPercent: range.fatPercent,
    },
    water: { liters: waterLiters },
    fiber: { minG: fiberMinG, maxG: fiberMaxG },
    fruitServings,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// 7. Suplementação (Lista A) — doses calculadas a partir do peso
// ---------------------------------------------------------------------------
export function computeSupplements(weightKg) {
  return [
    {
      name: 'Creatina monoidratada',
      dose: `${round(weightKg * 0.04, 1)} g/dia`,
      timing: 'Qualquer horário, todos os dias (inclusive dias de descanso).',
    },
    {
      name: 'Cafeína — dose diária',
      dose: `${round(weightKg * 1)}–${round(weightKg * 3)} mg/dia`,
      timing: 'Distribuída ao longo do dia.',
    },
    {
      name: 'Cafeína — pré-treino',
      dose: `${round(weightKg * 4)}–${round(weightKg * 6)} mg`,
      timing: '~60 min antes do treino (conta no total diário).',
    },
    {
      name: 'Ômega-3 (EPA + DHA)',
      dose: '1–2 g/dia',
      timing: 'Dose fixa — não escala com o peso. Junto de uma refeição.',
    },
    {
      name: 'Vitamina D3',
      dose: `${round(weightKg * 20)}–${round(weightKg * 80)} UI/dia`,
      timing: 'SOMENTE se um exame de sangue confirmar deficiência.',
      warn: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// 8. Pesagem diária -> média semanal
// ---------------------------------------------------------------------------

// Retorna "YYYY-MM-DD" da segunda-feira da semana que contém `date`.
export function mondayOf(date) {
  const d = typeof date === 'string' ? parseISODate(date) : new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = segunda ... 6 = domingo
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDaysISO(iso, n) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

// weighIns: array de { date: "YYYY-MM-DD", weightKg: number }
// Agrupa por semana (segunda) e calcula a média dos dias preenchidos.
export function weeklyAverages(weighIns) {
  const byWeek = new Map();
  for (const w of weighIns) {
    if (w.weightKg == null || Number.isNaN(w.weightKg)) continue;
    const key = mondayOf(w.date);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key).push(w.weightKg);
  }
  return [...byWeek.entries()]
    .map(([weekStart, values]) => ({
      weekStart,
      days: values.length,
      avgKg: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));
}

// ---------------------------------------------------------------------------
// 9. Status semanal — compara semana atual x anterior. A lógica INVERTE por fase.
// ---------------------------------------------------------------------------
export function weeklyStatus(profile, weighIns) {
  const weeks = weeklyAverages(weighIns);
  if (weeks.length < 2) {
    return {
      hasData: false,
      message: 'Registre pelo menos 2 semanas de pesagens para ver o status.',
      weeks,
    };
  }

  const current = weeks[weeks.length - 1];
  const previousStart = addDaysISO(current.weekStart, -7);
  const previous = weeks.find((w) => w.weekStart === previousStart);

  if (!previous) {
    return {
      hasData: false,
      message: 'A semana anterior à mais recente não tem pesagens registradas.',
      weeks,
      current,
    };
  }

  const variationPct = (current.avgKg - previous.avgKg) / previous.avgKg;
  const rate = weeklyRate(profile);
  const lowDays = current.days < 3 || previous.days < 3;

  let label;
  let action;
  let tone; // 'ok' | 'warn'

  if (profile.phase === 'Ganho') {
    if (variationPct < rate.min) {
      label = 'Abaixo da meta';
      action = 'Somar ~150 kcal/dia';
      tone = 'warn';
    } else if (variationPct > rate.max) {
      label = 'Acima da meta';
      action = 'Tirar ~150 kcal/dia';
      tone = 'warn';
    } else {
      label = 'Na meta';
      action = 'Manter meta atual';
      tone = 'ok';
    }
  } else {
    // Corte
    if (variationPct > rate.max) {
      label = 'Perdendo devagar';
      action = 'Tirar ~150 kcal/dia';
      tone = 'warn';
    } else if (variationPct < rate.min) {
      label = 'Perdendo rápido';
      action = 'Somar ~150 kcal/dia';
      tone = 'warn';
    } else {
      label = 'Na meta';
      action = 'Manter meta atual';
      tone = 'ok';
    }
  }

  return {
    hasData: true,
    current,
    previous,
    variationPct,
    variationKg: current.avgKg - previous.avgKg,
    rate,
    lowDays,
    label,
    action,
    tone,
    weeks,
  };
}

// ---------------------------------------------------------------------------
// Helpers de formatação
// ---------------------------------------------------------------------------
export const fmt = {
  kcal: (n) => `${Math.round(n)} kcal`,
  g: (n) => `${Math.round(n)} g`,
  g1: (n) => `${round(n, 1)} g`,
  kg: (n) => `${round(n, 1)} kg`,
  cm: (n) => `${round(n, 1)} cm`,
  pct: (n) => `${round(n * 100, 1)}%`,
  pctSigned: (n) => `${n >= 0 ? '+' : ''}${round(n * 100, 2)}%`,
  liters: (n) => `${round(n, 1)} L`,
  range: (a, b, unit = '') => `${round(a, 1)}–${round(b, 1)}${unit ? ' ' + unit : ''}`,
};

export { round, avg };
