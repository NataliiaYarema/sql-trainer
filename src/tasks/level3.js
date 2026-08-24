import {
  CUSTOMERS_SQL,
  EMPLOYEES_SQL,
  ORDERS_SQL,
  PRODUCTS_SQL,
  ORDER_ITEMS_SQL,
} from './fixtures.js';
import {
  CUSTOMERS_SCHEMA,
  EMPLOYEES_SCHEMA,
  ORDERS_SCHEMA,
  PRODUCTS_SCHEMA,
  ORDER_ITEMS_SCHEMA,
} from './schemas.js';

export default [
  {
    id: 'L3-orders-with-names',
    level: 3,
    tier: 'basic',
    topic: ['inner-join'],
    title: 'Замовлення з іменами клієнтів',
    context: 'Служба підтримки хоче бачити ім’я клієнта поруч із номером замовлення.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText: 'Виведи номер замовлення, ім’я клієнта та суму.',
    expectedOutputColumns: ['order_id', 'name', 'amount'],
    orderMatters: false,
    referenceSql: `
      SELECT
        o.order_id,
        c.name,
        o.amount
      FROM orders AS o
      JOIN customers AS c
        ON c.customer_id = o.customer_id;
    `,
    hints: [
      'Потрібні дані з двох таблиць, тож їх треба зʼєднати за спільною колонкою.',
      'Спільна колонка — customer_id. Синтаксис: JOIN інша_таблиця ON умова.',
      'Скелет: SELECT o.order_id, c.name, o.amount FROM orders o JOIN customers c ON c.customer_id = o.customer_id;',
    ],
    explanation:
      'INNER JOIN зіставляє рядки двох таблиць за умовою в ON і лишає лише ті пари, де знайдено збіг. Аліаси o і c скорочують запис і знімають неоднозначність, коли в обох таблицях є колонки з однаковими назвами.',
  },
  {
    id: 'L3-items-with-products',
    level: 3,
    tier: 'basic',
    topic: ['inner-join'],
    title: 'Позиції замовлень із назвами товарів',
    context: 'Комірник збирає замовлення і бачить у системі лише product_id замість назв.',
    schemaDescription: `${PRODUCTS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ORDER_ITEMS_SQL,
    taskText: 'Виведи номер замовлення, назву товару та кількість.',
    expectedOutputColumns: ['order_id', 'product_name', 'quantity'],
    orderMatters: false,
    referenceSql: `
      SELECT
        oi.order_id,
        p.product_name,
        oi.quantity
      FROM order_items AS oi
      JOIN products AS p
        ON p.product_id = oi.product_id;
    `,
    hints: [
      'Назва товару лежить у products, а кількість — в order_items.',
      'Зʼєднай таблиці за product_id.',
      'Скелет: SELECT oi.order_id, p.product_name, oi.quantity FROM order_items oi JOIN products p ON p.product_id = oi.product_id;',
    ],
    explanation:
      'Класична пара «факти + довідник»: order_items зберігає події продажу, products — описи товарів. JOIN підтягує людські назви до технічних ідентифікаторів. Саме так влаштована більшість схем у сховищах даних.',
  },
  {
    id: 'L3-all-customers-orders',
    level: 3,
    tier: 'basic',
    topic: ['left-join'],
    title: 'Усі клієнти та їхні замовлення',
    context:
      'Аналітик готує повний зріз бази: у списку мають лишитися навіть ті клієнти, які ще нічого не купили.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Виведи всіх клієнтів разом із номерами їхніх замовлень. Клієнти без замовлень теж мають бути в результаті.',
    expectedOutputColumns: ['name', 'order_id'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        o.order_id
      FROM customers AS c
      LEFT JOIN orders AS o
        ON o.customer_id = c.customer_id;
    `,
    hints: [
      'INNER JOIN викинув би клієнтів без замовлень — потрібне інше зʼєднання.',
      'LEFT JOIN зберігає всі рядки лівої таблиці; там, де пари немає, буде NULL.',
      'Скелет: SELECT c.name, o.order_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;',
    ],
    explanation:
      'LEFT JOIN лишає всі рядки лівої таблиці незалежно від наявності збігу праворуч. Порядок таблиць тут вирішальний: customers мусить бути ліворуч, інакше «зберігати всіх» буде застосовано не до тих даних.',
  },
  {
    id: 'L3-never-sold',
    level: 3,
    tier: 'basic',
    topic: ['left-join', 'anti-join'],
    title: 'Товари, які ніколи не купували',
    context: 'Закупівлі переглядають асортимент і шукають позиції без жодного продажу.',
    schemaDescription: `${PRODUCTS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ORDER_ITEMS_SQL,
    taskText: 'Виведи товари, яких немає в жодному замовленні.',
    expectedOutputColumns: ['product_name', 'category'],
    orderMatters: false,
    referenceSql: `
      SELECT
        p.product_name,
        p.category
      FROM products AS p
      LEFT JOIN order_items AS oi
        ON oi.product_id = p.product_id
      WHERE oi.order_item_id IS NULL;
    `,
    hints: [
      'Спершу збережи всі товари, а потім лиши ті, для яких пари не знайшлося.',
      'Після LEFT JOIN «непарні» рядки мають NULL у колонках правої таблиці — за цим їх і фільтруємо.',
      'Скелет: SELECT p.product_name, p.category FROM products p LEFT JOIN order_items oi ON ... WHERE oi.order_item_id IS NULL;',
    ],
    explanation:
      'Патерн anti-join: LEFT JOIN плюс WHERE ... IS NULL. Упізнавай його за словами «ніколи не», «жодного разу», «відсутні в». Перевіряти треба саме через IS NULL — порівняння = NULL не працює ніколи.',
  },
  {
    id: 'L3-join-using',
    level: 3,
    tier: 'basic',
    topic: ['inner-join', 'using'],
    title: 'Коротший запис зʼєднання',
    context: 'Аналітик переписує довгий запит і хоче прибрати з нього зайвий шум.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText: 'Виведи номер замовлення, імʼя клієнта та суму, зʼєднавши таблиці через USING.',
    expectedOutputColumns: ['order_id', 'name', 'amount'],
    orderMatters: false,
    referenceSql: `
      SELECT
        order_id,
        name,
        amount
      FROM orders
      JOIN customers USING (customer_id);
    `,
    hints: [
      'Колонка звʼязку називається однаково в обох таблицях, тому писати рівність двох однакових імен необовʼязково.',
      'USING (колонка) замінює ON, коли назва колонки збігається в обох таблицях.',
      'Скелет: SELECT order_id, name, amount FROM orders JOIN customers USING (customer_id);',
    ],
    explanation:
      'USING працює лише тоді, коли колонка називається однаково по обидва боки. На відміну від ON, спільна колонка потрапляє в результат один раз і перестає належати конкретній таблиці — тому написати o.customer_id після USING уже не можна. Це і зручність, і обмеження: щойно ключі назвуть по-різному, доведеться повертатися до ON.',
  },
  {
    id: 'L3-orders-from-customer-side',
    level: 3,
    tier: 'basic',
    topic: ['right-join'],
    title: 'Те саме зʼєднання з іншого боку',
    context:
      'Аналітик успадкував запит, де orders стоїть першою таблицею, але звіт має лишити всіх клієнтів.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Виведи всіх клієнтів і номери їхніх замовлень, поставивши orders першою таблицею у FROM. Клієнти без замовлень мають лишитися в результаті.',
    expectedOutputColumns: ['name', 'order_id'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        o.order_id
      FROM orders AS o
      RIGHT JOIN customers AS c
        ON c.customer_id = o.customer_id;
    `,
    hints: [
      'Зберегти треба рядки тієї таблиці, що стоїть другою, а не першою.',
      'RIGHT JOIN лишає всі рядки правої таблиці — дзеркально до LEFT JOIN.',
      'Скелет: SELECT c.name, o.order_id FROM orders o RIGHT JOIN customers c ON c.customer_id = o.customer_id;',
    ],
    explanation:
      'Результат тут точнісінько такий самий, як у завданні «Усі клієнти та їхні замовлення»: RIGHT JOIN — це LEFT JOIN із переставленими таблицями. Саме тому на практиці RIGHT JOIN пишуть рідко: коли в запиті три-чотири зʼєднання, тримати в голові один напрямок значно простіше, ніж стежити, який бік зберігається в кожному рядку.',
  },
  {
    id: 'L3-manager-subordinate',
    level: 3,
    tier: 'basic',
    topic: ['self-join'],
    title: 'Хто чий керівник',
    context: 'HR будує схему підпорядкування й хоче бачити пари «співробітник — його керівник».',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Виведи імʼя кожного співробітника поруч з імʼям його керівника. Тих, у кого керівника немає, показувати не треба.',
    expectedOutputColumns: ['employee', 'manager'],
    orderMatters: false,
    referenceSql: `
      SELECT
        e.first_name AS employee,
        m.first_name AS manager
      FROM employees AS e
      JOIN employees AS m
        ON m.employee_id = e.manager_id;
    `,
    hints: [
      'Обидва — і підлеглий, і керівник — лежать в одній таблиці, просто в різних рядках.',
      'Таблицю можна зʼєднати саму із собою, давши їй два різні аліаси.',
      'Скелет: SELECT e.first_name AS employee, m.first_name AS manager FROM employees e JOIN employees m ON m.employee_id = e.manager_id;',
    ],
    explanation:
      'У self-join аліаси перестають бути зручністю й стають необхідністю: без них employees.employee_id не сказало б, про яку з двох копій таблиці йдеться. Зверни увагу, що INNER JOIN сам відкинув топменеджерів — у них manager_id порожній, і пари для них не знайшлося. Якби їх треба було зберегти, знадобився б LEFT JOIN.',
  },
  {
    id: 'L3-orders-per-customer-join',
    level: 3,
    tier: 'basic',
    topic: ['left-join', 'join-group-by'],
    title: 'Скільки замовлень у кожного, включно з нулем',
    context: 'Маркетинг сегментує базу й окремо цікавиться тими, хто ще нічого не купив.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Для кожного клієнта виведи кількість його замовлень. Клієнти без замовлень мають показати 0.',
    expectedOutputColumns: ['name', 'order_count'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        COUNT(o.order_id) AS order_count
      FROM customers AS c
      LEFT JOIN orders AS o
        ON o.customer_id = c.customer_id
      GROUP BY c.customer_id, c.name;
    `,
    hints: [
      'Спершу зберігаємо всіх клієнтів, потім рахуємо — але рахувати треба саме замовлення, а не рядки.',
      'Після LEFT JOIN у клієнта без замовлень рядок усе одно є, просто з порожніми колонками справа.',
      'Скелет: SELECT c.name, COUNT(o.order_id) AS order_count FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.name;',
    ],
    explanation:
      'Тут ховається найпоширеніша помилка звʼязки LEFT JOIN із COUNT: COUNT(*) дав би клієнтові без замовлень одиницю, бо рядок після зʼєднання існує — просто порожній. COUNT(o.order_id) рахує лише непорожні значення й тому чесно повертає нуль. Групуємо за customer_id разом з іменем, бо двоє клієнтів теоретично можуть бути тезками.',
  },
  {
    id: 'L3-order-contents',
    level: 3,
    tier: 'basic',
    topic: ['multi-join'],
    title: 'Що лежить у кожному замовленні',
    context:
      'Комірник друкує аркуші комплектації: у системі лише коди, а на складі потрібні назви.',
    schemaDescription: `${ORDERS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}\n${PRODUCTS_SCHEMA}`,
    setupSql: ORDERS_SQL + ORDER_ITEMS_SQL + PRODUCTS_SQL,
    taskText: 'Виведи номер і дату замовлення разом із назвою товару та кількістю.',
    expectedOutputColumns: ['order_id', 'order_date', 'product_name', 'quantity'],
    orderMatters: false,
    referenceSql: `
      SELECT
        o.order_id,
        o.order_date,
        p.product_name,
        oi.quantity
      FROM orders AS o
      JOIN order_items AS oi
        ON oi.order_id = o.order_id
      JOIN products AS p
        ON p.product_id = oi.product_id;
    `,
    hints: [
      'Замовлення не знає, які саме товари в ньому, — між ними стоїть третя таблиця.',
      'JOIN-и ставляться ланцюжком: спершу від замовлення до його позицій, потім від позиції до довідника товарів.',
      'Скелет: SELECT o.order_id, o.order_date, p.product_name, oi.quantity FROM orders o JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'order_items — таблиця-звʼязка: вона існує саме тому, що одне замовлення містить багато товарів, а один товар трапляється в багатьох замовленнях. Прямого звʼязку між orders і products немає, тому потрібні два JOIN поспіль. Рядків у результаті більше, ніж замовлень, — це не помилка, а природа зʼєднання «один до багатьох».',
  },
  {
    id: 'L3-country-category-grid',
    level: 3,
    tier: 'basic',
    topic: ['cross-join'],
    title: 'Сітка «країна × категорія»',
    context:
      'Аналітик готує каркас звіту про покриття ринків: у таблиці мають бути всі клітинки, навіть порожні.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${PRODUCTS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + PRODUCTS_SQL,
    taskText:
      'Побудуй всі можливі пари «країна клієнта — категорія товару», навіть якщо таких продажів ніколи не було. Кожна пара має зустрітися один раз.',
    expectedOutputColumns: ['country', 'category'],
    orderMatters: false,
    referenceSql: `
      SELECT DISTINCT
        c.country,
        p.category
      FROM customers AS c
      CROSS JOIN products AS p;
    `,
    hints: [
      'Тут нема чого зіставляти: потрібні просто всі поєднання одного списку з другим.',
      'CROSS JOIN зʼєднує кожен рядок з кожним і не має умови ON.',
      'Скелет: SELECT DISTINCT c.country, p.category FROM customers c CROSS JOIN products p;',
    ],
    explanation:
      'CROSS JOIN свідомо будує декартів добуток: шість країн і пʼять категорій дають 30 пар. DISTINCT тут потрібен тому, що країни й категорії повторюються в самих таблицях. Такий каркас корисний для звітів, де мають бути видні й нулі. Але той самий добуток виникає й випадково — коли в JOIN забувають ON, і кількість рядків раптово вибухає; упізнавати цю картину варто саме тут, у безпечному вигляді.',
  },
  {
    id: 'L3-revenue-by-country',
    level: 3,
    tier: 'medium',
    topic: ['inner-join', 'join-group-by'],
    title: 'Виручка по країнах',
    context: 'Керівництво вирішує, у які ринки інвестувати, і дивиться на виручку в розрізі країн.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText: 'Порахуй сумарну виручку по кожній країні.',
    expectedOutputColumns: ['country', 'total_revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.country,
        SUM(o.amount) AS total_revenue
      FROM orders AS o
      JOIN customers AS c
        ON c.customer_id = o.customer_id
      GROUP BY c.country;
    `,
    hints: [
      'Країна лежить в одній таблиці, суми — в іншій, тому спершу потрібен JOIN.',
      'Після зʼєднання групуй за колонкою з customers, а сумуй колонку з orders.',
      'Скелет: SELECT c.country, SUM(o.amount) AS total_revenue FROM orders o JOIN customers c ON ... GROUP BY c.country;',
    ],
    explanation:
      'JOIN і GROUP BY чудово поєднуються: спершу будується зʼєднаний набір рядків, потім він групується. Оскільки використано INNER JOIN, країни без замовлень у звіт не потраплять — саме цього тут і хотіли.',
  },
  {
    id: 'L3-revenue-by-category',
    level: 3,
    tier: 'medium',
    topic: ['inner-join', 'join-group-by', 'revenue'],
    title: 'Виручка по категоріях',
    context:
      'Категорійний менеджер хоче бачити не кількість продажів, а гроші в розрізі напрямків.',
    schemaDescription: `${PRODUCTS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ORDER_ITEMS_SQL,
    taskText: 'Порахуй виручку кожної категорії як суму кількість × ціна.',
    expectedOutputColumns: ['category', 'revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT
        p.category,
        SUM(oi.quantity * p.price) AS revenue
      FROM order_items AS oi
      JOIN products AS p
        ON p.product_id = oi.product_id
      GROUP BY p.category;
    `,
    hints: [
      'Кількість лежить в order_items, ціна — в products, тому спершу потрібен JOIN.',
      'Множення має бути всередині SUM: SUM(oi.quantity * p.price).',
      'Скелет: SELECT p.category, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... GROUP BY p.category;',
    ],
    explanation:
      'Вираз усередині агрегатної функції обчислюється для кожного рядка окремо, і лише потім результати підсумовуються. SUM(quantity) * price дало б грубу помилку: загальна кількість помножилася б на ціну одного випадкового товару.',
  },
  {
    id: 'L3-customer-purchases',
    level: 3,
    tier: 'medium',
    topic: ['multi-join'],
    title: 'Що саме купив клієнт',
    context:
      'Служба підтримки розбирає звернення і хоче бачити повний ланцюжок: клієнт, замовлення, товар.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}\n${PRODUCTS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL + ORDER_ITEMS_SQL + PRODUCTS_SQL,
    taskText: 'Виведи, який клієнт у якому замовленні який товар придбав і в якій кількості.',
    expectedOutputColumns: ['name', 'order_id', 'product_name', 'quantity'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        o.order_id,
        p.product_name,
        oi.quantity
      FROM orders AS o
      JOIN customers AS c
        ON c.customer_id = o.customer_id
      JOIN order_items AS oi
        ON oi.order_id = o.order_id
      JOIN products AS p
        ON p.product_id = oi.product_id;
    `,
    hints: [
      'Дані розкидані по чотирьох таблицях, і кожна пара зʼєднується власним ключем.',
      'JOIN-и ставляться ланцюжком: orders → customers, orders → order_items, order_items → products.',
      'Скелет: SELECT ... FROM orders o JOIN customers c ON ... JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'JOIN-и виконуються послідовно: результат попереднього зʼєднання приєднується до наступної таблиці. Такий обхід нормалізованої схеми — щоденна робота аналітика, бо в реальних базах дані навмисно розкладені по окремих сутностях.',
  },
  {
    id: 'L3-managers-and-orders',
    level: 3,
    tier: 'medium',
    topic: ['full-join'],
    title: 'Ніхто не загубився',
    context:
      'Перед аудитом потрібен зріз, у якому видно і співробітників без продажів, і замовлення, за якими вже нема кому відповідати.',
    schemaDescription: `${EMPLOYEES_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: EMPLOYEES_SQL + ORDERS_SQL,
    taskText:
      'Зведи співробітників і замовлення так, щоб у результаті лишилися і співробітники, які не вели жодного замовлення, і замовлення, за якими не закріплений жоден наявний співробітник.',
    expectedOutputColumns: ['first_name', 'order_id', 'amount'],
    orderMatters: false,
    referenceSql: `
      SELECT
        e.first_name,
        o.order_id,
        o.amount
      FROM employees AS e
      FULL JOIN orders AS o
        ON e.employee_id = o.manager_id;
    `,
    hints: [
      'Зберегти треба непарні рядки з обох боків одразу, а не з якогось одного.',
      'FULL JOIN лишає все: і те, що зберіг би LEFT JOIN, і те, що зберіг би RIGHT JOIN.',
      'Скелет: SELECT e.first_name, o.order_id, o.amount FROM employees e FULL JOIN orders o ON e.employee_id = o.manager_id;',
    ],
    explanation:
      'FULL OUTER JOIN вартий свого імені лише тоді, коли непарні рядки є з обох боків — інакше він нічим не відрізняється від LEFT JOIN. Тут вони є: девʼятеро співробітників не ведуть замовлень, а одне замовлення записане на менеджера, якого в таблиці вже немає. Порожнє імʼя в рядку — це не збій даних, а якраз та сирота, заради якої запит і писався: у реальних базах так знаходять биті посилання.',
  },
  {
    id: 'L3-department-pairs',
    level: 3,
    tier: 'medium',
    topic: ['self-join'],
    title: 'Пари колег з одного департаменту',
    context: 'Для програми взаємного навчання складають пари людей, які працюють в одному відділі.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Склади список пар співробітників, які працюють в одному департаменті. Кожна пара має зустрітися лише один раз, і людину не можна ставити в пару із самою собою.',
    expectedOutputColumns: ['employee_a', 'employee_b', 'department'],
    orderMatters: false,
    referenceSql: `
      SELECT
        a.first_name AS employee_a,
        b.first_name AS employee_b,
        a.department
      FROM employees AS a
      JOIN employees AS b
        ON b.department = a.department
       AND b.employee_id > a.employee_id;
    `,
    hints: [
      'Таблиця знову зʼєднується сама із собою, але цього разу умова має ще й відсіяти зайві повтори.',
      'Порівняння ідентифікаторів через «більше» лишає з кожної пари лише один варіант.',
      'Скелет: SELECT a.first_name AS employee_a, b.first_name AS employee_b, a.department FROM employees a JOIN employees b ON b.department = a.department AND b.employee_id > a.employee_id;',
    ],
    explanation:
      'Умова b.employee_id > a.employee_id робить одразу дві речі: прибирає пару людини із самою собою і відкидає дзеркальний дублікат. Якби там стояло <>, кожна пара трапилася б двічі — раз у прямому, раз у зворотному порядку. Друга деталь: співробітник без департаменту в результат не потрапляє, бо NULL = NULL дає не істину, а невідомість.',
  },
  {
    id: 'L3-big-orders-kept-customers',
    level: 3,
    tier: 'medium',
    topic: ['left-join', 'join-condition'],
    title: 'Великі замовлення, але всі клієнти',
    context:
      'Керівник хоче бачити повний список клієнтів, а поруч — лише їхні великі покупки, щоб одразу помітити тих, у кого таких немає.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Виведи всіх клієнтів разом із їхніми замовленнями дорожчими за 200. Клієнт, у якого таких замовлень немає, усе одно має лишитися в результаті.',
    expectedOutputColumns: ['name', 'order_id', 'amount'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        o.order_id,
        o.amount
      FROM customers AS c
      LEFT JOIN orders AS o
        ON o.customer_id = c.customer_id
       AND o.amount > 200;
    `,
    hints: [
      'Умова про суму має обмежити те, що приєднується, а не те, що лишається в результаті.',
      'До ON можна дописати ще одну умову через AND — вона працює під час зʼєднання.',
      'Скелет: SELECT c.name, o.order_id, o.amount FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.amount > 200;',
    ],
    explanation:
      'Ця відмінність — одна з найважливіших у темі зʼєднань. Умова в ON застосовується під час зʼєднання: непарні рядки лівої таблиці все одно зберігаються, просто з порожніми колонками справа. Та сама умова у WHERE спрацювала б після зʼєднання й викинула б їх, бо NULL > 200 не істина, — LEFT JOIN тихо перетворився б на INNER. Якщо після LEFT JOIN раптово зникли рядки, першим ділом шукай умову на праву таблицю у WHERE.',
  },
  {
    id: 'L3-affordable-for-order',
    level: 3,
    tier: 'medium',
    topic: ['join-condition'],
    title: 'Що можна було допродати до чека',
    context:
      'Відділ продажів шукає ідеї для допродажу: до кожного чека хоче бачити товари приблизно тієї ж вартості.',
    schemaDescription: `${ORDERS_SCHEMA}\n${PRODUCTS_SCHEMA}`,
    setupSql: ORDERS_SQL + PRODUCTS_SQL,
    taskText:
      'Для кожного замовлення підбери товари, ціна яких становить від 80 до 100 відсотків його суми.',
    expectedOutputColumns: ['order_id', 'amount', 'product_name', 'price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        o.order_id,
        o.amount,
        p.product_name,
        p.price
      FROM orders AS o
      JOIN products AS p
        ON p.price BETWEEN o.amount * 0.8 AND o.amount;
    `,
    hints: [
      'Замовлення й товари не звʼязані жодним спільним ключем — їх зіставляє сама умова про ціну.',
      'В ON можна написати будь-яку умову, що дає «так» або «ні», зокрема діапазон через BETWEEN.',
      'Скелет: SELECT o.order_id, o.amount, p.product_name, p.price FROM orders o JOIN products p ON p.price BETWEEN o.amount * 0.8 AND o.amount;',
    ],
    explanation:
      'В ON не обовʼязково має бути рівність ключів — придатна будь-яка умова, що повертає істину або хибу. Ціна такої гнучкості практична: за відсутності рівності СУБД не може скористатися індексом і фактично перебирає пари, тому діапазонні зʼєднання на великих таблицях дорогі. Зверни увагу й на те, що замовлення без жодного підхожого товару в результат не потрапляють: це INNER JOIN.',
  },
  {
    id: 'L3-diverse-buyers',
    level: 3,
    tier: 'complex',
    topic: ['multi-join', 'join-group-by', 'count-distinct'],
    title: 'Клієнти з широкими смаками',
    context:
      'Маркетинг готує крос-продажі й шукає покупців, які вже брали товари щонайменше з трьох різних категорій.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}\n${PRODUCTS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL + ORDER_ITEMS_SQL + PRODUCTS_SQL,
    taskText:
      'Виведи клієнтів, які купували товари з трьох або більше різних категорій, і кількість цих категорій.',
    expectedOutputColumns: ['name', 'category_count'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        COUNT(DISTINCT p.category) AS category_count
      FROM customers AS c
      JOIN orders AS o
        ON o.customer_id = c.customer_id
      JOIN order_items AS oi
        ON oi.order_id = o.order_id
      JOIN products AS p
        ON p.product_id = oi.product_id
      GROUP BY c.customer_id, c.name
      HAVING COUNT(DISTINCT p.category) >= 3;
    `,
    hints: [
      'Щоб дійти від клієнта до категорії товару, потрібно пройти чотири таблиці.',
      'Рахувати треба не рядки, а різні категорії: COUNT(DISTINCT p.category).',
      'Скелет: SELECT c.name, COUNT(DISTINCT p.category) AS category_count FROM customers c JOIN orders o ON ... JOIN order_items oi ON ... JOIN products p ON ... GROUP BY c.customer_id, c.name HAVING COUNT(DISTINCT p.category) >= 3;',
    ],
    explanation:
      'Підсумкове завдання рівня зводить разом усе: багатотабличний JOIN, групування, DISTINCT усередині агрегації та фільтр по ній. Ключова деталь — саме DISTINCT: звичайний COUNT рахував би позиції замовлень, і клієнт, який пʼять разів купив ту саму категорію, помилково потрапив би у звіт.',
  },
  {
    id: 'L3-active-countries',
    level: 3,
    tier: 'complex',
    topic: ['inner-join', 'join-group-by'],
    title: 'Ринки, де вже є попит',
    context:
      'Перед розподілом бюджету керівництво відбирає країни, у яких продажі вже не поодинокі.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Виведи країни, з яких надійшло щонайменше чотири замовлення, разом із кількістю замовлень і сумарною виручкою.',
    expectedOutputColumns: ['country', 'order_count', 'revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.country,
        COUNT(o.order_id) AS order_count,
        SUM(o.amount) AS revenue
      FROM customers AS c
      JOIN orders AS o
        ON o.customer_id = c.customer_id
      GROUP BY c.country
      HAVING COUNT(o.order_id) >= 4;
    `,
    hints: [
      'Країна лежить в одній таблиці, замовлення — в іншій, а відсіювати треба вже підсумки, а не окремі рядки.',
      'Спершу JOIN, потім GROUP BY за країною, і аж потім HAVING на порахований лічильник.',
      'Скелет: SELECT c.country, COUNT(o.order_id) AS order_count, SUM(o.amount) AS revenue FROM customers c JOIN orders o ON ... GROUP BY c.country HAVING COUNT(o.order_id) >= 4;',
    ],
    explanation:
      'Простеж повний конвеєр: JOIN будує розширений набір рядків, GROUP BY згортає його в країни, HAVING відкидає готові групи. Італії в результаті немає, і причина не в HAVING: єдиний італійський клієнт не має жодного замовлення, тому INNER JOIN відкинув його ще до групування. Якби завдання вимагало показати й країни з нулем, довелося б брати LEFT JOIN — і тоді HAVING довелося б переписати, бо нуль не проходить умову «щонайменше чотири».',
  },
  {
    id: 'L3-category-reach',
    level: 3,
    tier: 'complex',
    topic: ['multi-join', 'join-group-by', 'count-distinct'],
    title: 'Охоплення й гроші по категоріях',
    context:
      'Категорійний менеджер зіставляє два показники: чи багато людей купує напрямок і скільки він приносить.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}\n${PRODUCTS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL + ORDER_ITEMS_SQL + PRODUCTS_SQL,
    taskText:
      'Для кожної категорії порахуй, скільки різних клієнтів купували з неї товари і скільки грошей вона принесла.',
    expectedOutputColumns: ['category', 'buyer_count', 'revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT
        p.category,
        COUNT(DISTINCT c.customer_id) AS buyer_count,
        SUM(oi.quantity * p.price) AS revenue
      FROM order_items AS oi
      JOIN products AS p
        ON p.product_id = oi.product_id
      JOIN orders AS o
        ON o.order_id = oi.order_id
      JOIN customers AS c
        ON c.customer_id = o.customer_id
      GROUP BY p.category;
    `,
    hints: [
      'Щоб дійти від позиції замовлення до клієнта, треба пройти чотири таблиці, а показників у результаті два.',
      'Один агрегат має бачити кожен рядок окремо, а другий — навпаки, схлопнути повтори.',
      'Скелет: SELECT p.category, COUNT(DISTINCT c.customer_id) AS buyer_count, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... JOIN orders o ON ... JOIN customers c ON ... GROUP BY p.category;',
    ],
    explanation:
      'Підсумкове завдання рівня: два агрегати рахуються по одному й тому ж наборі рядків, але поводяться протилежно. SUM мусить бачити кожну позицію окремо, інакше виручка буде неповною; COUNT(DISTINCT …) навпаки — має схлопнути повтори, інакше «кількість клієнтів» перетвориться на «кількість позицій замовлень». Саме тому DISTINCT ставлять усередину конкретного агрегата, а не поруч із SELECT: там він змінив би весь рядок результату.',
  },
];
