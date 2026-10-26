import { DEFAULT_FORM } from '../../js/data/defaults.js';
import { CHOICES } from '../../js/data/fields.js';

export const STORAGE_KEY = 'skill-prompt-generator:form';

// 저장 데이터는 옛 버전이거나 손으로 고쳐졌을 수 있으니 키마다 검사해 기본값과 합친다
export function restoreForm(raw) {
  if (raw === null) return null;
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null;

  const form = {};
  for (const [key, fallback] of Object.entries(DEFAULT_FORM)) {
    const value = saved[key];
    if (key === 'tools') form.tools = Array.isArray(value) ? value.filter((t) => CHOICES.tools.includes(t)) : [];
    else if (key in CHOICES) form[key] = CHOICES[key].includes(value) ? value : fallback;
    else form[key] = typeof value === 'string' ? value : fallback;
  }
  return form;
}
