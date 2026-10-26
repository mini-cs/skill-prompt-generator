const sameForm = (a, b) => Object.keys(b).every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));

// 같은 동작을 연달아 누르면(더블클릭) 두 번째 보관본이 이미 바뀐 폼이 되어 원래 입력을 잃는다.
// 되돌리기 알림이 떠 있고 폼이 그 동작의 결과 그대로면 처음 보관본을 유지한다.
export function pickUndoForm(current, target, toast) {
  if (toast?.undoForm && sameForm(current, target)) return toast.undoForm;
  return structuredClone(current);
}
