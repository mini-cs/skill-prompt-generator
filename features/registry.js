export const features = [
  { name: 'field-check', load: () => import('./field-check/index.js'), css: true },
  { name: 'platform-switch', load: () => import('./platform-switch/index.js'), css: true },
  { name: 'arg-map', load: () => import('./arg-map/index.js'), css: false },
  { name: 'char-counter', load: () => import('./char-counter/index.js'), css: true },
  { name: 'prompt-builder', load: () => import('./prompt-builder/index.js'), css: true },
  { name: 'sections', load: () => import('./sections/index.js'), css: true },
  { name: 'scroll-edge', load: () => import('./scroll-edge/index.js'), css: true },
  { name: 'toast', load: () => import('./toast/index.js'), css: true },
  { name: 'example-fill', load: () => import('./example-fill/index.js'), css: false },
  { name: 'copy', load: () => import('./copy/index.js'), css: true },
  { name: 'autosave', load: () => import('./autosave/index.js'), css: false },
];
