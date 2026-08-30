// ui.js — helpers minúsculos de DOM e feedback visual.

export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer = null;
export function toast(message, type = 'ok') {
  let box = $('#toast');
  if (!box) {
    box = h('div', { id: 'toast' });
    document.body.append(box);
  }
  box.className = `toast toast--${type}`;
  box.textContent = message;
  box.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('is-visible'), 2600);
}

export function emptyState(message, icon = '📭') {
  return h('div', { class: 'empty' }, [
    h('div', { class: 'empty__icon', text: icon }),
    h('p', { text: message }),
  ]);
}

export function card(title, ...content) {
  return h('section', { class: 'card' }, [
    title && h('h2', { class: 'card__title', text: title }),
    ...content,
  ]);
}

export function fieldNumber(name, label, value, opts = {}) {
  const input = h('input', {
    id: `f-${name}`,
    name,
    type: 'number',
    inputmode: opts.integer ? 'numeric' : 'decimal',
    step: opts.step || (opts.integer ? '1' : 'any'),
    min: opts.min ?? '0',
    value: value ?? '',
    placeholder: opts.placeholder || '',
    required: opts.required || false,
  });
  return {
    input,
    node: h('label', { class: 'field' }, [
      h('span', { class: 'field__label', text: label }),
      input,
      opts.hint && h('span', { class: 'field__hint', text: opts.hint }),
    ]),
  };
}

export function fieldSelect(name, label, value, options) {
  const select = h(
    'select',
    { id: `f-${name}`, name },
    options.map((o) =>
      h('option', { value: o, selected: o === value ? true : null }, o),
    ),
  );
  return {
    input: select,
    node: h('label', { class: 'field' }, [
      h('span', { class: 'field__label', text: label }),
      select,
    ]),
  };
}

// Botão que mostra estado "salvando…" e volta ao normal.
export async function withBusy(btn, fn) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Salvando…';
  try {
    await fn();
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}
