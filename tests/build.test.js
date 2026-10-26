import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../js/data/rules.js';
import { DEFAULT_FORM } from '../js/data/defaults.js';
import { EXAMPLE_FORM } from '../js/data/example.js';
import { buildPrompt } from '../features/prompt-builder/build.js';

const build = (patch) => buildPrompt({ ...EXAMPLE_FORM, ...patch }, rules);

test('claude-code + 예시: 모든 블록이 순서대로 들어간다', () => {
  const p = build({});
  assert.ok(p.startsWith('# Role (역할)\n당신은 Anthropic Claude Skills(Claude Code용)'));
  const order = ['# Task (임무)', '# SKILL.md 작성 표준 규칙', '# 사용자 스킬 명세', '# Output Format (출력 형식)'];
  let last = 0;
  for (const h of order) {
    const i = p.indexOf(h);
    assert.ok(i > last, h);
    last = i;
  }
  for (const s of ['   - when_to_use:', '   - argument-hint:', '   - allowed-tools:', '1,536자', rules.ARGS_RULE,
    '- 대상: Claude Code', '- 인자: `$0` = 리뷰할 경로', '- 허용 도구: Read, Grep, Bash(git diff *)',
    '~/.claude/skills/', rules.TEST_SLASH, rules.SUGGEST_LINE]) {
    assert.ok(p.includes(s), s);
  }
  assert.ok(p.trimEnd().split('\n').at(-1).startsWith('5. **규칙 셀프 체크**'));
});

test('claude-ai: Claude Code 전용 문구가 없다', () => {
  const p = build({ platform: 'claude-ai', invocation: 'user-only' });
  for (const s of ['argument-hint', 'when_to_use', 'disable-model-invocation', 'user-invocable', '`$0`', rules.TEST_SLASH]) {
    assert.ok(!p.includes(s), s);
  }
  for (const s of ['(claude.ai용)', 'name, description, license, compatibility, metadata, allowed-tools', '1,024자', 'ZIP', rules.HELP_URL_CLAUDE_AI]) {
    assert.ok(p.includes(s), s);
  }
});

test('both: 6개 필드 규칙과 설치 방법 두 가지가 모두 있다', () => {
  const p = build({ platform: 'both' });
  assert.ok(p.includes(rules.STD_FIELDS));
  assert.ok(p.includes(rules.INSTALL['claude-code']));
  assert.ok(p.includes(rules.INSTALL['claude-ai']));
  assert.ok(p.includes(rules.TEST_SLASH));
  assert.ok(!p.includes('argument-hint'));
});

test('빈 선택 칸은 명세에서 빠지고 제안 지시는 항상 있다', () => {
  const p = buildPrompt({ ...DEFAULT_FORM, idea: '아이디어만' }, rules);
  assert.ok(p.includes('- 아이디어: 아이디어만'));
  assert.ok(p.includes('- 호출 방식: 사용자 `/명령어` 호출과 Claude 자동 호출 모두'));
  for (const s of ['- 스킬 이름 후보', '- 트리거 상황', '- 인자', '- 허용 도구', '- 입력 예시', '- 금지사항',
    '   - when_to_use:', '   - argument-hint:', '   - allowed-tools:']) {
    assert.ok(!p.includes(s), s);
  }
  assert.ok(p.includes(rules.SUGGEST_LINE));
});

test('split 인자는 $0부터 이름을 붙이고, 끝 쉼표는 무시한다', () => {
  assert.ok(build({ argNames: '경로, 형식,' }).includes('- 인자: `$0` = 경로, `$1` = 형식'));
  assert.ok(build({ argNames: '' }).includes(`- 인자: ${rules.ARGS_SPLIT_UNNAMED}`));
  assert.ok(build({ argMode: 'whole' }).includes(`- 인자: ${rules.ARGS_WHOLE}`));
});

test('비활성 칸의 보관 값은 프롬프트에 들어가지 않는다', () => {
  assert.ok(!build({ platform: 'claude-ai', argMode: 'split', argNames: '경로' }).includes('`$0`'));
});

test('호출 방식은 claude-code에서만 frontmatter 규칙이 된다', () => {
  assert.ok(build({ invocation: 'user-only' }).includes('disable-model-invocation: true'));
  assert.ok(build({ invocation: 'model-only' }).includes('user-invocable: false'));
  assert.ok(!build({ invocation: 'both' }).includes('disable-model-invocation'));
});

test('사용자 입력의 특수 문자는 글자 그대로 들어간다', () => {
  const idea = '`$ARGUMENTS` <b>굵게</b> ${x}';
  assert.ok(build({ idea }).includes(`- 아이디어: ${idea}`));
});

test('여러 줄 값: 금지사항은 하위 목록, 출력 예시는 코드 블록', () => {
  const p = build({ prohibitions: 'a\r\n\r\nb' });
  assert.ok(p.includes('- 금지사항:\n  - a\n  - b'));
  assert.ok(p.includes('- 기대 출력 예시:\n```\n| 파일 | 줄 | 심각도 | 코멘트 |'));
});

test('예시 데이터의 완성 프롬프트가 고정본과 글자 하나까지 같다', async () => {
  const { readFile } = await import('node:fs/promises');
  const expected = await readFile(new URL('./fixtures/example-prompt.txt', import.meta.url), 'utf8');
  assert.equal(buildPrompt({ ...EXAMPLE_FORM }, rules), expected.trimEnd());
});

test('테스트 안내는 호출 방식과 어긋나지 않는다 (F7)', () => {
  const userOnly = build({ invocation: 'user-only' });
  assert.ok(userOnly.includes(rules.TEST_SLASH));
  assert.ok(!userOnly.includes(rules.TEST_TRIGGERS));
  const modelOnly = build({ invocation: 'model-only' });
  assert.ok(!modelOnly.includes(rules.TEST_SLASH));
  assert.ok(modelOnly.includes(rules.TEST_TRIGGERS));
  // 비활성인 호출 방식 값은 테스트 안내에도 영향을 주지 않는다
  assert.ok(build({ platform: 'claude-ai', invocation: 'user-only' }).includes(rules.TEST_TRIGGERS));
  const both = build({ platform: 'both', invocation: 'model-only' });
  assert.ok(both.includes(rules.TEST_SLASH) && both.includes(rules.TEST_TRIGGERS));
});

test('예시 속 백틱 펜스보다 긴 펜스로 감싸 구조가 깨지지 않는다', () => {
  const p = build({ outputExample: '```js\nx()\n```' });
  assert.ok(p.includes('- 기대 출력 예시:\n````\n```js\nx()\n```\n````\n- 금지사항:'));
});
