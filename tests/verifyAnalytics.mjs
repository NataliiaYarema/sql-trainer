// Тест-замок аналітичних фікстур. Перевіряє не «SQL виконався», а властивості
// даних: саме вони, а не текст генератора, є контрактом для завдань рівня 8.
//
// Усі числа тут виміряні прогоном, а не оцінені. Якщо якесь із них зрушило —
// генератор змінився, і разом із ним поїхали всі еталонні результати рівня 8.
// Це і є те, що замок мусить ловити.
//
// Межі часу беруться як occurred_at::text навмисно: без приведення значення
// пройшло б через гілку TIMESTAMP у pgResult.js, яка читає локальні складові,
// і тест став би залежним від зони машини.
import { ALL_FIXTURES_SQL, PRODUCTS_SQL } from '../src/tasks/fixtures.js';
import { ANALYTICS_SQL } from '../src/tasks/analyticsFixtures.js';
import { runQuery, closeAll } from './pgHarness.mjs';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

// products потрібна самому тесту, щоб звірити product_id. Генератор без неї
// обходиться — і це навмисно: інакше кожен setupSql із покупками мусив би
// тягнути каталог, навіть коли завдання його не показує.
const SETUP = PRODUCTS_SQL + ANALYTICS_SQL;

const rows = async (sql) => (await runQuery(SETUP, sql)).values;
const row = async (sql) => (await rows(sql))[0];
const scalar = async (sql) => (await row(sql))[0];

check('ALL_FIXTURES_SQL містить аналітичні таблиці', ALL_FIXTURES_SQL.includes(ANALYTICS_SQL));

const counts = await row(`
  SELECT
    (SELECT COUNT(*) FROM app_users),
    (SELECT COUNT(*) FROM app_events),
    (SELECT COUNT(*) FROM app_purchases),
    (SELECT COUNT(DISTINCT session_id) FROM app_events)
`);
check('app_users — 200 рядків', counts[0] === 200);
check('app_events — 3218 рядків', counts[1] === 3218);
check('app_purchases — 274 рядки', counts[2] === 274);
check('сесій — 1187', counts[3] === 1187);

const funnel = await rows(`
  SELECT event_type, COUNT(*)
  FROM app_events
  GROUP BY event_type
  ORDER BY ARRAY_POSITION(
    ARRAY['visit', 'view_product', 'add_to_cart', 'checkout', 'purchase'],
    event_type
  )
`);
check('у воронці рівно пʼять кроків', funnel.length === 5);
check(
  'воронка спадає монотонно й жоден крок не порожній',
  funnel.every(([, n], i) => n > 0 && (i === 0 || n <= funnel[i - 1][1]))
);
check('кроки воронки не зрушили', funnel.map(([, n]) => n).join() === '1187,843,541,373,274');

check(
  'у межах сесії події строго впорядковані в часі',
  (await scalar(`
    SELECT COUNT(*) FROM (
      SELECT
        occurred_at,
        LAG(occurred_at) OVER (PARTITION BY session_id ORDER BY event_id) AS prev
      FROM app_events
    ) AS ordered
    WHERE prev IS NOT NULL AND occurred_at <= prev
  `)) === 0
);

check(
  'сесія належить рівно одному користувачу',
  (await scalar(`
    SELECT COUNT(*) FROM (
      SELECT session_id FROM app_events
      GROUP BY session_id
      HAVING COUNT(DISTINCT user_id) > 1
    ) AS mixed
  `)) === 0
);

// Ядро першої знахідки фінальної рецензії: у першій версії генератора пауза
// була однакова на всю сесію, тож усі чотири переходи мали той самий середній
// час. Тепер пауза перед кожним кроком росте з глибиною — і саме це мусить
// ловити тест, а не просто «дані згенерувалися».
const gaps = await rows(`
  SELECT
    ARRAY_POSITION(
      ARRAY['visit', 'view_product', 'add_to_cart', 'checkout', 'purchase'],
      event_type
    ) AS step,
    ROUND(AVG(EXTRACT(EPOCH FROM (occurred_at - prev)) / 60)::numeric, 2)
  FROM (
    SELECT
      event_type,
      occurred_at,
      LAG(occurred_at) OVER (PARTITION BY session_id ORDER BY event_id) AS prev
    FROM app_events
  ) AS s
  WHERE prev IS NOT NULL
  GROUP BY 1
  ORDER BY 1
`);
check('середній час заміряно для кроків 2-5', gaps.length === 4);
check(
  'середня пауза перед кроком строго зростає з глибиною',
  gaps.every(([, avg], i) => i === 0 || Number(avg) > Number(gaps[i - 1][1]))
);
check(
  'паузи перед кроками 2-5 не зрушили: 1,99 / 5,18 / 10,86 / 21,89 хв',
  gaps.map(([, avg]) => avg).join() === '1.99,5.18,10.86,21.89'
);

