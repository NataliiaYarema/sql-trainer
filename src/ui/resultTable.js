import { icon, escapeHtml } from '../utils/dom.js';
import { t } from '../i18n/index.js';

const MAX_ROWS = 100;

function renderCell(value) {
  if (value === null || value === undefined) {
    return '<td class="cell--null">NULL</td>';
  }
  if (typeof value === 'number') {
    return `<td class="cell--number">${escapeHtml(value)}</td>`;
  }
  return `<td>${escapeHtml(value)}</td>`;
}

// Чиста функція розмітки — за конвенцією проєкту. Теорії потрібна та сама
// таблиця, що й під запитом користувача: якби вона малювала свою, результат
// у теорії й у вправі виглядали б по-різному без жодної на те причини.
export function resultTableHtml(result, { label } = {}) {
  if (!result) return '';

  const rows = result.values.slice(0, MAX_ROWS);
  const truncated = result.values.length > MAX_ROWS;
  // Підпис за замовчуванням беремо тут, а не в значенні параметра: значення
  // параметра обчислилося б раз на завантаження модуля й зафіксувало мову.
  const heading = label ?? t('result.yourQuery');

  return `
    <div class="result-block">
      <div class="result-block__head">
        <span class="section-label">${icon('i-table')}${escapeHtml(heading)}</span>
        <span class="result-block__meta">
          ${escapeHtml(t('result.rows', { count: result.values.length }))}${truncated ? escapeHtml(t('result.truncated', { count: MAX_ROWS })) : ''}
        </span>
      </div>
      <div class="table-scroll">
        <table class="result-table">
          <thead>
            <tr>${result.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map(renderCell).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderResultTable(root, result) {
  root.innerHTML = resultTableHtml(result);
}

export function clearResultTable(root) {
  root.innerHTML = '';
}
