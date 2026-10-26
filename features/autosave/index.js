import { restoreForm, STORAGE_KEY } from './restore.js';

// 저장소를 쓸 수 없으면(사생활 보호 모드, 차단 등) 조용히 건너뛴다
export function init({ store, root }) {
  const status = root.querySelector('[data-slot="save-status"]');

  try {
    const form = restoreForm(localStorage.getItem(STORAGE_KEY));
    if (form) store.set({ form });
  } catch {}

  let timer;
  store.subscribe(({ form }) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch {
        return;
      }
      store.set({ status: { savedAt: Date.now() } });
      status.textContent = '자동 저장됨';
    }, 300);
  }, (s) => s.form);
}
