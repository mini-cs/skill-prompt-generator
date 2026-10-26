# 개발자 프롬프트 생성기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Skill 아이디어와 조건을 폼에 입력하면 SKILL.md 설계를 요청하는 프롬프트를 실시간으로 조립하고 복사할 수 있는 웹 도구를 만든다.

**Architecture:** 화면과 무관한 로직(상태 저장소, 입력 검사, 프롬프트 조립, 개수 계산, 저장 복원)은 순수 함수로 먼저 만들고 `node --test`로 검증한다. 화면 기능은 `features/<기능명>/` 폴더 하나씩으로 나누고, 모든 기능은 `init(ctx)` 하나만 내보내며 `store`로만 정보를 주고받는다. `main.js`가 `features/registry.js`의 목록을 읽어 차례로 연결한다.

**Tech Stack:** HTML, CSS, JavaScript(ES 모듈), Node 내장 테스트 러너(`node:test`, Node v22에서 확인), 로컬 서버(`python -m http.server 8000`). 외부 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-26-skill-prompt-generator-design.md` — 이 계획은 스펙을 근거로 한다. 두 문서를 함께 읽는다.

**시작 상태:** 프로젝트 폴더에 `CLAUDE.md`, `.claude/skills/apple-design/SKILL.md`, 스펙, 이 계획이 이미 있다.

## Global Constraints

- 외부 라이브러리·빌드 도구·npm 의존성 없음. `package.json`에는 `"type": "module"`과 `"test": "node --test"`만 둔다.
- HTML·CSS·JS는 파일로 나누고, JS는 ES 모듈(`import`/`export`)로 쓴다.
- 기능 1개 = `features/<기능명>/` 폴더 1개. `index.js`는 `export function init(ctx)` 하나만 내보내고, `features/registry.js`에 1줄을 등록한다.
- 기능끼리 서로 import하지 않는다. 정보는 `store`로만 주고받는다. `js/data/`, `js/lib/`, 자기 폴더 안의 파일은 import해도 된다.
- 공식 문서 기반 규칙 문구는 `js/data/rules.js`에만 둔다. 문구를 바꾸거나 새 규칙을 지어내지 않는다.
- 사용자에게 보이는 글과 조립되는 프롬프트는 한국어다. 버튼 라벨은 "프롬프트 복사", "예시로 채우기", "초기화", "되돌리기"다.
- 디자인 수치(색, 글자, 간격, 모서리, 움직임, 접근성 설정)는 스펙 §3-2를 그대로 쓴다. §3-3(스프링 라이브러리, 제스처, 소리·진동)은 쓰지 않는다. 움직이는 속성은 `transform`과 `opacity`만이다.
- 화면 너비 기준은 900px이다. 미만이면 한 열 배치와 하단 복사 바를 쓴다.
- 사용자 입력은 화면에 넣을 때 항상 `textContent`로 넣는다(`innerHTML` 금지).
- 실행 확인은 `python -m http.server 8000` → `http://localhost:8000`으로 한다. 테스트는 `npm test`다.

## Review Focus

테스트가 직접 다루지 않던 입력 중 실제 사용에서 문제가 되기 쉬운 순서다. 각 줄의 테스트는 담당 Task에 이미 넣었다.

1. 한글·공백이 섞인 스킬 이름("리뷰 스킬") → 오류로 안내하고 복사를 막는다. (Task 3 `한글·공백이 섞인 이름은 invalid-char`)
2. 사용자 입력 속 `` `$ARGUMENTS` ``, `<b>`, `${x}` → 프롬프트와 미리보기에 글자 그대로 나온다. (Task 4 `사용자 입력의 특수 문자는 글자 그대로 들어간다`, Task 7 확인 단계)
3. 윈도우 줄바꿈(`\r\n`)과 빈 줄이 섞인 붙여넣기 → 한 줄에 하나로 정리된다. (Task 2 `parseLines…`, Task 4 `여러 줄 값…`)
4. 옛 버전이거나 손상된 자동 저장 데이터 → 기본값과 합쳐 복원되고 화면이 깨지지 않는다. (Task 13 `restore.test.js`)
5. 쉼표 목록의 빈 항목·앞뒤 공백·끝 쉼표("경로, 형식,") → 빈 인자 없이 `$0`, `$1`만 만든다. (Task 2 `parseList…`, Task 4 `split 인자는…`)

---

## 공통 계약 (모든 Task가 쓰는 이름)

### 상태 모양

```js
{
  form: {
    idea: string, platform: 'claude-code' | 'claude-ai' | 'both', skillName: string,
    invocation: 'both' | 'user-only' | 'model-only', triggers: string,
    argMode: 'none' | 'whole' | 'split', argNames: string,
    tools: Array<'Read' | 'Grep' | 'Glob' | 'Edit' | 'Write'>, bashPatterns: string,
    inputExample: string, outputExample: string, prohibitions: string, outputConstraints: string,
  },
  ui: { openSections: { basic: boolean, behavior: boolean, examples: boolean } },
  status: {
    blocking: Array<{ field: 'idea' | 'skillName' | 'bashPatterns', message: string }>,
    prompt: string,
    toast: null | { id: number, message: string, undoForm?: Form },  // id는 만드는 쪽이 performance.now()로
    savedAt: number | null,
  },
}
```

`ui.openSections`는 세 번째 단계 객체라서, 바꿀 때 `store.set({ ui: { openSections: { ...현재값, [id]: 새값 } } })`처럼 객체 전체를 넘긴다.

### `ctx` (각 기능의 `init(ctx)`가 받는 것)

`{ store, root: document, rules, defaults, example }`
- `rules` = `import * as rules from './data/rules.js'`의 모듈 객체
- `defaults` = `import * as defaults from './data/defaults.js'`의 모듈 객체
- `example` = `EXAMPLE_FORM`

### 기능 등록 순서와 CSS 여부 (`features/registry.js` 최종 모습)

각 Task는 자기 줄을 아래 순서 위치에 끼워 넣는다. 형식: `{ name: 'copy', load: () => import('./copy/index.js'), css: true },`

| 순서 | name | css |
| --- | --- | --- |
| 1 | field-check | true |
| 2 | platform-switch | true |
| 3 | arg-map | false |
| 4 | char-counter | true |
| 5 | prompt-builder | true |
| 6 | sections | true |
| 7 | scroll-edge | true |
| 8 | toast | true |
| 9 | example-fill | false |
| 10 | copy | true |
| 11 | autosave | false |

### DOM 훅 (Task 6이 `index.html`에 만들고 이후 Task가 쓴다)

- `#server-notice` — 서버 안내 (기본 표시)
- `header.app-header` — 상단 바. 안에 `h1`, `[data-slot="save-status"]`, `button[data-action="fill-example"]`, `button[data-action="reset"]`
- `#scroll-sentinel` — `main` 맨 위의 높이 1px 요소
- `form#skill-form` — 안에 `section.panel[data-section="basic|behavior|examples"]` 세 개
  - 각 섹션: `button[data-section-toggle][aria-expanded][aria-controls]`(섹션 제목 포함), `span[data-section-count]`, `div[data-section-body][id="body-<섹션id>"]`
- 각 칸: `div.field[data-field="<form 키>"]` 안에 입력 요소(`name="<form 키>"`), `p.field-reason[data-disabled-reason][hidden]`, `p.field-error[data-error-for="<form 키>"][id="error-<form 키>"][hidden]`
  - 라디오: 같은 `name`의 `input[type=radio]` 묶음. 체크박스: `name="tools"`인 `input[type=checkbox]` 5개(value = Read, Grep, Glob, Edit, Write)
- `[data-counter-for="triggers"]` — 트리거 칸 아래 카운터
- `[data-arg-map][hidden]` — 인자 이름 칸 아래 대응표
- `aside.panel.preview-panel` — 안에 `h2` "프롬프트 미리보기", `pre#preview[tabindex="0"]`, `p[data-slot="copy-hint"]`, `button[data-action="copy"]`
- `div.bottom-bar` — 안에 `[data-slot="blocking-count"]`, `button[data-action="copy"]`
- `#toast-region[aria-live="polite"]`

### 칸 라벨과 선택지 문구 (그대로 쓴다)

