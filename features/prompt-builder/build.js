import { parseList, parseLines } from '../../js/lib/list.js';
import { isActive } from '../../js/data/fields.js';

const item = (s) => `   - ${s}`;
const sub = (lines) => lines.map((l) => `  - ${l}`);

function rulesBlock(form, r, hasArgs, allowed) {
  const p = form.platform;
  const fm = [];
  if (p === 'claude-code') {
    fm.push(`name: ${r.NAME_RULE}${r.NAME_NOTE[p]}`, `description: ${r.CC_DESCRIPTION}`);
    if (form.triggers.trim()) fm.push(`when_to_use: ${r.CC_WHEN_TO_USE}`);
    if (hasArgs) fm.push(`argument-hint: ${r.CC_ARGUMENT_HINT}`);
    if (allowed.length) fm.push(`allowed-tools: ${r.CC_ALLOWED_TOOLS}`);
    if (r.CC_INVOCATION[form.invocation]) fm.push(r.CC_INVOCATION[form.invocation]);
  } else {
    fm.push(r.STD_FIELDS, `name: ${r.NAME_RULE}${r.NAME_NOTE[p]}`, `description: ${r.STD_DESCRIPTION}`);
    if (allowed.length) fm.push(`allowed-tools: ${r.STD_ALLOWED_TOOLS}`);
  }
  fm.push(r.NO_EXTRA_FIELDS);
  const body = [...r.BODY_RULES];
  if (hasArgs) body.push(r.ARGS_RULE);
  return [r.RULES_HEAD, '', r.FRONTMATTER_HEAD, ...fm.map(item), '', r.BODY_HEAD, ...body.map(item)].join('\n');
}

function specBlock(form, r, hasArgs, allowed) {
  const L = r.SPEC_LABELS;
  const lines = [r.SPEC_HEAD];
  const text = (label, value) => {
    const v = value.trim();
    if (!v) return;
    if (v.includes('\n')) lines.push(`- ${label}:`, ...sub(parseLines(v)));
    else lines.push(`- ${label}: ${v}`);
  };
  const code = (label, value) => {
    const v = value.replace(/\r\n/g, '\n').replace(/^\s*\n/, '').trimEnd();
    if (!v.trim()) return;
    // 값 속 백틱 연속보다 긴 펜스여야 바깥 코드 블록이 중간에 닫히지 않는다
    const fence = '`'.repeat(Math.max(3, ...(v.match(/`+/g) ?? []).map((run) => run.length + 1)));
    lines.push(`- ${label}:`, fence, v, fence);
  };
  const list = (label, value) => {
    const items = parseLines(value);
    if (items.length) lines.push(`- ${label}:`, ...sub(items));
  };

  text(L.idea, form.idea);
  lines.push(`- ${L.platform}: ${r.PLATFORM_NAME[form.platform]}`);
  text(L.skillName, form.skillName);
  if (isActive('invocation', form)) lines.push(`- ${L.invocation}: ${r.INVOCATION_TEXT[form.invocation]}`);
  text(L.triggers, form.triggers);
  if (hasArgs) {
    const names = parseList(form.argNames);
    let v = r.ARGS_WHOLE;
    if (form.argMode === 'split') v = names.length ? names.map((n, i) => `\`$${i}\` = ${n}`).join(', ') : r.ARGS_SPLIT_UNNAMED;
    lines.push(`- ${L.args}: ${v}`);
  }
  if (allowed.length) lines.push(`- ${L.tools}: ${allowed.join(', ')}`);
  code(L.inputExample, form.inputExample);
  code(L.outputExample, form.outputExample);
  list(L.prohibitions, form.prohibitions);
  list(L.outputConstraints, form.outputConstraints);
  lines.push('', r.SUGGEST_LINE);
  return lines.join('\n');
}

function outputBlock(form, r) {
  const p = form.platform;
  const install = p === 'both' ? [r.INSTALL['claude-code'], r.INSTALL['claude-ai']] : [r.INSTALL[p]];
  // F7: user-only면 자동 호출이 없고, model-only면 `/` 호출이 없다
  const invocation = isActive('invocation', form) ? form.invocation : 'both';
  const tests = [];
  if (p !== 'claude-ai' && invocation !== 'model-only') tests.push(r.TEST_SLASH);
  if (invocation !== 'user-only') tests.push(r.TEST_TRIGGERS);
  tests.push(r.TEST_FRESH);
  return [r.OUTPUT_HEAD, r.OUTPUT_1, r.OUTPUT_2, r.OUTPUT_3, ...install.map(item), r.OUTPUT_4, ...tests.map(item), r.SELF_CHECK(p)].join('\n');
}

export function buildPrompt(form, rules) {
  const hasArgs = isActive('argMode', form) && form.argMode !== 'none';
  const allowed = [...form.tools, ...parseList(form.bashPatterns)];
  return [
    rules.ROLE(form.platform),
    rules.TASK,
    rulesBlock(form, rules, hasArgs, allowed),
    specBlock(form, rules, hasArgs, allowed),
    outputBlock(form, rules),
  ].join('\n\n');
}
