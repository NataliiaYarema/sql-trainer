import { compareResults } from '../src/compare/resultComparer.js';
import { EMPLOYEES_SQL, ORDERS_SQL } from '../src/tasks/fixtures.js';
import { runQuery, closeAll } from './pgHarness.mjs';

// Тест навмисно не бере завдання з банку: він перевіряє логіку звірки
// результатів, а не вміст `src/tasks/`. Інакше будь-яке перетасування завдань
// ламало б перевірки comparer.

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const run = runQuery;

const unordered = { orderMatters: false };
const reference = await run(
  EMPLOYEES_SQL,
  'SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department;'
);

check('еталон збігається сам із собою', compareResults(reference, reference, unordered).ok);

const altCorrect = await run(
  EMPLOYEES_SQL,
  'SELECT department AS dept, ROUND(AVG(salary), 2) AS mean_pay FROM employees GROUP BY department;'
);
check('інші аліаси + ROUND приймаються', compareResults(altCorrect, reference, unordered).ok);

const swapped = await run(
  EMPLOYEES_SQL,
  'SELECT AVG(salary) AS avg_salary, department FROM employees GROUP BY department;'
);
check('переставлені колонки приймаються', compareResults(swapped, reference, unordered).ok);

const reordered = await run(
  EMPLOYEES_SQL,
  'SELECT department, AVG(salary) FROM employees GROUP BY department ORDER BY department DESC;'
);
check('інший порядок рядків приймається', compareResults(reordered, reference, unordered).ok);

const wrongAgg = await run(
  EMPLOYEES_SQL,
  'SELECT department, MAX(salary) FROM employees GROUP BY department;'
);
check('MAX замість AVG відхиляється', !compareResults(wrongAgg, reference, unordered).ok);

const extraCol = await run(
  EMPLOYEES_SQL,
  'SELECT department, AVG(salary), COUNT(*) FROM employees GROUP BY department;'
);
check('зайва колонка відхиляється', !compareResults(extraCol, reference, unordered).ok);

// Раніше тут стояв запит без GROUP BY. У PostgreSQL він навіть не виконається
// («column must appear in the GROUP BY clause»), тобто до comparer справа не
// дійде. Тому перевіряємо іншу реальну помилку того ж роду: одна група
// загубилася, бо WHERE відсіяв співробітника без департаменту.
const lostGroup = await run(
  EMPLOYEES_SQL,
  'SELECT department, AVG(salary) FROM employees WHERE department IS NOT NULL GROUP BY department;'
);
check('втрачена група відхиляється', !compareResults(lostGroup, reference, unordered).ok);

const ordered = { orderMatters: true };
const orderedRef = await run(
  ORDERS_SQL,
  'SELECT order_id, amount FROM orders ORDER BY amount DESC LIMIT 3;'
);
const wrongOrder = await run(
  ORDERS_SQL,
  'SELECT order_id, amount FROM orders ORDER BY amount ASC LIMIT 3;'
);
check(
  'orderMatters: неправильний порядок відхиляється',
  !compareResults(wrongOrder, orderedRef, ordered).ok
);
check(
  'orderMatters: правильний порядок приймається',
  compareResults(orderedRef, orderedRef, ordered).ok
);

// LAG лишає NULL у першому рядку кожного вікна — перевіряємо, що NULL звіряється,
// а не «губиться» при нормалізації значень.
const lagRef = await run(
  ORDERS_SQL,
  `SELECT customer_id, order_date,
          LAG(amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amount
   FROM orders;`
);
check('NULL у результаті звіряється коректно', compareResults(lagRef, lagRef, unordered).ok);

const nullVsZero = await run(
  ORDERS_SQL,
  `SELECT customer_id, order_date,
          COALESCE(LAG(amount) OVER (PARTITION BY customer_id ORDER BY order_date), 0) AS prev_amount
   FROM orders;`
);
check('NULL не дорівнює нулю', !compareResults(nullVsZero, lagRef, unordered).ok);

await closeAll();

// Дашборд рахує «роботу над помилками» за типом невдачі, тому потрібен
// машинний код, а не лише текст для людини.
const wrongCount = compareResults(
  { columns: ['a'], values: [[1]] },
  { columns: ['a', 'b'], values: [[1, 2]] },
  {}
);
check('невірна кількість колонок має код column-count', wrongCount.code === 'column-count');

const wrongData = compareResults(
  { columns: ['a'], values: [[1]] },
  { columns: ['a'], values: [[2]] },
  {}
);
check('розбіжність даних має код data-mismatch', wrongData.code === 'data-mismatch');

const fine = compareResults(
  { columns: ['a'], values: [[1]] },
  { columns: ['a'], values: [[1]] },
  {}
);
check('успішне порівняння коду не має', fine.code === undefined);

console.log(
  failures === 0 ? '\nУсі перевірки comparer пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
