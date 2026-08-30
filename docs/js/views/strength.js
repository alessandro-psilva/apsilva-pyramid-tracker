// views/strength.js — registro rápido de força + histórico por exercício.
import { addStrengthLog, listStrengthLogs, deleteStrengthLog } from '../store.js';
import { todayISO, fmt } from '../calc.js';
import { h, toast, withBusy, card, emptyState, fieldNumber } from '../ui.js';
import * as timer from '../rest-timer.js';

const PRESETS = [60, 90, 120, 180];
let activeUnsub = null;

function restTimerCard() {
  if (activeUnsub) activeUnsub(); // solta a inscrição do render anterior
  const clock = h('div', { class: 'timer__clock', text: '0:00' });
  const startBtn = h('button', { class: 'btn timer__toggle', onclick: () => timer.toggle() }, 'Iniciar');
  const box = h('div', { class: 'timer' }, [
    clock,
    h('div', { class: 'timer__presets' },
      PRESETS.map((s) =>
        h('button', {
          class: 'timer__preset',
          onclick: () => timer.startPreset(s),
        }, timer.fmtClock(s)),
      ),
    ),
    h('div', { class: 'timer__row' }, [
      startBtn,
      h('button', { class: 'btn btn--ghost', onclick: () => timer.bump(15) }, '+15s'),
      h('button', { class: 'btn btn--ghost', onclick: () => timer.reset() }, 'Zerar'),
    ]),
  ]);

  activeUnsub = timer.subscribe(({ remaining, running }) => {
    clock.textContent = timer.fmtClock(remaining);
    clock.classList.toggle('timer__clock--done', remaining === 0 && !running);
    startBtn.textContent = running ? 'Pausar' : 'Iniciar';
  });
  // O cronômetro vive no módulo rest-timer.js: segue contando mesmo se você
  // trocar de tela. A próxima abertura de Força só reconecta o mostrador.

  return card('Descanso entre séries', box);
}

export async function render(ctx) {
  const exercise = h('input', {
    type: 'text',
    list: 'exercise-options',
    placeholder: 'ex.: Supino reto',
    required: true,
    autocomplete: 'off',
  });
  const fWeight = fieldNumber('sWeight', 'Carga (kg)', '', {
    step: '0.5', required: true,
    help: 'Peso na barra ou no halter da sua melhor série de trabalho hoje. Comparar a mesma série semana a semana mostra a progressão.',
  });
  const fReps = fieldNumber('sReps', 'Reps', '', {
    integer: true, required: true, min: '1',
    help: 'Repetições completas nessa série, com boa forma. Subir a carga ou subir as reps na mesma carga já é progresso.',
  });
  const date = h('input', { type: 'date', value: todayISO(), required: true });
  const notes = h('input', { type: 'text', placeholder: 'observações (opcional)', autocomplete: 'off' });

  const datalist = h('datalist', { id: 'exercise-options' });
  const historyBox = h('div');

  async function refresh() {
    const logs = await listStrengthLogs();
    const names = [...new Set(logs.map((l) => l.exercise))].sort();
    datalist.innerHTML = '';
    for (const n of names) datalist.append(h('option', { value: n }));

    historyBox.innerHTML = '';
    if (!logs.length) {
      historyBox.append(emptyState('Sem registros de força ainda. Adicione o primeiro acima.', '🏋️'));
      return;
    }

    const byExercise = new Map();
    for (const l of logs) {
      if (!byExercise.has(l.exercise)) byExercise.set(l.exercise, []);
      byExercise.get(l.exercise).push(l);
    }

    for (const [name, entries] of [...byExercise].sort()) {
      // entries vem em ordem desc por data; ordena por data asc p/ comparar progressão.
      const asc = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
      const rows = asc.map((e, i) => {
        const prev = asc[i - 1];
        let arrow = '';
        if (prev) {
          if (e.weightKg > prev.weightKg) arrow = '▲';
          else if (e.weightKg < prev.weightKg) arrow = '▽';
          else arrow = '＝';
        }
        return h('li', { class: 'list__row' }, [
          h('span', { class: 'muted', text: e.date }),
          h('span', [
            h('strong', { text: `${fmt.kg(e.weightKg)} × ${e.reps}` }),
            arrow && h('span', { class: `trend trend--${arrow === '▲' ? 'up' : arrow === '▽' ? 'down' : 'flat'}`, text: ` ${arrow}` }),
          ]),
          h('button', {
            class: 'link-del',
            title: 'Excluir',
            text: '✕',
            onclick: async () => {
              if (!confirm('Excluir este registro?')) return;
              await deleteStrengthLog(e.id);
              toast('Registro excluído', 'ok');
              refresh();
            },
          }),
        ]);
      });
      const last = asc[asc.length - 1];
      const first = asc[0];
      const delta = last.weightKg - first.weightKg;
      historyBox.append(
        h('details', { class: 'exgroup', open: entries.length <= 3 ? true : null }, [
          h('summary', [
            h('span', { text: name }),
            h('span', {
              class: delta > 0 ? 'trend trend--up' : delta < 0 ? 'trend trend--down' : 'muted',
              text: delta === 0 ? '±0' : `${delta > 0 ? '+' : ''}${fmt.kg(delta)}`,
            }),
          ]),
          h('ul', { class: 'list' }, rows.reverse()),
        ]),
      );
    }
  }

  const form = h(
    'form',
    {
      onsubmit: async (ev) => {
        ev.preventDefault();
        if (!exercise.value.trim() || !fWeight.input.value || !fReps.input.value) {
          toast('Exercício, carga e reps são obrigatórios.', 'warn');
          return;
        }
        await withBusy(ev.submitter || ev.target.querySelector('[type=submit]'), async () => {
          await addStrengthLog({
            date: date.value,
            exercise: exercise.value,
            weightKg: fWeight.input.value,
            reps: fReps.input.value,
            notes: notes.value,
          });
          toast('Série registrada ✔', 'ok');
          fWeight.input.value = '';
          fReps.input.value = '';
          notes.value = '';
          exercise.focus();
          refresh();
        });
      },
    },
    [
      h('div', { class: 'field' }, [
        h('span', { class: 'field__label', text: 'Exercício' }),
        exercise,
        h('span', {
          class: 'field__hint',
          text: 'Use sempre o mesmo nome (ex.: "Supino reto"). O histórico agrupa por nome e mostra a seta de progressão.',
        }),
      ]),
      h('div', { class: 'grid-2' }, [fWeight.node, fReps.node]),
      h('label', { class: 'field' }, [
        h('span', { class: 'field__label', text: 'Data' }),
        date,
      ]),
      h('label', { class: 'field' }, [
        h('span', { class: 'field__label', text: 'Observações' }),
        notes,
      ]),
      h('button', { class: 'btn btn--block', type: 'submit' }, 'Registrar série'),
      datalist,
    ],
  );

  refresh();

  const frag = document.createDocumentFragment();
  frag.append(
    restTimerCard(),
    card('Nova série', form),
    card('Histórico por exercício', historyBox),
  );
  return frag;
}
