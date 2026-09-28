// Захист «лише SELECT / WITH» у вигляді чистого модуля: без PGlite і wasm,
// тому його можна перевірити звичайним node-скриптом — так само, як pgResult.js.
//
// Самі дані від зміни захищає не цей regex, а сам PostgreSQL: після
// SET default_transaction_read_only = on будь-які INSERT, UPDATE, DROP і
// CREATE відхиляються. Regex лишається заради зрозумілого повідомлення
// замість сирої помилки бази.
//
// Через це перелік слів має бути **вузьким**: зайве слово нічого не захищає,
// зате мовчки блокує законний запит. Саме так і сталося зі скалярною функцією
// REPLACE(рядок, що, на що) — оператора REPLACE у PostgreSQL немає
// (SQLite-івський REPLACE INTO сюди не стосується), а CREATE OR REPLACE
// ловиться словом create.
import { t } from '../i18n/index.js';

export const FORBIDDEN_STATEMENT =
  /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|begin|commit|rollback)\b/i;

// Функція, а не константа: константа зафіксувала б мову на момент завантаження
// модуля, а мова змінюється в пам'яті, без перезавантаження сторінки.
export function forbiddenStatementMessage() {
  return t('sql.forbidden');
}

// Повертає знайдене заборонене слово або null. Слово в поверненні, а не
// просто true, — щоб тест міг назвати, об що саме спіткнувся запит.
export function forbiddenStatementIn(sql) {
  const found = FORBIDDEN_STATEMENT.exec(sql);
  return found ? found[0] : null;
}
