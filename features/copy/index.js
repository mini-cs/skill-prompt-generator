const LABEL = '프롬프트 복사';

export function init({ store, root }) {
  const buttons = [...root.querySelectorAll('[data-action="copy"]')];
  const hint = root.querySelector('[data-slot="copy-hint"]');
  const count = root.querySelector('[data-slot="blocking-count"]');
  const preview = root.getElementById('preview');

  store.subscribe(({ status: { blocking } }) => {
    for (const button of buttons) button.disabled = blocking.length > 0;
    hint.textContent = blocking[0]?.message ?? '';
    hint.hidden = blocking.length === 0;
    count.textContent = blocking.length ? `고칠 곳 ${blocking.length}개` : '';
  }, (s) => s.status.blocking);

  // 클립보드를 못 쓰면(보안 연결이 아니거나 권한 거부) 미리보기를 전체 선택해 직접 복사하게 한다
  const fallback = () => {
    const range = document.createRange();
    range.selectNodeContents(preview);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    store.set({ status: { toast: { id: performance.now(), message: 'Ctrl+C(맥은 ⌘+C)로 복사하세요' } } });
  };

  for (const button of buttons) {
    let timer;
    button.addEventListener('click', async () => {
      const { blocking, prompt } = store.get().status;
      if (blocking.length) return;
      try {
        await navigator.clipboard.writeText(prompt);
      } catch {
        fallback();
        return;
      }
      button.textContent = '복사됨 ✓';
      button.classList.add('is-copied');
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.textContent = LABEL;
        button.classList.remove('is-copied');
      }, 1500);
    });
  }
}
