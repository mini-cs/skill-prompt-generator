import { SECTIONS, CHOICES, isActive } from '../../js/data/fields.js';
import { DEFAULT_FORM } from '../../js/data/defaults.js';

function filled(key, value) {
  if (Array.isArray(value)) return value.length > 0;
  if (key in CHOICES) return value !== DEFAULT_FORM[key];
  return value.trim() !== '';
}

export function countFilled(form) {
  const out = {};
  for (const [id, keys] of Object.entries(SECTIONS)) {
    out[id] = keys.filter((k) => isActive(k, form) && filled(k, form[k])).length;
  }
  return out;
}