- 섹션 제목: basic "기본", behavior "동작", examples "예시·금지사항"
- `idea` "스킬 아이디어" / 안내문 "예: git diff를 분석해서 PR 리뷰 코멘트를 표로 정리"
- `platform` "대상 플랫폼" / 선택지 claude-code "Claude Code", claude-ai "claude.ai", both "둘 다 호환"
- `skillName` "스킬 이름 후보 (선택)" / 안내문 "예: pr-review" / 도움말 "비워두면 Claude가 제안해요"
- `invocation` "호출 방식" / 선택지 both "둘 다", user-only "내가 /명령으로만", model-only "Claude가 자동으로만"
- `triggers` "트리거 상황" / 안내문 "예: PR 리뷰해줘, 변경사항 정리해줘"
- `argMode` "인자" / 선택지 none "없음", whole "통째로 받기 ($ARGUMENTS)", split "여러 개로 나눠 받기"
- `argNames` "인자 이름 (쉼표로 구분)" / 안내문 "예: 경로, 형식"
- `tools` "허용 도구" / 도움말 "스킬을 호출한 그 턴에만 승인 없이 쓸 수 있어요. 목록에 없는 도구를 막지는 않아요."
- `bashPatterns` "Bash 패턴 (쉼표로 구분)" / 안내문 "예: Bash(git diff *)"
- `inputExample` "입력 예시" / 안내문 "예: /pr-review src/api"
- `outputExample` "기대 출력 예시" / 안내문 "예: | 파일 | 줄 | 심각도 | 코멘트 | 표"
- `prohibitions` "금지사항 (한 줄에 하나)" / 안내문 "예: 코드 직접 수정 금지"
- `outputConstraints` "출력 형식 제약 (한 줄에 하나)" / 안내문 "형용사 대신 구체 조건 — 예: 첫 줄에 총평 1문장, 항목 10개 이하"
- 서버 안내: "이 페이지는 로컬 서버로 열어야 해요. README의 실행 방법을 참고하세요."

### CSS 변수 이름 (Task 6이 `css/base.css`에 정의, 기능 CSS는 이것만 쓴다)

`--color-bg`, `--color-surface`, `--color-text`, `--color-text-secondary`, `--color-separator`, `--color-accent`, `--color-success`, `--color-warning`, `--color-error`, `--material-bar`, `--shadow-panel`, `--radius-panel`(1rem), `--radius-control`(0.625rem), `--space-1`~`--space-6`(0.25 · 0.5 · 0.75 · 1 · 1.5 · 2rem), `--ease-out`(`cubic-bezier(0.25, 1, 0.5, 1)`), `--dur-press`(100ms), `--dur-fast`(150ms), `--dur-base`(200ms), `--font-sans`, `--font-mono`, `--header-height`(3.5rem), `--bottom-bar-height`(4rem). 색·재질·그림자 값은 스펙 §3-2.

---

## File Structure

| 파일 | 책임 | Task |
| --- | --- | --- |
| `package.json`, `.gitignore` | 모듈 설정, 테스트 명령 | 1 |
| `js/store.js` | 상태 저장소 | 1 |
| `js/lib/list.js` | 쉼표·줄 단위 목록 파싱 | 2 |
| `js/data/defaults.js` | 폼 기본값, 초기 상태 | 2 |
| `js/data/fields.js` | 섹션별 칸, 선택지, 칸 활성 여부와 비활성 이유 | 2 |
| `features/field-check/validate.js` | 이름·Bash 패턴·필수 검사 | 3 |
| `js/data/rules.js` | 프롬프트 규칙 문구 | 4 |
| `js/data/example.js` | 예시 데이터 | 4 |
| `features/prompt-builder/build.js` | 프롬프트 조립 | 4 |
| `features/sections/count.js` | 섹션별 입력 개수 | 5 |
| `index.html`, `css/base.css`, `js/bind.js`, `js/main.js`, `features/registry.js`, `README.md` | 화면 뼈대, 폼 연결, 시작점 | 6 |
| `features/<기능>/index.js`, `style.css` | 각 화면 기능 | 7~13 |
| `features/autosave/restore.js` | 저장 데이터 복원 | 13 |

스펙 7-1장 대비 추가된 파일: `js/lib/list.js`, `js/data/fields.js`, `features/arg-map/`, `features/autosave/restore.js`, `tests/store.test.js`, `tests/list.test.js`, `tests/fields.test.js`, `tests/restore.test.js`, `tests/fixtures/example-prompt.txt`. 모두 같은 규칙(순수 로직 분리, 기능 = 폴더)을 따른다.

---

### Task 1: 저장소와 상태 저장소

**Files:**
- Create: `package.json`, `.gitignore`, `js/store.js`
- Test: `tests/store.test.js`

**Interfaces:**
- Consumes: 없음
- Produces: `createStore(initial: State): Store` — `Store = { get(): State, set(patch: { form?: object, ui?: object, status?: object }): void, subscribe(fn: (state: State) => void, select?: (state: State) => unknown): () => void, emit(): void }`

- [ ] **Step 1: 저장소 준비**

폴더가 git 저장소가 아니면 `git init`을 실행한다. `package.json`:

