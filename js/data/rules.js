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
