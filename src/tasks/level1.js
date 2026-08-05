import { CUSTOMERS_SQL, EMPLOYEES_SQL, ORDERS_SQL, PRODUCTS_SQL } from './fixtures.js';
import { PRODUCTS_SCHEMA, ORDERS_SCHEMA, CUSTOMERS_SCHEMA, EMPLOYEES_SCHEMA } from './schemas.js';

export default [
  {
    id: 'L1-all-customers',
    level: 1,
    tier: 'basic',
    topic: ['select'],
    title: 'Повний список клієнтів',
    context: 'Новий менеджер знайомиться з базою і хоче побачити картки клієнтів цілком.',
    schemaDescription: CUSTOMERS_SCHEMA,
    setupSql: CUSTOMERS_SQL,
    taskText: 'Виведіть усі колонки й усі рядки таблиці customers.',
    expectedOutputColumns: ['customer_id', 'name', 'country'],
    orderMatters: false,
    referenceSql: `
      SELECT *
      FROM customers;
    `,
    hints: [
      'Потрібні всі колонки — перелічувати їх поіменно не обовʼязково.',
      'Зірочка * у SELECT означає «усі колонки таблиці».',
      'Скелет: SELECT * FROM customers;',
    ],
    explanation:
      'SELECT * зручний, коли треба швидко зазирнути в таблицю. У робочих запитах його уникають: він тягне зайві дані й ламається, щойно в таблиці зʼявиться нова колонка. Для розвідки — так, для дашборда — ні.',
  },
  {
    id: 'L1-product-prices',
    level: 1,
    tier: 'basic',
    topic: ['select', 'columns'],
    title: 'Тільки назви й ціни товарів',
    context:
      'Для друкованого прайса потрібні лише назви товарів і ціни — решта полів на аркуші зайва.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Виведіть назву та ціну кожного товару.',
    expectedOutputColumns: ['product_name', 'price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        price
      FROM products;
    `,
    hints: [
      'Замість усіх колонок потрібні лише дві конкретні.',
      'Перелічіть потрібні колонки через кому одразу після SELECT.',
      'Скелет: SELECT product_name, price FROM products;',
    ],
    explanation:
      'Явний перелік колонок — норма для робочих запитів: ви отримуєте рівно ті дані, які потрібні, а результат не зміниться, якщо в таблицю додадуть нові поля. Порядок колонок у SELECT задає порядок у результаті.',
  },
  {
    id: 'L1-departments',
    level: 1,
    tier: 'basic',
    topic: ['distinct'],
    title: 'Які департаменти є в компанії',
    context: 'Новий HR-менеджер складає структуру компанії й починає з переліку підрозділів.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Виведіть перелік департаментів без повторів.',
    expectedOutputColumns: ['department'],
    orderMatters: false,
    referenceSql: `
      SELECT DISTINCT department
      FROM employees;
    `,
    hints: [
      'Департамент повторюється в кожного співробітника, а потрібен список без повторів.',
      'DISTINCT відкидає однакові рядки результату, лишаючи по одному від кожної групи.',
      'Скелет: SELECT DISTINCT department FROM employees;',
    ],
    explanation:
      'Зверніть увагу на порожній рядок у результаті: один співробітник не має департаменту, і DISTINCT вважає NULL повноцінним окремим значенням — на відміну від умов у WHERE, де NULL нічому не дорівнює. Друга особливість: DISTINCT працює над усім рядком результату, а не над однією колонкою, тому SELECT DISTINCT department, salary дав би вже кожну пару значень.',
  },
  {
    id: 'L1-top-managers',
    level: 1,
    tier: 'basic',
    topic: ['where', 'is-null'],
    title: 'Хто нікому не підпорядкований',
    context: 'HR складає список керівників верхнього рівня для розсилки про стратегічну сесію.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Виведіть імена та прізвища співробітників, у яких немає керівника.',
    expectedOutputColumns: ['first_name', 'last_name'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        last_name
      FROM employees
      WHERE manager_id IS NULL;
    `,
    hints: [
      'Відсутність керівника записана в таблиці не нулем і не порожнім рядком, а особливим значенням «невідомо».',
      'Порожнє значення перевіряють оператором IS NULL, а не знаком рівності.',
      'Скелет: SELECT first_name, last_name FROM employees WHERE manager_id IS NULL;',
    ],
    explanation:
      'NULL — це не значення, а його відсутність, тому будь-яке порівняння з ним дає не «істину» чи «хибу», а «невідомо». Через це manager_id = NULL не поверне жодного рядка й помилки теж не викличе — запит просто мовчки віддасть порожній результат. Саме для таких перевірок існує IS NULL.',
  },
  {
    id: 'L1-category-filter',
    level: 1,
    tier: 'basic',
    topic: ['where', 'equality'],
    title: 'Товари однієї категорії',
    context: 'Категорійний менеджер переглядає асортимент електроніки перед сезонною акцією.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: "Виведіть товари категорії 'Electronics'.",
    expectedOutputColumns: ['product_name', 'price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        price
      FROM products
      WHERE category = 'Electronics';
    `,
    hints: [
      'Потрібні не всі рядки, а лише ті, що відповідають умові.',
      "WHERE фільтрує рядки. Текстові значення беруться в одинарні лапки: category = 'Electronics'.",
      "Скелет: SELECT product_name, price FROM products WHERE category = '...';",
    ],
    explanation:
      'WHERE відсіює рядки ще до формування результату. Умова рівності — найпростіший фільтр; памʼятайте, що в SQL порівняння рядків чутливе до регістру, тому Electronics і electronics — різні значення.',
  },
  {
    id: 'L1-low-stock',
    level: 1,
    tier: 'basic',
    topic: ['where', 'comparison'],
    title: 'Товари, яких мало на складі',
    context: 'Закупівельник щотижня перевіряє, які позиції треба дозамовити.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Виведіть товари, залишок яких менший за 20.',
    expectedOutputColumns: ['product_name', 'stock'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        stock
      FROM products
      WHERE stock < 20;
    `,
    hints: [
      'Умова порівнює число з числом.',
      'Оператор < перевіряє «менше ніж». Числа в лапки не беруться.',
      'Скелет: SELECT product_name, stock FROM products WHERE stock < 20;',
    ],
    explanation:
      "Оператори порівняння >, <, >=, <=, = і <> працюють у WHERE так само, як у математиці. Зверніть увагу: числа пишуться без лапок — PostgreSQL суворий до типів і на stock < '20' відповість помилкою про несумісні типи.",
  },
  {
    id: 'L1-price-desc',
    level: 1,
    tier: 'basic',
    topic: ['order-by'],
    title: 'Прайс від дорогого до дешевого',
    context: 'Продавець готує презентацію і хоче показати преміальні позиції першими.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Виведіть назви й ціни всіх товарів, відсортовані від найдорожчого до найдешевшого.',
    expectedOutputColumns: ['product_name', 'price'],
    orderMatters: true,
    referenceSql: `
      SELECT
        product_name,
        price
      FROM products
      ORDER BY price DESC;
    `,
    hints: [
      'Результат треба впорядкувати за ціною.',
      'ORDER BY задає сортування, а DESC перевертає його на спадання.',
      'Скелет: SELECT product_name, price FROM products ORDER BY price DESC;',
    ],
    explanation:
      'Без ORDER BY порядок рядків не гарантований — СУБД може повернути їх як завгодно. За замовчуванням сортування зростає (ASC), DESC дає спадання. Це єдиний спосіб керувати порядком у результаті.',
  },
  {
    id: 'L1-latest-orders',
    level: 1,
    tier: 'basic',
    topic: ['order-by', 'limit'],
    title: 'Три найновіші замовлення',
    context: 'Оператор підтримки дивиться, що замовляли останнім часом.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Виведіть три найсвіжіші замовлення за датою. Якщо дата однакова, вище має бути замовлення з більшим номером.',
    expectedOutputColumns: ['order_id', 'order_date', 'amount'],
    orderMatters: true,
    referenceSql: `
      SELECT
        order_id,
        order_date,
        amount
      FROM orders
      ORDER BY order_date DESC, order_id DESC
      LIMIT 3;
    `,
    hints: [
      'Спершу впорядкуйте рядки, потім обріжте зайві.',
      'LIMIT n лишає лише перші n рядків уже відсортованого результату.',
      'Скелет: SELECT order_id, order_date, amount FROM orders ORDER BY order_date DESC, order_id DESC LIMIT 3;',
    ],
    explanation:
      'LIMIT застосовується після сортування, тому порядок операцій важливий: спершу ORDER BY вишиковує рядки, і лише потім LIMIT відрізає хвіст. Друга колонка в ORDER BY тут не прикраса: дві дати збігаються, і без неї СУБД вільна повернути ці рядки в будь-якому порядку — звіт «топ-N» ставав би непередбачуваним.',
  },
  {
    id: 'L1-top-furniture',
    level: 1,
    tier: 'medium',
    topic: ['where', 'order-by', 'limit'],
    title: 'Найдорожчі меблі',
    context: 'Для вітрини преміальних меблів потрібні дві найдорожчі позиції саме цієї категорії.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: "Виведіть дві найдорожчі позиції категорії 'Furniture'.",
    expectedOutputColumns: ['product_name', 'price'],
    orderMatters: true,
    referenceSql: `
      SELECT
        product_name,
        price
      FROM products
      WHERE category = 'Furniture'
      ORDER BY price DESC
      LIMIT 2;
    `,
    hints: [
      'Тут поєднуються три дії: відібрати, впорядкувати, обрізати.',
      'Порядок частин запиту фіксований: WHERE, потім ORDER BY, потім LIMIT.',
      "Скелет: SELECT product_name, price FROM products WHERE category = '...' ORDER BY price DESC LIMIT 2;",
    ],
    explanation:
      'Порядок написання частин запиту жорсткий: SELECT → FROM → WHERE → ORDER BY → LIMIT. Порядок виконання інший: спершу WHERE відсіює рядки, далі вони сортуються, і лише наприкінці LIMIT відрізає зайве. Саме тому фільтр не «бачить» результату сортування.',
  },
  {
    id: 'L1-price-range',
    level: 1,
    tier: 'medium',
    topic: ['where', 'between'],
    title: 'Товари в ціновому коридорі',
    context:
      'Маркетинг готує акцію середнього сегмента й відбирає позиції, які туди вкладаються за ціною.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Виведіть назви й ціни товарів, ціна яких від 50 до 150 включно.',
    expectedOutputColumns: ['product_name', 'price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        price
      FROM products
      WHERE price BETWEEN 50 AND 150;
    `,
    hints: [
      'Умова обмежує ціну з двох боків одночасно — і знизу, і зверху.',
      'BETWEEN a AND b задає діапазон коротше, ніж дві умови через AND.',
      'Скелет: SELECT product_name, price FROM products WHERE price BETWEEN 50 AND 150;',
    ],
    explanation:
      'BETWEEN включає обидві межі: запис еквівалентний price >= 50 AND price <= 150. Саме тут ховається типова помилка — «від 50 до 150» у побутовій мові часто означає без верхньої межі, і тоді BETWEEN дає на кілька рядків більше, ніж очікували. Порядок меж теж важливий: BETWEEN 150 AND 50 не поверне нічого.',
  },
  {
    id: 'L1-two-categories',
    level: 1,
    tier: 'medium',
    topic: ['where', 'in-list'],
    title: 'Дві категорії одним фільтром',
    context: 'Для сезонної вітрини «дім і спорт» потрібні позиції одразу з двох напрямків.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: "Виведіть товари категорій 'Kitchen' і 'Sports' разом із їхніми цінами.",
    expectedOutputColumns: ['product_name', 'category', 'price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        category,
        price
      FROM products
      WHERE category IN ('Kitchen', 'Sports');
    `,
    hints: [
      'Підходить не одне конкретне значення категорії, а будь-яке з двох.',
      "Оператор IN перевіряє входження в список: category IN ('A', 'B').",
      "Скелет: SELECT product_name, category, price FROM products WHERE category IN ('Kitchen', 'Sports');",
    ],
    explanation:
      "IN — це коротший запис ланцюжка OR: category = 'Kitchen' OR category = 'Sports'. Виграш не лише в довжині: з OR легко забути дужки й змішати умови, а IN залишається одним цілим виразом. Обережно з NOT IN, якщо в списку може трапитися NULL — така умова не поверне жодного рядка.",
  },
  {
    id: 'L1-name-search',
    level: 1,
    tier: 'medium',
    topic: ['where', 'like'],
    title: 'Пошук за фрагментом назви',
    context: 'Оператор підтримки шукає товар, а клієнт памʼятає лише частину назви.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: "Виведіть назви й категорії товарів, у назві яких є слово 'Desk'.",
    expectedOutputColumns: ['product_name', 'category'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        category
      FROM products
      WHERE product_name LIKE '%Desk%';
    `,
    hints: [
      'Назва має не дорівнювати фрагменту, а містити його — де завгодно всередині.',
      'LIKE порівнює за зразком, у якому % означає «будь-скільки будь-яких символів».',
      "Скелет: SELECT product_name, category FROM products WHERE product_name LIKE '%Desk%';",
    ],
    explanation:
      "У зразку LIKE % замінює будь-яку послідовність символів, а _ — рівно один. Без % зразок працює як звичайна рівність: LIKE 'Desk' знайшов би лише товар із назвою рівно «Desk», а таких немає. У PostgreSQL LIKE чутливий до регістру, тому '%desk%' цих товарів не знайде — для пошуку без огляду на регістр є ILIKE.",
  },
  {
    id: 'L1-sorted-catalog',
    level: 1,
    tier: 'medium',
    topic: ['order-by', 'alias', 'expression'],
    title: 'Каталог по категоріях і цінах',
    context:
      'Комірник готує паперовий каталог для інвентаризації: спершу все за напрямками, усередині — від дорогого.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      'Виведіть назву, категорію та вартість залишку (ціна × залишок) кожного товару. Відсортуйте за категорією, а всередині категорії — від найдорожчого товару до найдешевшого.',
    expectedOutputColumns: ['product_name', 'category', 'stock_value'],
    orderMatters: true,
    referenceSql: `
      SELECT
        product_name,
        category,
        price * stock AS stock_value
      FROM products
      ORDER BY category, price DESC;
    `,
    hints: [
      'Сортування двоступеневе: спершу групи, а вже всередині кожної — своя черга.',
      'ORDER BY приймає кілька колонок через кому, і DESC стосується лише тієї, після якої стоїть.',
      'Скелет: SELECT product_name, category, price * stock AS stock_value FROM products ORDER BY category, price DESC;',
    ],
    explanation:
      'Друга колонка в ORDER BY вмикається лише там, де перша дала однакові значення, — тому саме вона впорядковує товари всередині категорії. Зверніть увагу й на те, що сортуємо за price, хоча в результаті показуємо stock_value: ORDER BY вільний посилатися на колонки таблиці, яких немає у виводі.',
  },
  {
    id: 'L1-expensive-low-stock',
    level: 1,
    tier: 'complex',
    topic: ['where', 'comparison', 'order-by', 'limit'],
    title: 'Дорогі товари, що закінчуються',
    context:
      'Закупівлі складають список термінових дозамовлень: дорогі позиції, яких лишилося мало, треба поповнити першими.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Виведіть пʼять найдорожчих товарів, залишок яких менший за 50.',
    expectedOutputColumns: ['product_name', 'price', 'stock'],
    orderMatters: true,
    referenceSql: `
      SELECT
        product_name,
        price,
        stock
      FROM products
      WHERE stock < 50
      ORDER BY price DESC
      LIMIT 5;
    `,
    hints: [
      'Розберіть умову на частини: спершу «залишок менший за 50», потім «найдорожчі», потім «пʼять».',
      'Фільтр іде у WHERE, «найдорожчі» — це ORDER BY price DESC, «пʼять» — LIMIT 5.',
      'Скелет: SELECT product_name, price, stock FROM products WHERE stock < 50 ORDER BY price DESC LIMIT 5;',
    ],
    explanation:
      'Підсумкове завдання рівня: бізнес-формулювання розкладається на три технічні кроки. Важливо, що LIMIT застосовується вже після фільтра — якби ви спершу взяли пʼять найдорожчих товарів узагалі, а потім відсіяли за залишком, у списку лишилося б менше пʼяти позицій.',
  },
  {
    id: 'L1-restock-shortlist',
    level: 1,
    tier: 'complex',
    topic: ['where', 'logical', 'comparison'],
    title: 'Список термінових дозамовлень',
    context:
      'Закупівлі формують заявку на тиждень: електроніку веде інший відділ, а решту треба поповнити за двома різними ознаками терміновості.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      "Виведіть товари, яких на складі менше 50, які не належать до категорії 'Electronics' і при цьому або коштують більше 100, або їх лишилося менше 10.",
    expectedOutputColumns: ['product_name', 'category', 'price', 'stock'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        category,
        price,
        stock
      FROM products
      WHERE stock < 50
        AND NOT category = 'Electronics'
        AND (price > 100 OR stock < 10);
    `,
    hints: [
      'Умов три, але остання складається з двох варіантів, з яких достатньо одного.',
      'AND вимагає виконання обох умов, OR — хоча б однієї, NOT перевертає умову. Дужки задають, що з чим групується.',
      "Скелет: SELECT product_name, category, price, stock FROM products WHERE stock < 50 AND NOT category = 'Electronics' AND (price > 100 OR stock < 10);",
    ],
    explanation:
      'Дужки навколо OR тут не для краси. AND звʼязується сильніше за OR, тому без них умова прочиталася б як «(мало на складі і не електроніка і дорожче 100) або лишилося менше 10» — і в результат потрапила б електроніка, яку ми щойно виключили. Коли в одній умові зустрічаються AND і OR, дужки варто ставити завжди, навіть там, де вони збігаються з поведінкою за замовчуванням: запит читає людина, а не лише СУБД.',
  },
];
