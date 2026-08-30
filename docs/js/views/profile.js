// views/profile.js — editar perfil e ver o efeito nas metas.
import { saveProfile } from '../store.js';
import {
  EXPERIENCE_LEVELS,
  ACTIVITY_LEVELS,
  PHASES,
  PHASE_DEFAULTS,
  MACRO_RANGES,
  computeTargets,
  fmt,
} from '../calc.js';
import { h, toast, withBusy, card, fieldNumber, fieldSelect } from '../ui.js';

const HELP = {
  weightKg:
    'Seu peso atual, em kg. Use a média das pesagens da última semana (de manhã, em jejum). Tudo parte daqui.',
  heightM:
    'Sua altura em metros (ex.: 1,75). Serve de referência; não entra no cálculo das calorias.',
  level:
    'Há quanto tempo você treina e ainda progride. Iniciante: sobe carga quase toda semana. Intermediário: progride a cada mês. Avançado: o progresso leva meses para aparecer. Isso define a velocidade de ganho esperada.',
  activity:
    'Seu movimento no dia a dia mais os treinos (já conta 3–6 treinos por semana). Sedentário: trabalha sentado, anda pouco. Levemente ativo: anda um tanto. Ativo: fica de pé ou andando boa parte do dia. Muito ativo: trabalho braçal. Na dúvida, comece em "Ativo" e ajuste em 2–3 semanas.',
  phase:
    'Ganho: comer acima da manutenção para ganhar músculo (vem gordura junto). Corte: comer abaixo para perder gordura. Faça uma coisa de cada vez — o livro pede ~4× mais tempo em Ganho do que em Corte.',
  proteinGPerLb:
    'Gramas de proteína por libra de peso (1 lb = 0,45 kg; o app converte). Padrões: 0,8 no Ganho, 1,1 no Corte. Sacia rápido e come pouco? Baixe. Com fome ou perdendo força no corte? Suba até 1,2.',
  fatPercent:
    'Quanto das calorias do dia vem de gordura — número inteiro (25 = 25%). O resto vira carboidrato. Padrões: 25% no Ganho, 20% no Corte. Não passe abaixo de ~0,25 g por libra de peso; a prévia avisa.',
  mealsPerDay:
    'Em quantas refeições você divide o dia. Serve só para a aba Comida mostrar uma margem de P/C/G por refeição — o livro não exige refeições fixas. O normal é 3 a 6.',
};

