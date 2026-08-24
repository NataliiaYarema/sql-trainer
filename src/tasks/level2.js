import { CUSTOMERS_SQL, EMPLOYEES_SQL, ORDERS_SQL, PRODUCTS_SQL } from './fixtures.js';
import { CUSTOMERS_SCHEMA, EMPLOYEES_SCHEMA, ORDERS_SCHEMA, PRODUCTS_SCHEMA } from './schemas.js';

export default [
  {
    id: 'L2-count-by-category',
    level: 2,
    tier: 'basic',
    topic: ['group-by', 'count'],
    title: 'Скільки товарів у кожній категорії',
    context: 'Категорійний менеджер оцінює, наскільки рівномірно наповнений каталог.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Порахуй кількість товарів у кожній категорії.',
    expectedOutputColumns: ['category', 'product_count'],
    orderMatters: false,
    referenceSql: `
      SELECT
        category,
        COUNT(*) AS product_count
      FROM products
      GROUP BY category;
    `,
    hints: [
      'Рахувати треба не по всій таблиці, а окремо для кожної категорії.',
      'GROUP BY category створює окрему групу для кожного значення, а COUNT(*) рахує рядки в групі.',
      'Скелет: SELECT category, COUNT(*) AS product_count FROM products GROUP BY category;',
    ],
    explanation:
      'GROUP BY розбиває таблицю на групи за значенням колонки, а агрегатна функція рахує одне число для кожної групи. Правило: усе, що стоїть у SELECT поза агрегацією, має бути перелічене в GROUP BY.',
  },
  {
    id: 'L2-orders-per-customer',
    level: 2,
    tier: 'basic',
    topic: ['group-by', 'count'],
    title: 'Скільки замовлень у кожного клієнта',
    context: 'Менеджер сегментує базу за активністю покупців.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Порахуй кількість замовлень для кожного клієнта.',
    expectedOutputColumns: ['customer_id', 'order_count'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        COUNT(*) AS order_count
      FROM orders
      GROUP BY customer_id;
    `,
    hints: [
      'Групувати треба за тим, що ідентифікує клієнта.',
      'GROUP BY customer_id зібере всі замовлення одного клієнта в одну групу.',
      'Скелет: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id;',
    ],
    explanation:
      'Той самий прийом, але групування йде за числовим ідентифікатором. Зверни увагу: у результат потраплять лише клієнти, які мають хоча б одне замовлення — тих, кого немає в orders, тут просто не існує.',
  },
  {
    id: 'L2-avg-price-by-category',
    level: 2,
    tier: 'basic',
    topic: ['group-by', 'avg'],
    title: 'Середня ціна по категоріях',
    context: 'Аналітик порівнює цінові рівні різних напрямків каталогу.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Порахуй середню ціну товарів у кожній категорії.',
    expectedOutputColumns: ['category', 'avg_price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        category,
        AVG(price) AS avg_price
      FROM products
      GROUP BY category;
    `,
    hints: [
      'Замість підрахунку рядків потрібне середнє значення колонки.',
      'AVG(price) рахує середнє в межах кожної групи.',
      'Скелет: SELECT category, AVG(price) AS avg_price FROM products GROUP BY category;',
    ],
    explanation:
      'AVG працює в межах групи так само, як COUNT: для кожної категорії обчислюється власне середнє. Якби прибрати GROUP BY, вийшло б одне середнє по всьому каталогу — зовсім інша метрика.',
  },
  {
    id: 'L2-revenue-by-customer',
    level: 2,
    tier: 'basic',
    topic: ['group-by', 'sum'],
    title: 'Виручка по клієнтах',
    context: 'Відділ продажів хоче знати, скільки грошей приніс кожен клієнт за весь час.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Порахуй сумарну суму замовлень кожного клієнта.',
    expectedOutputColumns: ['customer_id', 'total_spent'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        SUM(amount) AS total_spent
      FROM orders
      GROUP BY customer_id;
    `,
    hints: [
      'Потрібна сума сум: усі замовлення одного клієнта складаються разом.',
      'SUM(amount) з GROUP BY customer_id дає підсумок для кожного клієнта.',
      'Скелет: SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id;',
    ],
    explanation:
      'Це базовий розрахунок LTV — сумарної цінності клієнта. Схема «згрупувати за сутністю, підсумувати метрику» лежить в основі більшості аналітичних звітів: виручка по регіонах, по каналах, по періодах.',
  },
  {
    id: 'L2-salary-range-by-department',
    level: 2,
    tier: 'basic',
    topic: ['group-by', 'min-max'],
    title: 'Вилка зарплат у департаменті',
    context: 'HR готує перегляд компенсацій і хоче побачити розкид усередині кожного підрозділу.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Для кожного департаменту виведи найменшу та найбільшу зарплату.',
    expectedOutputColumns: ['department', 'min_salary', 'max_salary'],
    orderMatters: false,
    referenceSql: `
      SELECT
        department,
        MIN(salary) AS min_salary,
        MAX(salary) AS max_salary
      FROM employees
      GROUP BY department;
    `,
    hints: [
      'Потрібні два крайні значення в межах кожної групи, а не по всій таблиці.',
      'MIN і MAX — такі самі агрегати, як COUNT: з GROUP BY вони рахуються окремо для кожної групи.',
      'Скелет: SELECT department, MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM employees GROUP BY department;',
    ],
    explanation:
      'В одному SELECT можна поставити скільки завгодно агрегатів — усі вони рахуються за один прохід по тих самих групах. Зверни увагу на порожній департамент у результаті: GROUP BY збирає всі NULL в одну спільну групу, хоча у WHERE значення NULL не дорівнює навіть саме собі. Це різні механізми порівняння, і плутати їх — типова помилка.',
  },
  {
    id: 'L2-country-count',
    level: 2,
    tier: 'basic',
    topic: ['count-distinct'],
    title: 'Скільки країн у базі',
    context: 'Керівництво планує вихід на нові ринки й уточнює, у скількох країнах уже є покупці.',
    schemaDescription: CUSTOMERS_SCHEMA,
    setupSql: CUSTOMERS_SQL,
    taskText: 'Порахуй, скільки різних країн представлено серед клієнтів.',
    expectedOutputColumns: ['country_count'],
    orderMatters: false,
    referenceSql: `
      SELECT COUNT(DISTINCT country) AS country_count
      FROM customers;
    `,
    hints: [
      'Клієнтів більше, ніж країн: одна країна трапляється кілька разів, а рахувати треба саме країни.',
      'DISTINCT можна поставити всередину COUNT — тоді повтори не враховуються.',
      'Скелет: SELECT COUNT(DISTINCT country) AS country_count FROM customers;',
    ],
    explanation:
      'COUNT(country) порахував би рядки з непорожньою країною, тобто вісьмох клієнтів, а не шість країн. DISTINCT усередині агрегата спершу прибирає повтори й лише потім рахує — це той самий DISTINCT, що в SELECT, але діє в межах однієї функції. Плутанина між «скільки записів» і «скільки різних значень» — джерело завищених цифр у звітах.',
  },
  {
    id: 'L2-second-half-revenue',
    level: 2,
    tier: 'basic',
    topic: ['group-by', 'sum'],
    title: 'Витрати клієнтів від квітня',
    context: 'Фінансовий відділ звіряє другий квартал і рахує внесок кожного клієнта окремо.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Порахуй, скільки кожен клієнт витратив на замовлення від 1 квітня 2024 року.',
    expectedOutputColumns: ['customer_id', 'total_spent'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        SUM(amount) AS total_spent
      FROM orders
      WHERE order_date >= DATE '2024-04-01'
      GROUP BY customer_id;
    `,
    hints: [
      'Спершу треба відкинути ранні замовлення, і лише потім складати те, що лишилося.',
      'WHERE ставиться перед GROUP BY і відсіює окремі рядки ще до того, як утворяться групи.',
      "Скелет: SELECT customer_id, SUM(amount) AS total_spent FROM orders WHERE order_date >= DATE '2024-04-01' GROUP BY customer_id;",
    ],
    explanation:
      "Порядок виконання вирішує все: WHERE працює з окремими рядками до групування, тому в суму потрапляють лише замовлення потрібного періоду. Якби ту саму умову поставили в HAVING, вона стосувалася б уже готових груп і взагалі не мала б сенсу — окремої дати в групи немає. Запис DATE '2024-04-01' явно каже, що це дата, а не текст.",
  },
  {
    id: 'L2-rounded-avg-salary',
    level: 2,
    tier: 'basic',
    topic: ['group-by', 'avg', 'round'],
    title: 'Середня зарплата рівними числами',
    context:
      'Для слайда керівництву потрібні середні зарплати підрозділів без копійок — дробові хвости лише заважають читати.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Для кожного департаменту виведи середню зарплату, округлену до цілих.',
    expectedOutputColumns: ['department', 'avg_salary'],
    orderMatters: false,
    referenceSql: `
      SELECT
        department,
        ROUND(AVG(salary), 0) AS avg_salary
      FROM employees
      GROUP BY department;
    `,
    hints: [
      'Середнє рахується як завжди, але показати його треба без дробової частини.',
      'ROUND(вираз, кількість_знаків) округлює результат; нуль знаків дає ціле число.',
      'Скелет: SELECT department, ROUND(AVG(salary), 0) AS avg_salary FROM employees GROUP BY department;',
    ],
    explanation:
      'ROUND обгортає вже пораховане середнє, а не окремі зарплати — округлити спершу, а потім усереднити означало б інший, менш точний результат. Другий знак після коми в ROUND задає кількість знаків, і нуль тут не те саме, що його відсутність: ROUND(x) теж дає ціле, але явна нуль-точність читається однозначно.',
  },
  {
    id: 'L2-catalog-size',
    level: 2,
    tier: 'medium',
    topic: ['aggregation', 'count'],
    title: 'Розмір асортименту',
    context: 'Керівник запитує одну цифру: скільки взагалі позицій у каталозі.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Порахуй загальну кількість товарів.',
    expectedOutputColumns: ['total_products'],
    orderMatters: false,
    referenceSql: `
      SELECT COUNT(*) AS total_products
      FROM products;
    `,
    hints: [
      'Потрібна не сама таблиця, а одне число — кількість її рядків.',
      'COUNT(*) рахує всі рядки, а AS дає результату зрозумілу назву.',
      'Скелет: SELECT COUNT(*) AS total_products FROM products;',
    ],
    explanation:
      'Агрегатна функція без GROUP BY стискає всю таблицю в один рядок — тобто вся таблиця вважається однією групою. COUNT(*) рахує рядки незалежно від їхнього вмісту; якщо написати COUNT(колонка), рядки з NULL у цій колонці не враховуються — різниця, на якій часто спотикаються.',
  },
  {
    id: 'L2-total-revenue',
    level: 2,
    tier: 'medium',
    topic: ['aggregation', 'sum'],
    title: 'Загальна виручка',
    context: 'Фінансовий директор хоче одну підсумкову цифру продажів за весь період.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Порахуй суму всіх замовлень.',
    expectedOutputColumns: ['total_revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT SUM(amount) AS total_revenue
      FROM orders;
    `,
    hints: [
      'Потрібно скласти значення однієї колонки по всіх рядках.',
      'SUM(amount) підсумовує колонку; не забудь аліас через AS.',
      'Скелет: SELECT SUM(amount) AS total_revenue FROM orders;',
    ],
    explanation:
      'SUM додає значення колонки по всіх рядках, які пройшли фільтр WHERE. NULL-и вона просто ігнорує, а не перетворює на нуль — тому сума по колонці з пропусками може виявитися меншою, ніж очікуєш.',
  },
  {
    id: 'L2-premium-categories',
    level: 2,
    tier: 'medium',
    topic: ['group-by', 'having'],
    title: 'Категорії з дорогим асортиментом',
    context: 'Керівництво шукає преміальні напрямки: категорії із середньою ціною понад 100.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Виведи категорії, у яких середня ціна товару перевищує 100.',
    expectedOutputColumns: ['category', 'avg_price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        category,
        AVG(price) AS avg_price
      FROM products
      GROUP BY category
      HAVING AVG(price) > 100;
    `,
    hints: [
      'Фільтрувати треба вже пораховане середнє, а не окремі ціни.',
      'WHERE працює до агрегації, HAVING — після неї. Тут потрібен HAVING.',
      'Скелет: SELECT category, AVG(price) AS avg_price FROM products GROUP BY category HAVING AVG(price) > 100;',
    ],
    explanation:
      'Порядок виконання такий: WHERE відсіює рядки → GROUP BY будує групи → HAVING відкидає готові групи. Тому умову на AVG неможливо поставити у WHERE: на момент його роботи середнього ще не існує.',
  },
  {
    id: 'L2-frequent-customers',
    level: 2,
    tier: 'medium',
    topic: ['group-by', 'having', 'count'],
    title: 'Клієнти, які купують регулярно',
    context: 'Програма лояльності стартує з тих, у кого вже чотири й більше замовлень.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Виведи клієнтів із чотирма й більше замовленнями та кількість їхніх замовлень.',
    expectedOutputColumns: ['customer_id', 'order_count'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        COUNT(*) AS order_count
      FROM orders
      GROUP BY customer_id
      HAVING COUNT(*) >= 4;
    `,
    hints: [
      'Спершу порахуй замовлення кожного клієнта, потім відкинь тих, у кого їх мало.',
      'Умова ставиться на результат COUNT(*), тобто в HAVING.',
      'Скелет: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4;',
    ],
    explanation:
      'HAVING фільтрує групи за їхніми агрегатами. У PostgreSQL в HAVING не можна посилатися на аліас із SELECT, тому агрегатну функцію пишуть повторно — це не дублювання, а вимога стандарту.',
  },
  {
    id: 'L2-top-categories-by-value',
    level: 2,
    tier: 'medium',
    topic: ['group-by', 'sum', 'order-by-aggregate'],
    title: 'Три найдорожчі категорії складу',
    context:
      'Перед інвентаризацією керівник складу хоче знати, у яких напрямках заморожено найбільше грошей.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      'Порахуй вартість складських залишків кожної категорії як суму ціна × залишок і виведи три найбільші.',
    expectedOutputColumns: ['category', 'stock_value'],
    orderMatters: true,
    referenceSql: `
      SELECT
        category,
        SUM(price * stock) AS stock_value
      FROM products
      GROUP BY category
      ORDER BY stock_value DESC
      LIMIT 3;
    `,
    hints: [
      'Спершу порахуй підсумок для кожної категорії, потім вишикуй категорії за цим підсумком і візьми початок списку.',
      'ORDER BY може посилатися на аліас, заданий у SELECT, а LIMIT відрізає хвіст уже впорядкованого результату.',
      'Скелет: SELECT category, SUM(price * stock) AS stock_value FROM products GROUP BY category ORDER BY stock_value DESC LIMIT 3;',
    ],
    explanation:
      'На аліас із SELECT можна посилатися в ORDER BY, бо сортування виконується вже після того, як колонки результату пораховані. У HAVING так не можна — він працює раніше, тому там агрегат доводиться писати повторно. Ця асиметрія й спантеличує найчастіше. Зверни також увагу, що множення стоїть усередині SUM: SUM(price) * SUM(stock) дало б зовсім інше число.',
  },
  {
    id: 'L2-big-and-pricey',
    level: 2,
    tier: 'complex',
    topic: ['group-by', 'having', 'multiple-conditions'],
    title: 'Великі й дорогі категорії',
    context:
      'Для окремого преміального каталогу відбирають напрямки, де і асортимент широкий, і середній чек високий.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      'Виведи категорії, де середня ціна перевищує 100 і водночас налічується більше 5 товарів.',
    expectedOutputColumns: ['category', 'product_count', 'avg_price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        category,
        COUNT(*) AS product_count,
        AVG(price) AS avg_price
      FROM products
      GROUP BY category
      HAVING AVG(price) > 100
        AND COUNT(*) > 5;
    `,
    hints: [
      'Умови дві, і обидві стосуються групи, а не окремого рядка.',
      'У HAVING можна поєднати кілька агрегатних умов через AND.',
      'Скелет: SELECT category, COUNT(*) AS product_count, AVG(price) AS avg_price FROM products GROUP BY category HAVING AVG(price) > 100 AND COUNT(*) > 5;',
    ],
    explanation:
      'Підсумкове завдання рівня: у HAVING можна ставити скільки завгодно умов і комбінувати різні агрегати. Дані підібрані так, щоб перевірити розуміння: є категорії з високою середньою ціною, але малою кількістю позицій — і вони мають бути відсіяні саме другою умовою.',
  },
  {
    id: 'L2-loyal-and-valuable',
    level: 2,
    tier: 'complex',
    topic: ['group-by-multi', 'having', 'multiple-conditions'],
    title: 'Стабільні пари клієнт — менеджер',
    context:
      'Керівник продажів шукає звʼязки, що вже працюють: клієнт повертається саме до цього менеджера й лишає помітні суми.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Знайди пари «клієнт — менеджер», у яких набралося щонайменше два замовлення на загальну суму понад 300. Виведи кількість замовлень і суму.',
    expectedOutputColumns: ['customer_id', 'manager_id', 'order_count', 'total_spent'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        manager_id,
        COUNT(*) AS order_count,
        SUM(amount) AS total_spent
      FROM orders
      GROUP BY customer_id, manager_id
      HAVING COUNT(*) >= 2
        AND SUM(amount) > 300;
    `,
    hints: [
      'Групу утворює не клієнт і не менеджер окремо, а саме їхнє поєднання.',
      'GROUP BY приймає кілька колонок через кому, а в HAVING умови поєднуються через AND.',
      'Скелет: SELECT customer_id, manager_id, COUNT(*) AS order_count, SUM(amount) AS total_spent FROM orders GROUP BY customer_id, manager_id HAVING COUNT(*) >= 2 AND SUM(amount) > 300;',
    ],
    explanation:
      'Підсумкове завдання рівня: GROUP BY за двома колонками створює групу на кожну наявну комбінацію значень, а не окремі групи для кожної колонки. Тому один клієнт може потрапити в кілька рядків результату — по одному на кожного менеджера, з яким він працював. Саме тут ховається типова помилка читання таких звітів: сума по колонці total_spent більше не дорівнює виручці клієнта, бо його замовлення розкидані по різних рядках.',
  },
];
