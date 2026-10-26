import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickUndoForm } from '../features/example-fill/undo.js';
import { DEFAULT_FORM } from '../js/data/defaults.js';
import { EXAMPLE_FORM } from '../js/data/example.js';

const mine = { ...DEFAULT_FORM, idea: '내 입력', tools: ['Read'] };
const empty = { ...DEFAULT_FORM, tools: [] };

test('같은 동작을 연달아 누르면 처음 보관한 입력을 유지한다', () => {
  const toast = { id: 1, message: '초기화했어요', undoForm: mine };
  assert.deepEqual(pickUndoForm(empty, empty, toast), mine);
  const filled = { id: 2, message: '예시로 채웠어요', undoForm: mine };
  assert.deepEqual(pickUndoForm({ ...EXAMPLE_FORM }, EXAMPLE_FORM, filled), mine);
});

test('되돌리기 알림이 없거나 폼이 바뀌었으면 현재 폼을 보관한다', () => {
  assert.deepEqual(pickUndoForm(mine, empty, null), mine);
  assert.deepEqual(pickUndoForm(mine, empty, { id: 3, message: '복사', undoForm: undefined }), mine);
  assert.deepEqual(pickUndoForm({ ...EXAMPLE_FORM }, empty, { id: 4, message: '예시로 채웠어요', undoForm: mine }), EXAMPLE_FORM);
});

test('보관본은 현재 폼과 분리된 복사본이다', () => {
  const out = pickUndoForm(mine, empty, null);
  out.tools.push('Grep');
  assert.deepEqual(mine.tools, ['Read']);
});
