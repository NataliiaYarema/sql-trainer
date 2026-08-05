// Дані аналітичного продукту для рівня 8: реєстрації, поведінка в сесіях і
// покупки. На відміну від fixtures.js, де кожен рядок підібраний вручну під
// конкретне завдання, тут дані породжуються — когорти й воронки на двадцяти
// рядках вироджуються в «нуль або сто відсотків» і нічого не навчають.
//
// Псевдовипадковість дає md5: ('x' || substr(md5(вираз), 1, 7))::bit(28)::int.
// Сім шістнадцяткових цифр — це рівно 28 біт, тому число завжди невідʼємне й
// приведення до int не переповнюється. Різна сіль ('u', 'c', 'k', …) дає
// незалежні між собою величини з одного й того самого джерела.
// Виміряно: два незалежні прогони дають однакові контрольні суми.
//
// Модуль самодостатній: він НЕ читає products, хоча app_purchases.product_id
// туди й посилається. Якби читав, ANALYTICS_SQL не виконувався б без каталогу,
// і кожен setupSql із покупками мусив би тягнути products — навіть у завданнях
// про LTV, яким каталог не потрібен. Тоді завдання могло б непомітно
// звернутися до неоголошеної таблиці, а саме це й ловить pgHarness.
// Наслідок: сума покупки не повʼязана з ціною товара, і завдання, яке
// порівнює amount із products.price, писати не можна.
//
// Друга версія генератора (замінила першу за фінальною рецензією підетапу
// B4): прибрала два артефакти, знайдені при перевірці властивостей даних.
//
// 1. Пауза між кроками воронки більше не однакова. У першій версії була одна
//    пауза на всю сесію, тому всі чотири переходи мали той самий середній
//    час — завдання «на якому кроці користувачі затримуються найдовше» дало
//    б чотири однакові числа. Тепер пауза задається перед кожним кроком
//    окремо й росте з глибиною (CASE step у під запиті з гепами), а
//    SUM(gap_minutes) OVER (PARTITION BY session_id ORDER BY step) накопичує
//    її в occurred_at. Виміряно: середній час перед кроками 2-5 —
//    1,99 → 5,18 → 10,86 → 21,89 хвилини.
// 2. Сесії більше не розкидані рівномірно до кінця періоду. У першій версії
//    зсув від реєстрації брався за модулем «скільки днів лишалося до
//    2024-06-30», через що пізні когорти майже гарантовано мали подію
//    наступного місяця, і утримання зростало з новизною когорти — 29% у
//    січні 2023 проти 100% у травні 2024. Тепер зсув має фіксований спадний
//    розподіл (400 * POWER(u, 2.2)), не залежний від решти вікна, а сесії,
//    що випадають за 2024-06-30, просто не сталися (WHERE started_at <
//    TIMESTAMP '2024-07-01'). Виміряно: утримання по 17 повних когортах
//    гуляє в межах 43-90% без тренду.
// 3. Сесій на користувача стало 1-14 замість 1-10 — компенсація за відкинуті
//    сесії з пункту 2.
//
// Червнева когорта 2024 має утримання рівно 0% — і це НЕ поломка. У неї
// просто немає наступного календарного місяця в даних (дані закінчуються
// 2024-06-30), тому «утримання першого місяця» для неї неможливо порахувати
// в принципі. Це нормальна неповна когорта, і саме тому перевірка
// невиродженості в tests/verifyAnalytics.mjs явно виключає її й лишає лише
// 17 повних когорт.
//
// Властивості цих даних закріплені в tests/verifyAnalytics.mjs. Підкручувати
// коефіцієнти нижче, щоб окреме завдання дало зручніший результат, —
// найгірше, що можна тут зробити: поїдуть усі інші завдання рівня одночасно.
export const ANALYTICS_SQL = `
CREATE TABLE app_users (
  user_id INTEGER,
  signup_date DATE,
  country TEXT,
  channel TEXT
);

-- Реєстрації за 18 місяців, з 2023-01-01 по 2024-06-30. POWER(u, 0.8) зсуває
-- їх до пізніших місяців: продукт росте, і рівні когорти виглядали б штучно.
-- Виміряно: 18 когорт від 6 до 16 людей.
INSERT INTO app_users (user_id, signup_date, country, channel)
SELECT
  g,
  DATE '2023-01-01'
    + FLOOR(545 * POWER((h_day % 1000) / 1000.0, 0.8))::int,
  (ARRAY['Ukraine', 'USA', 'Poland', 'Germany', 'Romania', 'Italy'])[1 + h_geo % 6],
  CASE
    WHEN h_ch % 100 < 40 THEN 'organic'
    WHEN h_ch % 100 < 70 THEN 'ads'
    WHEN h_ch % 100 < 88 THEN 'referral'
    ELSE 'email'
  END
FROM (
  SELECT
    g,
    ('x' || substr(md5('u' || g), 1, 7))::bit(28)::int AS h_day,
    ('x' || substr(md5('c' || g), 1, 7))::bit(28)::int AS h_geo,
    ('x' || substr(md5('k' || g), 1, 7))::bit(28)::int AS h_ch
  FROM generate_series(1, 200) AS g
) AS raw;

CREATE TABLE app_events (
  event_id INTEGER,
  session_id INTEGER,
  user_id INTEGER,
  event_type TEXT,
  occurred_at TIMESTAMP
);

INSERT INTO app_events (event_id, session_id, user_id, event_type, occurred_at)
SELECT
  ROW_NUMBER() OVER (ORDER BY session_id, step),
  session_id,
  user_id,
  event_type,
  occurred_at
FROM (
  SELECT
    session_id,
    user_id,
    step,
    (ARRAY['visit', 'view_product', 'add_to_cart', 'checkout', 'purchase'])[step]
      AS event_type,
    started_at
      + INTERVAL '1 minute'
        * SUM(gap_minutes) OVER (PARTITION BY session_id ORDER BY step)
      AS occurred_at
  FROM (
    SELECT
      sessions.session_id,
      sessions.user_id,
      step,
      sessions.started_at,
      -- Пауза перед кроком, а не після: перший крок сесії має нуль. Базова
      -- пауза росте з глибиною — роздивитися товар швидко, зважитися на
      -- оплату довго, — а розкид навколо неї дає хеш кроку.
      CASE step
        WHEN 1 THEN 0
        WHEN 2 THEN 1 + ('x' || substr(md5('w1' || sessions.session_id), 1, 7))::bit(28)::int % 3
        WHEN 3 THEN 3 + ('x' || substr(md5('w2' || sessions.session_id), 1, 7))::bit(28)::int % 5
        WHEN 4 THEN 7 + ('x' || substr(md5('w3' || sessions.session_id), 1, 7))::bit(28)::int % 9
        ELSE 14 + ('x' || substr(md5('w4' || sessions.session_id), 1, 7))::bit(28)::int % 17
      END AS gap_minutes
    FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY user_id, k) AS session_id,
        user_id,
        started_at,
        -- Глибина сесії, а не незалежний відсів на кожному кроці. Це не
        -- спрощення, а гарантія: сесія розгортається в перші depth кроків
        -- воронки, тому checkout без add_to_cart стає неможливим за
        -- побудовою. Розподіл 30/25/15/8/22 дає воронку
        -- 1187 → 843 → 541 → 373 → 274.
        CASE
          WHEN h_depth % 100 < 30 THEN 1
          WHEN h_depth % 100 < 55 THEN 2
          WHEN h_depth % 100 < 70 THEN 3
          WHEN h_depth % 100 < 78 THEN 4
          ELSE 5
        END AS depth
      FROM (
        SELECT
          u.user_id,
          k,
          -- Активність спадає з часом від реєстрації: POWER(u, 2.2) стягує
          -- більшість сесій до перших тижнів. Зсув НЕ залежить від того,
          -- скільки днів лишалося користувачу до кінця періоду, — інакше
          -- пізні когорти автоматично мали б вище утримання.
          u.signup_date
            + FLOOR(400 * POWER(
                (('x' || substr(md5('d' || u.user_id || '-' || k), 1, 7))::bit(28)::int
                  % 1000) / 1000.0,
                2.2
              ))::int
            + INTERVAL '1 hour'
              * (8 + ('x' || substr(md5('h' || u.user_id || '-' || k), 1, 7))::bit(28)::int % 14)
            + INTERVAL '1 minute'
              * (('x' || substr(md5('m' || u.user_id || '-' || k), 1, 7))::bit(28)::int % 60)
            AS started_at,
          ('x' || substr(md5('p' || u.user_id || '-' || k), 1, 7))::bit(28)::int AS h_depth
        FROM app_users AS u,
          generate_series(
            1,
            1 + ('x' || substr(md5('n' || u.user_id), 1, 7))::bit(28)::int % 14
          ) AS k
      ) AS raw_sessions
      -- Сесії, що випали б за кінець періоду, просто не сталися: свіжий
      -- користувач ще не встиг стільки разів зайти.
      WHERE started_at < TIMESTAMP '2024-07-01'
    ) AS sessions,
      generate_series(1, sessions.depth) AS step
  ) AS with_gaps
) AS events;

CREATE TABLE app_purchases (
  purchase_id INTEGER,
  user_id INTEGER,
  product_id INTEGER,
  purchase_date DATE,
  amount NUMERIC
);

-- Покупки виводяться з подій purchase, а не генеруються окремо: так рядок у
-- цій таблиці й подія у воронці збігаються за побудовою, а не за
-- домовленістю. POWER(u, 2.2) зсуває суми до дрібних — середній чек виходить
-- 164, а не 255, як дала б рівномірність.
INSERT INTO app_purchases (purchase_id, user_id, product_id, purchase_date, amount)
SELECT
  ROW_NUMBER() OVER (ORDER BY event_id),
  user_id,
  1 + ('x' || substr(md5('t' || event_id), 1, 7))::bit(28)::int % 25,
  occurred_at::date,
  ROUND(
    (10 + 490 * POWER(
      (('x' || substr(md5('a' || event_id), 1, 7))::bit(28)::int % 1000) / 1000.0,
      2.2
    ))::numeric,
    2
  )
FROM app_events
WHERE event_type = 'purchase';
`;
