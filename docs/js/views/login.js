// views/login.js — tela única de acesso (Firebase Auth: email/senha).
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { auth } from '../firebase.js';
import { h, toast, withBusy } from '../ui.js';

const MESSAGES = {
  'auth/invalid-email': 'Email inválido.',
  'auth/invalid-credential': 'Email ou senha incorretos.',
  'auth/wrong-password': 'Email ou senha incorretos.',
  'auth/user-not-found': 'Usuário não encontrado. Crie-o no Firebase Console.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco.',
  'auth/network-request-failed': 'Sem conexão.',
};

export async function render() {
  const email = h('input', {
    type: 'email',
    inputmode: 'email',
    autocomplete: 'username',
    placeholder: 'email',
    required: true,
  });
  const pass = h('input', {
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'senha',
    required: true,
  });

  const form = h(
    'form',
    {
      class: 'auth-card',
      onsubmit: async (ev) => {
        ev.preventDefault();
        const btn = ev.submitter || ev.target.querySelector('[type=submit]');
        await withBusy(btn, async () => {
          try {
            await signInWithEmailAndPassword(auth, email.value.trim(), pass.value);
          } catch (e) {
            toast(MESSAGES[e.code] || 'Não foi possível entrar.', 'warn');
          }
        });
      },
    },
    [
      h('div', { class: 'auth-card__brand' }, [
        h('h1', { text: 'Pyramid Tracker' }),
        h('p', { class: 'muted', text: 'Dieta e treino — método Eric Helms' }),
      ]),
      h('label', { class: 'field' }, [
        h('span', { class: 'field__label', text: 'Email' }),
        email,
      ]),
      h('label', { class: 'field' }, [
        h('span', { class: 'field__label', text: 'Senha' }),
        pass,
      ]),
      h('button', { class: 'btn btn--block', type: 'submit' }, 'Entrar'),
      h('p', {
        class: 'muted auth-card__hint',
        text: 'Sistema pessoal. O usuário é criado manualmente no Firebase Console.',
      }),
    ],
  );

  return form;
}
