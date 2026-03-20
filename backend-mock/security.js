// Security helpers for backend-mock

const path = require('path');

function isSafeRelativePath(p) {
  // Disallow absolute paths and path traversal
  if (!p || typeof p !== 'string') return false;
  if (path.isAbsolute(p)) return false;
  const normalized = path.normalize(p);
  if (normalized.startsWith('..') || normalized.includes('..' + path.sep)) return false;
  return true;
}

function escapeShellArg(s) {
  // Minimal shell-arg escaper for POSIX shells; Windows should use spawn with args array
  if (s == null) return '';
  return `'${String(s).replace(/'/g, `'"'"'`)}'`;
}

module.exports = { isSafeRelativePath, escapeShellArg };
