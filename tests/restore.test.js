import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreForm, STORAGE_KEY } from '../features/autosave/restore.js';
import { DEFAULT_FORM } from '../js/data/defaults.js';

test('저장 키는 고정 값', () => {
  assert.equal(STORAGE_KEY, 'skill-prompt-generator:form');
});

test('저장된 값이 없거나 깨졌으면 null', () => {
  assert.equal(restoreForm(null), null);
  assert.equal(restoreForm('not json'), null);
  assert.equal(restoreForm('[]'), null);
  assert.equal(restoreForm('"text"'), null);
});

test('모르는 키는 버리고, 잘못된 값은 기본값으로 바꾼다', () => {
  const raw = JSON.stringify({ idea: 'x', platform: 'bad', tools: ['Read', 'Bash'], argNames: 3, extra: 1 });
  assert.deepEqual(restoreForm(raw), { ...DEFAULT_FORM, idea: 'x', tools: ['Read'] });
});

test('빠진 키는 기본값으로 채운다 (옛 버전 저장 데이터)', () => {
  assert.deepEqual(restoreForm(JSON.stringify({ idea: 'old' })), { ...DEFAULT_FORM, idea: 'old' });
});
