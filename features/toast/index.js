function dismiss(el) {
  el.dataset.state = 'closed';
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

export function init({ store, root }) {
  const region = root.getElementById('toast-region');
  let current = null;

  store.subscribe(({ status: { toast } }) => {
    if (!toast) {
      if (current) dismiss(current);
      current = null;
      return;
    }
    // 새 알림은 이전 알림을 대체한다
    current?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.dataset.state = 'closed';
    const message = document.createElement('span');
    message.textContent = toast.message;
    el.append(message);
    if (toast.undoForm) {
      const undo = document.createElement('button');
      undo.type = 'button';
      undo.className = 'btn btn-secondary';
      undo.textContent = '되돌리기';
      undo.addEventListener('click', () => store.set({ form: toast.undoForm, status: { toast: null } }));
      el.append(undo);
    }
    region.append(el);
    void el.offsetHeight; // 닫힌 모습에서 등장 전환이 시작되도록
    el.dataset.state = 'open';
    current = el;

    setTimeout(() => {
      if (store.get().status.toast?.id === toast.id) store.set({ status: { toast: null } });
    }, toast.undoForm ? 5000 : 3000);
  }, (s) => s.status.toast);
}
