import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countFilled } from '../features/sections/count.js';
import { DEFAULT_FORM } from '../js/data/defaults.js';
import { EXAMPLE_FORM } from '../js/data/example.js';

test('기본값만 있으면 모두 0', () => {
  assert.deepEqual(countFilled({ ...DEFAULT_FORM }), { basic: 0, behavior: 0, examples: 0 });
});

test('예시 데이터: 기본값과 다른 활성 칸만 센다', () => {
  assert.deepEqual(countFilled({ ...EXAMPLE_FORM }), { basic: 2, behavior: 5, examples: 4 });
});

test('공백뿐인 값은 세지 않는다', () => {
  assert.deepEqual(countFilled({ ...DEFAULT_FORM, idea: '   ' }).basic, 0);
});

test('비활성 칸은 값이 보관돼 있어도 세지 않는다', () => {
  const form = { ...DEFAULT_FORM, platform: 'claude-ai', invocation: 'user-only', argMode: 'split', argNames: 'a' };
  assert.deepEqual(countFilled(form), { basic: 1, behavior: 0, examples: 0 });
});
