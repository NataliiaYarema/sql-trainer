export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function icon(id) {
  return `<svg class="icon"><use href="#${id}" /></svg>`;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function dedent(sql) {
  const lines = sql.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length);
  const minIndent = Math.min(...indents);
  return lines.map((l) => l.slice(minIndent)).join('\n');
}
