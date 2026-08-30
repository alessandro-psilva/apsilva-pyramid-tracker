// views/measurements.js — 9 pontos de medida + histórico em tabela.
import {
  addMeasurement,
  listMeasurements,
  deleteMeasurement,
  MEASURE_FIELDS,
} from '../store.js';
import { todayISO } from '../calc.js';
import { h, toast, withBusy, card, emptyState, fieldNumber } from '../ui.js';

// Como e onde medir cada ponto (instruções do livro, cap. "Fazendo ajustes").
const HELP = {
  chest: 'Fita na linha do mamilo (ou sob as axilas, se ficar melhor pro seu formato). Inspire fundo, contraia peito e dorsais.',
  armR: 'Braço direito contraído, como se mostrasse o bíceps. Meça no ponto mais grosso.',
  armL: 'Braço esquerdo contraído, como se mostrasse o bíceps. Meça no ponto mais grosso.',
  thighR: 'Em pé, coxa direita contraída. Meça no ponto mais grosso.',
  thighL: 'Em pé, coxa esquerda contraída. Meça no ponto mais grosso.',
  waistAbove: 'Três dedos ACIMA do umbigo. Tensione a barriga como se fosse levar um soco — sem estufar nem sugar.',
  waistNavel: 'Na linha do umbigo. Mesma tensão de barriga (nem estufar nem sugar).',
  waistBelow: 'Três dedos ABAIXO do umbigo. Mesma tensão de barriga.',
  hips: 'Na parte mais larga do quadril/glúteos, em pé, relaxado.',
};

const GENERAL_HELP =
  'Meça 1×/semana, no mesmo dia, junto da média de peso. Meça você mesmo (assim nunca falta), sempre do mesmo jeito, e anote ao 0,1 cm. O que importa é a tendência ao longo das semanas, não uma medida isolada. Queda de 2–2,5 cm em pelo menos 2 pontos da barriga ≈ ~1,8 kg de gordura a menos.';

export async function render() {
  const dateInput = h('input', { id: 'f-mDate', type: 'date', value: todayISO(), required: true });
  const dateNode = h('div', { class: 'field' }, [
    h('label', { class: 'field__label', for: 'f-mDate', text: 'Data' }),
    dateInput,
  ]);

  const fields = MEASURE_FIELDS.map(([key, label]) =>
    fieldNumber(key, label, '', { step: '0.1', placeholder: 'cm', help: HELP[key] }),
  );

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
        const values = {};
        for (const f of fields) values[f.input.name] = f.input.value;
        if (!Object.values(values).some((v) => v !== '')) {
          toast('Preencha ao menos uma medida.', 'warn');
          return;
        }
        await withBusy(ev.submitter || ev.target.querySelector('[type=submit]'), async () => {
          await addMeasurement({ date: dateInput.value, ...values });
          toast('Medidas salvas ✔', 'ok');
          for (const f of fields) f.input.value = '';
          refresh();
        });
      },
    },
    [
      dateNode,
      h('div', { class: 'grid-2' }, fields.map((f) => f.node)),
      h('button', { class: 'btn btn--block', type: 'submit' }, 'Salvar medidas'),
    ],
  );

  refresh();

  const frag = document.createDocumentFragment();
  frag.append(
    card(
      'Nova medição (cm)',
      h('p', { class: 'muted', text: GENERAL_HELP }),
      form,
    ),
    card('Histórico', tableBox),
  );
  return frag;
}
