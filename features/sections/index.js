import { countFilled } from './count.js';

export function init({ store, root }) {
  const sections = [...root.querySelectorAll('section[data-section]')].map((el) => ({
    id: el.dataset.section,
    toggle: el.querySelector('[data-section-toggle]'),
    body: el.querySelector('[data-section-body]'),
    count: el.querySelector('[data-section-count]'),
  }));

  for (const { id, toggle, body } of sections) {
    toggle.addEventListener('click', () => {
      const open = store.get().ui.openSections;
      store.set({ ui: { openSections: { ...open, [id]: !open[id] } } });
    });
    // 접는 도중 다시 펼쳤다면 state가 open이라 숨기지 않는다
    body.addEventListener('transitionend', (e) => {
      if (e.target === body && body.dataset.state === 'closed') body.hidden = true;
    });
  }

  store.subscribe(({ ui }) => {
    for (const { id, toggle, body } of sections) {
      const open = ui.openSections[id];
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        if (body.hidden) {
          body.hidden = false;
          void body.offsetHeight; // 닫힌 모습에서 전환이 시작되도록 강제 리플로우
        }
        body.dataset.state = 'open';
      } else {
        body.dataset.state = 'closed';
      }
    }
  }, (s) => s.ui.openSections);

  const renderCounts = ({ form, ui }) => {
    const counts = countFilled(form);
    for (const { id, count } of sections) {
      const n = counts[id];
      count.textContent = !ui.openSections[id] && n > 0 ? `${n}개 입력됨` : '';
    }
  };
  store.subscribe(renderCounts, (s) => s.form);
  store.subscribe(renderCounts, (s) => s.ui.openSections);
}
