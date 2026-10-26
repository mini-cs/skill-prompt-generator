import { getBlocking } from './validate.js';

// 아이디어 필수 메시지는 칸 아래가 아니라 복사 영역(copy 기능)에서 보여준다
const SHOWN = ['skillName', 'bashPatterns'];

export function init({ store, root }) {
  store.subscribe(({ form }) => {
    const blocking = getBlocking(form);
    store.set({ status: { blocking } });
    for (const key of SHOWN) {
      const messages = blocking.filter((b) => b.field === key).map((b) => b.message);
      const error = root.getElementById(`error-${key}`);
      const input = root.querySelector(`[name="${key}"]`);
      error.textContent = messages.join('\n');
      error.hidden = messages.length === 0;
      if (messages.length) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', error.id);
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
  }, (s) => s.form);
}
