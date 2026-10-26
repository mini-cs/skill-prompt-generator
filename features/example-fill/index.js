import { pickUndoForm } from './undo.js';

export function init({ store, root, example, defaults }) {
  // 확인창 대신 이전 입력을 보관해 [되돌리기]로 복원한다
  const replace = (form, message, ui) => {
    const { form: current, status } = store.get();
    const undoForm = pickUndoForm(current, form, status.toast);
    store.set({ form, ...ui, status: { toast: { id: performance.now(), message, undoForm } } });
  };

  root.querySelector('[data-action="fill-example"]').addEventListener('click', () => {
    replace(structuredClone(example), '예시로 채웠어요', { ui: { openSections: { basic: true, behavior: true, examples: true } } });
  });
  root.querySelector('[data-action="reset"]').addEventListener('click', () => {
    replace(defaults.createInitialState().form, '초기화했어요');
  });
}
