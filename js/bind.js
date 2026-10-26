import { DEFAULT_FORM } from './data/defaults.js';

const same = (a, b) => (Array.isArray(a) ? a.join('\n') === b.join('\n') : a === b);

function read(form, name) {
  if (name === 'tools') return [...form.querySelectorAll('input[name="tools"]:checked')].map((el) => el.value);
  // 라디오 묶음은 RadioNodeList라서 .value가 체크된 값이다
  return form.elements[name].value;
}

function write(form, name, value) {
  if (name === 'tools') {
    for (const el of form.querySelectorAll('input[name="tools"]')) {
      const on = value.includes(el.value);
      if (el.checked !== on) el.checked = on;
    }
    return;
  }
  const el = form.elements[name];
  if (el.value !== value) el.value = value;
}

export function bindForm(form, store) {
  const onInput = (e) => {
    const { name } = e.target;
    if (!Object.hasOwn(DEFAULT_FORM, name)) return;
    const value = read(form, name);
    if (!same(value, store.get().form[name])) store.set({ form: { [name]: value } });
  };
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  // 한 줄 입력칸에서 Enter를 눌러도 페이지가 다시 로드되지 않게
  form.addEventListener('submit', (e) => e.preventDefault());

  // 같은 값이면 건드리지 않아야 입력 중 커서가 튀지 않는다
  store.subscribe((s) => {
    for (const name of Object.keys(DEFAULT_FORM)) write(form, name, s.form[name]);
  }, (s) => s.form);
}