````json
{
  "name": "skill-prompt-generator",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
````

`.gitignore`: `node_modules/`, `.DS_Store` 두 줄.

- [ ] **Step 2: 실패하는 테스트 작성** — `tests/store.test.js`

````js
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
````

- [ ] **Step 3: 실패 확인**

Run: `node --test tests/store.test.js`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` (`js/store.js`가 아직 없음)

- [ ] **Step 4: `createStore(initial)`를 `js/store.js`에 구현**

동작 규칙:
- `set(patch)`는 새 state 객체를 만들고, patch의 최상위 키 `k`마다 `{ ...state[k], ...patch[k] }`로 한 단계 합친다.
- 구독마다 `select(state)` 결과를 `last`로 기억한다. `select` 기본값은 `(s) => s`이고, 구독할 때 `last = select(현재 state)`로 시작한다.
- 알림 때는 `Object.is`로 비교해서 바뀐 구독만 호출한다. 이때 **구독자를 부르기 전에 `last`를 먼저 갱신**한다. 그래야 구독자 안에서 `set`을 불러도 같은 구독자가 다시 불리지 않는다. 알림 목록은 복사본을 돌린다.
- `emit()`은 비교 없이 모든 구독자를 부르고 `last`를 갱신한다.

- [ ] **Step 5: 통과 확인**

Run: `npm test`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 6: 커밋**

```bash
git add package.json .gitignore js/store.js tests/store.test.js
git commit -m "feat: 상태 저장소와 테스트 환경"
```

---

### Task 2: 폼 데이터 모델

**Files:**
- Create: `js/lib/list.js`, `js/data/defaults.js`, `js/data/fields.js`
- Test: `tests/list.test.js`, `tests/fields.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `parseList(text: string): string[]` — 쉼표로 나누고 trim, 빈 항목 제거
  - `parseLines(text: string): string[]` — `\r\n`/`\n`으로 나누고 trim, 빈 줄 제거
  - `DEFAULT_FORM: Form`, `createInitialState(): State`
  - `SECTIONS: { basic: string[], behavior: string[], examples: string[] }`, `CHOICES: { platform, invocation, argMode, tools }`
  - `isActive(field: string, form: Form): boolean`, `disabledReason(field: string, form: Form): string | null`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/list.test.js`

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseList, parseLines } from '../js/lib/list.js';

test('parseList는 쉼표로 나누고 빈 항목과 앞뒤 공백을 버린다', () => {
  assert.deepEqual(parseList('Read, , Bash(git diff *) ,'), ['Read', 'Bash(git diff *)']);
  assert.deepEqual(parseList('경로, 형식,'), ['경로', '형식']);
  assert.deepEqual(parseList(''), []);
});

test('parseLines는 \\r\\n과 \\n 모두로 나누고 빈 줄을 버린다', () => {
  assert.deepEqual(parseLines('a\r\n\r\n b \nc'), ['a', 'b', 'c']);
  assert.deepEqual(parseLines('   '), []);
});
````

`tests/fields.test.js`:

````js
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
````

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/list.test.js tests/fields.test.js`
Expected: FAIL — `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: `parseList`, `parseLines`를 `js/lib/list.js`에 구현**

- [ ] **Step 4: 데이터 파일 작성 (그대로 쓴다)** — `js/data/defaults.js`

````js
export const DEFAULT_FORM = {
  idea: '',
  platform: 'claude-code',
  skillName: '',
  invocation: 'both',
  triggers: '',
  argMode: 'none',
  argNames: '',
  tools: [],
  bashPatterns: '',
  inputExample: '',
  outputExample: '',
  prohibitions: '',
  outputConstraints: '',
};

export function createInitialState() {
  return {
    form: { ...DEFAULT_FORM, tools: [] },
    ui: { openSections: { basic: true, behavior: false, examples: false } },
    status: { blocking: [], prompt: '', toast: null, savedAt: null },
  };
}
````

`js/data/fields.js`:

````js
export const SECTIONS = {
  basic: ['idea', 'platform', 'skillName'],
  behavior: ['invocation', 'triggers', 'argMode', 'argNames', 'tools', 'bashPatterns'],
  examples: ['inputExample', 'outputExample', 'prohibitions', 'outputConstraints'],
};

export const CHOICES = {
  platform: ['claude-code', 'claude-ai', 'both'],
  invocation: ['both', 'user-only', 'model-only'],
  argMode: ['none', 'whole', 'split'],
  tools: ['Read', 'Grep', 'Glob', 'Edit', 'Write'],
};

const CLAUDE_CODE_ONLY = ['invocation', 'argMode', 'argNames'];

export function isActive(field, form) {
  if (CLAUDE_CODE_ONLY.includes(field) && form.platform !== 'claude-code') return false;
  if (field === 'argNames') return form.argMode === 'split';
  return true;
}

const REASON = {
  'claude-ai': 'claude.ai에는 없는 기능이라 프롬프트에서 빠져요',
  both: 'claude.ai와 함께 쓰면 지원되지 않는 기능이라 프롬프트에서 빠져요',
  argNames: '"여러 개로 나눠 받기"를 고르면 입력할 수 있어요',
};

export function disabledReason(field, form) {
  if (isActive(field, form)) return null;
  if (CLAUDE_CODE_ONLY.includes(field) && form.platform !== 'claude-code') return REASON[form.platform];
  return REASON.argNames;
}
````

- [ ] **Step 5: 통과 확인**

Run: `npm test`
Expected: `# pass 15`, `# fail 0`

- [ ] **Step 6: 커밋**

```bash
git add js/lib js/data/defaults.js js/data/fields.js tests/list.test.js tests/fields.test.js
git commit -m "feat: 폼 기본값, 칸 활성 규칙, 목록 파싱"
```

---

### Task 3: 입력 검사 로직

**Files:**
- Create: `features/field-check/validate.js`
- Test: `tests/validate.test.js`

**Interfaces:**
- Consumes: `parseList` (Task 2)
- Produces:
  - `validateName(name: string): Array<{ code: 'too-long' | 'uppercase' | 'invalid-char' | 'edge-hyphen' | 'double-hyphen', message: string }>`
  - `invalidBashPatterns(text: string): string[]`
  - `getBlocking(form: Form): Array<{ field: 'idea' | 'skillName' | 'bashPatterns', message: string }>`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/validate.test.js`

````js
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
````

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/validate.test.js`
Expected: FAIL — `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: `features/field-check/validate.js` 구현**

- `validateName`은 `name.trim()`을 검사한다. 빈 값이면 `[]`를 돌려준다. 오류는 아래 순서로 해당하는 것을 모두 담는다.
  1. `too-long`: 64자 초과 — "64자 이하로 줄여주세요 (지금 N자)"
  2. `uppercase`: `/[A-Z]/` — "대문자는 쓸 수 없어요. 소문자로 바꿔주세요"
  3. `invalid-char`: `/[^a-zA-Z0-9-]/` — "소문자 영어, 숫자, 하이픈(-)만 쓸 수 있어요"
  4. `edge-hyphen`: `-`로 시작하거나 끝남 — "하이픈(-)으로 시작하거나 끝날 수 없어요"
  5. `double-hyphen`: `--` 포함 — "하이픈을 두 개 연속(--)으로 쓸 수 없어요"
- `invalidBashPatterns`는 `parseList` 결과 중 `/^Bash\(\s*\S.*\)$/`에 맞지 않는 항목을 돌려준다.
- `getBlocking`은 아래 순서로 만든다. ① 아이디어가 공백뿐이면 `{ field: 'idea', message: '아이디어를 먼저 적어주세요' }` ② 이름 오류마다 `{ field: 'skillName', message }` ③ 잘못된 Bash 항목마다 `{ field: 'bashPatterns', message: '"<항목>" → Bash(명령 *) 형태로 적어주세요' }`

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: `# pass 23`, `# fail 0`

- [ ] **Step 5: 커밋**

```bash
git add features/field-check/validate.js tests/validate.test.js
git commit -m "feat: 스킬 이름·Bash 패턴·필수 입력 검사"
```

---

### Task 4: 프롬프트 조립 로직

**Files:**
- Create: `js/data/rules.js`, `js/data/example.js`, `features/prompt-builder/build.js`, `tests/fixtures/example-prompt.txt`
- Test: `tests/build.test.js`

**Interfaces:**
- Consumes: `parseList`, `parseLines` (Task 2), `isActive` (Task 2), `DEFAULT_FORM` (Task 2)
- Produces: `buildPrompt(form: Form, rules: RulesModule): string`, `EXAMPLE_FORM: Form`, `rules.js`의 내보내기 전부(특히 `DESCRIPTION_LIMIT`, `HELP_URL_CLAUDE_AI`는 Task 8이 쓴다)

- [ ] **Step 1: 규칙 문구와 예시 데이터 작성 (그대로 쓴다)** — `js/data/rules.js`

````js
// 공식 문서 기반 규칙 문구 (스펙 §4 F1~F12, 2026-10-26 확인). 문서가 바뀌면 이 파일만 고친다.

export const HELP_URL_CLAUDE_AI = 'https://support.claude.com/en/articles/12512180';

export const DESCRIPTION_LIMIT = { 'claude-code': 1536, 'claude-ai': 1024, both: 1024 };

export const LIMIT_TEXT = {
  'claude-code': 'description과 when_to_use를 합쳐 1,536자',
  'claude-ai': 'description 1,024자',
  both: 'description 1,024자',
};

export const PLATFORM_ROLE = {
  'claude-code': 'Claude Code용',
  'claude-ai': 'claude.ai용',
  both: 'Claude Code와 claude.ai 공용',
};

export const PLATFORM_NAME = {
  'claude-code': 'Claude Code',
  'claude-ai': 'claude.ai',
  both: 'Claude Code와 claude.ai 모두',
};

export const INVOCATION_TEXT = {
  both: '사용자 `/명령어` 호출과 Claude 자동 호출 모두',
  'user-only': '사용자가 `/명령어`로 호출할 때만',
  'model-only': 'Claude가 자동으로만 호출',
};

export const ROLE = (platform) =>
  `# Role (역할)\n당신은 Anthropic Claude Skills(${PLATFORM_ROLE[platform]}) 아키텍처 전문가이자 프롬프트 엔지니어입니다.\n사용자가 원하는 업무나 반복 워크플로우를 분석하여, 완벽한 형식의 \`SKILL.md\` 파일과 폴더 구조를 설계해 주는 생성기입니다.`;

export const TASK =
  '# Task (임무)\n사용자가 만들고자 하는 스킬의 목적이나 아이디어를 입력하면, 아래 규칙에 맞춰 최적화된 스킬 코드를 작성해 주세요.';

export const RULES_HEAD = '# SKILL.md 작성 표준 규칙';
export const FRONTMATTER_HEAD = '1. Frontmatter (YAML 헤더 - 파일 최상단에 위치)';
export const BODY_HEAD = '2. Body (마크다운 본문 지침)';

export const NAME_RULE =
  '소문자, 숫자, 하이픈(-)만 사용 (1~64자). 하이픈으로 시작·끝나거나 `--`처럼 연속으로 쓰지 않음. 스킬 폴더 이름과 같게 작성';
export const NAME_NOTE = {
  'claude-code': ' (`/명령어` 이름은 폴더 이름에서 나옴)',
  'claude-ai': ' (다르면 업로드가 실패할 수 있음)',
  both: ' (Claude Code는 폴더 이름이 `/명령어` 이름이 되고, claude.ai는 다르면 업로드가 실패할 수 있음)',
};

export const CC_DESCRIPTION =
  '스킬이 하는 일과 Claude가 이 스킬을 불러와야 하는 시점을 기술. 핵심 용도를 첫 문장에 둘 것 (description과 when_to_use를 합친 텍스트는 스킬 목록에서 1,536자로 잘림)';
export const CC_WHEN_TO_USE = '사용자 스킬 명세의 "트리거 상황"을 바탕으로, 이 스킬을 불러와야 하는 요청 예시를 기술';
export const CC_ARGUMENT_HINT = '`/명령어` 입력 시 자동완성에 보여줄 인자 형식 (예: `[file-path]`)';
export const CC_ALLOWED_TOOLS =
  '사용자 스킬 명세의 "허용 도구"만 공백으로 구분해 나열. 이 사전 승인은 스킬을 호출한 턴에만 적용되고, 목록에 없는 도구를 막지는 않음';
export const CC_INVOCATION = {
  'user-only': 'disable-model-invocation: true (사용자가 `/명령어`로 호출할 때만 실행)',
  'model-only': 'user-invocable: false (Claude만 자동으로 호출하고 `/` 메뉴에는 표시하지 않음)',
};

export const STD_FIELDS =
  '사용할 수 있는 필드는 name, description, license, compatibility, metadata, allowed-tools 6개뿐. 그 외 필드가 있으면 claude.ai 업로드가 실패함';
export const STD_DESCRIPTION =
  '스킬이 하는 일과 Claude가 이 스킬을 불러와야 하는 시점을 1,024자 이하로 기술. 핵심 용도를 첫 문장에 두고, 트리거 상황도 description 안에 녹여서 작성';
export const STD_ALLOWED_TOOLS = '사용자 스킬 명세의 "허용 도구"만 공백으로 구분해 나열';

export const NO_EXTRA_FIELDS = '위에 나열하지 않은 frontmatter 필드는 추가하지 않음';

export const BODY_RULES = [
  '명확한 단계별(Step-by-step) 실행 워크플로우로 구성',
  '형용사적 지시(예: "친절하게", "짧게") 대신 구체적인 제약 조건(예: "첫 줄에 결론 작성", "항목 3개 이하") 사용',
  'SKILL.md는 500줄 이하로 유지하고, 긴 참고 자료는 별도 파일로 분리한 뒤 SKILL.md에서 링크',
];
export const ARGS_RULE = '인자: `$ARGUMENTS`는 전달된 인자 전체, `$0`은 첫 번째 인자, `$1`은 두 번째 인자 (0부터 셈)';

export const SPEC_HEAD = '# 사용자 스킬 명세';
export const SPEC_LABELS = {
  idea: '아이디어',
  platform: '대상',
  skillName: '스킬 이름 후보',
  invocation: '호출 방식',
  triggers: '트리거 상황',
  args: '인자',
  tools: '허용 도구',
  inputExample: '입력 예시',
  outputExample: '기대 출력 예시',
  prohibitions: '금지사항',
  outputConstraints: '출력 형식 제약',
};
export const ARGS_WHOLE = '`$ARGUMENTS` 전체를 하나의 값으로 받음';
export const ARGS_SPLIT_UNNAMED = '여러 개로 나눠 받음 (`$0`, `$1`… 각 인자의 이름은 제안)';
export const SUGGEST_LINE = '명세에 없는 항목은 제안하되, 제안한 값이라고 표시할 것.';

export const OUTPUT_HEAD = '# Output Format (출력 형식)\n결과물은 반드시 아래 구조로 제공해 주세요:';
export const OUTPUT_1 = '1. **스킬 디렉토리 및 파일 구조** (예: `my-skill/SKILL.md`)';
export const OUTPUT_2 = '2. **복사해서 쓸 수 있는 완성된 SKILL.md 코드** (YAML Frontmatter 포함)';
export const OUTPUT_3 = '3. **설치 방법 안내**';
export const OUTPUT_4 = '4. **테스트 방법**';
export const INSTALL = {
  'claude-code':
    'Claude Code: 개인용 `~/.claude/skills/<스킬 폴더명>/SKILL.md` 또는 프로젝트용 `.claude/skills/<스킬 폴더명>/SKILL.md`에 저장. 폴더 이름이 `/명령어` 이름이 됨',
  'claude-ai': `claude.ai: 폴더 이름을 name과 같게 맞춘 뒤 폴더를 ZIP으로 압축해 스킬 설정에서 업로드. 코드 실행 기능이 켜져 있어야 함. 메뉴 위치는 도움말 참고: ${HELP_URL_CLAUDE_AI}`,
};
export const TEST_SLASH = '`/스킬 폴더명`으로 직접 실행하는 방법';
export const TEST_TRIGGERS = '자동으로 불러와져야 하는 요청 문장 2개와 불러오면 안 되는 요청 문장 1개';
export const TEST_FRESH = '스킬을 만든 대화가 아닌 새 세션에서 테스트하라는 안내';
export const SELF_CHECK = (platform) =>
  `5. **규칙 셀프 체크** — name 규칙, description 글자 수(${LIMIT_TEXT[platform]} 기준), 허용되지 않은 frontmatter 필드 포함 여부를 항목별로 통과/실패 표시`;
````

`js/data/example.js`:

````js
export const EXAMPLE_FORM = {
  idea: 'git diff를 분석해서 PR 리뷰 코멘트를 마크다운 표로 정리해 주는 스킬',
  platform: 'claude-code',
  skillName: 'pr-review',
  invocation: 'both',
  triggers: 'PR 리뷰해줘, 이번 변경사항 검토해줘, 머지 전에 diff 봐줘',
  argMode: 'split',
  argNames: '리뷰할 경로',
  tools: ['Read', 'Grep'],
  bashPatterns: 'Bash(git diff *)',
  inputExample: '/pr-review src/api',
  outputExample:
    '| 파일 | 줄 | 심각도 | 코멘트 |\n| --- | --- | --- | --- |\n| src/api/user.js | 42 | 높음 | null 체크 없이 user.id에 접근해요 |',
  prohibitions: '코드를 직접 수정하지 않는다\n근거가 되는 줄 번호 없이 지적하지 않는다',
  outputConstraints: '첫 줄에 총평 1문장\n코멘트는 10개 이하\n심각도는 높음/중간/낮음 중 하나',
};
````

- [ ] **Step 2: 고정본 작성** — `tests/fixtures/example-prompt.txt` (예시 데이터로 조립했을 때의 정답. 마지막에 줄바꿈 하나)

````text
# Role (역할)
당신은 Anthropic Claude Skills(Claude Code용) 아키텍처 전문가이자 프롬프트 엔지니어입니다.
사용자가 원하는 업무나 반복 워크플로우를 분석하여, 완벽한 형식의 `SKILL.md` 파일과 폴더 구조를 설계해 주는 생성기입니다.

# Task (임무)
사용자가 만들고자 하는 스킬의 목적이나 아이디어를 입력하면, 아래 규칙에 맞춰 최적화된 스킬 코드를 작성해 주세요.

# SKILL.md 작성 표준 규칙

1. Frontmatter (YAML 헤더 - 파일 최상단에 위치)
   - name: 소문자, 숫자, 하이픈(-)만 사용 (1~64자). 하이픈으로 시작·끝나거나 `--`처럼 연속으로 쓰지 않음. 스킬 폴더 이름과 같게 작성 (`/명령어` 이름은 폴더 이름에서 나옴)
   - description: 스킬이 하는 일과 Claude가 이 스킬을 불러와야 하는 시점을 기술. 핵심 용도를 첫 문장에 둘 것 (description과 when_to_use를 합친 텍스트는 스킬 목록에서 1,536자로 잘림)
   - when_to_use: 사용자 스킬 명세의 "트리거 상황"을 바탕으로, 이 스킬을 불러와야 하는 요청 예시를 기술
   - argument-hint: `/명령어` 입력 시 자동완성에 보여줄 인자 형식 (예: `[file-path]`)
   - allowed-tools: 사용자 스킬 명세의 "허용 도구"만 공백으로 구분해 나열. 이 사전 승인은 스킬을 호출한 턴에만 적용되고, 목록에 없는 도구를 막지는 않음
   - 위에 나열하지 않은 frontmatter 필드는 추가하지 않음

2. Body (마크다운 본문 지침)
   - 명확한 단계별(Step-by-step) 실행 워크플로우로 구성
   - 형용사적 지시(예: "친절하게", "짧게") 대신 구체적인 제약 조건(예: "첫 줄에 결론 작성", "항목 3개 이하") 사용
   - SKILL.md는 500줄 이하로 유지하고, 긴 참고 자료는 별도 파일로 분리한 뒤 SKILL.md에서 링크
   - 인자: `$ARGUMENTS`는 전달된 인자 전체, `$0`은 첫 번째 인자, `$1`은 두 번째 인자 (0부터 셈)

# 사용자 스킬 명세
- 아이디어: git diff를 분석해서 PR 리뷰 코멘트를 마크다운 표로 정리해 주는 스킬
- 대상: Claude Code
- 스킬 이름 후보: pr-review
- 호출 방식: 사용자 `/명령어` 호출과 Claude 자동 호출 모두
- 트리거 상황: PR 리뷰해줘, 이번 변경사항 검토해줘, 머지 전에 diff 봐줘
- 인자: `$0` = 리뷰할 경로
- 허용 도구: Read, Grep, Bash(git diff *)
- 입력 예시:
```
/pr-review src/api
```
- 기대 출력 예시:
```
| 파일 | 줄 | 심각도 | 코멘트 |
| --- | --- | --- | --- |
| src/api/user.js | 42 | 높음 | null 체크 없이 user.id에 접근해요 |
```
- 금지사항:
  - 코드를 직접 수정하지 않는다
  - 근거가 되는 줄 번호 없이 지적하지 않는다
- 출력 형식 제약:
  - 첫 줄에 총평 1문장
  - 코멘트는 10개 이하
  - 심각도는 높음/중간/낮음 중 하나

명세에 없는 항목은 제안하되, 제안한 값이라고 표시할 것.

# Output Format (출력 형식)
결과물은 반드시 아래 구조로 제공해 주세요:
1. **스킬 디렉토리 및 파일 구조** (예: `my-skill/SKILL.md`)
2. **복사해서 쓸 수 있는 완성된 SKILL.md 코드** (YAML Frontmatter 포함)
3. **설치 방법 안내**
   - Claude Code: 개인용 `~/.claude/skills/<스킬 폴더명>/SKILL.md` 또는 프로젝트용 `.claude/skills/<스킬 폴더명>/SKILL.md`에 저장. 폴더 이름이 `/명령어` 이름이 됨
4. **테스트 방법**
   - `/스킬 폴더명`으로 직접 실행하는 방법
   - 자동으로 불러와져야 하는 요청 문장 2개와 불러오면 안 되는 요청 문장 1개
   - 스킬을 만든 대화가 아닌 새 세션에서 테스트하라는 안내
5. **규칙 셀프 체크** — name 규칙, description 글자 수(description과 when_to_use를 합쳐 1,536자 기준), 허용되지 않은 frontmatter 필드 포함 여부를 항목별로 통과/실패 표시
````

- [ ] **Step 3: 실패하는 테스트 작성** — `tests/build.test.js`

````js
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
````

- [ ] **Step 4: 실패 확인**

Run: `node --test tests/build.test.js`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` (`build.js`가 아직 없음)

- [ ] **Step 5: `buildPrompt(form, rules)`를 `features/prompt-builder/build.js`에 구현**

조립 규칙 (고정본이 claude-code의 모양을 글자 단위로 정한다):
- 다섯 블록을 빈 줄 하나(`\n\n`)로 잇는다: `ROLE(platform)` → `TASK` → 규칙 블록 → 명세 블록 → 출력 블록.
- **규칙 블록:** `RULES_HEAD`, 빈 줄, `FRONTMATTER_HEAD`, 항목들, 빈 줄, `BODY_HEAD`, 항목들. 항목 줄은 모두 `"   - "`(공백 3칸 + `- `)로 시작한다.
  - claude-code frontmatter 순서: `name: NAME_RULE+NAME_NOTE[p]` → `description: CC_DESCRIPTION` → (트리거 있음) `when_to_use: CC_WHEN_TO_USE` → (인자 활성이고 none 아님) `argument-hint: CC_ARGUMENT_HINT` → (도구나 Bash 패턴 있음) `allowed-tools: CC_ALLOWED_TOOLS` → (user-only/model-only) `CC_INVOCATION[값]` → `NO_EXTRA_FIELDS`
  - claude-ai / both frontmatter 순서: `STD_FIELDS` → `name: …` → `description: STD_DESCRIPTION` → (도구 있음) `allowed-tools: STD_ALLOWED_TOOLS` → `NO_EXTRA_FIELDS`
  - body: `BODY_RULES` 세 줄 → (인자 활성이고 none 아님) `ARGS_RULE`
- **명세 블록:** `SPEC_HEAD` 다음 줄부터 항목, 빈 줄, `SUGGEST_LINE`.
  - 항목 순서: 아이디어 → 대상(`PLATFORM_NAME`, 항상) → 스킬 이름 후보 → 호출 방식(활성일 때 항상, `INVOCATION_TEXT`) → 트리거 상황 → 인자 → 허용 도구(`tools` 뒤에 Bash 패턴, `", "`로 연결) → 입력 예시 → 기대 출력 예시 → 금지사항 → 출력 형식 제약.
  - 값이 공백뿐이거나 비활성인 칸은 뺀다.
  - 값 모양: 입력 예시와 기대 출력 예시는 `- 라벨:` 다음 줄에 ```` ``` ```` 코드 블록. 금지사항과 출력 형식 제약은 항상 `parseLines`로 나눠 `  - 줄` 하위 목록. 나머지는 줄바꿈이 있으면 하위 목록, 없으면 `- 라벨: 값`(trim).
  - 인자 값: whole → `ARGS_WHOLE`, split + 이름 있음 → `` `$0` = 이름, `$1` = 이름 ``, split + 이름 없음 → `ARGS_SPLIT_UNNAMED`.
- **출력 블록:** `OUTPUT_HEAD`, `OUTPUT_1`, `OUTPUT_2`, `OUTPUT_3`, 설치 항목(`"   - "` + `INSTALL[p]`, both는 claude-code와 claude-ai 둘 다), `OUTPUT_4`, 테스트 항목(claude-ai는 `TEST_TRIGGERS`, `TEST_FRESH`, 그 외는 `TEST_SLASH`까지 셋), `SELF_CHECK(p)`를 줄바꿈으로 잇는다.

- [ ] **Step 6: 통과 확인**

Run: `npm test`
Expected: `# pass 33`, `# fail 0`

- [ ] **Step 7: 커밋**

```bash
git add js/data/rules.js js/data/example.js features/prompt-builder/build.js tests/build.test.js tests/fixtures
git commit -m "feat: 대상 플랫폼별 프롬프트 조립"
```

---

### Task 5: 섹션별 입력 개수 계산

**Files:**
- Create: `features/sections/count.js`
- Test: `tests/count.test.js`

**Interfaces:**
- Consumes: `SECTIONS`, `isActive` (Task 2), `DEFAULT_FORM` (Task 2)
- Produces: `countFilled(form: Form): { basic: number, behavior: number, examples: number }`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/count.test.js`

````js
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
````

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/count.test.js`
Expected: FAIL — `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: `countFilled(form)`를 `features/sections/count.js`에 구현**

활성 칸 중 "입력됨"인 것만 센다. 배열은 길이 > 0, 라디오(`platform`, `invocation`, `argMode`)는 기본값과 다를 때, 나머지는 trim 후 빈 문자열이 아닐 때다.

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: `# pass 37`, `# fail 0`

- [ ] **Step 5: 커밋**

```bash
git add features/sections/count.js tests/count.test.js
git commit -m "feat: 섹션별 입력 개수 계산"
```

---

### Task 6: 화면 뼈대와 폼 연결

**Files:**
- Create: `index.html`, `css/base.css`, `js/bind.js`, `js/main.js`, `features/registry.js`, `README.md`

**Interfaces:**
- Consumes: `createStore` (Task 1), `createInitialState`, `DEFAULT_FORM` (Task 2), `rules.js`·`EXAMPLE_FORM` (Task 4)
- Produces: 공통 계약의 DOM 훅·CSS 변수·`ctx`, `bindForm(form: HTMLFormElement, store: Store): void`, `features` 배열(빈 배열로 시작)

- [ ] **Step 1: `index.html` 작성**

`<html lang="ko">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<title>개발자 프롬프트 생성기</title>`, `<link rel="stylesheet" href="css/base.css">`, `<script type="module" src="js/main.js"></script>`를 넣는다. 본문에는 공통 계약의 DOM 훅과 라벨 문구를 그대로 쓴다. 시작 상태는 basic 섹션만 펼침(`aria-expanded="true"`, 본문 표시)이고, behavior와 examples는 접힘(`aria-expanded="false"`, 본문 `hidden`)이다. 칸은 `SECTIONS` 순서로 배치한다.

- [ ] **Step 2: `css/base.css` 작성**

공통 계약의 CSS 변수를 `:root`에 라이트 값으로, `@media (prefers-color-scheme: dark)`에 다크 값으로 정의한다(값은 스펙 §3-2). 그 밖에 다음을 담는다.
- 글자 세트 6단계, 레이아웃
  - ≥900px: 폼과 미리보기 두 열, 미리보기 패널 `position: sticky; top: calc(var(--header-height) + var(--space-4))`, 패널 안 스크롤
  - <900px: 한 열, `.bottom-bar` 표시(≥900px에서는 숨김). 하단 여백은 `env(safe-area-inset-bottom)`를 더한다
- 패널, 칸, 버튼 스타일
  - 버튼: 최소 높이 2.75rem, `touch-action: manipulation`, `:active`에서 `transform: scale(0.97)`, `var(--dur-press)` ease-out
- 상단 바와 하단 바 재질: `background: var(--material-bar); backdrop-filter: blur(20px) saturate(180%)`
- `body` 배경색·글자색 전환: `var(--dur-base)`
- 접근성 설정 3가지(스펙 §3-2)
  - `prefers-reduced-motion`: 버튼 눌림을 배경색 변화로
  - `prefers-reduced-transparency`: 바를 불투명하게
  - `prefers-contrast: more`
- `#server-notice` 스타일, `[hidden] { display: none !important; }`

- [ ] **Step 3: `bindForm(form, store)`를 `js/bind.js`에 구현**

- `form`의 `input`·`change` 이벤트를 위임으로 받아 `name`이 `DEFAULT_FORM` 키인 요소만 처리한다. 읽는 값은 다음과 같다.
  - 라디오: 체크된 값
  - `tools`: 체크된 값 배열(DOM 순서)
  - 나머지: `value`
- 읽은 값으로 `store.set({ form: { [name]: 값 } })`을 호출한다.
- 반대 방향: `store.subscribe(…, (s) => s.form)`로 모든 칸에 값을 쓴다. 단, 이미 같은 값이면 건드리지 않는다. 입력 중 커서가 튀지 않게 하기 위해서다.

- [ ] **Step 4: `features/registry.js`와 `js/main.js` 작성**

`registry.js`: `export const features = [];`

`main.js`는 스펙 7-3장의 순서대로 동작한다.
1. `#server-notice`를 숨긴다.
2. `createStore(createInitialState())`로 상태 저장소를 만든다.
3. `bindForm`으로 폼과 저장소를 연결한다.
4. 등록된 기능을 순서대로 처리한다. `css`가 true면 `new URL('../features/<name>/style.css', import.meta.url)`로 `<link>`를 추가하고, `await load()` 후 `init(ctx)`를 호출한다. 각 기능은 try/catch로 감싸고 실패하면 `console.error`만 남긴다. 한 기능이 실패해도 나머지는 동작해야 하기 때문이다.
5. 마지막에 `store.emit()`을 호출한다.

- [ ] **Step 5: `README.md` 작성**

다음 네 부분으로 쓴다.
- **실행:** VS Code Live Server 확장, 또는 `python -m http.server 8000` → `http://localhost:8000`. `index.html`을 더블클릭하면 동작하지 않는 이유(ES 모듈) 한 줄 포함
- **테스트:** `npm test`
- **기능 추가하는 법:** `features/<이름>/index.js`에 `init(ctx)`를 만들고 `registry.js`에 1줄 등록
- **브라우저 확인 목록:** 스펙 §10의 브라우저 확인 항목을 체크박스로 그대로 옮긴다

- [ ] **Step 6: 확인**

Run: `npm test` → Expected: `# pass 37`

Run: `python -m http.server 8000` → `http://localhost:8000`에서 다음을 확인한다.
- 서버 안내가 안 보이고, 콘솔 오류가 없다.
- 상단 바가 반투명이고 내용이 그 아래로 스크롤된다.
- 900px 미만으로 줄이면 한 열 배치가 되고 하단 바가 보인다.
- OS를 다크 모드로 바꾸면 색이 전환된다.
- 버튼은 누르는 순간 작아진다.

`index.html`을 파일로 직접 열면 서버 안내가 보여야 한다.

- [ ] **Step 7: 커밋**

```bash
git add index.html css js/bind.js js/main.js features/registry.js README.md
git commit -m "feat: 화면 뼈대, 폼-상태 연결, 기능 로더"
```

---

### Task 7: 실시간 미리보기

**Files:**
- Create: `features/prompt-builder/index.js`, `features/prompt-builder/style.css`
- Modify: `features/registry.js` (`prompt-builder` 줄 추가)

**Interfaces:**
- Consumes: `buildPrompt` (Task 4), `ctx.rules`
- Produces: `status.prompt` (Task 12가 복사에 씀)

- [ ] **Step 1: `init(ctx)` 구현**

`store.subscribe(…, (s) => s.form)` 안에서 다음을 한다.
- `prompt = buildPrompt(form, ctx.rules)`를 계산한다.
- `store.set({ status: { prompt } })`로 저장한다.
- `#preview.textContent = prompt`로 화면에 넣는다.
- 디바운스는 두지 않는다.

`style.css`: `#preview`에 `--font-mono`, 0.875rem / 1.6, `white-space: pre-wrap`, `overflow-wrap: anywhere`.

- [ ] **Step 2: 확인**

Run: `npm test` → Expected: `# pass 37`

브라우저에서 다음을 확인한다.
- 아이디어를 한 글자씩 칠 때마다 미리보기가 즉시 바뀐다.
- 아이디어에 `` `$ARGUMENTS` <b>굵게</b> `` 를 넣으면 글자 그대로 보인다(굵게 표시되지 않음).

- [ ] **Step 3: 커밋**

```bash
git add features/prompt-builder features/registry.js
git commit -m "feat: 프롬프트 실시간 미리보기"
```

---

### Task 8: 입력 검사 표시와 글자 수 카운터

**Files:**
- Create: `features/field-check/index.js`, `features/field-check/style.css`, `features/char-counter/index.js`, `features/char-counter/style.css`
- Modify: `features/registry.js` (`field-check`, `char-counter` 줄 추가)

**Interfaces:**
- Consumes: `getBlocking`, `validateName`, `invalidBashPatterns` (Task 3), `rules.DESCRIPTION_LIMIT` (Task 4)
- Produces: `status.blocking` (Task 12가 씀)

- [ ] **Step 1: field-check `init(ctx)` 구현**

`subscribe(…, (s) => s.form)` 안에서 다음을 한다.
- `store.set({ status: { blocking: getBlocking(form) } })`
- `skillName`·`bashPatterns` 칸의 오류 메시지를 `[data-error-for]`에 한 줄씩(`textContent`, 줄바꿈) 넣고 `hidden`을 푼다. 해당 입력에 `aria-invalid="true"`와 `aria-describedby="error-<키>"`를 단다. 오류가 없으면 숨기고 속성을 지운다.
- 아이디어 필수 메시지는 칸 아래에 띄우지 않는다. 복사 영역에서 보여준다(Task 12).

`style.css`:
- `.field-error`: `--color-error`, 0.8125rem / 1.45 / 0.01em, `white-space: pre-line`
- `[aria-invalid="true"]`: 테두리 `--color-error`

- [ ] **Step 2: char-counter `init(ctx)` 구현**

`subscribe(…, (s) => s.form)` 안에서 다음을 한다.
- `n = triggers.length`, `limit = ctx.rules.DESCRIPTION_LIMIT[platform]`
- `[data-counter-for="triggers"]`에 `` `${n.toLocaleString('ko-KR')} / ${limit.toLocaleString('ko-KR')}자 (description 기준 참고값)` ``를 넣는다.
- `n > limit`이면 `is-over` 클래스를 단다.

`style.css`: 보조 글자색, `.is-over`는 `--color-warning`.

- [ ] **Step 3: 확인**

Run: `npm test` → Expected: `# pass 37`

브라우저에서 다음을 확인한다.
- 이름에 `PR 리뷰`를 치면 오류 두 줄이 즉시 보인다. 대문자 문구와 허용 문자 문구다.
- `pr-review`로 고치면 오류가 사라진다.
- Bash 패턴에 `git diff *`를 치면 형식 오류가 보인다.
- 대상을 claude.ai로 바꾸면 카운터 기준이 1,024로 바뀐다.

- [ ] **Step 4: 커밋**

```bash
git add features/field-check features/char-counter features/registry.js
git commit -m "feat: 입력 즉시 검사 표시와 트리거 글자 수"
```

---

### Task 9: 대상별 칸 활성화와 인자 대응표

**Files:**
- Create: `features/platform-switch/index.js`, `features/platform-switch/style.css`, `features/arg-map/index.js`
- Modify: `features/registry.js` (`platform-switch`, `arg-map` 줄 추가)

**Interfaces:**
- Consumes: `isActive`, `disabledReason` (Task 2), `parseList` (Task 2)
- Produces: 없음 (화면만 바꿈)

- [ ] **Step 1: platform-switch `init(ctx)` 구현**

`subscribe(…, (s) => s.form)` 안에서 `[data-field]`마다 다음을 한다.
- `active = isActive(키, form)`를 계산한다.
- 안의 입력 요소들에 `disabled = !active`를 준다.
- 칸에 `is-disabled` 클래스를 토글한다.
- `[data-disabled-reason]`에 `disabledReason(…)`을 `textContent`로 넣고, 활성이면 숨긴다.

비활성 입력은 이벤트가 없으므로 저장소의 값은 그대로 보관된다.

`style.css`:
- `.is-disabled`의 입력 요소: `opacity: 0.45`
- `.field-reason`: 보조 글자색, 0.8125rem

- [ ] **Step 2: arg-map `init(ctx)` 구현**

`subscribe(…, (s) => s.form)` 안에서 다음을 한다.
- `isActive('argNames', form)`이고 `parseList(argNames)`가 비어 있지 않으면, `[data-arg-map]`에 `` `$0 = 경로, $1 = 형식` `` 형태로 넣고 보인다.
- 아니면 숨긴다.

- [ ] **Step 3: 확인**

Run: `npm test` → Expected: `# pass 37`

브라우저에서 다음을 확인한다.
- 인자를 "여러 개로 나눠 받기"로 바꾸고 `경로, 형식,`을 치면 `$0 = 경로, $1 = 형식`이 보인다.
- 대상을 claude.ai로 바꾸면 다음이 일어난다.
  - 호출 방식과 인자 칸이 흐려진다.
  - 이유 문구가 보인다.
  - 미리보기에서 `argument-hint`가 사라진다.
- Claude Code로 되돌리면 입력했던 값이 그대로 살아 있다.

- [ ] **Step 4: 커밋**

```bash
git add features/platform-switch features/arg-map features/registry.js
git commit -m "feat: 대상 플랫폼별 칸 활성화와 인자 대응표"
```

---

### Task 10: 섹션 접기·펼치기와 스크롤 그림자

**Files:**
- Create: `features/sections/index.js`, `features/sections/style.css`, `features/scroll-edge/index.js`, `features/scroll-edge/style.css`
- Modify: `features/registry.js` (`sections`, `scroll-edge` 줄 추가)

**Interfaces:**
- Consumes: `countFilled` (Task 5), `ui.openSections`
- Produces: `ui.openSections`를 바꾸는 토글 (Task 11이 같은 키를 씀)

- [ ] **Step 1: sections `init(ctx)` 구현**

- **토글 버튼 클릭:** `openSections` 전체를 복사해 해당 id만 뒤집어 `set`한다.
- **`subscribe(…, (s) => s.ui.openSections)`:** 섹션마다 `aria-expanded`를 맞추고, 본문 상태를 바꾼다.
  - 펼칠 때: `hidden`을 풀고, 강제 리플로우 후 `data-state="open"`으로 둔다.
  - 접을 때: `data-state="closed"`로 두고, `transitionend` 때 여전히 closed이면 `hidden`을 준다.
  - 움직이는 도중 다시 누르면 상태만 바꾼다. CSS 전환이 현재 위치에서 방향을 바꾼다. 입력을 막지 않는다.
- **입력 개수 표시:** `renderCounts(state)` 함수 하나를 만들고 `subscribe(renderCounts, (s) => s.form)`와 `subscribe(renderCounts, (s) => s.ui.openSections)` 두 구독에 연결한다. 접힌 섹션이고 `countFilled(form)[id] > 0`이면 `[data-section-count]`에 `` `${n}개 입력됨` ``을, 아니면 빈 문자열을 넣는다.

`style.css`:
- `[data-section-body]`: `transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)`
- `[data-state="closed"]`: `opacity: 0; transform: translateY(-0.25rem)`
- 움직임 줄이기 설정: transform 없이 opacity만 `var(--dur-fast)`

- [ ] **Step 2: scroll-edge `init(ctx)` 구현**

`IntersectionObserver`로 `#scroll-sentinel`을 보다가, 보이지 않으면 `.app-header`에 `is-scrolled`를 단다.

`style.css`: `.app-header::after`에 옅은 아래 그림자를 두고 `opacity: 0`에서 `.is-scrolled`일 때 1로, `var(--dur-fast)`.

- [ ] **Step 3: 확인**

Run: `npm test` → Expected: `# pass 37`

브라우저에서 다음을 확인한다.
- 처음에는 "기본"만 펼쳐져 있다.
- "동작"을 펼쳐 트리거를 입력하고 다시 접으면 "1개 입력됨"이 보인다.
- 펼침 중에 빠르게 두 번 눌러도 끊김 없이 방향을 바꾼다.
- 페이지 맨 위에서는 상단 바 그림자가 없고, 스크롤하면 생긴다.

- [ ] **Step 4: 커밋**

```bash
git add features/sections features/scroll-edge features/registry.js
git commit -m "feat: 섹션 접기·펼치기와 스크롤 시 상단 바 그림자"
```

---

### Task 11: 알림과 예시로 채우기·초기화

**Files:**
- Create: `features/toast/index.js`, `features/toast/style.css`, `features/example-fill/index.js`
- Modify: `features/registry.js` (`toast`, `example-fill` 줄 추가)

**Interfaces:**
- Consumes: `ctx.example` (Task 4), `ctx.defaults.createInitialState` (Task 2), `status.toast`
- Produces: `status.toast` 사용 규칙 — 다른 기능은 `{ id: performance.now(), message, undoForm? }`를 `set`하기만 하면 알림이 뜬다 (Task 12가 씀)

- [ ] **Step 1: toast `init(ctx)` 구현**

`subscribe(…, (s) => s.status.toast)`:
- **null일 때:** 현재 알림을 사라지게 한다(아래로 이동 + 투명).
- **값이 있을 때:** 이전 알림을 바로 지우고, `#toast-region`에 새 알림을 만든다. 메시지는 `textContent`로 넣는다. `undoForm`이 있으면 [되돌리기] 버튼을 붙이고, 누르면 `store.set({ form: undoForm, status: { toast: null } })`을 호출한다.
- **자동 닫기:** `undoForm`이 있으면 5000ms, 없으면 3000ms 뒤에 닫는다. 그때 `store.get().status.toast?.id`가 같을 때만 `toast: null`로 바꾼다.

`style.css`:
- 위치: 화면 아래 가운데 고정, `bottom: var(--space-5)`. <900px에서는 `calc(var(--bottom-bar-height) + var(--space-3))`.
- 모양: 패널 색, `--shadow-panel`, `--radius-control`, 최대 너비 `min(28rem, 100% - 2rem)`.
- 움직임: 등장·퇴장 모두 `translateY(100%)` ↔ `0`과 opacity, `var(--dur-base) var(--ease-out)`. 움직임 줄이기 설정에서는 opacity만.

- [ ] **Step 2: example-fill `init(ctx)` 구현**

- **[예시로 채우기]:** `prev = structuredClone(form)`로 이전 입력을 보관한 뒤 아래를 한 번에 `set`한다.
  - `form: structuredClone(ctx.example)`
  - `ui: { openSections: { basic: true, behavior: true, examples: true } }`
  - `status: { toast: { id, message: '예시로 채웠어요', undoForm: prev } }`
- **[초기화]:** 같은 방식으로 `form: ctx.defaults.createInitialState().form`과 `toast: { id, message: '초기화했어요', undoForm: prev }`를 `set`한다. 섹션 열림 상태는 그대로 둔다.
- 확인창은 띄우지 않는다.

- [ ] **Step 3: 확인**

Run: `npm test` → Expected: `# pass 37`

브라우저에서 다음을 확인한다.
- 몇 칸을 입력하고 [예시로 채우기]를 누르면 세 섹션이 모두 펼쳐지고, 예시가 채워지고, 알림이 아래에서 올라온다.
- [되돌리기]를 누르면 이전 입력으로 돌아온다.
- [초기화] 후 5초가 지나면 알림이 내려가며 사라진다.

- [ ] **Step 4: 커밋**

```bash
git add features/toast features/example-fill features/registry.js
git commit -m "feat: 되돌리기 알림, 예시로 채우기, 초기화"
```

---

### Task 12: 프롬프트 복사와 모바일 하단 바

**Files:**
- Create: `features/copy/index.js`, `features/copy/style.css`
- Modify: `features/registry.js` (`copy` 줄 추가)

**Interfaces:**
- Consumes: `status.blocking` (Task 8), `status.prompt` (Task 7), `status.toast` 규칙 (Task 11)
- Produces: 없음

- [ ] **Step 1: `init(ctx)` 구현**

- **`subscribe(…, (s) => s.status.blocking)`:**
  - 두 `[data-action="copy"]` 버튼에 `disabled = blocking.length > 0`을 준다.
  - `[data-slot="copy-hint"]`에는 첫 문제의 `message`를 넣는다. 문제가 없으면 숨긴다.
  - `[data-slot="blocking-count"]`에는 `` `고칠 곳 ${n}개` ``를 넣는다. 0개면 빈 문자열이다.
- **클릭:**
  - `navigator.clipboard.writeText(store.get().status.prompt)`로 복사한다.
  - 성공하면 누른 버튼 글자를 "복사됨 ✓"로 바꾸고 `is-copied` 클래스를 단다. 1500ms 뒤 "프롬프트 복사"로 되돌린다.
  - 실패하거나 `navigator.clipboard`가 없으면 `#preview`의 내용을 `Selection`/`Range`로 전체 선택한다. 그리고 `status.toast`에 "Ctrl+C(맥은 ⌘+C)로 복사하세요"를 `set`한다.

`style.css`:
- `.is-copied`: `--color-success`
- `[data-slot="copy-hint"]`: 보조 글자색, 0.8125rem
- `.bottom-bar` 안 배치: 문제 개수는 왼쪽, 버튼은 오른쪽

- [ ] **Step 2: 확인**

Run: `npm test` → Expected: `# pass 37`

브라우저에서 다음을 확인한다.
- 아이디어가 비어 있으면 복사 버튼이 비활성이고 "아이디어를 먼저 적어주세요"가 보인다.
- [예시로 채우기] 후 [프롬프트 복사]를 누르면 "복사됨 ✓"이 보이고, 다른 곳에 붙여넣으면 미리보기와 같은 내용이다.
- 900px 미만에서는 하단 바 버튼으로도 복사된다.
- `http://<내 IP>:8000`처럼 보안 연결이 아닌 주소에서 열면, 전체 선택과 안내 알림으로 대체된다.

- [ ] **Step 3: 커밋**

```bash
git add features/copy features/registry.js
git commit -m "feat: 프롬프트 복사, 복사 차단 안내, 모바일 하단 바"
```

---

### Task 13: 자동 임시 저장

**Files:**
- Create: `features/autosave/restore.js`, `features/autosave/index.js`
- Modify: `features/registry.js` (`autosave` 줄 추가)
- Test: `tests/restore.test.js`

**Interfaces:**
- Consumes: `DEFAULT_FORM`, `CHOICES` (Task 2)
- Produces: `STORAGE_KEY = 'skill-prompt-generator:form'`, `restoreForm(raw: string | null): Form | null`, `status.savedAt`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/restore.test.js`

````js
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
````

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/restore.test.js`
Expected: FAIL — `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: `restoreForm(raw)`를 `features/autosave/restore.js`에 구현**

- 다음 경우에는 `null`을 돌려준다: `raw`가 null, JSON 해석 실패, 결과가 일반 객체가 아님(배열 포함).
- 그 외에는 `DEFAULT_FORM` 키만 골라 새 폼을 만든다. 키별 규칙은 아래와 같다.
  - `tools`: 배열이면 `CHOICES.tools`에 있는 값만 남긴다. 아니면 `[]`다.
  - `CHOICES`에 있는 키(라디오): 허용된 값일 때만 받는다. 아니면 기본값이다.
  - 나머지: 문자열일 때만 받는다. 아니면 기본값이다.

- [ ] **Step 4: 통과 확인**

Run: `npm test`
Expected: `# pass 41`, `# fail 0`

- [ ] **Step 5: autosave `init(ctx)` 구현**

- **복원:** try/catch로 `localStorage.getItem(STORAGE_KEY)`를 읽는다. `restoreForm` 결과가 있으면 `store.set({ form })`을 호출한다.
- **저장:** 그다음 `subscribe(…, (s) => s.form)`을 단다. 마지막 변경 후 300ms가 지나면 아래를 실행한다.
  - try/catch로 `localStorage.setItem(STORAGE_KEY, JSON.stringify(form))`
  - `store.set({ status: { savedAt: Date.now() } })`
  - `[data-slot="save-status"]`에 "자동 저장됨"을 넣는다.
- **저장소를 쓸 수 없을 때:** 조용히 건너뛴다.

- [ ] **Step 6: 확인**

브라우저에서 다음을 확인한다.
- 몇 칸 입력 후 새로고침하면 값이 그대로 있다. 접힌 섹션에는 "N개 입력됨"이 보인다.
- 개발자 도구에서 `localStorage.setItem('skill-prompt-generator:form', '{깨진')` 후 새로고침해도 빈 폼으로 정상 시작한다.

- [ ] **Step 7: 커밋**

```bash
git add features/autosave tests/restore.test.js features/registry.js
git commit -m "feat: 자동 임시 저장과 안전한 복원"
```

---

### Task 14: 최종 확인

**Files:**
- Modify: `README.md` (확인 결과에 맞게 목록 정리가 필요할 때만)

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: `# pass 41`, `# fail 0`

- [ ] **Step 2: 등록 확인**

`features/registry.js`가 공통 계약의 11줄, 같은 순서와 같은 css 값인지 확인한다.

- [ ] **Step 3: 브라우저 확인 목록**

README의 브라우저 확인 목록을 위에서부터 끝까지 확인한다. 추가로 다음 OS 설정에서도 확인한다.
- 움직임 줄이기: 슬라이드 없이 페이드만
- 투명도 줄이기: 바 불투명

- [ ] **Step 4: 인수 테스트 안내**

[예시로 채우기] → [프롬프트 복사] → 새 Claude 대화에 붙여넣으면 다음 다섯 가지가 응답에 모두 오는지 사용자가 확인한다. 디렉토리 구조, SKILL.md, 설치 방법, 테스트 방법, 규칙 셀프 체크다.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: 최종 확인"
```
