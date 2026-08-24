import { icon, escapeHtml } from '../utils/dom.js';

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
export function resultTableHtml(result, { label = 'Результат твого запиту' } = {}) {
  if (!result) return '';

  const rows = result.values.slice(0, MAX_ROWS);
  const truncated = result.values.length > MAX_ROWS;

  return `
    <div class="result-block">
      <div class="result-block__head">
        <span class="section-label">${icon('i-table')}${escapeHtml(label)}</span>
        <span class="result-block__meta">
          ${result.values.length} рядк(ів)${truncated ? `, показано перші ${MAX_ROWS}` : ''}
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
