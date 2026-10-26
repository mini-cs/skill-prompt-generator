import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FORM, createInitialState } from '../js/data/defaults.js';
import { SECTIONS, CHOICES, isActive, disabledReason } from '../js/data/fields.js';

const f = (patch) => ({ ...DEFAULT_FORM, ...patch });

test('기본값이 스펙 5장과 같다', () => {
  assert.equal(DEFAULT_FORM.platform, 'claude-code');
  assert.equal(DEFAULT_FORM.invocation, 'both');
  assert.equal(DEFAULT_FORM.argMode, 'none');
  assert.deepEqual(DEFAULT_FORM.tools, []);
  assert.deepEqual(createInitialState().ui.openSections, { basic: true, behavior: false, examples: false });
  assert.deepEqual(createInitialState().status, { blocking: [], prompt: '', toast: null, savedAt: null });
});

test('createInitialState는 매번 새 객체를 돌려준다', () => {
  const a = createInitialState();
  a.form.tools.push('Read');
  assert.deepEqual(createInitialState().form.tools, []);
});

test('SECTIONS는 폼의 모든 칸을 정확히 한 번씩 담는다', () => {
  const all = [...SECTIONS.basic, ...SECTIONS.behavior, ...SECTIONS.examples].sort();
  assert.deepEqual(all, Object.keys(DEFAULT_FORM).sort());
});

test('CHOICES는 라디오·체크박스 선택지를 담는다', () => {
  assert.deepEqual(CHOICES.platform, ['claude-code', 'claude-ai', 'both']);
  assert.deepEqual(CHOICES.tools, ['Read', 'Grep', 'Glob', 'Edit', 'Write']);
});

test('호출 방식과 인자는 claude-code에서만 활성', () => {
  assert.equal(isActive('invocation', f({ platform: 'claude-code' })), true);
  assert.equal(isActive('invocation', f({ platform: 'claude-ai' })), false);
  assert.equal(isActive('argMode', f({ platform: 'both' })), false);
});

test('인자 이름은 claude-code이면서 split일 때만 활성', () => {
  assert.equal(isActive('argNames', f({ argMode: 'split' })), true);
  assert.equal(isActive('argNames', f({ argMode: 'whole' })), false);
  assert.equal(isActive('argNames', f({ platform: 'claude-ai', argMode: 'split' })), false);
});

test('나머지 칸은 모든 대상에서 활성', () => {
  for (const platform of CHOICES.platform) {
    for (const k of ['idea', 'skillName', 'triggers', 'tools', 'bashPatterns', 'prohibitions']) {
      assert.equal(isActive(k, f({ platform })), true, `${k} @ ${platform}`);
    }
  }
});

test('disabledReason은 비활성 이유를, 활성이면 null을 돌려준다', () => {
  assert.equal(disabledReason('idea', f({})), null);
  assert.equal(disabledReason('invocation', f({ platform: 'claude-ai' })), 'claude.ai에는 없는 기능이라 프롬프트에서 빠져요');
  assert.equal(disabledReason('argMode', f({ platform: 'both' })), 'claude.ai와 함께 쓰면 지원되지 않는 기능이라 프롬프트에서 빠져요');
  assert.equal(disabledReason('argNames', f({ argMode: 'none' })), '"여러 개로 나눠 받기"를 고르면 입력할 수 있어요');
});
