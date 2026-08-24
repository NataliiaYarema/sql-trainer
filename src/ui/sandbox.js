import { icon, escapeHtml, dedent } from '../utils/dom.js';

// Порожній редактор не підказує, з чого почати. Цей запит одразу показує і
// синтаксис, і те, що дані в базі справжні. Записаний він так само, як
// приклади в теорії — колонки з відступом, кожна секція з нового рядка, —
// тож перше, що людина бачить у пісочниці, вчить ще й оформленню.
export const INITIAL_SANDBOX_SQL = dedent(`
  SELECT
    first_name,
    last_name,
    department,
    salary
  FROM employees
  LIMIT 10;
`);

// Що показати в редакторі при відкритті пісочниці.
//
// Перевіряємо саме вміст, а не `?? INITIAL_SANDBOX_SQL`: у сховищі цілком
// може лежати порожній рядок (користувач стер усе й вийшов), а `??` реагує
// лише на null. Тоді редактор відкривався б порожнім, і ця порожнеча
// закріплювала б себе при наступному ж збереженні.
export function sandboxInitialSql(saved) {
  return saved && saved.trim() !== '' ? saved : INITIAL_SANDBOX_SQL;
}

// Опис схеми має вигляд `employees(employee_id INT, first_name TEXT)`.
//
// Парсер живе тут, а не поруч зі схемами: verifyTasks.mjs робить
// Object.values(schemas) і кожне значення проганяє через /^(\w+)\(/, кидаючи
// виняток на невідповідності. Функція в тому модулі зламала б увесь банк
// завдань, і причина була б неочевидною.
export function parseSchemaLine(line) {
  const open = line.indexOf('(');
  const close = line.lastIndexOf(')');
  return {
    name: line.slice(0, open),
    columns: line
      .slice(open + 1, close)
      .split(',')
      .map((column) => column.trim()),
  };
}

// schemaLines приходять аргументом, а не імпортом: так модуль не знає про банк
// завдань і перевіряється звичайним node-скриптом.
export function sandboxSchemaHtml(schemaLines) {
  return `
    <div class="sandbox-schema">
      <div class="sandbox-schema__head">
        <span class="level-pill">${icon('i-table')}Пісочниця</span>
      </div>
      <h2 class="sandbox-schema__title">Таблиці бази</h2>
      <p class="sandbox-schema__hint">
        Експериментуй із SQL-запитами та досліджуй таблиці.
      </p>
      ${schemaLines.map(parseSchemaLine).map(tableHtml).join('')}
    </div>
  `;
}

function tableHtml({ name, columns }) {
  return `
    <details class="sandbox-table">
      <summary class="sandbox-table__name">${escapeHtml(name)}</summary>
      <ul class="sandbox-table__columns">
        ${columns.map((column) => `<li>${escapeHtml(column)}</li>`).join('')}
      </ul>
    </details>
  `;
}

// Розмітка кнопок повторює controls.js: та сама пара класів, та сама окрема
// смуга для «На головну», щоб пісочниця не виглядала чужою.
export function sandboxControlsHtml() {
  return `
    <div class="controls">
      <button class="btn btn--primary" data-action="run">
        ${icon('i-play')}Виконати
      </button>
    </div>
    <div class="controls-home">
      <button class="btn btn--ghost" data-action="to-home">
        ${icon('i-arrow-left')}На головну
      </button>
    </div>
  `;
}

export function renderSandboxSchema(root, schemaLines) {
  root.innerHTML = sandboxSchemaHtml(schemaLines);
}

export function renderSandboxControls(root, handlers) {
  root.innerHTML = sandboxControlsHtml();
  root.querySelector('[data-action="run"]').addEventListener('click', handlers.onRun);
  root.querySelector('[data-action="to-home"]').addEventListener('click', handlers.onToHome);
}
