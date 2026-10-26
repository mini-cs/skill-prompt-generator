import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateName, invalidBashPatterns, getBlocking } from '../features/field-check/validate.js';
import { DEFAULT_FORM } from '../js/data/defaults.js';

const codes = (name) => validateName(name).map((e) => e.code);

test('규칙에 맞는 이름과 빈 값은 통과', () => {
  assert.deepEqual(codes('pr-review'), []);
  assert.deepEqual(codes('a'.repeat(64)), []);
  assert.deepEqual(codes(''), []);
  assert.deepEqual(codes('   '), []);
});

test('규칙 위반은 해당 이유로 실패', () => {
  assert.deepEqual(codes('PR-Review'), ['uppercase']);
  assert.deepEqual(codes('-pr'), ['edge-hyphen']);
  assert.deepEqual(codes('pr-'), ['edge-hyphen']);
  assert.deepEqual(codes('pr--review'), ['double-hyphen']);
  assert.deepEqual(codes('pr_review'), ['invalid-char']);
  assert.deepEqual(codes('a'.repeat(65)), ['too-long']);
  assert.deepEqual(codes('PR_Review'), ['uppercase', 'invalid-char']);
});

test('한글·공백이 섞인 이름은 invalid-char', () => {
  assert.deepEqual(codes('리뷰 스킬'), ['invalid-char']);
});

test('오류 문구는 스펙 문구 그대로', () => {
  assert.equal(validateName('a'.repeat(65))[0].message, '64자 이하로 줄여주세요 (지금 65자)');
  assert.equal(validateName('pr--a')[0].message, '하이픈을 두 개 연속(--)으로 쓸 수 없어요');
});

test('Bash 패턴은 Bash(내용) 형식만 통과', () => {
  assert.deepEqual(invalidBashPatterns('Bash(git diff *)'), []);
  assert.deepEqual(invalidBashPatterns('git diff *, Bash(), Bash(npm test)'), ['git diff *', 'Bash()']);
  assert.deepEqual(invalidBashPatterns('Bash(  )'), ['Bash(  )']);
});

test('getBlocking: 아이디어가 비거나 공백뿐이면 막는다', () => {
  const expected = [{ field: 'idea', message: '아이디어를 먼저 적어주세요' }];
  assert.deepEqual(getBlocking({ ...DEFAULT_FORM }), expected);
  assert.deepEqual(getBlocking({ ...DEFAULT_FORM, idea: '  \n ' }), expected);
});

test('getBlocking: 이름 오류는 오류마다, Bash 오류는 항목마다 하나씩', () => {
  const out = getBlocking({ ...DEFAULT_FORM, idea: 'x', skillName: 'PR_Review', bashPatterns: 'git *' });
  assert.deepEqual(out.map((b) => b.field), ['skillName', 'skillName', 'bashPatterns']);
  assert.equal(out[2].message, '"git *" → Bash(명령 *) 형태로 적어주세요');
});

test('getBlocking: 문제가 없으면 빈 배열', () => {
  assert.deepEqual(getBlocking({ ...DEFAULT_FORM, idea: 'x', skillName: 'pr-review', bashPatterns: 'Bash(git diff *)' }), []);
});
