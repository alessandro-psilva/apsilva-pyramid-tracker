// views/food.js — montar e acompanhar as refeições do dia contra a meta.
import {
  getFoodLog, saveFoodLog,
  listFoods, addFood, deleteFood,
} from '../store.js';
import { todayISO, parseISODate, sumFood, splitPerMeal } from '../calc.js';
import { h, toast, card, emptyState, fieldNumber, progressBar } from '../ui.js';

const MEALS = ['Café', 'Almoço', 'Lanche', 'Jantar', 'Ceia'];
const r0 = (n) => Math.round(n);

function prettyDate(iso) {
  return parseISODate(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });
}

export async function render(ctx) {
  const t = ctx.targets;
  const perMeal = t ? splitPerMeal(t, ctx.profile.mealsPerDay) : null;
  let date = todayISO();
  let items = (await getFoodLog(date)).items;
  let foods = await listFoods();
  let meal = MEALS[0];
  let saving = false;
  let queued = null; // snapshot {date, items} aguardando o save atual terminar

  const dateInput = h('input', { id: 'f-foodDate', type: 'date', value: date });
  const dayLabel = h('p', { class: 'food-day', text: prettyDate(date) });
  const progressBox = h('div', { class: 'food-progress' });
  const listBox = h('div');
  const foodsBox = h('div');
  const dl = h('datalist', { id: 'saved-foods' });

  function syncDatalist() {
    dl.innerHTML = '';
    for (const f of foods) dl.append(h('option', { value: f.name }));
  }

  async function persist() {
    // Captura o alvo AGORA — se a data mudar durante o save, o pendente
    // ainda grava o dia certo.
    if (saving) {
      queued = { date, items };
      return;
    }
    saving = true;
    let job = { date, items };
    try {
      while (job) {
        await saveFoodLog(job.date, job.items);
        job = queued;
        queued = null;
      }
    } catch (e) {
      console.error(e);
      toast('Não deu para salvar.', 'warn');
      queued = null;
    } finally {
      saving = false;
    }
  }

  function drawProgress() {
    const s = sumFood(items);
    progressBox.innerHTML = '';
    if (!t) {
      progressBox.append(
        h('p', { class: 'muted', text: 'Preencha o Perfil para ver as metas.' }),
        h('p', { class: 'food-tot', text: `${Math.round(s.kcal)} kcal · P ${Math.round(s.protein)} · C ${Math.round(s.carb)} · G ${Math.round(s.fat)}` }),
      );
      return;
    }
    progressBox.append(
      progressBar('Calorias', s.kcal, t.targetKcal, 'kcal', { warnOver: true }),
      progressBar('Proteína', s.protein, t.protein.g, 'g'),
      progressBar('Carboidrato', s.carb, t.carb.g, 'g'),
      progressBar('Gordura', s.fat, t.fat.g, 'g', { warnOver: true }),
    );
    const remK = Math.round(t.targetKcal - s.kcal);
    const remP = Math.round(t.protein.g - s.protein);
    progressBox.append(
      h('p', {
        class: 'muted',
        text: remK >= 0
          ? `Faltam ${remK} kcal e ${Math.max(remP, 0)} g de proteína.`
          : `${-remK} kcal acima da meta.`,
      }),
      h('p', {
        class: 'muted food-permeal',
        text: `Margem por refeição (÷${perMeal.meals}): ~${r0(perMeal.kcal)} kcal · P ${r0(perMeal.protein)} · C ${r0(perMeal.carb)} · G ${r0(perMeal.fat)} g.`,
      }),
    );
    updateMealHint();
  }

  function itemRow(it, i) {
    return h('li', { class: 'list__row food-item' }, [
      h('span', { class: 'food-item__name', text: it.name || '(sem nome)' }),
      h('span', { class: 'food-item__macros', text:
        `${Math.round(it.kcal)} kcal · P ${Math.round(it.protein)}` +
        (it.carb != null ? ` · C ${Math.round(it.carb)}` : '') +
        (it.fat != null ? ` · G ${Math.round(it.fat)}` : '') }),
      h('button', {
        class: 'link-del', text: '×', 'aria-label': `Remover ${it.name}`,
        onclick: async () => {
          items.splice(i, 1);
          drawProgress(); drawList();
          await persist();
        },
      }),
    ]);
  }

  function drawList() {
    listBox.innerHTML = '';
    if (!items.length) {
      listBox.append(emptyState('Nada neste dia ainda. Monte as refeições abaixo.'));
      return;
    }
    const groups = [...MEALS, ''];
    for (const g of groups) {
      const rows = items
        .map((it, i) => [it, i])
        .filter(([it]) => (it.meal || '') === g);
      if (!rows.length) continue;
      const gs = sumFood(rows.map(([it]) => it));
      const totText = perMeal
        ? `${r0(gs.kcal)} / ${r0(perMeal.kcal)} kcal · P ${r0(gs.protein)}/${r0(perMeal.protein)}`
        : `${r0(gs.kcal)} kcal · P ${r0(gs.protein)}`;
      const over = perMeal && gs.kcal > perMeal.kcal * 1.15;
      listBox.append(
        h('div', { class: 'meal-group' }, [
          h('div', { class: 'meal-group__head' }, [
            h('span', { text: g || 'Sem categoria' }),
            h('span', { class: over ? 'meal-group__over' : 'muted', text: totText }),
          ]),
          h('ul', { class: 'list' }, rows.map(([it, i]) => itemRow(it, i))),
        ]),
      );
    }
  }

  function drawFoods() {
    foodsBox.innerHTML = '';
    if (!foods.length) {
      foodsBox.append(h('p', { class: 'muted', text: 'Nenhum alimento salvo. Marque "salvar" ao adicionar um item para reaproveitar depois.' }));
      return;
    }
    foodsBox.append(
      h('ul', { class: 'list' }, foods.map((f) =>
        h('li', { class: 'list__row food-item' }, [
          h('button', {
            class: 'food-add-saved',
            text: f.name,
            onclick: async () => {
              items.push({
                name: f.name, meal,
                kcal: f.kcal, protein: f.protein,
                carb: f.carb ?? null, fat: f.fat ?? null,
              });
              drawProgress(); drawList();
              toast(`${f.name} em ${meal}`, 'ok');
              await persist();
            },
          }),
          h('span', { class: 'food-item__macros', text: `${Math.round(f.kcal)} kcal · P ${Math.round(f.protein)}` }),
          h('button', {
            class: 'link-del', text: '×', 'aria-label': `Apagar ${f.name}`,
            onclick: async () => {
              if (!confirm(`Apagar "${f.name}" dos seus alimentos?`)) return;
              await deleteFood(f.id);
              foods = foods.filter((x) => x.id !== f.id);
              drawFoods();
              syncDatalist();
            },
          }),
        ]),
      )),
    );
  }

  async function loadDate(d) {
    date = d;
    items = (await getFoodLog(date)).items;
    dayLabel.textContent = prettyDate(date) + (date > todayISO() ? ' · planejamento' : '');
    drawProgress(); drawList();
  }
  dateInput.addEventListener('change', () => dateInput.value && loadDate(dateInput.value));

  // --- formulário ---
  syncDatalist();

  const fName = h('input', {
    id: 'f-fName', type: 'text', list: 'saved-foods', autocomplete: 'off', required: true,
    placeholder: 'ex.: Frango grelhado 150 g',
  });
  const fKcal = fieldNumber('fKcal', 'Calorias (kcal)', '', { integer: true, required: true });
  const fProt = fieldNumber('fProt', 'Proteína (g)', '', { step: '0.1', required: true });
  const fCarb = fieldNumber('fCarb', 'Carboidrato (g)', '', { step: '0.1' });
  const fFat = fieldNumber('fFat', 'Gordura (g)', '', { step: '0.1' });
  const fSave = h('input', { id: 'f-fSave', type: 'checkbox' });

  // Ao escolher um alimento salvo, preenche os números.
  fName.addEventListener('input', () => {
    const hit = foods.find((f) => f.name.toLowerCase() === fName.value.trim().toLowerCase());
    if (hit) {
      fKcal.input.value = hit.kcal;
      fProt.input.value = hit.protein;
      fCarb.input.value = hit.carb ?? '';
      fFat.input.value = hit.fat ?? '';
    }
  });

  const mealHint = h('span', { class: 'field__hint' });
  function updateMealHint() {
    if (!perMeal) {
      mealHint.textContent = '';
      return;
    }
    const logged = sumFood(items.filter((it) => (it.meal || '') === meal));
    const fk = Math.round(perMeal.kcal - logged.kcal);
    const fp = Math.round(perMeal.protein - logged.protein);
    mealHint.textContent =
      fk >= 0
        ? `${meal}: cabem mais ~${fk} kcal e ${Math.max(fp, 0)} g de proteína.`
        : `${meal}: já passou ${-fk} kcal da margem.`;
  }

  const mealChips = h('div', { class: 'meal-chips' },
    MEALS.map((m) =>
      h('button', {
        type: 'button',
        class: 'meal-chip' + (m === meal ? ' is-active' : ''),
        onclick: (ev) => {
          meal = m;
          for (const b of ev.target.parentElement.children) b.classList.remove('is-active');
          ev.target.classList.add('is-active');
          updateMealHint();
        },
      }, m),
    ),
  );

  const form = h('form', {
    onsubmit: async (ev) => {
      ev.preventDefault();
      const name = fName.value.trim();
      const kcal = parseFloat(fKcal.input.value);
      if (!name || !(kcal > 0)) {
        toast('Informe nome e calorias.', 'warn');
        return;
      }
      const item = {
        name, meal, kcal,
        protein: parseFloat(fProt.input.value) || 0,
        carb: fCarb.input.value === '' ? null : parseFloat(fCarb.input.value),
        fat: fFat.input.value === '' ? null : parseFloat(fFat.input.value),
      };
      items.push(item);
      drawProgress(); drawList();

      if (fSave.checked && !foods.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        try {
          await addFood(item);
          foods = await listFoods();
          drawFoods();
          syncDatalist();
        } catch (e) { console.error(e); }
      }

      for (const el of [fName, fKcal.input, fProt.input, fCarb.input, fFat.input]) el.value = '';
      fSave.checked = false;
      fName.focus();
      await persist();
    },
  }, [
    h('label', { class: 'field' }, [
      h('span', { class: 'field__label', text: 'Alimento' }),
      fName,
      h('span', { class: 'field__hint', text: 'Digite um nome já salvo para puxar os números automaticamente.' }),
    ]),
    h('span', { class: 'field__label', text: 'Refeição' }),
    mealChips,
    mealHint,
    h('div', { class: 'grid-2' }, [fKcal.node, fProt.node, fCarb.node, fFat.node]),
    h('label', { class: 'checkline' }, [fSave, h('span', { text: 'Salvar como meu alimento' })]),
    h('button', { class: 'btn btn--block', type: 'submit' }, 'Adicionar'),
    dl,
  ]);

  drawProgress();
  drawList();
  drawFoods();

  const frag = document.createDocumentFragment();
  frag.append(
    card(
      null,
      h('label', { class: 'field' }, [
        h('span', { class: 'field__label', text: 'Dia (pode planejar dias futuros)' }),
        dateInput,
      ]),
      dayLabel,
      progressBox,
    ),
    card('Adicionar alimento', form),
    card('Refeições do dia', listBox),
    card('Meus alimentos', foodsBox),
    h('p', {
      class: 'muted',
      text: 'Contar comida é opcional no método do livro — a base é peso de manhã e média semanal. Use isto nas fases em que quiser mais precisão. Não sabe a quantidade exata? Chute para cima.',
    }),
  );
  return frag;
}
