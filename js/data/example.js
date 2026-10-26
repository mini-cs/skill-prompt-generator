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
