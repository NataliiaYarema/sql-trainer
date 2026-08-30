import { PGlite } from '@electric-sql/pglite';
import { toResult } from './pgResult.js';
import { FORBIDDEN_STATEMENT, FORBIDDEN_STATEMENT_MESSAGE } from './sqlGuard.js';
import { ALL_FIXTURES_SQL } from '../tasks/fixtures.js';

// Один інстанс PGlite на весь застосунок. Свіжа база під кожен запит коштує
// ~850 мс (заміряно), тобто 1,7 с на кожен клік «Перевірити» — запит
// користувача плюс еталон. Спільна база стартує раз за ~1,2 с, далі запит
// відпрацьовує за частки мілісекунди.
//
// Дані від зміни захищає не regex, а сам PostgreSQL: після
// SET default_transaction_read_only = on будь-які INSERT, UPDATE, DROP і
// CREATE відхиляються, а SELECT і WITH працюють як раніше.
let dbPromise = null;

function initDbOnce() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new PGlite();
      // Без UTC локальний час машини зсуває результат DATE_TRUNC на годину
      // назад, і початок березня показується як 29 лютого.
      await db.query("SET timezone = 'UTC'");
      await db.exec(ALL_FIXTURES_SQL);
      await db.query('SET default_transaction_read_only = on');
      return db;
    })();
  }
  return dbPromise;
}

export class SqlUserError extends Error {}

async function runSelect(sql) {
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new SqlUserError('Запит порожній. Напиши SQL-запит перед перевіркою.');
  }
  if (FORBIDDEN_STATEMENT.test(trimmed)) {
    throw new SqlUserError(FORBIDDEN_STATEMENT_MESSAGE);
  }

  const db = await initDbOnce();

  let result;
  try {
    // rowMode: 'array' обов'язковий. В об'єктному режимі два однойменні поля
    // (SELECT c.customer_id, o.customer_id) злилися б в одне.
    result = await db.query(trimmed, [], { rowMode: 'array' });
  } catch (err) {
    if (/multiple commands/i.test(err.message)) {
      throw new SqlUserError('Дозволено виконувати лише один запит за раз.');
    }
    throw new SqlUserError(`Помилка SQL: ${err.message}`);
  }

  if (!result.fields || result.fields.length === 0) {
    throw new SqlUserError('Запит не повернув результату. Переконайтесь, що це SELECT-запит.');
  }

  return toResult(result);
}

// setupSql у застосунку не використовується: база одна, і в ній є всі таблиці.
// Параметр лишається в сигнатурі, бо саме він у tests/pgHarness.mjs доводить,
// що завдання обходиться таблицями, показаними користувачу.
export async function executeUserQuery(setupSql, userSql) {
  return runSelect(userSql);
}

export async function executeReferenceQuery(setupSql, referenceSql) {
  return runSelect(referenceSql);
}
