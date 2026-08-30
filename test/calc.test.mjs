// Testes das funções puras de negócio. Rode com:  node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maintenanceKcal,
  phaseAdjustment,
  computeTargets,
  computeSupplements,
  weeklyRate,
  weeklyAverages,
  weeklyStatus,
  mondayOf,
  sumFood,
  splitPerMeal,
} from '../docs/js/calc.js';

const base = {
  weightKg: 80,
  heightM: 1.75,
  level: 'Intermediário',
  activity: 'Ativo',
  phase: 'Ganho',
  proteinGPerLb: 0.8,
  fatPercent: 0.25,
};

test('manutenção = peso * 22 * média do multiplicador', () => {
  assert.equal(maintenanceKcal(80, 'Ativo'), 80 * 22 * 1.85);
});

test('Ganho: superávit vem da tabela por nível', () => {
  assert.equal(phaseAdjustment({ ...base, level: 'Iniciante' }).deltaKcal, 300);
  assert.equal(phaseAdjustment({ ...base, level: 'Intermediário' }).deltaKcal, 200);
  assert.equal(phaseAdjustment({ ...base, level: 'Avançado' }).deltaKcal, 100);
});

test('Corte: déficit = -round(0.75% * peso * 7700 / 7)', () => {
  const adj = phaseAdjustment({ ...base, phase: 'Corte' });
  assert.equal(adj.deltaKcal, -660);
});

test('metas calóricas e macros', () => {
  const t = computeTargets(base);
  assert.equal(Math.round(t.maintenanceKcal), 3256);
  assert.equal(Math.round(t.targetKcal), 3456);
  assert.equal(Math.round(t.fat.g), 96);
  assert.equal(Math.round(t.protein.g), 141);
  assert.equal(t.fruitServings, 3);
  assert.equal(t.fiber.minG, 48);
});

test('suplementos escalam com o peso (creatina 0.04 g/kg)', () => {
  const s = computeSupplements(80);
  assert.match(s[0].dose, /3\.2 g/);
});

test('splitPerMeal divide a meta e limita o nº de refeições a 2–8', () => {
  const targets = { targetKcal: 2400, protein: { g: 180 }, carb: { g: 240 }, fat: { g: 80 } };
  const pm = splitPerMeal(targets, 4);
  assert.equal(pm.meals, 4);
  assert.equal(pm.kcal, 600);
  assert.equal(pm.protein, 45);
  assert.equal(splitPerMeal(targets, 100).meals, 8);
  assert.equal(splitPerMeal(targets, 0).meals, 4); // fallback
});

test('cafeína: 1–3 mg/kg diária, 4–6 mg/kg pré-treino, com aviso', () => {
  const s = computeSupplements(80);
  const daily = s.find((x) => /cansaço/i.test(x.name));
  const pre = s.find((x) => /pré-treino/i.test(x.name));
  assert.equal(daily.dose, '80–240 mg/dia');
  assert.equal(pre.dose, '320–480 mg');
  assert.equal(pre.warn, true);
  assert.match(pre.timing, /NÃO some/); // não é aditiva com a dose diária
});

test('weeklyRate inverte por fase', () => {
  const ganho = weeklyRate({ ...base, phase: 'Ganho' });
  assert.ok(ganho.min > 0 && ganho.max > ganho.min);
  const corte = weeklyRate({ ...base, phase: 'Corte' });
  assert.ok(corte.max < 0 && corte.min < corte.max);
});

test('mondayOf devolve a segunda-feira da semana', () => {
  assert.equal(mondayOf('2026-08-30'), '2026-08-24'); // domingo -> segunda anterior
  assert.equal(mondayOf('2026-08-24'), '2026-08-24');
});

test('média semanal ignora dias vazios', () => {
  const weeks = weeklyAverages([
    { date: '2026-08-24', weightKg: 80 },
    { date: '2026-08-26', weightKg: 82 },
    { date: '2026-08-31', weightKg: 81 },
  ]);
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0].avgKg, 81);
  assert.equal(weeks[0].days, 2);
});

test('status Ganho: ganho lento => "Abaixo da meta"', () => {
  const s = weeklyStatus(base, [
    { date: '2026-08-17', weightKg: 80 },
    { date: '2026-08-19', weightKg: 80 },
    { date: '2026-08-21', weightKg: 80 },
    { date: '2026-08-24', weightKg: 80.02 },
    { date: '2026-08-26', weightKg: 80.02 },
    { date: '2026-08-28', weightKg: 80.02 },
  ]);
  assert.equal(s.hasData, true);
  assert.equal(s.label, 'Abaixo da meta');
});

test('sumFood soma itens e trata macro ausente como 0', () => {
  const s = sumFood([
    { kcal: 200, protein: 30, carb: 5, fat: 4 },
    { kcal: 150, protein: 10 }, // sem carb/fat
  ]);
  assert.equal(s.kcal, 350);
  assert.equal(s.protein, 40);
  assert.equal(s.carb, 5);
  assert.equal(s.fat, 4);
});

test('status Corte: perda muito rápida => "Perdendo rápido"', () => {
  const s = weeklyStatus({ ...base, phase: 'Corte' }, [
    { date: '2026-08-17', weightKg: 80 },
    { date: '2026-08-19', weightKg: 80 },
    { date: '2026-08-21', weightKg: 80 },
    { date: '2026-08-24', weightKg: 78 },
    { date: '2026-08-26', weightKg: 78 },
    { date: '2026-08-28', weightKg: 78 },
  ]);
  assert.equal(s.label, 'Perdendo rápido');
  assert.equal(s.action, 'Somar ~150 kcal/dia');
});
