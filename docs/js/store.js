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
