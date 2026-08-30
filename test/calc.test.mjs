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
