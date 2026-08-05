import { EMPLOYEES_SQL, ORDERS_SQL, CUSTOMERS_SQL, RAW_CONTACTS_SQL } from './fixtures.js';
import {
  EMPLOYEES_SCHEMA,
  ORDERS_SCHEMA,
  CUSTOMERS_SCHEMA,
  RAW_CONTACTS_SCHEMA,
} from './schemas.js';

export default [
  {
    id: 'L6-hires-per-year',
    level: 6,
    tier: 'basic',
    topic: ['extract'],
    title: 'Наймання по роках',
    context:
      'HR готує звіт про темпи найму за роками, щоб планувати бюджет на рекрутинг наступного року.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Порахуйте, скільки співробітників найняли кожного року.',
    expectedOutputColumns: ['hire_year', 'hired'],
    orderMatters: false,
    referenceSql: `
      SELECT
        EXTRACT(YEAR FROM hire_date) AS hire_year,
        COUNT(*) AS hired
      FROM employees
      GROUP BY hire_year
      ORDER BY hire_year;
    `,
    hints: [
      'Потрібно згрупувати співробітників не за точною датою наймання, а за роком, який із неї видно.',
      'EXTRACT(YEAR FROM ...) дістає з дати лише рік як число — саме за ним і можна групувати.',
      'Скелет: SELECT EXTRACT(YEAR FROM hire_date) AS hire_year, COUNT(*) AS hired FROM employees GROUP BY hire_year ORDER BY hire_year;',
    ],
    explanation:
      'EXTRACT(YEAR FROM ...) перетворює дату на число — рік. Групувати одразу за hire_date безглуздо: кожна дата унікальна, тож GROUP BY hire_date дав би стільки ж груп, скільки рядків, і жодного реального підсумку по роках не вийшло б.',
  },
  {
    id: 'L6-orders-by-weekday',
    level: 6,
    tier: 'basic',
    topic: ['extract'],
    title: 'Дні тижня замовлень',
    context:
      'Менеджер зі складу хоче знати, на які дні тижня припадає найбільше замовлень, щоб планувати зміни персоналу.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Порахуйте кількість замовлень за кожним днем тижня.',
    expectedOutputColumns: ['weekday', 'orders_count'],
    orderMatters: false,
    referenceSql: `
      SELECT
        EXTRACT(DOW FROM order_date) AS weekday,
        COUNT(*) AS orders_count
      FROM orders
      GROUP BY weekday
      ORDER BY weekday;
    `,
    hints: [
      'Треба порахувати замовлення не за конкретною датою, а за тим, який це день тижня.',
      'EXTRACT(DOW FROM ...) повертає номер дня тижня для дати.',
      'Скелет: SELECT EXTRACT(DOW FROM order_date) AS weekday, COUNT(*) AS orders_count FROM orders GROUP BY weekday ORDER BY weekday;',
    ],
    explanation:
      'EXTRACT(DOW FROM ...) нумерує дні тижня від нуля до шести. Пастка в тому, що нуль означає неділю, а не понеділок, як інтуїтивно очікують, — тому в звітах цю колонку часто плутають і приписують вихідні «не тим» дням.',
  },
  {
    id: 'L6-revenue-by-month',
    level: 6,
    tier: 'basic',
    topic: ['date-trunc'],
    title: 'Виручка по місяцях',
    context: 'Фінансовий відділ хоче бачити динаміку виручки по місяцях, щоб порівнювати сезони.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Порахуйте суму замовлень за кожен місяць.',
    expectedOutputColumns: ['month', 'revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT
        DATE_TRUNC('month', order_date) AS month,
        SUM(amount) AS revenue
      FROM orders
      GROUP BY month
      ORDER BY month;
    `,
    hints: [
      'Суму замовлень треба порахувати не за кожен день окремо, а звівши дати до їхнього місяця.',
      "DATE_TRUNC('month', ...) зрізає дату до першого числа її місяця.",
      "Скелет: SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount) AS revenue FROM orders GROUP BY month ORDER BY month;",
    ],
    explanation:
      "DATE_TRUNC('month', ...) обнуляє все, що дрібніше за місяць, тому 3 і 17 січня перетворюються на однакове 2024-01-01 і потрапляють в одну групу. Групувати напряму за order_date немає сенсу — вона майже завжди унікальна, і GROUP BY нічого не схлопне.",
  },
  {
    id: 'L6-trim-names',
    level: 6,
    tier: 'basic',
    topic: ['trim-replace'],
    title: 'Прибрати зайві пробіли',
    context:
      'Оператор контакт-центру імпортував список контактів із CRM, де поля заповнювали вручну і з різними пробілами.',
    schemaDescription: RAW_CONTACTS_SCHEMA,
    setupSql: RAW_CONTACTS_SQL,
    taskText: 'Виведіть номер контакту та імʼя без пробілів по краях.',
    expectedOutputColumns: ['contact_id', 'clean_name'],
    orderMatters: false,
    referenceSql: `
      SELECT
        contact_id,
        TRIM(raw_name) AS clean_name
      FROM raw_contacts
      ORDER BY contact_id;
    `,
    hints: [
      'Потрібно вивести імена, прибравши пробіли, які стоять перед іменем або після нього.',
      'TRIM(...) прибирає пробіли з обох країв рядка.',
      'Скелет: SELECT contact_id, TRIM(raw_name) AS clean_name FROM raw_contacts ORDER BY contact_id;',
    ],
    explanation:
      'TRIM прибирає пробіли лише з початку й кінця рядка, а те, що всередині, не чіпає. У контакту з id 3 подвійний пробіл стоїть між словами — TRIM його не бачить, і в результаті «Olena  Shevchenko» так і лишається з двома пробілами посередині.',
  },
  {
    id: 'L6-lower-emails',
    level: 6,
    tier: 'basic',
    topic: ['case-change'],
    title: 'Пошта в одному регістрі',
    context:
      'Маркетолог готує розсилку і хоче знайти дублікати адрес, які відрізняються лише регістром літер.',
    schemaDescription: RAW_CONTACTS_SCHEMA,
    setupSql: RAW_CONTACTS_SQL,
    taskText: 'Виведіть номер контакту та адресу пошти малими літерами.',
    expectedOutputColumns: ['contact_id', 'email'],
    orderMatters: false,
    referenceSql: `
      SELECT
        contact_id,
        LOWER(raw_email) AS email
      FROM raw_contacts
      ORDER BY contact_id;
    `,
    hints: [
      'Треба привести всі адреси пошти до одного регістру, щоб однакові адреси, записані по-різному, виглядали однаково.',
      'LOWER(...) переводить усі літери рядка в малі.',
      'Скелет: SELECT contact_id, LOWER(raw_email) AS email FROM raw_contacts ORDER BY contact_id;',
    ],
    explanation:
      "Порівняння рядків у SQL чутливе до регістру: 'ANNA.K@Example.COM' = 'anna.k@example.com' поверне false, хоча для людини це та сама адреса. Тому перед порівнянням чи пошуком дублів адреси зводять до одного регістру — LOWER тут стандартний прийом.",
  },
  {
    id: 'L6-contact-code',
    level: 6,
    tier: 'basic',
    topic: ['string-length'],
    title: 'Код контакту фіксованої ширини',
    context:
      'Служба підтримки хоче короткі однакової довжини коди контактів для внутрішніх посилань у тикетах.',
    schemaDescription: RAW_CONTACTS_SCHEMA,
    setupSql: RAW_CONTACTS_SQL,
    taskText:
      'Виведіть чотиризначний код контакту з провідними нулями та довжину його очищеного імені.',
    expectedOutputColumns: ['contact_code', 'name_length'],
    orderMatters: false,
    referenceSql: `
      SELECT
        LPAD(contact_id::TEXT, 4, '0') AS contact_code,
        LENGTH(TRIM(raw_name)) AS name_length
      FROM raw_contacts
      ORDER BY contact_id;
    `,
    hints: [
      'Потрібно перетворити номер контакту на рядок фіксованої довжини з нулями спереду, і окремо порахувати кількість символів у очищеному імені.',
      "LPAD(..., 4, '0') доповнює рядок зліва до потрібної довжини, а LENGTH(...) рахує кількість символів у рядку.",
      "Скелет: SELECT LPAD(contact_id::TEXT, 4, '0') AS contact_code, LENGTH(TRIM(raw_name)) AS name_length FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'LPAD працює лише з текстом, тому число contact_id спершу приводять до тексту через ::TEXT — інакше LPAD відмовить типами. LENGTH рахує саме символи, і якщо не прибрати пробіли заздалегідь через TRIM, вони теж підуть у підрахунок довжини.',
  },
  {
    id: 'L6-contact-signature',
    level: 6,
    tier: 'basic',
    topic: ['concat'],
    title: 'Підпис для розсилки',
    context: 'Відділ розсилок формує підпис «Імʼя <пошта>» для шаблону листа кожному контакту.',
    schemaDescription: RAW_CONTACTS_SCHEMA,
    setupSql: RAW_CONTACTS_SQL,
    taskText: 'Зберіть для кожного контакту підпис виду «Імʼя <пошта>».',
    expectedOutputColumns: ['contact_id', 'signature'],
    orderMatters: false,
    referenceSql: `
      SELECT
        contact_id,
        TRIM(raw_name) || ' <' || LOWER(raw_email) || '>' AS signature
      FROM raw_contacts
      ORDER BY contact_id;
    `,
    hints: [
      'Потрібно зібрати одне текстове поле з очищеного імені та адреси пошти в кутових дужках.',
      'Оператор || склеює рядки в один.',
      "Скелет: SELECT contact_id, TRIM(raw_name) || ' <' || LOWER(raw_email) || '>' AS signature FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'Оператор || послідовно склеює всі операнди в один рядок. Пастка в тому, що будь-який NULL серед операндів перетворює на NULL увесь результат, а не лише свою частину, — тому конкатенацію «сирих» полів, де можливі порожні значення, зазвичай страхують COALESCE.',
  },
  {
    id: 'L6-month-label',
    level: 6,
    tier: 'basic',
    topic: ['to-char', 'string-date-combo'],
    title: 'Місяць текстовою міткою',
    context:
      'Керівництву потрібен звіт по виручці з місяцями у вигляді назв, а не номерів, у природному хронологічному порядку.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Виведіть виручку за кожен місяць, підписавши місяць назвою й роком, у хронологічному порядку.',
    expectedOutputColumns: ['month_label', 'revenue'],
    orderMatters: true,
    referenceSql: `
      SELECT
        TO_CHAR(order_date, 'FMMonth YYYY') AS month_label,
        SUM(amount) AS revenue
      FROM orders
      GROUP BY month_label
      ORDER BY MIN(order_date);
    `,
    hints: [
      'Місяць треба підписати не номером, а словом на кшталт «January 2024», і вивести рядки в порядку часу, а не за алфавітом назви.',
      "TO_CHAR(..., 'FMMonth YYYY') форматує дату в текстову мітку з назвою місяця; префікс FM прибирає зайві пробіли доповнення.",
      "Скелет: SELECT TO_CHAR(order_date, 'FMMonth YYYY') AS month_label, SUM(amount) AS revenue FROM orders GROUP BY month_label ORDER BY MIN(order_date);",
    ],
    explanation:
      'TO_CHAR без префікса FM доповнює назву місяця пробілами до однакової довжини, і FM це прибирає. Сортувати за самою міткою тут не можна: ORDER BY month_label дав би алфавітний порядок — April, February, January, — тому впорядковують за фактичною датою через MIN(order_date).',
  },
  {
    id: 'L6-quarter-summary',
    level: 6,
    tier: 'medium',
    topic: ['date-trunc'],
    title: 'Підсумки кварталів',
    context:
      'Керівництво щоквартально звіряє план продажів і хоче кількість та суму замовлень по кварталах.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Для кожного кварталу виведіть кількість замовлень і їхню суму.',
    expectedOutputColumns: ['quarter', 'orders_count', 'revenue'],
    orderMatters: false,
    referenceSql: `
      SELECT
        DATE_TRUNC('quarter', order_date) AS quarter,
        COUNT(*) AS orders_count,
        SUM(amount) AS revenue
      FROM orders
      GROUP BY quarter
      ORDER BY quarter;
    `,
    hints: [
      'Замовлення треба звести не до місяця, а до кварталу, і для кожного порахувати і кількість, і суму.',
      "DATE_TRUNC('quarter', ...) зрізає дату до початку кварталу так само, як 'month' зрізає до початку місяця.",
      "Скелет: SELECT DATE_TRUNC('quarter', order_date) AS quarter, COUNT(*) AS orders_count, SUM(amount) AS revenue FROM orders GROUP BY quarter ORDER BY quarter;",
    ],
    explanation:
      "DATE_TRUNC приймає різні одиниці округлення — 'month', 'quarter', 'year', 'week' — і працює за тим самим принципом. Результат для кварталу — не номер 1-4, а дата: перше число першого місяця кварталу, тобто другий квартал 2024 року позначається як 2024-04-01.",
  },
  {
    id: 'L6-return-deadline',
    level: 6,
    tier: 'medium',
    topic: ['date-arithmetic', 'interval'],
    title: 'Дедлайн повернення товару',
    context:
      'Служба підтримки перевіряє, чи ще діє право повернення для замовлень, оформлених з початку червня.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для замовлень від 1 червня 2024 року включно виведіть номер, дату та дату, коли спливає 30-денний строк повернення.',
    expectedOutputColumns: ['order_id', 'order_date', 'return_deadline'],
    orderMatters: false,
    referenceSql: `
      SELECT
        order_id,
        order_date,
        order_date + INTERVAL '30 days' AS return_deadline
      FROM orders
      WHERE order_date >= DATE '2024-06-01'
      ORDER BY order_id;
    `,
    hints: [
      'Для не надто старих замовлень потрібно вивести їхню дату й дату, що настає через 30 днів після неї.',
      "До дати можна додати INTERVAL '30 days', і вийде нова дата на 30 днів пізніше.",
      "Скелет: SELECT order_id, order_date, order_date + INTERVAL '30 days' AS return_deadline FROM orders WHERE order_date >= DATE '2024-06-01' ORDER BY order_id;",
    ],
    explanation:
      "До DATE можна додати INTERVAL напряму — результат уже не DATE, а мітка часу, навіть якщо час у ній нульовий. Слово DATE перед літералом задає тип явно, і це важливо там, де типу нізвідки взяти: '2024-6-1' > '2024-12-01' дає true, бо це порівняння двох текстів, а DATE '2024-06-01' > '2024-12-01' дає false, бо тут уже порівнюються дати.",
  },
  {
    id: 'L6-experience-at-date',
    level: 6,
    tier: 'medium',
    topic: ['age', 'date-arithmetic'],
    title: 'Стаж на кінець року',
    context:
      'HR готує річний звіт про стаж співробітників станом на кінець року, а не на сьогодні.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Порахуйте для кожного співробітника стаж станом на 31 грудня 2024 року.',
    expectedOutputColumns: ['first_name', 'hire_date', 'experience'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        hire_date,
        AGE(DATE '2024-12-31', hire_date) AS experience
      FROM employees
      ORDER BY hire_date;
    `,
    hints: [
      'Треба порахувати, скільки часу минуло від дати найму до конкретної фіксованої дати — 31 грудня 2024 року.',
      'AGE(дата1, дата2) повертає різницю між двома датами у вигляді років, місяців і днів.',
      "Скелет: SELECT first_name, hire_date, AGE(DATE '2024-12-31', hire_date) AS experience FROM employees ORDER BY hire_date;",
    ],
    explanation:
      "AGE з двома аргументами рахує різницю між ними, а з одним аргументом — різницю між ним і сьогоднішньою датою. Другий варіант для звіту не годиться: результат змінювався б щодня разом з поточною датою, тому тут дату відліку задають явно — DATE '2024-12-31'.",
  },
  {
    id: 'L6-source-parts',
    level: 6,
    tier: 'medium',
    topic: ['split-part'],
    title: 'Канал і підканал переходу',
    context:
      'Маркетолог розбирає джерела трафіку на канал і підканал, щоб оцінити ефективність кожного окремо.',
    schemaDescription: RAW_CONTACTS_SCHEMA,
    setupSql: RAW_CONTACTS_SQL,
    taskText: 'Розберіть джерело переходу на канал і підканал.',
    expectedOutputColumns: ['contact_id', 'channel', 'subchannel'],
    orderMatters: false,
    referenceSql: `
      SELECT
        contact_id,
        SPLIT_PART(source, '/', 1) AS channel,
        SPLIT_PART(source, '/', 2) AS subchannel
      FROM raw_contacts
      ORDER BY contact_id;
    `,
    hints: [
      'Джерело записане одним рядком через похилу риску — потрібно розділити його на дві частини: до риски і після.',
      'SPLIT_PART(рядок, роздільник, номер) повертає задану за номером частину рядка.',
      "Скелет: SELECT contact_id, SPLIT_PART(source, '/', 1) AS channel, SPLIT_PART(source, '/', 2) AS subchannel FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      "SPLIT_PART нумерує частини рядка з одиниці, а не з нуля. Якщо частини з таким номером не існує, функція повертає порожній рядок '', а не NULL — тому перевірка IS NULL такі «відсутні» значення не знайде, шукати їх треба через порівняння з ''.",
  },
  {
    id: 'L6-email-domain',
    level: 6,
    tier: 'medium',
    topic: ['substring'],
    title: 'Домен поштової адреси',
    context: 'Аналітик хоче побачити, які поштові домени найчастіше трапляються серед контактів.',
    schemaDescription: RAW_CONTACTS_SCHEMA,
    setupSql: RAW_CONTACTS_SQL,
    taskText: 'Витягніть із кожної адреси домен — усе, що після равлика, — малими літерами.',
    expectedOutputColumns: ['contact_id', 'domain'],
    orderMatters: false,
    referenceSql: `
      SELECT
        contact_id,
        LOWER(
          SUBSTRING(raw_email FROM POSITION('@' IN raw_email) + 1)
        ) AS domain
      FROM raw_contacts
      ORDER BY contact_id;
    `,
    hints: [
      'З адреси пошти потрібно вирізати частину після символу @ і привести її до малих літер.',
      'POSITION(підрядок IN рядок) знаходить номер символу, з якого починається підрядок, а SUBSTRING(рядок FROM номер) бере все від цього номера й до кінця.',
      "Скелет: SELECT contact_id, LOWER(SUBSTRING(raw_email FROM POSITION('@' IN raw_email) + 1)) AS domain FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      "POSITION повертає номер символу з одиниці, а не з нуля, тому до результату додають 1, щоб SUBSTRING почала вирізати одразу після равлика, а не з нього самого. Якщо символу '@' у рядку немає, POSITION поверне 0, і SUBSTRING FROM 1 мовчки віддасть увесь вихідний рядок замість помилки чи NULL.",
  },
  {
    id: 'L6-clean-contacts',
    level: 6,
    tier: 'complex',
    topic: ['trim-replace', 'case-change'],
    title: 'Повне очищення контакту',
    context: 'Перед завантаженням у нову CRM контакти треба привести до єдиного охайного формату.',
    schemaDescription: RAW_CONTACTS_SCHEMA,
    setupSql: RAW_CONTACTS_SQL,
    taskText:
      'Приведіть контакти до ладу: імʼя без зайвих пробілів і з великої літери кожне слово, пошта малими літерами.',
    expectedOutputColumns: ['contact_id', 'clean_name', 'clean_email'],
    orderMatters: false,
    referenceSql: `
      SELECT
        contact_id,
        INITCAP(TRIM(REPLACE(raw_name, '  ', ' '))) AS clean_name,
        LOWER(TRIM(raw_email)) AS clean_email
      FROM raw_contacts
      ORDER BY contact_id;
    `,
    hints: [
      'Імʼя треба одночасно очистити від зайвих пробілів і зробити кожне слово з великої літери, а пошту — привести до малих літер.',
      'REPLACE прибирає повторювані пробіли, TRIM зрізає краї, а INITCAP робить кожне слово з великої літери — їх можна вкладати одна в одну.',
      "Скелет: SELECT contact_id, INITCAP(TRIM(REPLACE(raw_name, '  ', ' '))) AS clean_name, LOWER(TRIM(raw_email)) AS clean_email FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'Вкладені функції виконуються зсередини назовні, і порядок тут важливий: якби INITCAP застосували до неочищеного рядка, подвійні пробіли між словами нікуди б не поділися. REPLACE шукає рівно пари пробілів і замінює їх на один — на трьох пробілах поспіль один зайвий усе одно лишився б, тому у фікстурах їх спеціально по два, не по три.',
  },
  {
    id: 'L6-monthly-customer-report',
    level: 6,
    tier: 'complex',
    topic: ['string-date-combo', 'to-char', 'concat'],
    title: 'Місячний звіт по клієнтах',
    context:
      'Фінансовий відділ зводить продажі по місяцях і клієнтах для щомісячного звіту в діловому форматі «ПРІЗВИЩЕ, Імʼя».',
    schemaDescription: `${ORDERS_SCHEMA}\n${CUSTOMERS_SCHEMA}`,
    setupSql: ORDERS_SQL + CUSTOMERS_SQL,
    taskText:
      'Зведіть суми замовлень за місяцями й клієнтами: місяць у вигляді 2024-01, клієнта — «ПРІЗВИЩЕ, Імʼя».',
    expectedOutputColumns: ['month', 'customer', 'total'],
    orderMatters: false,
    referenceSql: `
      SELECT
        TO_CHAR(o.order_date, 'YYYY-MM') AS month,
        UPPER(SPLIT_PART(c.name, ' ', 2)) || ', ' ||
          SPLIT_PART(c.name, ' ', 1) AS customer,
        SUM(o.amount) AS total
      FROM orders AS o
      JOIN customers AS c ON c.customer_id = o.customer_id
      GROUP BY month, customer
      ORDER BY month, customer;
    `,
    hints: [
      'Треба порахувати суму замовлень окремо для кожної пари «місяць + клієнт», а імʼя клієнта показати у форматі «ПРІЗВИЩЕ, Імʼя».',
      "TO_CHAR(..., 'YYYY-MM') дає мітку місяця, а SPLIT_PART розбирає повне імʼя на прізвище й імʼя за пробілом.",
      "Скелет: SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS month, UPPER(SPLIT_PART(c.name, ' ', 2)) || ', ' || SPLIT_PART(c.name, ' ', 1) AS customer, SUM(o.amount) AS total FROM orders o JOIN customers c ON c.customer_id = o.customer_id GROUP BY month, customer ORDER BY month, customer;",
    ],
    explanation:
      "PostgreSQL дозволяє групувати за псевдонімом обчисленої колонки (GROUP BY month, customer), тому громіздкі вирази не доводиться дублювати в GROUP BY. TO_CHAR(..., 'YYYY-MM') дає текстову мітку місяця, яка при цьому сортується правильно як звичайний рядок — на відміну від назви місяця словом, де алфавітний і хронологічний порядок розходяться.",
  },
];
