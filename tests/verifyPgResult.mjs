// Тип 1114 драйвер конструює в зоні машини, тому в UTC різниця між гілками
// адаптера невидима: локальні й UTC-складові збігаються, і тест зеленітиме
// навіть із поверненою вадою. Фіксуємо зону, щоб перевірка мала що ловити.
process.env.TZ = 'Europe/Kyiv';

import { toResult } from '../src/db/pgResult.js';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const TEXT = 25;
const INT4 = 23;
const NUMERIC = 1700;
const DATE = 1082;
const TIMESTAMP = 1114;
const TIMESTAMPTZ = 1184;

const simple = toResult({
  fields: [
    { name: 'name', dataTypeID: TEXT },
    { name: 'total', dataTypeID: NUMERIC },
  ],
  rows: [
    ['Anna', '120.50'],
    ['Ivan', '75.00'],
  ],
});
check('назви колонок беруться з fields', simple.columns.join() === 'name,total');
check('рядки лишаються масивами', simple.values.length === 2);
check('текст не змінюється', simple.values[0][0] === 'Anna');
check('NUMERIC лишається рядком як є', simple.values[0][1] === '120.50');

// Однакові назви колонок трапляються в JOIN: SELECT c.customer_id, o.customer_id.
// Саме через них PGlite опитується в режимі rowMode: 'array' — об'єктний режим
// загубив би одну з двох колонок.
const duplicated = toResult({
  fields: [
    { name: 'customer_id', dataTypeID: INT4 },
    { name: 'customer_id', dataTypeID: INT4 },
  ],
  rows: [[1, 7]],
});
check('однойменні колонки не зливаються', duplicated.values[0].join() === '1,7');
check('однойменні колонки обидві в заголовку', duplicated.columns.length === 2);

// Дата приходить об'єктом Date і без форматування показалася б у таблиці
// як 2024-01-05T00:00:00.000Z.
const dated = toResult({
  fields: [{ name: 'order_date', dataTypeID: DATE }],
  rows: [[new Date('2024-01-05T00:00:00.000Z')]],
});
check('DATE форматується як YYYY-MM-DD', dated.values[0][0] === '2024-01-05');

// DATE_TRUNC повертає саме timestamptz (виміряно: oid 1184). Драйвер знає
// зону, сервер працює в UTC — тому UTC-складові дають ті самі цифри, що
// показав би psql.
const midnight = toResult({
  fields: [{ name: 'month', dataTypeID: TIMESTAMPTZ }],
  rows: [[new Date('2024-03-01T00:00:00.000Z')]],
});
check('TIMESTAMPTZ опівночі показується без часу', midnight.values[0][0] === '2024-03-01');

const withTime = toResult({
  fields: [{ name: 'moment', dataTypeID: TIMESTAMPTZ }],
  rows: [[new Date('2024-03-01T14:07:09.000Z')]],
});
check('TIMESTAMPTZ з часом показує час', withTime.values[0][0] === '2024-03-01 14:07:09');

// timestamp without time zone приходить голим текстом «2024-06-19 00:00:00»,
// і драйвер збирає з нього new Date(2024, 5, 19) — у зоні машини. Тому дату
// тут конструюємо окремими аргументами, а не рядком із Z: такий тест дає
// однаковий результат і в Києві, і на машині в UTC.
const localMidnight = toResult({
  fields: [{ name: 'return_deadline', dataTypeID: TIMESTAMP }],
  rows: [[new Date(2024, 5, 19, 0, 0, 0)]],
});
check('TIMESTAMP опівночі показується без часу', localMidnight.values[0][0] === '2024-06-19');

const localTime = toResult({
  fields: [{ name: 'moment', dataTypeID: TIMESTAMP }],
  rows: [[new Date(2024, 5, 19, 14, 7, 9)]],
});
check('TIMESTAMP з часом показує час', localTime.values[0][0] === '2024-06-19 14:07:09');

// Однозначні місяць і день мають доповнюватися нулем, інакше сортування
// рядків у таблиці розсипається: '2024-1-5' стоїть після '2024-12-01'.
const single = toResult({
  fields: [{ name: 'd', dataTypeID: DATE }],
  rows: [[new Date('2024-01-05T00:00:00.000Z')]],
});
check('місяць і день доповнюються нулем', single.values[0][0] === '2024-01-05');

const empty = toResult({
  fields: [{ name: 'name', dataTypeID: TEXT }],
  rows: [],
});
check('нуль рядків зберігає заголовок', empty.columns.join() === 'name');
check('нуль рядків дає порожній values', empty.values.length === 0);

const nulls = toResult({
  fields: [
    { name: 'department', dataTypeID: TEXT },
    { name: 'hire_date', dataTypeID: DATE },
  ],
  rows: [[null, null]],
});
check('NULL лишається null у тексті', nulls.values[0][0] === null);
check('NULL лишається null у даті', nulls.values[0][1] === null);

console.log(
  failures === 0
    ? '\nУсі перевірки адаптера результату пройдено.'
    : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
