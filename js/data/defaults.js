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
