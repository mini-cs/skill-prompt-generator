import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

const initial = () => ({
  form: { idea: '', platform: 'claude-code' },
  ui: { openSections: { basic: true } },
  status: { blocking: [], prompt: '' },
});

test('set은 최상위 키 아래 한 단계까지 합친다', () => {
  const store = createStore(initial());
  store.set({ form: { idea: 'x' } });
  assert.deepEqual(store.get().form, { idea: 'x', platform: 'claude-code' });
  assert.deepEqual(store.get().status, { blocking: [], prompt: '' });
});

test('선택한 조각이 바뀔 때만 구독자를 부른다', () => {
  const store = createStore(initial());
  const calls = [];
  store.subscribe((s) => calls.push(s.form.idea), (s) => s.form);
  store.set({ status: { prompt: 'p' } });
  store.set({ form: { idea: 'a' } });
  assert.deepEqual(calls, ['a']);
});

test('구독 해제 후에는 부르지 않는다', () => {
  const store = createStore(initial());
  let n = 0;
  const off = store.subscribe(() => { n += 1; }, (s) => s.form);
  off();
  store.set({ form: { idea: 'a' } });
  assert.equal(n, 0);
});

test('emit은 바뀐 것이 없어도 모든 구독자를 한 번씩 부른다', () => {
  const store = createStore(initial());
  let a = 0;
  let b = 0;
  store.subscribe(() => { a += 1; }, (s) => s.form);
  store.subscribe(() => { b += 1; }, (s) => s.ui);
  store.emit();
  assert.deepEqual([a, b], [1, 1]);
});

test('구독자 안에서 다른 조각을 set해도 반복 호출되지 않는다', () => {
  const store = createStore(initial());
  let formCalls = 0;
  store.subscribe((s) => {
    formCalls += 1;
    store.set({ status: { prompt: s.form.idea } });
  }, (s) => s.form);
  store.set({ form: { idea: 'b' } });
  assert.equal(formCalls, 1);
  assert.equal(store.get().status.prompt, 'b');
});
