import { isActive, disabledReason } from '../../js/data/fields.js';

// 비활성 입력은 이벤트가 없으므로 저장소의 값은 그대로 보관된다
export function init({ store, root }) {
  const fields = [...root.querySelectorAll('[data-field]')];
  store.subscribe(({ form }) => {
    for (const field of fields) {
      const key = field.dataset.field;
      const active = isActive(key, form);
      for (const input of field.querySelectorAll('input, textarea')) input.disabled = !active;
      field.classList.toggle('is-disabled', !active);
      const reason = field.querySelector('[data-disabled-reason]');
      reason.textContent = disabledReason(key, form) ?? '';
      reason.hidden = active;
    }
  }, (s) => s.form);
}
