// views/measurements.js — 9 pontos de medida + histórico em tabela.
import {
  addMeasurement,
  listMeasurements,
  deleteMeasurement,
  MEASURE_FIELDS,
} from '../store.js';
import { todayISO } from '../calc.js';
import { h, toast, withBusy, card, emptyState } from '../ui.js';

export async function render() {
  const date = h('input', { type: 'date', value: todayISO(), required: true });

  const inputs = {};
  const fieldNodes = MEASURE_FIELDS.map(([key, label]) => {
    const inp = h('input', {
      type: 'number',
      inputmode: 'decimal',
      step: '0.1',
      min: '0',
      placeholder: 'cm',
    });
    inputs[key] = inp;
    return h('label', { class: 'field' }, [
      h('span', { class: 'field__label', text: label }),
      inp,
    ]);
  });

  const tableBox = h('div', { class: 'table-scroll' });

  async function refresh() {
    const rows = await listMeasurements();
    tableBox.innerHTML = '';
    if (!rows.length) {
      tableBox.append(emptyState('Nenhuma medida registrada ainda.', '📏'));
      return;
    }
    const table = h('table', { class: 'data-table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', { text: 'Data' }),
        ...MEASURE_FIELDS.map(([, label]) => h('th', { text: label })),
        h('th', { text: '' }),
      ])),
      h(
        'tbody',
        {},
        rows.map((r) =>
          h('tr', {}, [
            h('td', { text: r.date }),
            ...MEASURE_FIELDS.map(([key]) =>
              h('td', { text: r[key] != null ? String(r[key]) : '–' }),
            ),
            h('td', {}, h('button', {
              class: 'link-del',
              text: '✕',
              title: 'Excluir',
              onclick: async () => {
                if (!confirm('Excluir esta medição?')) return;
                await deleteMeasurement(r.id);
                toast('Medição excluída', 'ok');
                refresh();
              },
            })),
          ]),
        ),
      ),
    ]);
    tableBox.append(table);
  }

  const form = h(
    'form',
    {
      onsubmit: async (ev) => {
        ev.preventDefault();
        const values = Object.fromEntries(
          Object.entries(inputs).map(([k, i]) => [k, i.value]),
        );
        if (!Object.values(values).some((v) => v !== '')) {
          toast('Preencha ao menos uma medida.', 'warn');
          return;
        }
        await withBusy(ev.submitter, async () => {
          await addMeasurement({ date: date.value, ...values });
          toast('Medidas salvas ✔', 'ok');
          for (const i of Object.values(inputs)) i.value = '';
          refresh();
        });
      },
    },
    [
      h('label', { class: 'field' }, [
        h('span', { class: 'field__label', text: 'Data' }),
        date,
      ]),
      h('div', { class: 'grid-2' }, fieldNodes),
      h('button', { class: 'btn btn--block', type: 'submit' }, 'Salvar medidas'),
    ],
  );

  refresh();

  const frag = document.createDocumentFragment();
  frag.append(card('Nova medição (cm)', form), card('Histórico', tableBox));
  return frag;
}
