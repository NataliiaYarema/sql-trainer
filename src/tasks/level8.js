import { ANALYTICS_SQL } from './analyticsFixtures.js';
import { PRODUCTS_SQL } from './fixtures.js';
import {
  APP_USERS_SCHEMA,
  APP_EVENTS_SCHEMA,
  APP_PURCHASES_SCHEMA,
  PRODUCTS_SCHEMA,
} from './schemas.js';

export default [
  {
    id: 'L8-signup-cohorts',
    level: 8,
    tier: 'basic',
    topic: ['cohort'],
    title: 'Розмір когорт за місяцем реєстрації',
    context:
      'Продуктовий аналітик хоче зрозуміти, чи росте приплив нових користувачів місяць до місяця.',
    schemaDescription: APP_USERS_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Порахуйте, скільки користувачів зареєструвалося кожного місяця, показавши місяць першою датою періоду.',
    expectedOutputColumns: ['cohort_month', 'users'],
    orderMatters: false,
    referenceSql: `
      SELECT
        DATE_TRUNC('month', signup_date)::date AS cohort_month,
        COUNT(*) AS users
      FROM app_users
      GROUP BY DATE_TRUNC('month', signup_date)
      ORDER BY cohort_month;
    `,
    hints: [
      'Потрібно порахувати, скільки нових людей приєдналося до застосунку в кожному календарному місяці, і показати цей місяць як дату.',
      "DATE_TRUNC('month', ...) зрізає дату до першого числа її місяця — саме ця дата й стає позначкою для GROUP BY.",
      "Скелет: SELECT DATE_TRUNC('month', signup_date)::date AS cohort_month, COUNT(*) AS users FROM app_users GROUP BY DATE_TRUNC('month', signup_date) ORDER BY cohort_month;",
    ],
    explanation:
      "DATE_TRUNC('month', …) повертає першу дату місяця, а не його назву, і саме ця дата стає позначкою когорти. Когорту визначає дата реєстрації користувача, і надалі вона закріплена за ним назавжди — незалежно від того, коли він щось робить у застосунку. Виміряний результат: 18 місяців, від 6 до 16 користувачів у кожному.",
  },
  {
    id: 'L8-funnel-steps',
    level: 8,
    tier: 'basic',
    topic: ['funnel'],
    title: 'Кроки воронки',
    context: 'Команда хоче побачити, скільки людей доходить до кожного кроку покупки.',
    schemaDescription: APP_EVENTS_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText: 'Порахуйте кількість подій кожного типу, від найчастіших до найрідших.',
    expectedOutputColumns: ['event_type', 'events'],
    orderMatters: true,
    referenceSql: `
      SELECT
        event_type,
        COUNT(*) AS events
      FROM app_events
      GROUP BY event_type
      ORDER BY events DESC;
    `,
    hints: [
      'Потрібно порахувати, скільки разів трапилася кожна дія користувачів у застосунку, і розташувати результат від найпоширенішої дії до найрідкіснішої.',
      'GROUP BY складає події в купки за типом, а COUNT(*) рахує розмір кожної купки; ORDER BY за спаданням розташовує їх від найбільшої до найменшої.',
      'Скелет: SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type ORDER BY events DESC;',
    ],
    explanation:
      'Сортування за спаданням тут показує саме порядок воронки: кожен наступний крок — підмножина попереднього (щоб оформити покупку, треба спершу покласти товар у кошик), тому кількості спадають за побудовою, а не випадково. COUNT(*) тут рахує події, а не людей: той самий користувач міг зробити кілька візитів чи переглядів товару. Виміряний результат: 1187, 843, 541, 373, 274.',
  },
  {
    id: 'L8-active-users-by-month',
    level: 8,
    tier: 'basic',
    topic: ['active-users'],
    title: 'Активні користувачі по місяцях',
    context:
      'Продуктовий аналітик стежить, чи росте кількість людей, які реально користуються застосунком щомісяця.',
    schemaDescription: APP_EVENTS_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText: 'Порахуйте, скільки різних користувачів здійснювали дії в застосунку кожного місяця.',
    expectedOutputColumns: ['month', 'active_users'],
    orderMatters: false,
    referenceSql: `
      SELECT
        DATE_TRUNC('month', occurred_at)::date AS month,
        COUNT(DISTINCT user_id) AS active_users
      FROM app_events
      GROUP BY DATE_TRUNC('month', occurred_at)
      ORDER BY month;
    `,
    hints: [
      'Потрібно порахувати, скільки різних людей заходили в застосунок кожного місяця, а не скільки всього дій вони зробили.',
      "DATE_TRUNC('month', ...) зрізає дату до першого числа її місяця, а COUNT(DISTINCT user_id) рахує кожного користувача один раз, навіть якщо в нього багато подій.",
      "Скелет: SELECT DATE_TRUNC('month', occurred_at)::date AS month, COUNT(DISTINCT user_id) AS active_users FROM app_events GROUP BY DATE_TRUNC('month', occurred_at) ORDER BY month;",
    ],
    explanation:
      'Подій 3218, а людей 190, тому COUNT(*) тут відповів би на інше питання; той самий користувач із десятьма сесіями в місяці має рахуватися один раз. Виміряно: 18 місяців, від 5 активних у січні 2023 до 69 у квітні 2024 — ряд росте майже монотонно.',
  },
  {
    id: 'L8-sessions-per-user',
    level: 8,
    tier: 'basic',
    topic: ['session'],
    title: 'Найактивніші користувачі за сесіями',
    context:
      'Продакт-менеджер хоче знайти десятьох найзалученіших користувачів за кількістю сесій.',
    schemaDescription: APP_EVENTS_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Знайдіть десятьох користувачів із найбільшою кількістю сесій, від найактивнішого до менш активного.',
    expectedOutputColumns: ['user_id', 'sessions'],
    orderMatters: true,
    referenceSql: `
      SELECT
        user_id,
        COUNT(DISTINCT session_id) AS sessions
      FROM app_events
      GROUP BY user_id
      ORDER BY sessions DESC, user_id
      LIMIT 10;
    `,
    hints: [
      'Потрібно знайти десятьох людей, які заходили в застосунок найчастіше, і показати їх від найактивнішого до менш активного.',
      'COUNT(DISTINCT session_id) рахує кількість унікальних сесій на користувача; GROUP BY групує події за user_id, а LIMIT обмежує результат десятьма рядками.',
      'Скелет: SELECT user_id, COUNT(DISTINCT session_id) AS sessions FROM app_events GROUP BY user_id ORDER BY sessions DESC, user_id LIMIT 10;',
    ],
    explanation:
      'Чому COUNT(DISTINCT session_id), а не COUNT(*): одна сесія містить від однієї до пʼяти подій, тому рахунок подій дав би зовсім інший рейтинг; і чому в ORDER BY є другий ключ user_id — без нього порядок серед однакових значень не визначений, а завдання з LIMIT має мати однозначну відповідь. Виміряно: 10 рядків, від 14 до 12 сесій.',
  },
  {
    id: 'L8-revenue-by-month',
    level: 8,
    tier: 'basic',
    topic: ['revenue'],
    title: 'Виручка застосунку по місяцях',
    context: 'Фінансовий аналітик хоче побачити кількість покупок і виручку за кожен місяць.',
    schemaDescription: APP_PURCHASES_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText: 'Порахуйте кількість покупок і суму виручки за кожен місяць.',
    expectedOutputColumns: ['month', 'purchases', 'revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT
        DATE_TRUNC('month', purchase_date)::date AS month,
        COUNT(*) AS purchases,
        ROUND(SUM(amount), 2) AS revenue
      FROM app_purchases
      GROUP BY DATE_TRUNC('month', purchase_date)
      ORDER BY month;
    `,
    hints: [
      'Потрібно порахувати, скільки покупок відбулося і на яку суму, для кожного календарного місяця.',
      "DATE_TRUNC('month', ...) зрізає дату покупки до першого числа місяця; COUNT(*) рахує покупки, а SUM(amount) із ROUND — суму, округлену до копійок.",
      "Скелет: SELECT DATE_TRUNC('month', purchase_date)::date AS month, COUNT(*) AS purchases, ROUND(SUM(amount), 2) AS revenue FROM app_purchases GROUP BY DATE_TRUNC('month', purchase_date) ORDER BY month;",
    ],
    explanation:
      'Навіщо ROUND(SUM(amount), 2): NUMERIC складається точно, але сума копійок дає довгий хвіст, і звіт про гроші округлюють до копійок явно. Виміряно: 18 місяців, від 72,12 у січні 2023.',
  },
  {
    id: 'L8-avg-check-by-country',
    level: 8,
    tier: 'basic',
    topic: ['segmentation'],
    title: 'Середній чек по країнах',
    context:
      'Менеджер із продажів порівнює країни не за загальною виручкою, а за тим, наскільки великий чек лишає покупець за одну покупку.',
    schemaDescription: `${APP_USERS_SCHEMA}\n${APP_PURCHASES_SCHEMA}`,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Порахуйте кількість покупок і середній чек у кожній країні користувача, округливши середнє до копійок.',
    expectedOutputColumns: ['country', 'purchases', 'avg_check'],
    orderMatters: false,
    referenceSql: `
      SELECT
        u.country,
        COUNT(*) AS purchases,
        ROUND(AVG(p.amount), 2) AS avg_check
      FROM app_purchases AS p
      JOIN app_users AS u ON u.user_id = p.user_id
      GROUP BY u.country
      ORDER BY avg_check DESC;
    `,
    hints: [
      'Потрібно порахувати, скільки покупок зробили в кожній країні і на яку середню суму виходить одна покупка, округливши її до копійок.',
      'JOIN додає до покупки країну користувача, GROUP BY складає покупки в купки за країною, а AVG із ROUND рахує середню суму в купці.',
      'Скелет: SELECT u.country, COUNT(*) AS purchases, ROUND(AVG(p.amount), 2) AS avg_check FROM app_purchases AS p JOIN app_users AS u ON u.user_id = p.user_id GROUP BY u.country ORDER BY avg_check DESC;',
    ],
    explanation:
      'Середній чек і загальна виручка відповідають на різні питання: Україна дає найбільше покупок (73), але водночас найнижчий середній чек (137,95), а США — навпаки, лише 37 покупок при найвищому середньому (210,29). Країна з найбільшою кількістю покупок і країна з найвищим середнім чеком тут — це різні країни, і плутати ці два рейтинги не можна. Виміряно: 6 рядків — по одному на країну.',
  },
  {
    id: 'L8-buyers-by-channel',
    level: 8,
    tier: 'basic',
    topic: ['conversion'],
    title: 'Скільки користувачів каналу доходить до покупки',
    context:
      'Маркетолог оцінює канали залучення не за кількістю людей, а за тим, яка частка з них взагалі щось купує.',
    schemaDescription: `${APP_USERS_SCHEMA}\n${APP_PURCHASES_SCHEMA}`,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Для кожного каналу залучення порахуйте, скільки користувачів прийшло і скільки з них зробили хоча б одну покупку.',
    expectedOutputColumns: ['channel', 'users', 'buyers'],
    orderMatters: false,
    referenceSql: `
      SELECT
        u.channel,
        COUNT(DISTINCT u.user_id) AS users,
        COUNT(DISTINCT p.user_id) AS buyers
      FROM app_users AS u
      LEFT JOIN app_purchases AS p ON p.user_id = u.user_id
      GROUP BY u.channel
      ORDER BY users DESC;
    `,
    hints: [
      'Для кожного каналу залучення потрібні одразу два числа: скільки людей прийшло цим каналом і скільки з них хоч раз щось купили.',
      'LEFT JOIN лишає в результаті й тих користувачів, у яких немає жодної покупки; COUNT(DISTINCT ...) рахує кожного користувача один раз, навіть якщо покупок у нього декілька.',
      'Скелет: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, COUNT(DISTINCT p.user_id) AS buyers FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY users DESC;',
    ],
    explanation:
      'Чому LEFT JOIN, а не звичайний JOIN: зі звичайним JOIN користувач без жодної покупки зник би з відповіді разом із рядком у знаменнику, і канал виглядав би меншим, ніж є насправді. Чому в обох COUNT є DISTINCT: після JOIN користувач із трьома покупками дає три рядки, і без DISTINCT він порахувався б тричі. Виміряно: organic 86 користувачів і 61 покупець, ads 59/40, email 30/17, referral 25/18.',
  },
  {
    id: 'L8-ltv-by-channel',
    level: 8,
    tier: 'basic',
    topic: ['ltv'],
    title: 'LTV за каналом залучення',
    context:
      'Продакт-менеджер хоче порівняти канали залучення за грошима, які приносить один залучений користувач, а не лише за кількістю покупців.',
    schemaDescription: `${APP_USERS_SCHEMA}\n${APP_PURCHASES_SCHEMA}`,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Порахуйте LTV кожного каналу залучення — середню суму покупок на одного зареєстрованого користувача, включно з тими, хто нічого не купив.',
    expectedOutputColumns: ['channel', 'users', 'ltv'],
    orderMatters: false,
    referenceSql: `
      SELECT
        u.channel,
        COUNT(DISTINCT u.user_id) AS users,
        ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT u.user_id), 2)
          AS ltv
      FROM app_users AS u
      LEFT JOIN app_purchases AS p ON p.user_id = u.user_id
      GROUP BY u.channel
      ORDER BY ltv DESC;
    `,
    hints: [
      'Потрібно порахувати, скільки грошей у середньому приносить каналу один залучений користувач — і той, хто купував, і той, хто ні.',
      'SUM(p.amount) після LEFT JOIN дає загальну суму покупок каналу, COALESCE підставляє нуль там, де покупок не було, а ділення на COUNT(DISTINCT u.user_id) — усіх зареєстрованих — дає середнє на людину.',
      'Скелет: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT u.user_id), 2) AS ltv FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY ltv DESC;',
    ],
    explanation:
      'Знаменник тут — усі зареєстровані користувачі каналу, а не лише покупці: інакше вийшов би середній чек покупця, а не віддача каналу на кожного залученого. COALESCE рятує канал без жодної покупки від NULL у чисельнику. Виміряно: organic 247,27, referral 240,16, email 210,40, ads 192,19 — і найбільший канал (organic, 86 користувачів) виявляється водночас найкращим за віддачею, що буває не завжди.',
  },
  {
    id: 'L8-step-conversion',
    level: 8,
    tier: 'medium',
    topic: ['conversion', 'funnel'],
    title: 'Конверсія крок до кроку',
    context:
      'Продакт-аналітик хоче знайти, на якому саме переході воронки застосунок втрачає найбільше людей, а не лише побачити загальні цифри по кроках.',
    schemaDescription: APP_EVENTS_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Порахуйте кількість подій кожного типу, а для кожного кроку, крім першого, — яку частку у відсотках він становить від кроку перед ним, округливши до десятої.',
    expectedOutputColumns: ['event_type', 'events', 'step_conversion'],
    orderMatters: true,
    referenceSql: `
      WITH funnel AS (
        SELECT
          event_type,
          COUNT(*) AS events
        FROM app_events
        GROUP BY event_type
      )
      SELECT
        event_type,
        events,
        ROUND(100.0 * events / LAG(events) OVER (ORDER BY events DESC), 1)
          AS step_conversion
      FROM funnel
      ORDER BY events DESC;
    `,
    hints: [
      'Спершу порахуйте, скільки разів трапилася кожна дія, і розташуйте кроки від найпоширенішого до найрідкіснішого. Потім для кожного кроку, крім першого, порахуйте, яку частку від попереднього кроку він становить у відсотках.',
      'CTE рахує кількість подій по кроках окремо, а віконна функція LAG(events) OVER (ORDER BY events DESC) дивиться на кількість попереднього рядка вікна — з нею й порівнюється поточний крок.',
      'Скелет: WITH funnel AS (SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type) SELECT event_type, events, ROUND(100.0 * events / LAG(events) OVER (ORDER BY events DESC), 1) AS step_conversion FROM funnel ORDER BY events DESC;',
    ],
    explanation:
      'У першого рядка (visit) step_conversion — NULL: попереднього кроку немає, і це правильний результат, а не поломка. Сортування за спаданням кількості тут збігається з порядком воронки лише тому, що кожен наступний крок — підмножина попереднього (дійти до checkout можна тільки через add_to_cart); якби кількість на кроці могла зрости, ORDER BY events DESC довелося б замінити на явний порядок кроків. Перемножити ці чотири відсотки й сказати «наскрізна конверсія 71 %» — помилка: 71,0 % × 64,2 % × 68,9 % × 73,5 % дають близько 23 %, а не 71 %, — саме стільки перших відвідувачів насправді доходять до покупки. Виміряно: 71,0 / 64,2 / 68,9 / 73,5.',
  },
  {
    id: 'L8-first-month-retention',
    level: 8,
    tier: 'medium',
    topic: ['cohort', 'retention'],
    title: 'Утримання першого місяця по когортах',
    context:
      'Продакт-менеджер хоче знати, чи повертаються нові користувачі в перший наступний місяць після реєстрації, а не лише скільки їх прийшло.',
    schemaDescription: `${APP_USERS_SCHEMA}\n${APP_EVENTS_SCHEMA}`,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Для кожної когорти реєстрації (місяць) порахуйте розмір когорти, скільки її користувачів здійснили хоч одну дію рівно наступного календарного місяця й яка це частка у відсотках.',
    expectedOutputColumns: ['cohort_month', 'cohort_size', 'retained', 'retention_rate'],
    orderMatters: false,
    referenceSql: `
      WITH cohort AS (
        SELECT
          user_id,
          DATE_TRUNC('month', signup_date) AS cohort_month
        FROM app_users
      ),
      retained AS (
        SELECT DISTINCT
          c.user_id,
          c.cohort_month
        FROM cohort AS c
        JOIN app_events AS e ON e.user_id = c.user_id
        WHERE DATE_TRUNC('month', e.occurred_at)
          = c.cohort_month + INTERVAL '1 month'
      )
      SELECT
        c.cohort_month::date AS cohort_month,
        COUNT(*) AS cohort_size,
        COUNT(r.user_id) AS retained,
        ROUND(100.0 * COUNT(r.user_id) / COUNT(*), 1) AS retention_rate
      FROM cohort AS c
      LEFT JOIN retained AS r ON r.user_id = c.user_id
      GROUP BY c.cohort_month
      ORDER BY cohort_month;
    `,
    hints: [
      'Розбийте користувачів на групи за місяцем реєстрації. Для кожної групи перевірте, чи людина зробила щось у застосунку саме в наступному календарному місяці після реєстрації, і порахуйте цю частку від усієї групи.',
      "Перший CTE визначає когорту кожного користувача через DATE_TRUNC('month', signup_date), другий — DISTINCT-ом відбирає тих, у кого є подія рівно в cohort_month + INTERVAL '1 month'; LEFT JOIN цих двох CTE не губить когорту, у якої повернень не було.",
      "Скелет: WITH cohort AS (SELECT user_id, DATE_TRUNC('month', signup_date) AS cohort_month FROM app_users), retained AS (SELECT DISTINCT c.user_id, c.cohort_month FROM cohort AS c JOIN app_events AS e ON e.user_id = c.user_id WHERE DATE_TRUNC('month', e.occurred_at) = c.cohort_month + INTERVAL '1 month') SELECT c.cohort_month::date AS cohort_month, COUNT(*) AS cohort_size, COUNT(r.user_id) AS retained, ROUND(100.0 * COUNT(r.user_id) / COUNT(*), 1) AS retention_rate FROM cohort AS c LEFT JOIN retained AS r ON r.user_id = c.user_id GROUP BY c.cohort_month ORDER BY cohort_month;",
    ],
    explanation:
      "LEFT JOIN тут обов'язковий: зі звичайним JOIN когорта, у якій не повернувся жоден користувач, зникла б із відповіді разом зі своїм рядком, хоча мусить показати 0 %. DISTINCT у retained не дає одному користувачеві з кількома подіями наступного місяця порахуватися кілька разів — без нього когорта могла б показати утримання понад 100 %. Остання когорта, 2024-06, показує 0 % не через провал продукту: у неї просто немає наступного календарного місяця в даних (дані закінчуються 2024-06-30), тому перевірити повернення для неї в принципі неможливо. Виміряно: 18 рядків, від 42,9 % у січні 2023.",
  },
  {
    id: 'L8-rfm-quartiles',
    level: 8,
    tier: 'medium',
    topic: ['rfm'],
    title: 'RFM-квартилі покупців',
    context:
      'Маркетолог хоче розкласти покупців на групи за трьома різними ознаками одразу, щоб потім комбінувати сегменти.',
    schemaDescription: APP_PURCHASES_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Для кожного покупця порахуйте дату останньої покупки, кількість покупок і суму, а потім розподіліть покупців на чотири рівні групи окремо за кожною з цих трьох ознак.',
    expectedOutputColumns: [
      'user_id',
      'recency_quartile',
      'frequency_quartile',
      'monetary_quartile',
    ],
    orderMatters: false,
    referenceSql: `
      WITH base AS (
        SELECT
          user_id,
          MAX(purchase_date) AS last_purchase,
          COUNT(*) AS frequency,
          SUM(amount) AS monetary
        FROM app_purchases
        GROUP BY user_id
      )
      SELECT
        user_id,
        NTILE(4) OVER (ORDER BY last_purchase) AS recency_quartile,
        NTILE(4) OVER (ORDER BY frequency) AS frequency_quartile,
        NTILE(4) OVER (ORDER BY monetary) AS monetary_quartile
      FROM base
      ORDER BY user_id;
    `,
    hints: [
      'Спершу для кожного покупця знайдіть дату останньої покупки, кількість покупок і загальну суму. Потім розділіть усіх покупців на чотири рівні групи — окремо за давністю останньої покупки, окремо за кількістю покупок, окремо за сумою.',
      'NTILE(4) OVER (ORDER BY ...) ділить відсортованих покупців на чотири групи так, щоб у кожній було приблизно однаково людей; три окремі NTILE в одному SELECT рахуються незалежно, кожен зі своїм ORDER BY.',
      'Скелет: WITH base AS (SELECT user_id, MAX(purchase_date) AS last_purchase, COUNT(*) AS frequency, SUM(amount) AS monetary FROM app_purchases GROUP BY user_id) SELECT user_id, NTILE(4) OVER (ORDER BY last_purchase) AS recency_quartile, NTILE(4) OVER (ORDER BY frequency) AS frequency_quartile, NTILE(4) OVER (ORDER BY monetary) AS monetary_quartile FROM base ORDER BY user_id;',
    ],
    explanation:
      'NTILE(4) ділить покупців на квартилі за кількістю людей у групі, а не за сумою значення: межі груп підлаштовуються під дані так, щоб у кожному квартилі опинилося приблизно однаково покупців, а не так, щоб діапазон значень був однаковим. Три NTILE в одному SELECT — три незалежні вікна, кожне зі своїм ORDER BY, тому той самий покупець цілком може опинитися в першому квартилі за частотою і в четвертому за сумою одночасно. Виміряно: 136 рядків, по одному на покупця.',
  },
  {
    id: 'L8-repeat-buyer-share',
    level: 8,
    tier: 'medium',
    topic: ['case-study', 'conversion'],
    title: 'Скільки покупців повертається по другу покупку',
    context:
      'Команда хоче зрозуміти, що відбувається з користувачем після першої покупки, і починає розслідування з найпростішого числа: яка частка покупців узагалі повертається за другою.',
    caseStudy: {
      id: 'conversion',
      title: 'Аналіз конверсії користувачів',
      step: 1,
    },
    schemaDescription: APP_PURCHASES_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Порахуйте загальну кількість покупців, скільки з них зробили дві покупки й більше, і яка це частка у відсотках, округлена до десятої.',
    expectedOutputColumns: ['buyers', 'repeat_buyers', 'repeat_rate'],
    orderMatters: false,
    referenceSql: `
      WITH buyer_purchases AS (
        SELECT
          user_id,
          COUNT(*) AS purchases
        FROM app_purchases
        GROUP BY user_id
      )
      SELECT
        COUNT(*) AS buyers,
        COUNT(*) FILTER (WHERE purchases >= 2) AS repeat_buyers,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE purchases >= 2) / COUNT(*),
          1
        ) AS repeat_rate
      FROM buyer_purchases;
    `,
    hints: [
      'Спершу порахуйте, скільки покупок зробив кожен покупець. Потім порахуйте всіх покупців, окремо тих, у кого дві покупки й більше, і яку частку другі становлять від усіх.',
      'FILTER (WHERE …) дає COUNT(*) рахувати лише підмножину рядків, що задовольняє умову, — і робить це в тому самому проході, що й загальний підрахунок.',
      'Скелет: WITH buyer_purchases AS (SELECT user_id, COUNT(*) AS purchases FROM app_purchases GROUP BY user_id) SELECT COUNT(*) AS buyers, COUNT(*) FILTER (WHERE purchases >= 2) AS repeat_buyers, ROUND(100.0 * COUNT(*) FILTER (WHERE purchases >= 2) / COUNT(*), 1) AS repeat_rate FROM buyer_purchases;',
    ],
    explanation:
      'Знаменник тут — покупці, а не всі зареєстровані користувачі: питання про повернення має сенс лише для тих, хто вже купив хоч раз. FILTER (WHERE …) рахує підмножину в тому самому проході, що й загальний COUNT(*), тому обидва числа беруться одним запитом і не можуть розʼїхатися між собою. Виміряно: 136 покупців, 80 повторних, 58,8 %.',
  },
  {
    id: 'L8-days-to-second-purchase',
    level: 8,
    tier: 'medium',
    topic: ['case-study', 'retention'],
    title: 'Скільки часу минає до другої покупки',
    context:
      'Крок перший показав: більше половини покупців повертається. Лишається зрозуміти, коли саме це відбувається — щоб команда знала, коли нагадувати про другу покупку.',
    caseStudy: {
      id: 'conversion',
      title: 'Аналіз конверсії користувачів',
      step: 2,
    },
    schemaDescription: APP_PURCHASES_SCHEMA,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Для покупців із двома покупками й більше порахуйте їхню кількість і середню кількість днів між першою та другою покупкою, округлену до десятої.',
    expectedOutputColumns: ['repeat_buyers', 'avg_days_to_second'],
    orderMatters: false,
    referenceSql: `
      WITH ranked AS (
        SELECT
          user_id,
          purchase_date,
          ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY purchase_date, purchase_id
          ) AS purchase_number
        FROM app_purchases
      )
      SELECT
        COUNT(*) AS repeat_buyers,
        ROUND(AVG(later.purchase_date - first_buy.purchase_date), 1)
          AS avg_days_to_second
      FROM ranked AS first_buy
      JOIN ranked AS later
        ON later.user_id = first_buy.user_id
        AND later.purchase_number = 2
      WHERE first_buy.purchase_number = 1;
    `,
    hints: [
      'Для кожного покупця пронумеруйте його покупки за датою від першої до останньої. Потім зіставте в один рядок покупку номер один і покупку номер два того самого покупця та порахуйте різницю в датах.',
      'ROW_NUMBER() із PARTITION BY user_id нумерує покупки всередині кожного покупця окремо; другий ключ purchase_id в ORDER BY потрібен, бо дві покупки можуть припасти на один день, і без нього «перша» була б випадковою.',
      'Скелет: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT COUNT(*) AS repeat_buyers, ROUND(AVG(later.purchase_date - first_buy.purchase_date), 1) AS avg_days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1;',
    ],
    explanation:
      'ROW_NUMBER() із PARTITION BY user_id нумерує покупки в межах кожного покупця окремо, а не наскрізь по всій таблиці, тому номер 1 і номер 2 завжди означають першу й другу покупку саме цієї людини. Другий ключ purchase_id в ORDER BY тут не косметика: дві покупки одного користувача можуть припасти на один день, і без цього ключа те, яка з них рахується першою, було б справою випадку — а від цього залежить уся відповідь. Самозʼєднання таблиці ranked із собою за номерами 1 і 2 — стандартний спосіб покласти дві події одного користувача в один рядок, щоб порахувати різницю між ними. Віднімання двох DATE у PostgreSQL дає ціле число днів. Виміряно: 80 користувачів, 67,9 дня.',
  },
  {
    id: 'L8-repeat-purchase-products',
    level: 8,
    tier: 'complex',
    topic: ['case-study', 'revenue'],
    title: 'Що купують, коли повертаються',
    context:
      'Команда вже знає, що повертається 58,8 % покупців і робить це в середньому за 67,9 дня. Лишається питання: а з яким товаром людина повертається?',
    caseStudy: {
      id: 'conversion',
      title: 'Аналіз конверсії користувачів',
      step: 3,
    },
    schemaDescription: `${PRODUCTS_SCHEMA}\n${APP_PURCHASES_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ANALYTICS_SQL,
    taskText:
      'Для кожного товару порахуйте, скільки разів його купували не першою покупкою користувача, і покажіть від найпопулярнішого товару повернення до найменш популярного.',
    expectedOutputColumns: ['product_name', 'repeat_purchases'],
    orderMatters: true,
    referenceSql: `
      WITH ranked AS (
        SELECT
          product_id,
          ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY purchase_date, purchase_id
          ) AS purchase_number
        FROM app_purchases
      )
      SELECT
        pr.product_name,
        COUNT(*) AS repeat_purchases
      FROM ranked AS r
      JOIN products AS pr ON pr.product_id = r.product_id
      WHERE r.purchase_number >= 2
      GROUP BY pr.product_name
      ORDER BY repeat_purchases DESC, pr.product_name;
    `,
    hints: [
      'Для кожного товару порахуйте, скільки разів його купували в той момент, коли в людини вже була якась покупка раніше — тобто саме при поверненні, а не вперше.',
      'ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) нумерує покупки кожного користувача окремо від 1; WHERE purchase_number >= 2 лишає тільки ті покупки, що не є першими для свого покупця.',
      'Скелет: WITH ranked AS (SELECT product_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT pr.product_name, COUNT(*) AS repeat_purchases FROM ranked AS r JOIN products AS pr ON pr.product_id = r.product_id WHERE r.purchase_number >= 2 GROUP BY pr.product_name ORDER BY repeat_purchases DESC, pr.product_name;',
    ],
    explanation:
      'Рахуються не всі покупки товару, а лише ті, що не перші в свого користувача: ROW_NUMBER() нумерує покупки всередині кожного користувача, а WHERE purchase_number >= 2 лишає тільки повернення. Це чесно варто визнати одним зі способів прочитати питання: він відповідає на «з яким товаром люди повертаються», а не на «який товар купують двічі поспіль» — той самий товар, куплений після зовсім іншої покупки півроку тому, тут так само рахується поверненням. Виміряно: 25 товарів, від 9 повторних покупок до 2.',
  },
  {
    id: 'L8-conversion-report-by-channel',
    level: 8,
    tier: 'complex',
    topic: ['case-study', 'segmentation'],
    title: 'Підсумковий звіт про повернення за каналами',
    context:
      'Три попередні кроки порахували частку повернень, час до другої покупки й товар повернення по всьому продукту разом. Фінал кейса — те саме в розрізі каналу залучення, щоб побачити, який канал приводить людей, що дійсно повертаються.',
    caseStudy: {
      id: 'conversion',
      title: 'Аналіз конверсії користувачів',
      step: 4,
    },
    schemaDescription: `${APP_USERS_SCHEMA}\n${APP_PURCHASES_SCHEMA}`,
    setupSql: ANALYTICS_SQL,
    taskText:
      'Для кожного каналу залучення порахуйте кількість покупців, скільки з них зробили другу покупку, яку частку в процентах (округлену до десятої) вони становлять і скільки днів у середньому минає до другої покупки (округлено до десятої).',
    expectedOutputColumns: [
      'channel',
      'buyers',
      'repeat_buyers',
      'repeat_rate',
      'avg_days_to_second',
    ],
    orderMatters: false,
    referenceSql: `
      WITH ranked AS (
        SELECT
          user_id,
          purchase_date,
          ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY purchase_date, purchase_id
          ) AS purchase_number
        FROM app_purchases
      ),
      buyers AS (
        SELECT DISTINCT
          user_id
        FROM app_purchases
      ),
      second_gap AS (
        SELECT
          first_buy.user_id,
          later.purchase_date - first_buy.purchase_date AS days_to_second
        FROM ranked AS first_buy
        JOIN ranked AS later
          ON later.user_id = first_buy.user_id
          AND later.purchase_number = 2
        WHERE first_buy.purchase_number = 1
      )
      SELECT
        u.channel,
        COUNT(*) AS buyers,
        COUNT(g.user_id) AS repeat_buyers,
        ROUND(100.0 * COUNT(g.user_id) / COUNT(*), 1) AS repeat_rate,
        ROUND(AVG(g.days_to_second), 1) AS avg_days_to_second
      FROM buyers AS b
      JOIN app_users AS u ON u.user_id = b.user_id
      LEFT JOIN second_gap AS g ON g.user_id = b.user_id
      GROUP BY u.channel
      ORDER BY u.channel;
    `,
    hints: [
      'Для кожного каналу залучення порахуйте, скільки людей узагалі купували, скільки з них купили вдруге, яка це частка у відсотках і скільки днів у середньому минає між першою та другою покупкою.',
      'Три CTE тут — це по суті три попередні кроки кейса: ranked нумерує покупки користувача, buyers перелічує унікальних покупців, second_gap зіставляє першу й другу покупку в один рядок; LEFT JOIN приєднує second_gap так, щоб покупці без другої покупки не зникли з результату.',
      'Скелет: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases), buyers AS (SELECT DISTINCT user_id FROM app_purchases), second_gap AS (SELECT first_buy.user_id, later.purchase_date - first_buy.purchase_date AS days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1) SELECT u.channel, COUNT(*) AS buyers, COUNT(g.user_id) AS repeat_buyers, ROUND(100.0 * COUNT(g.user_id) / COUNT(*), 1) AS repeat_rate, ROUND(AVG(g.days_to_second), 1) AS avg_days_to_second FROM buyers AS b JOIN app_users AS u ON u.user_id = b.user_id LEFT JOIN second_gap AS g ON g.user_id = b.user_id GROUP BY u.channel ORDER BY u.channel;',
    ],
    explanation:
      'Кожне CTE тут — розвʼязок одного з попередніх кроків кейса, зведений в один звіт: ranked і second_gap рахують, коли настає друга покупка, buyers перелічує тих, хто купував узагалі. LEFT JOIN із second_gap обовʼязковий: покупці без другої покупки мусять лишитися в знаменнику, інакше репутація каналу штучно поліпшиться. COUNT(g.user_id) рахує лише непорожні значення, тому дає саме кількість повторних покупців, а не всіх. Висновок, заради якого й затіяно кейс: organic дає і найбільше покупців (61), і найвищу частку повернень (65,6 %), тоді як ads при 40 покупцях утримує вдвічі гірше (50,0 %) — канал, що приводить найбільше людей, необовʼязково приводить найлояльніших. Виміряно: ads 40/20/50,0/73,9, email 17/9/52,9/56,3, organic 61/40/65,6/70,4, referral 18/11/61,1/57,5.',
  },
];
