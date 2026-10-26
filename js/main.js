import { createStore } from './store.js';
import { bindForm } from './bind.js';
import * as rules from './data/rules.js';
import * as defaults from './data/defaults.js';
import { EXAMPLE_FORM } from './data/example.js';
import { features } from '../features/registry.js';

document.getElementById('server-notice').hidden = true;

const store = createStore(defaults.createInitialState());
bindForm(document.getElementById('skill-form'), store);

const ctx = { store, root: document, rules, defaults, example: EXAMPLE_FORM };

for (const feature of features) {
  // 한 기능이 실패해도 나머지는 동작해야 한다
  try {
    if (feature.css) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL(`../features/${feature.name}/style.css`, import.meta.url).href;
      document.head.append(link);
    }
    const { init } = await feature.load();
    init(ctx);
  } catch (err) {
    console.error(`[${feature.name}]`, err);
  }
}

store.emit();
