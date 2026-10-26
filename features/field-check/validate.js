import { parseList } from '../../js/lib/list.js';

export function validateName(name) {
  const n = name.trim();
  if (!n) return [];
  const errors = [];
  if (n.length > 64) errors.push({ code: 'too-long', message: `64자 이하로 줄여주세요 (지금 ${n.length}자)` });
  if (/[A-Z]/.test(n)) errors.push({ code: 'uppercase', message: '대문자는 쓸 수 없어요. 소문자로 바꿔주세요' });
  if (/[^a-zA-Z0-9-]/.test(n)) errors.push({ code: 'invalid-char', message: '소문자 영어, 숫자, 하이픈(-)만 쓸 수 있어요' });
  if (n.startsWith('-') || n.endsWith('-')) errors.push({ code: 'edge-hyphen', message: '하이픈(-)으로 시작하거나 끝날 수 없어요' });
  if (n.includes('--')) errors.push({ code: 'double-hyphen', message: '하이픈을 두 개 연속(--)으로 쓸 수 없어요' });
  return errors;
}

export const invalidBashPatterns = (text) => parseList(text).filter((p) => !/^Bash\(\s*\S.*\)$/.test(p));

export function getBlocking(form) {
  const blocking = [];
  if (!form.idea.trim()) blocking.push({ field: 'idea', message: '아이디어를 먼저 적어주세요' });
  for (const e of validateName(form.skillName)) blocking.push({ field: 'skillName', message: e.message });
  for (const p of invalidBashPatterns(form.bashPatterns)) {
    blocking.push({ field: 'bashPatterns', message: `"${p}" → Bash(명령 *) 형태로 적어주세요` });
  }
  return blocking;
}