// Сесія глибиною n мусить складатися рівно з перших n кроків воронки. Це
// ловить і пропуск (checkout без add_to_cart), і повтор того самого кроку.
check(
  'у сесіях немає пропущених кроків',
  (await scalar(`
    SELECT COUNT(*) FROM (
      SELECT
        COUNT(*) AS n,
        MAX(ARRAY_POSITION(
          ARRAY['visit', 'view_product', 'add_to_cart', 'checkout', 'purchase'],
          event_type
        )) AS deepest
      FROM app_events
      GROUP BY session_id
    ) AS s
    WHERE n <> deepest
  `)) === 0
);

const purchaseLink = await row(`
  SELECT
    (SELECT COUNT(*) FROM app_events WHERE event_type = 'purchase'),
    (SELECT COUNT(*) FROM app_purchases)
`);
check('подій purchase рівно стільки, скільки покупок', purchaseLink[0] === purchaseLink[1]);

check(
  'жодна подія не раніша за реєстрацію свого користувача',
  (await scalar(`
    SELECT COUNT(*)
    FROM app_events AS e
    JOIN app_users AS u ON u.user_id = e.user_id
    WHERE e.occurred_at::date < u.signup_date
  `)) === 0
);

check(
  'кожен user_id з подій і покупок є в app_users',
  (await scalar(`
    SELECT
      (SELECT COUNT(*) FROM app_events AS e
       WHERE NOT EXISTS (SELECT 1 FROM app_users AS u WHERE u.user_id = e.user_id))
      + (SELECT COUNT(*) FROM app_purchases AS p
         WHERE NOT EXISTS (SELECT 1 FROM app_users AS u WHERE u.user_id = p.user_id))
  `)) === 0
);

check(
  'кожен product_id покупки є в products',
  (await scalar(`
    SELECT COUNT(*)
    FROM app_purchases AS p
    WHERE NOT EXISTS (
      SELECT 1 FROM products AS pr WHERE pr.product_id = p.product_id
    )
  `)) === 0
);

const cohorts = await row(`
  SELECT COUNT(*), MIN(n), MAX(n) FROM (
    SELECT DATE_TRUNC('month', signup_date) AS month, COUNT(*) AS n
    FROM app_users
    GROUP BY 1
  ) AS c
`);
check('18 місячних когорт', cohorts[0] === 18);
check('у найменшій когорті не менше пʼяти користувачів', cohorts[1] >= 5);
check('когорти не зрушили: найменша 6, найбільша 16', cohorts[1] === 6 && cohorts[2] === 16);

// Утримання рахується подіями наступного календарного місяця після реєстрації.
// Виродження в 0 або в 200 зробило б половину завдань рівня 8 беззмістовною.
const retained = await scalar(`
  WITH cohort AS (
    SELECT user_id, DATE_TRUNC('month', signup_date) AS month FROM app_users
  )
  SELECT COUNT(DISTINCT c.user_id)
  FROM cohort AS c
  JOIN app_events AS e ON e.user_id = c.user_id
  WHERE DATE_TRUNC('month', e.occurred_at) = c.month + INTERVAL '1 month'
`);
check('утримання першого місяця не вироджене', retained > 0 && retained < 200);
check('утримання першого місяця — 127 користувачів', retained === 127);

// Утримання по кожній когорті окремо: ядро другої знахідки фінальної
// рецензії. У першій версії генератора зсув сесії від реєстрації брався за
// модулем «скільки днів лишалося до кінця періоду» — і пізні когорти
// автоматично мали вище утримання. Тут перевіряємо саме відсутність
// виродження (0% чи 100%) для кожної когорти окремо, а не лише сумарне число.
//
// Останню когорту (2024-06) виключаємо явно: дані закінчуються 2024-06-30,
// тож у неї просто немає наступного календарного місяця, і її утримання
// рівно 0% за побудовою — це не поломка генератора, а нормальна неповна
// когорта.
const cohortRetention = await rows(`
  WITH cohort AS (
    SELECT user_id, DATE_TRUNC('month', signup_date) AS month FROM app_users
  ),
  sizes AS (SELECT month, COUNT(*) AS n FROM cohort GROUP BY month),
  ret AS (
    SELECT c.month, COUNT(DISTINCT c.user_id) AS r
    FROM cohort AS c
    JOIN app_events AS e ON e.user_id = c.user_id
    WHERE DATE_TRUNC('month', e.occurred_at) = c.month + INTERVAL '1 month'
    GROUP BY c.month
  )
  SELECT s.month::text, s.n, COALESCE(r.r, 0)
  FROM sizes AS s LEFT JOIN ret AS r ON r.month = s.month
  ORDER BY s.month
`);
const fullCohorts = cohortRetention.slice(0, -1);
check('останні когорти для перевірки — усі 18, повних 17', cohortRetention.length === 18);
check(
  'остання когорта (2024-06) виключена — саме в неї немає наступного місяця',
  cohortRetention.at(-1)[0].startsWith('2024-06')
);
check(
  'серед 17 повних когорт немає жодної з 0% чи 100% утриманням',
  fullCohorts.length === 17 && fullCohorts.every(([, n, r]) => r > 0 && r < n)
);

