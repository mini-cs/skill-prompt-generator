export const features = [
  { name: 'field-check', load: () => import('./field-check/index.js'), css: true },
  { name: 'char-counter', load: () => import('./char-counter/index.js'), css: true },
  { name: 'prompt-builder', load: () => import('./prompt-builder/index.js'), css: true },
];
