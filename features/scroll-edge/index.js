export function init({ root }) {
  const header = root.querySelector('.app-header');
  const sentinel = root.getElementById('scroll-sentinel');
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(sentinel);
}
