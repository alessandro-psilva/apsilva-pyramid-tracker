# apsilva-pyramid-tracker 🌴

Site pessoal de acompanhamento de **dieta e treino**, seguindo o método do livro
*The Muscle & Strength Pyramid: Nutrition* (Eric Helms, v2.0).

- **Frontend:** HTML + CSS + JavaScript puro (ES modules, sem build step).
- **Backend:** Firebase Authentication (email/senha) + Cloud Firestore.
- **Hospedagem:** GitHub Pages servindo a pasta [`/docs`](docs).

### Custo: R$ 0

Tudo roda no plano gratuito, **sem cartão de crédito**:

| Serviço | Plano | Limite grátis | Uso deste app (1 pessoa) |
|---|---|---|---|
| GitHub Pages | grátis (repo público) | — | hospedagem estática |
| Firebase Auth | Spark (grátis) | ilimitado p/ email/senha | 1 usuário |
| Cloud Firestore | Spark (grátis) | 1 GiB, 50k leituras/dia, 20k escritas/dia | ~dezenas de leituras/dia |
| Chart.js | CDN jsDelivr | — | 1 arquivo |

**Não ative o plano Blaze.** O plano Spark é suficiente e nunca gera cobrança.
Nada aqui usa Cloud Functions, Storage pago ou hosting do Firebase.

**Mobile-first / PWA:** dá para "Adicionar à tela inicial". A tela de registrar o
peso do dia abre com o campo já focado e salva em poucos toques. Barra superior
com título e botão voltar, barra inferior de abas, botão flutuante de peso e
transições suaves entre telas.

**Ajuda embutida:** cada campo do Perfil e das Medidas tem um "?" que explica o
que é e como preencher; telas ligam direto para o capítulo relevante do Guia.

---

## Telas

| Rota | Tela |
|---|---|
| `#/dashboard` | Resumo: peso, fase, metas do dia, água/fibra, suplementos, status semanal, 3 gráficos |
| `#/guia` | Guia de consulta com um capítulo por nível da Pirâmide + ajustes, periodização e comportamento (resumo do livro em português) |
| `#/peso` | Registrar peso de hoje (acesso rápido pelo botão flutuante) |
| `#/forca` | Registro de força + histórico por exercício com indicação de progressão |
| `#/medidas` | 9 pontos de medida corporal (com instruções de como medir) + histórico |
| `#/graficos` | Versão ampliada dos gráficos, com seletor de 4/8/12 semanas |
| `#/suplementos` | Doses da Lista A calculadas pelo peso (somente leitura) |
| `#/perfil` | Editar peso, altura, nível, atividade, fase e macros; prévia das metas ao vivo; "?" em cada campo |

---

## Modelo de dados (Firestore)

```
users/{uid}/meta/profile                 (documento único de perfil)
users/{uid}/dailyWeighIns/{YYYY-MM-DD}    (pesagem diária, id = data)
users/{uid}/strengthLogs/{autoId}
users/{uid}/measurements/{autoId}
```

O conteúdo do Guia é estático (`docs/js/guide-content.js`) — não usa o Firestore.

> O perfil fica em `meta/profile` (e não em `users/{uid}`) para ser coberto pela
> regra recursiva `match /users/{uid}/{document=**}`.

---

## Lógica de negócio

Toda a matemática está isolada em [`docs/js/calc.js`](docs/js/calc.js) como funções
puras, implementando exatamente:

1. **Manutenção:** `peso × 22 × média(multiplicador de atividade)`.
2. **Ganho:** superávit fixo por nível (+300 / +200 / +100 kcal); taxa alvo em %/mês.
3. **Corte:** `déficit = -round(0,75% × peso × 7700 / 7)` — não depende do nível.
4. **Meta diária:** manutenção + superávit/déficit.
5. **Macros:** proteína por g/lb → gordura por % das calorias → carboidrato no resto.
   Pisos mínimos de gordura (0,25 g/lb) e carbo (0,5 g/lb) geram aviso.
6. **Hidratação/fibra:** água `peso/23` L; fibra `14 g / 1000 kcal` até `20% do carbo`.
7. **Suplementos (Lista A):** creatina `0,04 g/kg`; cafeína `1–3 mg/kg`/dia e
   `4–6 mg/kg` pré-treino; ômega-3 fixo 1–2 g; vitamina D3 `20–80 UI/kg` **só com
   exame confirmando deficiência**.
