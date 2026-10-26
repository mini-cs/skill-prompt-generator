export function init({ store, root, rules }) {
  const counter = root.querySelector('[data-counter-for="triggers"]');
  store.subscribe(({ form }) => {
    const n = form.triggers.length;
    const limit = rules.DESCRIPTION_LIMIT[form.platform];
    counter.textContent = `${n.toLocaleString('ko-KR')} / ${limit.toLocaleString('ko-KR')}자 (description 기준 참고값)`;
    counter.classList.toggle('is-over', n > limit);
  }, (s) => s.form);
}
