import { isActive } from '../../js/data/fields.js';
import { parseList } from '../../js/lib/list.js';

export function init({ store, root }) {
  const map = root.querySelector('[data-arg-map]');
  store.subscribe(({ form }) => {
    const names = isActive('argNames', form) ? parseList(form.argNames) : [];
    map.textContent = names.map((n, i) => `$${i} = ${n}`).join(', ');
    map.hidden = names.length === 0;
  }, (s) => s.form);
}
