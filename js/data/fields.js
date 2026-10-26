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
