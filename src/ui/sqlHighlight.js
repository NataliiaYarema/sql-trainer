import { escapeHtml } from '../utils/dom.js';

// Мінімальна підсвітка SQL для статичного тексту: приклади теорії та еталонні
// розв'язки. У редакторі цим займається CodeMirror — тут же потрібен лише
// рядок HTML, тому кольори свідомо взято ті самі, що в темі редактора,
// щоб запит виглядав однаково, де б користувач його не бачив.

const KEYWORDS = new Set([
  'SELECT',
  'DISTINCT',
  'AS',
  'FROM',
  'WHERE',
  'GROUP',
  'BY',
  'HAVING',
  'ORDER',
  'ASC',
  'DESC',
  'LIMIT',
  'OFFSET',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'FULL',
  'CROSS',
  'ON',
  'USING',
  'UNION',
  'ALL',
  'EXCEPT',
  'INTERSECT',
  'WITH',
  'RECURSIVE',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'LIKE',
  'GLOB',
  'BETWEEN',
  'EXISTS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'CAST',
  'OVER',
  'PARTITION',
  'ROWS',
  'RANGE',
  'GROUPS',
  'PRECEDING',
  'FOLLOWING',
  'CURRENT',
  'ROW',
  'UNBOUNDED',
  'FILTER',
  'WINDOW',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'VIEW',
  'INDEX',
  'DROP',
  'PRIMARY',
  'KEY',
  'REFERENCES',
  'INTEGER',
  'TEXT',
  'NUMERIC',
  'REAL',
  'BLOB',
  'INT',
]);

// Порядок альтернатив і є пріоритетом розбору: рядок у лапках має бути
// розпізнаний раніше за число, інакше дата '2024-01-05' розсиплеться.
const TOKEN =
  /(--[^\n]*)|(\/\*[\s\S]*?\*\/)|('[^']*(?:''[^']*)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z_0-9]*)|([(),;.*+\-/<>=!%|]+)/g;

function wordClass(word, sql, endIndex) {
  if (KEYWORDS.has(word.toUpperCase())) return 'keyword';
  // Функцією вважаємо слово, за яким одразу йде дужка: так COUNT( — функція,
  // а customers у "FROM customers (…)" нею не стане.
  return sql[endIndex] === '(' ? 'function' : null;
}

function tokenClass(match, sql) {
  const [text, lineComment, blockComment, string, number, word] = match;
  if (lineComment || blockComment) return 'comment';
  if (string) return 'string';
  if (number) return 'number';
  if (word) return wordClass(word, sql, match.index + text.length);
  return 'punct';
}

export function highlightSql(sql) {
  let html = '';
  let cursor = 0;

  TOKEN.lastIndex = 0;
  let match;
  while ((match = TOKEN.exec(sql)) !== null) {
    if (match.index > cursor) html += escapeHtml(sql.slice(cursor, match.index));

    const cls = tokenClass(match, sql);
    const text = escapeHtml(match[0]);
    html += cls ? `<span class="sql-${cls}">${text}</span>` : text;

    cursor = match.index + match[0].length;
  }

  return html + escapeHtml(sql.slice(cursor));
}
