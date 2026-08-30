// views/weigh-in.js — "Registrar peso de hoje". Meta: salvar em <= 3 toques.
import { getWeighIn, saveWeighIn, listWeighIns } from '../store.js';
import { todayISO, parseISODate, fmt, weeklyAverages } from '../calc.js';
import { h, toast, withBusy, card } from '../ui.js';

function prettyDate(iso) {
  return parseISODate(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export async function render(ctx) {
  const date = todayISO();
  const existing = await getWeighIn(date);

  const input = h('input', {
    id: 'weight-today',
    type: 'number',
    inputmode: 'decimal',
    step: '0.1',
    min: '0',
    placeholder: 'kg',
    value: existing ? existing.weightKg : '',
    required: true,
  });
  // Foca e abre o teclado numérico assim que a tela aparece.
  setTimeout(() => input.focus(), 60);

  const status = h('p', { class: 'muted' });
  if (existing) {
    status.textContent = `Já existe um registro de hoje: ${fmt.kg(existing.weightKg)}. Salvar de novo sobrescreve.`;
  }

  const save = h(
    'button',
    {
      class: 'btn btn--block btn--lg',
      onclick: async (ev) => {
        const value = parseFloat(input.value);
        if (!value || value <= 0) {
          toast('Digite um peso válido.', 'warn');
          input.focus();
          return;
        }
        const current = await getWeighIn(date);
        if (current && !ev.target.dataset.confirmed) {
          if (!confirm(`Sobrescrever o registro de hoje (${fmt.kg(current.weightKg)}) por ${fmt.kg(value)}?`)) {
            return;
          }
        }
        await withBusy(ev.target, async () => {
          await saveWeighIn(date, value);
          toast('Peso de hoje salvo ✔', 'ok');
          renderRecent();
        });
      },
    },
    existing ? 'Atualizar peso de hoje' : 'Salvar peso de hoje',
  );

  const recentBox = h('div');

  async function renderRecent() {
    const all = await listWeighIns();
    recentBox.innerHTML = '';
    const last7 = all.slice(-7).reverse();
    if (!last7.length) {
      recentBox.append(h('p', { class: 'muted', text: 'Nenhuma pesagem ainda.' }));
    } else {
      recentBox.append(
        h(
          'ul',
          { class: 'list' },
          last7.map((w) =>
            h('li', { class: 'list__row' }, [
              h('span', { text: prettyDate(w.date) }),
              h('strong', { text: fmt.kg(w.weightKg) }),
            ]),
          ),
        ),
      );
      const weeks = weeklyAverages(all);
      const wk = weeks[weeks.length - 1];
      if (wk) {
        recentBox.append(
          h('p', {
            class: 'muted',
            text: `Semana atual: média ${fmt.kg(wk.avgKg)} (${wk.days} ${wk.days === 1 ? 'dia' : 'dias'}).`,
          }),
        );
      }
    }
  }
  renderRecent();

  const frag = document.createDocumentFragment();
  frag.append(
    card(
      null,
      h('p', { class: 'weigh__date', text: prettyDate(date) }),
      h('label', { class: 'field field--hero' }, [
        h('span', { class: 'field__label', text: 'Peso de hoje' }),
        input,
      ]),
      status,
      save,
    ),
    card('Últimas pesagens', recentBox),
  );
  return frag;
}
