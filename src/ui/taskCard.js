import { icon, escapeHtml } from '../utils/dom.js';
import { LEVEL_NAMES, TIER_LABELS } from '../tasks/index.js';

// Розбирає рядок виду "employees(employee_id INT, first_name TEXT)" на назву
// таблиці та список колонок, щоб показати кожне поле окремим рядком.
function parseSchema(schemaDescription) {
  return schemaDescription
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\w+)\s*\((.*)\)$/s);
      if (!match) return { name: line, columns: [] };
      const [, name, body] = match;
      const columns = body.split(',').map((part) => {
        const [columnName, ...typeParts] = part.trim().split(/\s+/);
        return { name: columnName, type: typeParts.join(' ') };
      });
      return { name, columns };
    });
}

function renderSchema(schemaDescription) {
  return parseSchema(schemaDescription)
    .map(
      (table) => `
        <div class="schema-table">
          <div class="schema-table__name">${escapeHtml(table.name)}</div>
          <ul class="schema-table__columns">
            ${table.columns
              .map(
                (column) => `
                  <li class="schema-column">
                    <span class="schema-column__name">${escapeHtml(column.name)}</span>
                    <span class="schema-column__type">${escapeHtml(column.type)}</span>
                  </li>
                `
              )
              .join('')}
          </ul>
        </div>
      `
    )
    .join('');
}

export function renderTaskCard(root, { task, index, total, isSolved, caseStudySteps = 0 }) {
  root.innerHTML = `
    <div class="task-card">
      <div class="task-card__head">
        <span class="level-pill">${icon('i-target')}Рівень ${task.level} · ${escapeHtml(LEVEL_NAMES[task.level])}</span>
        <span class="tier-pill tier-pill--${task.tier}">${escapeHtml(TIER_LABELS[task.tier])}</span>
        <span class="task-counter">Завдання ${index + 1} з ${total}</span>
        ${isSolved ? `<span class="solved-mark">${icon('i-check')}вже розв'язано</span>` : ''}
      </div>

      <h2 class="task-card__title">${escapeHtml(task.title)}</h2>

      ${
        task.caseStudy
          ? `<div class="case-pill">${icon('i-flag')}Кейс: ${escapeHtml(task.caseStudy.title)} — крок ${task.caseStudy.step} з ${caseStudySteps}</div>`
          : ''
      }

      <div class="task-section">
        <div class="section-label">${icon('i-briefcase')}Бізнес-контекст</div>
        <div class="task-section__body task-section__body--muted">${escapeHtml(task.context)}</div>
      </div>

      <div class="task-section">
        <div class="section-label">${icon('i-table')}Структура даних</div>
        <div class="schema-block">${renderSchema(task.schemaDescription)}</div>
      </div>

      <div class="task-section">
        <div class="section-label">${icon('i-target')}Завдання</div>
        <div class="task-section__body">${escapeHtml(task.taskText)}</div>
      </div>

      <div class="task-section">
        <div class="section-label">${icon('i-columns')}Очікувані колонки</div>
        <div class="column-chips">
          ${task.expectedOutputColumns.map((c) => `<span class="column-chip">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}