export async function render(ctx) {
  const p = { ...ctx.profile };

  const fW = fieldNumber('weightKg', 'Peso base (kg)', p.weightKg, {
    step: '0.1', required: true, help: HELP.weightKg,
  });
  const fH = fieldNumber('heightM', 'Altura (m)', p.heightM, {
    step: '0.01', required: true, help: HELP.heightM,
  });
  const fLevel = fieldSelect('level', 'Nível de treino', p.level, EXPERIENCE_LEVELS, { help: HELP.level });
  const fAct = fieldSelect('activity', 'Nível de atividade', p.activity, ACTIVITY_LEVELS, { help: HELP.activity });
  const fPhase = fieldSelect('phase', 'Fase', p.phase, PHASES, { help: HELP.phase });
  const fProt = fieldNumber('proteinGPerLb', 'Proteína (g/lb)', p.proteinGPerLb, {
    step: '0.05', help: HELP.proteinGPerLb,
  });
  const fFat = fieldNumber('fatPercent', 'Gordura (% das calorias)', Math.round(p.fatPercent * 100), {
    step: '1', integer: true, help: HELP.fatPercent,
  });
  const fMeals = fieldNumber('mealsPerDay', 'Refeições por dia', p.mealsPerDay ?? 4, {
    integer: true, min: '2', help: HELP.mealsPerDay,
  });

  // Dica dinâmica da faixa recomendada de proteína (atualiza ao trocar de fase).
  const protRange = h('span', { class: 'field__hint' });
  fProt.node.insertBefore(protRange, fProt.node.querySelector('.field__help'));

  const preview = h('div', { class: 'preview' });

  function readForm() {
    return {
      weightKg: parseFloat(fW.input.value),
      heightM: parseFloat(fH.input.value),
      level: fLevel.input.value,
      activity: fAct.input.value,
      phase: fPhase.input.value,
      proteinGPerLb: parseFloat(fProt.input.value),
      fatPercent: parseFloat(fFat.input.value) / 100,
      mealsPerDay: parseInt(fMeals.input.value, 10) || 4,
    };
  }

  function row(label, value, strong = false) {
    return h('div', { class: 'preview__row' }, [
      h('span', { text: label }),
      strong ? h('strong', { text: value }) : h('span', { text: value }),
    ]);
  }

  function updatePreview() {
    const draft = readForm();
    const range = MACRO_RANGES[draft.phase] || MACRO_RANGES.Ganho;
    protRange.textContent = `Faixa ${draft.phase}: ${fmt.range(
      range.proteinGPerLb[0], range.proteinGPerLb[1],
    )} g/lb · gordura ${Math.round(range.fatPercent[0] * 100)}–${Math.round(range.fatPercent[1] * 100)}%`;

    try {
      const t = computeTargets(draft);
      preview.innerHTML = '';
      preview.append(
        row('Manutenção', fmt.kcal(t.maintenanceKcal)),
        row(t.deltaKcal >= 0 ? 'Superávit' : 'Déficit', fmt.kcal(t.deltaKcal)),
        row('Meta diária', fmt.kcal(t.targetKcal), true),
        row('Proteína', `${fmt.g(t.protein.g)} · ${fmt.kcal(t.protein.kcal)}`),
        row('Gordura', `${fmt.g(t.fat.g)} · ${fmt.pct(t.fat.pct)}`),
        row('Carboidrato', `${fmt.g(t.carb.g)} · ${fmt.kcal(t.carb.kcal)}`),
      );
      for (const w of t.warnings) {
        preview.append(h('p', { class: 'alert', text: 'Atenção — ' + w }));
      }
    } catch (e) {
      preview.innerHTML = '';
      preview.append(h('p', { class: 'alert', text: 'Preencha os campos numéricos.' }));
    }
  }

  fPhase.input.addEventListener('change', () => {
    const d = PHASE_DEFAULTS[fPhase.input.value];
    if (d) {
      fProt.input.value = d.proteinGPerLb;
      fFat.input.value = Math.round(d.fatPercent * 100);
    }
    updatePreview();
  });
  for (const f of [fW, fH, fLevel, fAct, fProt, fFat, fMeals]) {
    f.input.addEventListener('input', updatePreview);
    f.input.addEventListener('change', updatePreview);
  }
  updatePreview();

  const form = h(
    'form',
    {
      onsubmit: async (ev) => {
        ev.preventDefault();
        const draft = readForm();
        if (!draft.weightKg || !draft.heightM) {
          toast('Peso e altura são obrigatórios.', 'warn');
          return;
        }
        await withBusy(ev.submitter || ev.target.querySelector('[type=submit]'), async () => {
          await saveProfile(draft);
          await ctx.reloadProfile();
          toast('Perfil salvo', 'ok');
          ctx.navigate('/dashboard');
        });
      },
    },
    [
      fW.node, fH.node, fLevel.node, fAct.node, fPhase.node, fProt.node, fFat.node, fMeals.node,
      h('button', { class: 'btn btn--block', type: 'submit' }, 'Salvar perfil'),
    ],
  );

  const logout = h(
    'button',
    { class: 'btn btn--ghost btn--block', onclick: () => ctx.signOut() },
    'Sair da conta',
  );

  const frag = document.createDocumentFragment();
  frag.append(
    card('Perfil', h('p', { class: 'muted', text: 'Toque no "?" ao lado de cada campo para entender o que preencher.' }), form),
    card('Prévia das metas', preview),
    card(null, logout),
  );
  return frag;
}
