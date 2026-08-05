import * as schemas from '../src/tasks/schemas.js';
import {
  INITIAL_SANDBOX_SQL,
  parseSchemaLine,
  sandboxSchemaHtml,
  sandboxControlsHtml,
  sandboxInitialSql,
} from '../src/ui/sandbox.js';
// Модуль читає localStorage лише в момент виклику функції, а не при
// завантаженні, тому статичний імпорт до підстановки заглушки безпечний.
import { loadSandboxSql, saveSandboxSql, clearSandboxSql } from '../src/game/persistence.js';
import { progressHtml } from '../src/ui/progressBar.js';
import { checkSqlFormatting } from './sqlFormat.mjs';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const schemaLines = Object.values(schemas);

// Парсер
const employees = parseSchemaLine(schemas.EMPLOYEES_SCHEMA);
check('парсер бере назву таблиці', employees.name === 'employees');
check('парсер бере всі сім колонок employees', employees.columns.length === 7);
check('колонка зберігає тип', employees.columns[0] === 'employee_id INT');
check('остання колонка не тягне дужку', employees.columns.at(-1) === 'manager_id INT');

// Довідник
const html = sandboxSchemaHtml(schemaLines);
check(
  'довідник показує кожну таблицю',
  schemaLines.every((line) => html.includes(`>${parseSchemaLine(line).name}<`))
);
check(
  'кожна таблиця згорнута окремим details',
  (html.match(/<details/g) ?? []).length === schemaLines.length
);
check('колонки лежать усередині', html.includes('salary NUMERIC'));
check('розмітка екранується', sandboxSchemaHtml(['x(<b>bad</b> TEXT)']).includes('&lt;b&gt;'));

// Кнопки
const controls = sandboxControlsHtml();
check('є кнопка виконання', controls.includes('data-action="run"'));
check('є кнопка «На головну»', controls.includes('data-action="to-home"'));

// Початковий запит
check('початковий запит — SELECT', /^SELECT/i.test(INITIAL_SANDBOX_SQL));
check('початковий запит завершено крапкою з комою', INITIAL_SANDBOX_SQL.trim().endsWith(';'));

// Той самий стандарт запису, що в теорії та еталонних розв'язках: перший
// запит, який людина бачить у пісочниці, показує не лише синтаксис, а й те,
// як запит прийнято оформляти.
checkSqlFormatting(
  [{ name: 'початковий запит', sql: INITIAL_SANDBOX_SQL }],
  check,
  'початковий запит відформатовано як приклади теорії'
);

// Який запит показати при відкритті. Порожній рядок — не те саме, що null:
// саме на ньому зламався перший варіант, де стояв ?? замість перевірки на
// вміст. Користувач бачив порожній редактор, і порожнеча закріплювала себе
// при наступному збереженні.
check('без збереженого показуємо початковий', sandboxInitialSql(null) === INITIAL_SANDBOX_SQL);
check('порожній рядок теж дає початковий', sandboxInitialSql('') === INITIAL_SANDBOX_SQL);
check('самі пробіли дають початковий', sandboxInitialSql('   \n  ') === INITIAL_SANDBOX_SQL);
check('збережений запит повертається як є', sandboxInitialSql('SELECT 1;') === 'SELECT 1;');

// Кнопка в шапці
check('кнопка пісочниці є в шапці', progressHtml({}).includes('data-action="sandbox"'));
check(
  'на самій пісочниці кнопки немає',
  !progressHtml({ active: 'sandbox' }).includes('data-action="sandbox"')
);
check(
  'на пісочниці лишаються інші кнопки шапки',
  progressHtml({ active: 'sandbox' }).includes('data-action="dashboard"')
);

// Збереження запиту. У Node немає localStorage, тому підсовуємо заглушку —
// тим самим прийомом, що й verifyState.mjs.
globalThis.localStorage = {
  value: null,
  getItem() {
    return this.value;
  },
  setItem(key, next) {
    this.value = next;
  },
  removeItem() {
    this.value = null;
  },
};

check('порожнє сховище дає null', loadSandboxSql() === null);
saveSandboxSql('SELECT 1;');
check('запит зберігається й читається', loadSandboxSql() === 'SELECT 1;');

// «Очистити весь прогрес» стирає й запит пісочниці: кнопка обіцяє прибрати
// все, крім нотаток, і залишений запит зробив би обіцянку неточною.
clearSandboxSql();
check('очищення прибирає запит пісочниці', loadSandboxSql() === null);
check(
  'після очищення показується початковий запит',
  sandboxInitialSql(loadSandboxSql()) === INITIAL_SANDBOX_SQL
);

delete globalThis.localStorage;
check('без сховища читання не падає', loadSandboxSql() === null);

let wroteWithoutStorage = false;
try {
  saveSandboxSql('SELECT 2;');
  wroteWithoutStorage = true;
} catch {
  // Змінна лишається false — саме це й буде провалом перевірки нижче.
}
check('без сховища запис не кидає виняток', wroteWithoutStorage);

console.log(
  failures === 0 ? '\nУсі перевірки пісочниці пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