8. **Pesagem → média semanal:** semana de segunda a domingo, média dos dias
   preenchidos (mín. recomendado 3/semana).
9. **Status semanal:** compara a média da última semana com a anterior. **A lógica
   inverte entre Ganho e Corte** (ver `weeklyStatus` em `calc.js`).

### Testes

```bash
node --test
```

Cobrem as fórmulas principais e a inversão da lógica de status por fase.
(O app em si não precisa de Node — é só HTML/JS estático.)

---

## Setup

### 1. Criar o projeto no Firebase

1. [Firebase Console](https://console.firebase.google.com/) → **Adicionar projeto**.
2. **Build → Authentication → Get started →** aba *Sign-in method* → ative
   **Email/senha**.
3. **Build → Firestore Database → Criar banco de dados** (modo produção, região à
   sua escolha).

### 2. Configurar as credenciais do client

1. Firebase Console → ⚙️ **Configurações do projeto** → seção *Seus apps* →
   ícone **Web (`</>`)** → registre o app.
2. Copie o objeto `firebaseConfig` e cole em
   [`docs/js/firebase-config.js`](docs/js/firebase-config.js).

   > Estas chaves são **públicas por design** (ficam visíveis no navegador). A
   > segurança real vem das Firestore Rules. Pode commitar o arquivo.

### 3. Autorizar o domínio do GitHub Pages

Firebase Console → **Authentication → Settings → Authorized domains → Add domain**
→ `SEU_USUARIO.github.io`.

### 4. Publicar as Firestore Rules

As regras estão em [`firestore.rules`](firestore.rules). Com a
[Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # selecione o projeto
firebase deploy --only firestore:rules
```

Ou cole o conteúdo de `firestore.rules` manualmente em
**Firestore Database → Regras → Publicar**.

### 5. Configurar o GitHub Pages

Repositório → **Settings → Pages**:
- **Source:** *Deploy from a branch*
- **Branch:** `main` — pasta **`/docs`** → *Save*

Em ~1 min o site fica em `https://SEU_USUARIO.github.io/apsilva-pyramid-tracker/`.

### 6. Criar o seu usuário

Como é um sistema pessoal (sem cadastro público):

Firebase Console → **Authentication → Users → Add user** → informe email e senha.
Use esse email/senha na tela de login.

### 7. Primeiro acesso

1. Abra o site, faça login.
2. O dashboard vai pedir para **preencher o perfil** — faça isso primeiro.
3. Volte ao dashboard: metas, suplementos e gráficos já aparecem.
4. No celular: menu do navegador → *Adicionar à tela inicial*.

---

## Rodar localmente

Precisa de um servidor estático (os ES modules não carregam via `file://`):

```bash
npx serve docs
```

Depois abra `http://localhost:3000`. O `firebase-config.js` precisa estar
preenchido e o domínio `localhost` já vem autorizado no Firebase por padrão.

---

## Estrutura

```
docs/
  index.html            shell + carrega Chart.js (CDN) e o app
  manifest.webmanifest  PWA
  sw.js                 service worker (cache só do shell estático)
  css/styles.css        paleta Palmeiras, mobile-first
  icons/icon.svg        ícone (substitua por PNGs se quiser)
  js/
    firebase-config.js  <-- COLE SUAS CREDENCIAIS AQUI
    firebase.js         init do SDK
    calc.js             lógica de negócio (funções puras)
    store.js            CRUD no Firestore
    charts.js           wrappers do Chart.js
    ui.js               helpers de DOM / toast / campos com ajuda "?"
    guide-content.js    texto do Guia (resumo do livro, estático)
    app.js              bootstrap, gate de auth, roteador por hash, app bar
    views/              uma tela por arquivo (inclui guide.js)
firestore.rules
firebase.json
test/calc.test.mjs
```

## Notas

- **Chart.js** é carregado da CDN jsDelivr. Para 100% offline, baixe
  `chart.umd.min.js` para `docs/js/vendor/` e ajuste o `<script>` em `index.html`
  (e a lista `SHELL` em `sw.js`).
- O ícone é um SVG. Se algum navegador reclamar, gere `icon-192.png` /
  `icon-512.png` e atualize `manifest.webmanifest` e `index.html`.
- Paleta: verde `#006437`, verde escuro `#004225`, verde claro `#E8F5E9`,
  cinza `#6B6B6B`, âmbar `#B7791F` (nunca vermelho puro).
