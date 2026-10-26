export const parseList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

export const parseLines = (text) => text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
