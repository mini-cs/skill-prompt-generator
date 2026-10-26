import { buildPrompt } from './build.js';

export function init({ store, root, rules }) {
  const preview = root.getElementById('preview');
  // 디바운스 없이 입력마다 바로 갱신
  store.subscribe(({ form }) => {
    const prompt = buildPrompt(form, rules);
    store.set({ status: { prompt } });
    preview.textContent = prompt;
  }, (s) => s.form);
}
