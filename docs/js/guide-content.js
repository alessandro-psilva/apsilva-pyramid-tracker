// guide-content.js
// Resumo, em português, de cada capítulo de "The Muscle & Strength Pyramid:
// Nutrition" (Eric Helms, 2ª ed., 2018). São notas de estudo condensadas — os
// conceitos e números do método, na minha redação, para servir de guia de
// consulta ao longo dos anos. Para o argumento completo, leia o livro.
//
// Formatação nos textos: **negrito** vira <strong>.

export const GUIDE_INTRO = `A Pirâmide organiza a nutrição da base (mais importante)
para o topo (ajuste fino). Cada nível só faz sentido depois do anterior: não
adianta cronometrar proteína no pós-treino se o total de calorias está errado.
Ordem: 1) Balanço energético → 2) Macros e fibra → 3) Micronutrientes e água →
4) Tempo e frequência → 5) Suplementos.`;

export const CHAPTERS = [
  // -----------------------------------------------------------------------
  {
    id: 'mentalidade',
    title: 'Mentalidade e materiais',
    tagline: 'Como pensar sobre dieta antes de contar qualquer caloria.',
    sections: [
      {
        h: 'Rastrear ou não rastrear',
        body: [
          'Pesar comida e se pesar todo dia está associado a maior risco de relação ruim com comida e com o corpo, principalmente em quem compete. Sem prazo de categoria nem palco, você provavelmente chega ao seu objetivo **sem** rastrear para sempre — e talvez chegue melhor assim.',
          'Rastrear é uma ferramenta de aprendizado e de fases específicas, não um estado permanente.',
        ],
      },
      {
        h: 'Precisão × flexibilidade × consistência',
        body: [
          'Os três se equilibram. Muita precisão custa flexibilidade e sanidade, e cedo ou tarde quebra a consistência (o ciclo "seguindo à risca → largou tudo → binge").',
          'Seja só tão preciso quanto o objetivo exige. Restrição alimentar **flexível** é o que se associa a perder peso, manter e continuar são.',
        ],
      },
      {
        h: 'O perigo do "tudo ou nada"',
        list: [
          '**Plano de refeições rígido:** vira binário ("no plano" / "fora do plano"). Serve como exemplo para aprender a montar refeições, não como destino.',
          '**Macros "mágicos":** são só números, mudam com a vida. Passar 5 g do alvo não é motivo pra "chutar o balde".',
          '**"Comida boa × comida ruim":** troque por mentalidade **inclusiva** — primeiro inclua alimentos densos em micronutrientes e fibra; depois cabe o resto com moderação. Variedade é um dos pilares de uma dieta saudável.',
        ],
      },
      {
        h: 'Como rastrear comida (se for rastrear)',
        list: [
          'Pese em vez de medir volume (xícara varia muito).',
          'Pese os alimentos **crus** — o tempo de cozimento muda o peso, não a nutrição.',
          'Use um banco de dados (o app do seu tracker); confira alimentos frequentes em mais de uma fonte.',
        ],
      },
      {
        h: 'Como rastrear peso corporal',
        body: [
          'Pese-se **de manhã, após o banheiro, antes de comer/beber, sem roupa**, todo dia. O número de um dia não importa — o que importa é a **média da semana** (mínimo 3 dias).',
          'Oscilação diária de 1–2% do peso é normal (água, sódio, hormônios). A média semanal achata esse ruído. Não faça mudanças antes de ter 2–3 semanas de médias.',
        ],
      },
    ],
    appTie: 'A tela "Registrar peso de hoje" e o status semanal do Resumo já fazem exatamente isso: guardam a pesagem do dia e comparam a média desta semana com a da anterior.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'nivel-1',
    title: 'Nível 1 — Balanço energético',
    tagline: 'Calorias de manutenção, ganhar ou cortar, e a que ritmo.',
    sections: [
      {
        h: 'Achar a manutenção',
        body: [
          '**Método preferido:** rastrear peso e calorias por 2 semanas. Média das 14 calorias; média dos 7 primeiros pesos × média dos 7 últimos. A variação de peso × ~3500 kcal/lb (~7700 kcal/kg) diz seu superávit/déficit, e daí a manutenção real.',
          '**Método rápido (estimativa):** peso(kg) × 22 × multiplicador de atividade. Faixas: sedentário 1,3–1,6 · levemente ativo 1,5–1,8 · ativo 1,7–2,0 · muito ativo 1,9–2,2 (tudo já contando 3–6 treinos/semana). Na dúvida use ~1,7 e ajuste em 2–3 semanas.',
        ],
        formula: 'manutenção ≈ peso(kg) × 22 × média(multiplicador de atividade)',
      },
      {
        h: 'Ganhar ou cortar?',
        list: [
          'Iniciante com muita gordura: treine forte 6 meses perto da manutenção e reavalie — a composição melhora sozinha.',
          'Não-iniciante: decide-se pelo nível de gordura. Comece um ganho até ~15% (homem) / ~23% (mulher); deixe subir 3–5 pontos de %gordura e faça um mini-corte.',
          'Não tente ficar muito magro **antes** de ganhar — você fica faminto, ganha rápido demais e, pós-dieta agressiva, o corpo até prioriza estoque de gordura.',
          'Regra de tempo: no mínimo 4:1 de tempo em ganho para tempo em corte.',
        ],
      },
      {
        h: 'Ritmo de GANHO (por mês, por nível)',
        list: [
          '**Iniciante:** 1,0–1,5% do peso/mês · superávit sugerido ~+300 kcal/dia',
          '**Intermediário:** 0,5–1,0% do peso/mês · ~+200 kcal/dia',
          '**Avançado:** até 0,5% do peso/mês · +100 kcal/dia (foco é progredir na barra, não a balança)',
        ],
        note: 'Mais rápido que isso = proporção maior de gordura no que você ganha.',
      },
      {
        h: 'Ritmo de CORTE (universal, não depende do nível)',
        body: [
          '0,5–1,0% do peso corporal **por semana**. Usando ~0,75% de média: déficit ≈ 0,0075 × peso(kg) × 7700 ÷ 7 kcal/dia.',
          'O déficit não precisa vir só da comida — mas cardio não deve passar de metade do tempo que você gasta levantando peso, e não é o veículo principal da perda de gordura.',
        ],
        formula: 'déficit ≈ −(0,75% × peso(kg) × 7700 ÷ 7) kcal/dia',
      },
      {
        h: 'Disponibilidade energética (RED-S)',
        body: [
          'Dá para estar em equilíbrio calórico e ainda assim "sub-abastecido": libido, humor, sono, ciclo menstrual e hormônios caem. Alvo aproximado: acima de ~30 kcal/kg de massa magra (mulheres) / ~25 (homens).',
          'Sinais de alerta: perda de libido, fome constante, mais doenças, humor pior, desempenho travado. Se aparecerem, **coma mais** e aceite um pouco mais de gordura corporal.',
        ],
        warn: true,
      },
    ],
    appTie: 'O app calcula manutenção, superávit/déficit e meta diária a partir do seu Perfil, e o status semanal avisa quando o ritmo saiu da faixa esperada da sua fase.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'nivel-2',
    title: 'Nível 2 — Macronutrientes e fibra',
    tagline: 'De onde vêm as calorias: proteína, depois gordura, depois carbo.',
    sections: [
      {
        h: 'Ordem de montagem',
        body: [
          'Defina **proteína** por peso corporal → depois **gordura** como % das calorias → **carboidrato** é o que sobra. Treinar é a defesa nº 1 da massa magra no corte; o ritmo de perda é a nº 2; os macros, a nº 3.',
        ],
      },
      {
        h: 'Proteína',
        list: [
          '**Corte:** 1,0–1,2 g/lb (2,2–2,6 g/kg). Mais proteína no déficit ajuda a preservar músculo e dá saciedade.',
          '**Ganho:** 0,7–1,0 g/lb (1,6–2,2 g/kg) — o benefício estabiliza aí. Com as calorias sobrando, você não precisa de mais.',
          'Come pouco por saciar rápido? Fique na ponta baixa. Ganha rápido demais por fome? Pode ir até ~1,5 g/lb.',
          '**Obesidade:** usar g/lb infla demais — alternativa: use a **altura em cm** como alvo de gramas de proteína/dia.',
        ],
      },
      {
        h: 'Gordura e carboidrato',
        list: [
          '**Corte:** gordura 15–25% das calorias (15% é baixo, mas dieta não dura pra sempre) — sobra vira carbo para sustentar o treino.',
          '**Ganho:** gordura 20–30%. Fora do corte, dá pra só cuidar de calorias e proteína e não se preocupar com a razão carbo/gordura.',
          'Preferência forte ou dados próprios a favor de low-carb: até 40% de gordura é aceitável.',
        ],
      },
      {
        h: 'Pisos mínimos',
        body: [
          'Gordura: **0,25 g/lb** (~0,5 g/kg). Carboidrato: **0,5 g/lb** (~1 g/kg). Se para bater o ritmo de perda você teria que furar esses pisos, aceite uma perda mais lenta (0,3–0,5%/semana).',
        ],
        warn: true,
      },
      {
        h: 'Low-carb / cetogênica serve pra mim?',
        body: [
          'Só compensa se você tem resistência à insulina real (idade, histórico familiar, SOP/oligomenorreia) ou dados próprios. Teste honesto: 1 mês a 40% de gordura vs 1 mês a 20%, mesmas calorias e proteína, anotando humor/energia/qualidade de treino de 1 a 10 — de preferência repetido.',
        ],
      },
      {
        h: 'Fibra',
        formula: 'mínimo 14 g / 1000 kcal · máximo 20% do total de carboidrato do dia',
        body: [
          'Importa para saúde intestinal e absorção. Fibra em excesso atrapalha absorção de nutrientes e incha. Conte a fibra como carboidrato e fique entre o mínimo e o máximo.',
        ],
      },
    ],
    appTie: 'No Perfil você define proteína (g/lb), gordura (%) e refeições por dia; o app deriva os gramas e avisa se algum macro fura o piso mínimo. Na aba Comida você monta as refeições com alimentos salvos, vê o quanto falta de cada macro no dia e uma margem de P/C/G por refeição.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'nivel-3',
    title: 'Nível 3 — Micronutrientes e água',
    tagline: 'Vitaminas, minerais, frutas/vegetais e hidratação.',
    sections: [
      {
        h: 'Mentalidade inclusiva',
        body: [
          'Comendo menos, você come menos micronutrientes. Dietas "limpas" restritas costumam ser **deficientes**. Inclua variedade (2–3 opções de proteína, vegetal, fruta, gordura e carbo) em vez de excluir alimentos.',
        ],
      },
      {
        h: 'Deficiências mais comuns em quem faz dieta',
        list: [
          'Vitamina D, cálcio, zinco, magnésio, ferro.',
          'Zinco baixo → tireoide/gasto energético caem. Ferro baixo → força cai (comum em mulheres). Cálcio baixo → saúde óssea.',
          'Manter carne vermelha magra + laticínios + sol regular cobre a maior parte disso.',
        ],
      },
      {
        h: 'Frutas e vegetais fibrosos',
        formula: '1 porção / 1000 kcal no ganho · 1 porção / 500 kcal no corte (arredonde pra cima) · mínimo 2',
        body: [
          '≥5 porções/dia associam-se a menor mortalidade. No corte saciam; no ganho, se atrapalharem bater calorias, pode reduzir. 1 porção ≈ 1 xícara ou 1 fruta média.',
        ],
      },
      {
        h: 'Água',
        formula: '≈ 1 L para cada 23 kg de peso  (ou 2/3 do peso em lb, em onças)',
        body: [
          'Conta tudo menos álcool (café conta a favor). Método melhor: beber por sede e checar a **cor da urina** — 1 a 3 = bem hidratado; 7+ = beba. Desidratação de 2–3% do peso já prejudica desempenho.',
        ],
      },
    ],
    appTie: 'O Resumo mostra a meta de água, a faixa de fibra e o número de porções de fruta/vegetal calculados a partir da sua meta calórica.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'nivel-4',
    title: 'Nível 4 — Tempo e frequência',
    tagline: 'Diet breaks, refeeds, número de refeições, nutrição peri-treino.',
    sections: [
      {
        h: 'Diet breaks (pausas na dieta)',
        body: [
          'A cada 4–8 semanas de corte, 1–2 semanas em **manutenção** (subir 300–600 kcal nos dias de déficit, cortar o cardio pela metade). Não atrasa a perda de gordura e reduz as adaptações metabólicas e o desgaste mental.',
          'Também servem como resposta a um estol de 2–3 semanas — às vezes a perda volta sozinha depois da pausa.',
        ],
      },
      {
        h: 'Refeeds',
        list: [
          '**1 dia/semana** em manutenção (subindo carbo): bom no começo do corte / quando mais gordo. Para manter o déficit semanal, tire um pouco mais dos outros 6 dias.',
          '**2 dias seguidos/semana:** conforme fica magro (abaixo de ~12% homem / ~20% mulher) — há dado mostrando melhor preservação de massa magra e de gasto energético que o déficit contínuo.',
          'Tempo fora do déficit importa, não só a quantidade de calorias.',
        ],
      },
      {
        h: 'Frequência de refeições',
        body: [
          '**3 a 6 refeições/dia** para a maioria. Menos de 3 ou mais de 6 tende a piorar controle de fome. Se você já vai bem com 2 (jejum intermitente) ou 7, tudo bem — o que conta é **estrutura consistente**.',
          'Quem faz ganho volumoso (5000 kcal) pode precisar de 6–7 refeições só para caber a comida.',
        ],
      },
      {
        h: 'Nutrição peri-treino',
        list: [
          'Base do dia domina; timing tem efeito pequeno se você já come proteína suficiente em 3–6 refeições.',
          '**Proteína:** ~0,18–0,23 g/lb (0,4–0,5 g/kg) 1–2 h antes e 1–2 h depois de treinar.',
          '**Carbo (no corte):** 10–20% do carbo do dia na refeição pré-treino, em forma de fácil digestão; +10–15% da gordura se você tem hipoglicemia reativa.',
          'Carbo pós-treino para repor glicogênio raramente é problema — reposição acontece em 24 h.',
          'Treino contínuo e pesado de 2 h+: aí sim bebida com 8–15 g de proteína + 30–60 g de carbo intra-treino.',
        ],
      },
    ],
    appTie: 'Esta parte é mais manual. A aba Força traz o cronômetro de descanso entre séries e o histórico — o desempenho no treino é o melhor sinal de que timing e refeeds estão certos.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'nivel-5',
    title: 'Nível 5 — Suplementação',
    tagline: 'O nível menos importante. A maioria só esvazia a carteira.',
    sections: [
      {
        h: 'Antes de comprar: qualidade',
        list: [
          'Prefira marcas com selo de teste independente (o rótulo bate com o conteúdo).',
          'Evite "blends proprietários" (não dizem a dose de cada ingrediente).',
          'Faça exame de sangue antes de suplementar vitaminas/minerais — para não corrigir o que não está faltando nem mascarar deficiência.',
        ],
      },
      {
        h: 'Lista A — têm base de evidência',
        list: [
          '**Multivitamínico:** um simples "one-a-day", sem megadose. Rede de segurança **no corte**; no ganho geralmente não é preciso.',
          '**Ômega-3 (EPA+DHA):** 1–2 g/dia combinados (pode exigir 3–6 g de óleo de peixe). Não megadose. Benefícios de saúde (pressão, humor, cardio); efeito em hipertrofia é fraco/misto.',
          '**Vitamina D3:** 20–80 UI/kg/dia — **só** se um exame mostrar 25(OH)D abaixo de 75 nmol/L (30 ng/mL). Corrigida a deficiência, mais não é melhor.',
          '**Creatina monoidratada:** 0,04 g/kg/dia (~3–5 g), qualquer horário, todo dia. Timing e "saturação" só afetam as 2 primeiras semanas. Saturar ajuda se você começa durante o corte (menos ruído na balança).',
          '**Cafeína:** dois usos, que NÃO se somam. Para o cansaço: 1–3 mg/kg/dia distribuídos (resiste à tolerância). Para desempenho: 4–6 mg/kg em dose única ~60 min antes do treino — comece pela metade e mantenha o resto do dia perto de 1 mg/kg, no máx. ~2×/semana, senão a tolerância anula o efeito. Teto geral de segurança: ~400 mg/dia. Reduza no fim do dia.',
        ],
      },
      {
        h: 'Lista B — condicional / evidência mista',
        list: [
          '**Beta-alanina:** 3–4 g/dia — só se você faz muito volume de reps altas (15–20+), CrossFit, ou esforços contínuos de 60 s+. Inútil para força pura.',
          '**Citrulina-malato:** 8 g ~60 min pré-treino. Evidência dividida; sem indício de prejuízo.',
        ],
      },
      {
        h: 'Lista C — sem base (não valem)',
        body: [
          'Glutamina, BCAA (se sua proteína já é alta, são redundantes), HMB. Se um suplemento não está em nenhuma lista, trate-o como Lista C.',
        ],
      },
    ],
    appTie: 'A tela Suplementos calcula creatina, cafeína (diária e pré-treino) e vitamina D3 pelo seu peso, e repete o aviso de que a D3 depende de exame.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'ajustes',
    title: 'Fazendo ajustes e medindo progresso',
    tagline: 'Balança, fotos, desempenho e fita métrica — e quando mexer na dieta.',
    sections: [
      {
        h: 'Por que % de gordura engana',
        body: [
          'DXA, bioimpedância, Bod Pod têm erro grande no nível individual (um "10%" pode ser 8–12% no melhor caso). Fazer scan com frequência leva a ajustes desnecessários. O que é confiável e barato: balança + fita + fotos + desempenho, acompanhados ao longo do tempo.',
        ],
      },
      {
        h: 'Usando a balança',
        list: [
          'Pese 3+ vezes/semana (se só 3, inclua 1 dia de fim de semana), sempre nas mesmas condições. Faça a média da semana.',
          'Ignore a **1ª semana** de uma fase nova (água/glicogênio/volume de comida distorcem).',
          'Compare 2–3 semanas de médias antes de mudar qualquer coisa (mulheres: +1 semana pelo ciclo).',
        ],
      },
      {
        h: 'Ajustes',
        list: [
          '**Direção errada na 1ª semana** (não subiu no ganho / não desceu no corte): você errou o multiplicador — recalcule com ±0,2.',
          '**Estol depois de ir bem:** mude 100–200 kcal (100–150 se come <3000 kcal; 150–200 se >3000), tirando/pondo em carbo e/ou gordura. Arredonde a 5 g; mudanças <5 g não importam.',
          'Alternativa: +40 min de cardio leve ou +20 min de HIIT/semana — mas respeitando o teto de metade do tempo de musculação.',
        ],
      },
      {
        h: 'Fotos e desempenho',
        body: [
          'Fotos só informam bem quando você já está razoavelmente magro; tire sempre na mesma luz (fonte de luz à sua frente). No ganho, mudança visual leva meses.',
          'Desempenho na academia é um dos melhores sinais indiretos de músculo. No corte inicial dá pra ganhar força; bem fundo no corte, manter já é vitória.',
        ],
      },
      {
        h: 'Medidas de circunferência (9 pontos)',
        list: [
          '1×/semana, mesmo dia, ao mm (0,1 cm), junto da média de peso. Meça você mesmo, sempre do mesmo jeito (tensione o local, ponto mais grosso; barriga: como se fosse levar um soco).',
          'Queda de 2–2,5 cm em **pelo menos 2 pontos** da barriga ≈ ~1,8 kg de gordura a menos (heurística).',
          'Membros/peito **mantendo** enquanto a barriga cai = quase certamente ganho de músculo.',
          'Peso subiu de repente mas a barriga não mudou? É água/glicogênio, não gordura.',
        ],
      },
    ],
    appTie: 'As telas de Medidas (9 pontos + histórico) e de Gráficos (peso, cintura) existem para esse acompanhamento; o Resumo já traduz a variação semanal em "abaixo / na / acima da meta".',
  },

  // -----------------------------------------------------------------------
  {
    id: 'periodizacao',
    title: 'Recuperação e periodização de longo prazo',
    tagline: 'O que fazer quando uma fase termina, e como encadear os anos.',
    sections: [
      {
        h: 'Terminou um corte (não-competidor)',
        body: [
          'Se magro de forma **insustentável** (fome e obsessão por comida meses depois), o problema é: a abordagem da dieta, a relação com comida, ou um nível de gordura baixo demais para você. A solução simples: volte à manutenção (95–100% da manutenção anterior; se a dieta foi longa, corte o cardio pela metade e suba 200–400 kcal/dia, ajustando ao longo de semanas).',
        ],
      },
      {
        h: 'Reverse diet × recovery diet',
        body: [
          'Só relevante para competidores/modelos que ficaram magros demais de propósito. O "reverse diet" (subir calorias devagar tentando não ganhar peso) costuma prolongar o déficit e falha em >90% dos casos. O "recovery diet" tira você do déficit **na hora** e mira ganho de peso controlado (5–10% acima do peso de palco em 4–8 semanas), porque é assim que se revertem as adaptações.',
        ],
      },
      {
        h: 'Mini-corte',
        list: [
          'Corte curto e mais agressivo (~1%/semana) para "limpar" gordura no offseason.',
          'Regra 4:1 — para cada ~4 meses em ganho, no máximo ~1 mês de mini-corte.',
          'Num ganho, deixe a %gordura subir ~3–5 pontos antes de fazer o mini-corte, e repita o ciclo.',
        ],
      },
      {
        h: 'Limites para começar um ganho',
        body: [
          'Máx ~15% de gordura (homem) / ~23% (mulher). Acima disso, faça um corte antes — não por "resistência anabólica", e sim para ter pista de decolagem de vários meses antes da próxima dieta.',
        ],
      },
    ],
    appTie: 'Troque a fase (Ganho/Corte) no Perfil quando mudar de ciclo — o app recalcula metas e inverte a lógica do status semanal automaticamente.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'comportamento',
    title: 'Comportamento e estilo de vida',
    tagline: 'Como seguir o plano de verdade, pelo resto da vida.',
    sections: [
      {
        h: 'Sistema de 3 níveis (quando precisa rastrear)',
        list: [
          '**Bom:** bateu a meta de calorias ±100 kcal. (Quando não dá pra rastrear macros.)',
          '**Melhor:** bateu proteína (dentro da faixa) **e** calorias ±100 kcal. (Offseason, recuperação, cortes não-competitivos, mini-cortes, diet breaks.)',
          '**Ótimo:** bateu os 3 macros ±5–10 g. (Só prep de palco ou corte de categoria.)',
          'Se seu objetivo exige "Ótimo", "Melhor" e "Bom" continuam sendo dias aceitáveis quando a vida acontece.',
        ],
      },
      {
        h: 'Borrowing (emprestar entre dias)',
        body: [
          'Fora de dieta agressiva, tire o "dia de 24 h" do pedestal: pode mover até **20%** das calorias/macros de um dia para outro(s), ou simplesmente mirar a **média semanal** de calorias. Estrutura consistente ainda é o ideal — borrowing é a válvula de escape.',
        ],
      },
      {
        h: 'Comer fora',
        list: [
          'Prep de palco: no máximo ~1×/mês, pratos simples (carne magra + vegetais no vapor), estimando por cima.',
          'Corte não-competitivo: 1–2×/semana, escolhendo opções de baixa caloria e superestimando.',
          'Fora de corte: tudo bem — só lembre que porções e óleo do chef fogem do seu controle.',
        ],
      },
      {
        h: 'Álcool',
        body: [
          '7 kcal/g, quase sempre junto com carboidrato. Não há "macro de álcool": se bebeu, você cai automaticamente para o nível "Melhor" ou "Bom". Limite ~15% das calorias do dia (1–3 doses), 1–2×/semana, e nunca a ponto de sentir no dia seguinte.',
        ],
      },
      {
        h: 'Reaprender a ouvir o corpo',
        body: [
          'Depois de anos "pelos números", o objetivo é automatizar os níveis 2–5 como hábito e deixar a **fome e a saciedade** guiarem o total de calorias na maior parte da carreira. Rastreio externo só volta a dominar quando a fome trabalha contra a meta (corte de categoria, palco).',
          'Truque prático: hábitos-âncora que você bate todo dia sem pensar — ex.: um shake com 3 frutas + 20 g de proteína + água. O resto você regula pela fome.',
        ],
      },
    ],
    appTie: 'Registrar peso rápido de manhã e olhar o status semanal é o "mínimo de feedback externo" que este app foi feito para dar — sem exigir que você conte macros todo dia.',
  },

  // -----------------------------------------------------------------------
  {
    id: 'pico',
    title: 'Pico para competição',
    tagline: 'Capítulo avançado — só se você for competir.',
    sections: [
      {
        h: 'Ideia geral',
        body: [
          '95–99% da aparência no palco vem dos anos de treino e da dieta longa que antecede o show. A "peak week" mexe pouco: carb loading, manipulação de água e eletrólitos, treino depletivo de glicogênio, corte/redução de cardio e de trabalho de perna.',
        ],
      },
      {
        h: 'Fazer peso (esportes de categoria)',
        body: [
          'Só corte categoria se estiver ~6–8% acima do limite no offseason e dietar até <5% acima antes de cada competição. Métodos agudos (desidratação, esvaziar o intestino) têm risco de desempenho — do menor para o maior risco — e exigem reidratação/realimentação planejadas após a pesagem.',
        ],
        warn: true,
      },
      {
        h: 'Para quem não compete',
        body: [
          'Pode pular este capítulo inteiro. Nada aqui se aplica a quem treina por saúde, estética sustentável ou força recreativa. Para os detalhes (back/front load, templates de peak week, cutting agudo), consulte o livro diretamente.',
        ],
      },
    ],
    appTie: null,
  },
];

export function chapterById(id) {
  return CHAPTERS.find((c) => c.id === id) || null;
}
