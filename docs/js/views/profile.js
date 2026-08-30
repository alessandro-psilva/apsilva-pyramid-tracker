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

export async function render(ctx) {
  const p = { ...ctx.profile };

  const fW = fieldNumber('weightKg', 'Peso base (kg)', p.weightKg, { step: '0.1', required: true });
  const fH = fieldNumber('heightM', 'Altura (m)', p.heightM, { step: '0.01', required: true });
  const fLevel = fieldSelect('level', 'Nível de treino', p.level, EXPERIENCE_LEVELS);
  const fAct = fieldSelect('activity', 'Nível de atividade', p.activity, ACTIVITY_LEVELS);
  const fPhase = fieldSelect('phase', 'Fase', p.phase, PHASES);
  const fProt = fieldNumber('proteinGPerLb', 'Proteína (g/lb)', p.proteinGPerLb, { step: '0.05' });
  const fFat = fieldNumber('fatPercent', 'Gordura (% das calorias)', Math.round(p.fatPercent * 100), {
    step: '1',
    integer: true,
  });

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
    };
  }

  function updatePreview() {
    const draft = readForm();
    const range = MACRO_RANGES[draft.phase];
    fProt.node.querySelector('.field__hint')?.remove();
    fProt.node.append(
      h('span', {
        class: 'field__hint',
        text: `Faixa ${draft.phase}: ${fmt.range(range.proteinGPerLb[0], range.proteinGPerLb[1])} g/lb`,
      }),
    );
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
        preview.append(h('p', { class: 'alert', text: '⚠ ' + w }));
      }
    } catch (e) {
      preview.innerHTML = '';
      preview.append(h('p', { class: 'alert', text: 'Preencha os campos numéricos.' }));
    }
  }

  function row(label, value, strong = false) {
    return h('div', { class: 'preview__row' }, [
      h('span', { text: label }),
      strong ? h('strong', { text: value }) : h('span', { text: value }),
    ]);
  }

  // Ao trocar de fase, sugere os defaults de macro daquela fase.
  fPhase.input.addEventListener('change', () => {
    const d = PHASE_DEFAULTS[fPhase.input.value];
    fProt.input.value = d.proteinGPerLb;
    fFat.input.value = Math.round(d.fatPercent * 100);
    updatePreview();
  });
  for (const f of [fW, fH, fLevel, fAct, fProt, fFat]) {
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
        await withBusy(ev.submitter, async () => {
          await saveProfile(draft);
          await ctx.reloadProfile();
          toast('Perfil salvo ✔', 'ok');
          ctx.navigate('/dashboard');
        });
      },
    },
    [
      fW.node, fH.node, fLevel.node, fAct.node, fPhase.node, fProt.node, fFat.node,
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
    card('Perfil', form),
    card('Prévia das metas', preview),
    card(null, logout),
  );
  return frag;
}
