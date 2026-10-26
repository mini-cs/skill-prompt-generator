import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseList, parseLines } from '../js/lib/list.js';

test('parseList는 쉼표로 나누고 빈 항목과 앞뒤 공백을 버린다', () => {
  assert.deepEqual(parseList('Read, , Bash(git diff *) ,'), ['Read', 'Bash(git diff *)']);
  assert.deepEqual(parseList('경로, 형식,'), ['경로', '형식']);
  assert.deepEqual(parseList(''), []);
});

test('parseLines는 \r\n과 \n 모두로 나누고 빈 줄을 버린다', () => {
  assert.deepEqual(parseLines('a\r\n\r\n b \nc'), ['a', 'b', 'c']);
  assert.deepEqual(parseLines('   '), []);
});
