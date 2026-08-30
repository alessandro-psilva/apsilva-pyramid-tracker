// store.js — leitura/escrita no Cloud Firestore.
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { db, auth } from './firebase.js';
import { PHASE_DEFAULTS } from './calc.js';

function uid() {
  const u = auth.currentUser;
  if (!u) throw new Error('Sem usuário autenticado.');
  return u.uid;
}

const userRef = () => doc(db, 'users', uid());
const sub = (name) => collection(db, 'users', uid(), name);

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------
export const DEFAULT_PROFILE = {
  weightKg: 80,
  heightM: 1.75,
  level: 'Intermediário',
  activity: 'Ativo',
  phase: 'Ganho',
  proteinGPerLb: PHASE_DEFAULTS['Ganho'].proteinGPerLb,
  fatPercent: PHASE_DEFAULTS['Ganho'].fatPercent,
  mealsPerDay: 4,
};

export async function getProfile() {
  const snap = await getDoc(doc(db, 'users', uid(), 'meta', 'profile'));
  if (!snap.exists()) return { ...DEFAULT_PROFILE, _isNew: true };
  return { ...DEFAULT_PROFILE, ...snap.data() };
}

export async function saveProfile(profile) {
  const clean = {
    weightKg: Number(profile.weightKg),
    heightM: Number(profile.heightM),
    level: profile.level,
    activity: profile.activity,
    phase: profile.phase,
    proteinGPerLb: Number(profile.proteinGPerLb),
    fatPercent: Number(profile.fatPercent),
    mealsPerDay: Math.min(8, Math.max(2, Math.round(Number(profile.mealsPerDay) || 4))),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', uid(), 'meta', 'profile'), clean, { merge: true });
  return clean;
}

// ---------------------------------------------------------------------------
// Pesagem diária — id do doc = "YYYY-MM-DD"
// ---------------------------------------------------------------------------
export async function getWeighIn(date) {
  const snap = await getDoc(doc(db, 'users', uid(), 'dailyWeighIns', date));
  return snap.exists() ? snap.data() : null;
}

export async function saveWeighIn(date, weightKg) {
  await setDoc(doc(db, 'users', uid(), 'dailyWeighIns', date), {
    weightKg: Number(weightKg),
    createdAt: serverTimestamp(),
  });
}

export async function listWeighIns() {
  const snap = await getDocs(sub('dailyWeighIns'));
  return snap.docs
    .map((d) => ({ date: d.id, weightKg: d.data().weightKg }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---------------------------------------------------------------------------
// Registro diário de comida — id do doc = "YYYY-MM-DD", itens num array
// ---------------------------------------------------------------------------
export async function getFoodLog(date) {
  const snap = await getDoc(doc(db, 'users', uid(), 'foodLogs', date));
  return snap.exists() ? { items: snap.data().items || [] } : { items: [] };
}

export async function saveFoodLog(date, items) {
  const clean = items.map((it) => ({
    name: String(it.name || '').trim(),
    meal: it.meal || '',
    kcal: Number(it.kcal) || 0,
    protein: Number(it.protein) || 0,
    carb: it.carb === '' || it.carb == null ? null : Number(it.carb),
    fat: it.fat === '' || it.fat == null ? null : Number(it.fat),
  }));
  await setDoc(doc(db, 'users', uid(), 'foodLogs', date), {
    items: clean,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Alimentos salvos (reutilizáveis para montar refeições)
// ---------------------------------------------------------------------------
export async function listFoods() {
  const snap = await getDocs(sub('foods'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt'));
}

export async function addFood(item) {
  await addDoc(sub('foods'), {
    name: String(item.name || '').trim(),
    kcal: Number(item.kcal) || 0,
    protein: Number(item.protein) || 0,
    carb: item.carb === '' || item.carb == null ? null : Number(item.carb),
    fat: item.fat === '' || item.fat == null ? null : Number(item.fat),
    createdAt: serverTimestamp(),
  });
}

export async function deleteFood(id) {
  await deleteDoc(doc(db, 'users', uid(), 'foods', id));
}

// ---------------------------------------------------------------------------
// Força
// ---------------------------------------------------------------------------
export async function addStrengthLog(entry) {
  await addDoc(sub('strengthLogs'), {
    date: entry.date,
    exercise: entry.exercise.trim(),
    weightKg: Number(entry.weightKg),
    reps: Number(entry.reps),
    notes: (entry.notes || '').trim(),
    createdAt: serverTimestamp(),
  });
}

export async function listStrengthLogs() {
  const snap = await getDocs(query(sub('strengthLogs'), orderBy('date', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteStrengthLog(id) {
  await deleteDoc(doc(db, 'users', uid(), 'strengthLogs', id));
}

// ---------------------------------------------------------------------------
// Medidas corporais
// ---------------------------------------------------------------------------
export const MEASURE_FIELDS = [
  ['chest', 'Peitoral'],
  ['armR', 'Braço D'],
  ['armL', 'Braço E'],
  ['thighR', 'Coxa D'],
  ['thighL', 'Coxa E'],
  ['waistAbove', 'Cintura (acima)'],
  ['waistNavel', 'Cintura (umbigo)'],
  ['waistBelow', 'Cintura (abaixo)'],
  ['hips', 'Quadril'],
];

export async function addMeasurement(entry) {
  const rec = { date: entry.date, createdAt: serverTimestamp() };
  for (const [key] of MEASURE_FIELDS) {
    const v = entry[key];
    if (v !== '' && v != null && !Number.isNaN(Number(v))) rec[key] = Number(v);
  }
  await addDoc(sub('measurements'), rec);
}

export async function listMeasurements() {
  const snap = await getDocs(query(sub('measurements'), orderBy('date', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteMeasurement(id) {
  await deleteDoc(doc(db, 'users', uid(), 'measurements', id));
}