const buyers = await row(`
  SELECT COUNT(*), COUNT(*) FILTER (WHERE n >= 2), COUNT(*) FILTER (WHERE n >= 3) FROM (
    SELECT user_id, COUNT(*) AS n FROM app_purchases GROUP BY user_id
  ) AS b
`);
check('покупців — 136', buyers[0] === 136);
check('покупців із двома покупками й більше — 80', buyers[1] === 80);
check('покупців із трьома покупками й більше — 35', buyers[2] === 35);
check('повторних покупців вистачає наскрізному кейсу', buyers[1] >= 50);

const channels = await rows(`
  SELECT channel, COUNT(*) FROM app_users GROUP BY channel ORDER BY COUNT(*) DESC
`);
check('рівно чотири канали', channels.length === 4);
check('найбільший канал не перевищує 45% користувачів', channels[0][1] <= 90);
check('канали не зрушили', channels.map(([, n]) => n).join() === '86,59,30,25');

// Country поки що не читала жодна перевірка: підміна назви країни проходила б
// зеленою й тихо ламала майбутні завдання рівня 8 про конверсію за країнами.
const countries = await rows(`
  SELECT country, COUNT(*) FROM app_users GROUP BY country ORDER BY country
`);
check('рівно шість країн', countries.length === 6);
check(
  'країни не зрушили: Germany 32, Italy 34, Poland 29, Romania 26, USA 35, Ukraine 44',
  countries.map(([, n]) => n).join() === '32,34,29,26,35,44'
);

// Пальне для завдання «хто жодного разу не заходив у застосунок». Якби всі
// 200 користувачів мали хоча б одну подію, таке завдання повертало б порожньо.
const withoutActivity = await row(`
  SELECT
    (SELECT COUNT(*) FROM app_users AS u
     WHERE NOT EXISTS (SELECT 1 FROM app_events AS e WHERE e.user_id = u.user_id)),
    (SELECT COUNT(*) FROM app_users AS u
     WHERE NOT EXISTS (SELECT 1 FROM app_purchases AS p WHERE p.user_id = u.user_id))
`);
check('користувачів без жодної події — 10', withoutActivity[0] === 10);
check('користувачів без жодної покупки — 64', withoutActivity[1] === 64);

const totals = await row(`
  SELECT
    (SELECT ROUND(SUM(amount), 2)::text FROM app_purchases),
    (SELECT SUM(user_id * 31 + product_id) FROM app_purchases),
    (SELECT MIN(occurred_at)::text FROM app_events),
    (SELECT MAX(occurred_at)::text FROM app_events),
    (SELECT MIN(purchase_date)::text FROM app_purchases),
    (SELECT MAX(purchase_date)::text FROM app_purchases),
    (SELECT MIN(signup_date)::text FROM app_users),
    (SELECT MAX(signup_date)::text FROM app_users)
`);
check('сума покупок не зрушила', totals[0] === '44920.57');
check('контрольна сума звʼязків користувач-товар не зрушила', totals[1] === 870068);
check('перша подія — 2023-01-12 10:56:00', totals[2] === '2023-01-12 10:56:00');
check('остання подія — 2024-06-30 13:34:00', totals[3] === '2024-06-30 13:34:00');
check('перша покупка — 2023-01-23', totals[4] === '2023-01-23');
check('остання покупка — 2024-06-30', totals[5] === '2024-06-30');
check('перша реєстрація — 2023-01-08', totals[6] === '2023-01-08');
check('остання реєстрація — 2024-06-24', totals[7] === '2024-06-24');

await closeAll();

console.log(
  failures === 0 ? '\nАналітичні фікстури пройшли перевірку.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
