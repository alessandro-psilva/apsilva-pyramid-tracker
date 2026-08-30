// views/strength.js — registro rápido de força + histórico por exercício.
import { addStrengthLog, listStrengthLogs, deleteStrengthLog } from '../store.js';
import { todayISO, fmt } from '../calc.js';
import { h, toast, withBusy, card, emptyState, fieldNumber } from '../ui.js';

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
    help: 'Peso total na barra ou no halter da sua melhor série de trabalho desse exercício hoje. Comparar a mesma série entre semanas mostra a progressão.',
  });
  const fReps = fieldNumber('sReps', 'Reps', '', {
    integer: true, required: true, min: '1',
    help: 'Quantas repetições completas você fez nessa série (com boa forma). Subir carga OU subir reps na mesma carga já conta como progresso.',
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
          text: 'Use sempre o mesmo nome pro mesmo exercício (ex.: "Supino reto") — é assim que o histórico agrupa e mostra a seta de progressão.',
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
  frag.append(card('Nova série', form), card('Histórico por exercício', historyBox));
  return frag;
}
