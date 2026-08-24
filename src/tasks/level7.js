import {
  EMPLOYEES_SQL,
  CUSTOMERS_SQL,
  PRODUCTS_SQL,
  ORDERS_SQL,
  ORDER_ITEMS_SQL,
} from './fixtures.js';
import {
  EMPLOYEES_SCHEMA,
  CUSTOMERS_SCHEMA,
  PRODUCTS_SCHEMA,
  ORDERS_SCHEMA,
  ORDER_ITEMS_SCHEMA,
} from './schemas.js';

export default [
  {
    id: 'L7-stock-alert',
    level: 7,
    tier: 'basic',
    topic: ['case-when'],
    title: 'Сигнал про залишок',
    context:
      'Комірник переглядає залишки товарів і хоче одразу бачити, які позиції потребують термінового дозамовлення.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      "Познач товари за залишком: менше 10 — 'critical', менше 30 — 'low'. Решта лишається без позначки.",
    expectedOutputColumns: ['product_name', 'stock', 'stock_alert'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        stock,
        CASE
          WHEN stock < 10 THEN 'critical'
          WHEN stock < 30 THEN 'low'
        END AS stock_alert
      FROM products
      ORDER BY stock;
    `,
    hints: [
      'Потрібно підписати товари міткою залежно від того, наскільки мало їх лишилося на складі, а товари з великим запасом узагалі не підписувати.',
      'CASE перевіряє гілки WHEN одну за одною зверху вниз і повертає значення першої, яка виявилася істинною.',
      "Скелет: SELECT product_name, stock, CASE WHEN stock < 10 THEN 'critical' WHEN stock < 30 THEN 'low' END AS stock_alert FROM products ORDER BY stock;",
    ],
    explanation:
      'CASE перевіряє умови по черзі й зупиняється на першій, що збіглася, ігноруючи решту гілок. Якщо жодна умова не спрацювала, а ELSE не написано, результатом стає NULL, а не порожній рядок чи нуль — саме такий NULL і видно в товарів із великим запасом.',
  },
  {
    id: 'L7-price-tier',
    level: 7,
    tier: 'basic',
    topic: ['case-when'],
    title: 'Цінові категорії товарів',
    context:
      'Менеджер із закупівель готує прайс і хоче одразу бачити, до якого цінового сегмента належить кожен товар.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      "Розподіли товари за ціною: до 50 — 'budget', до 200 — 'standard', решта — 'premium'.",
    expectedOutputColumns: ['product_name', 'price', 'price_tier'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        price,
        CASE
          WHEN price < 50 THEN 'budget'
          WHEN price < 200 THEN 'standard'
          ELSE 'premium'
        END AS price_tier
      FROM products
      ORDER BY price;
    `,
    hints: [
      'Кожному товару потрібно підібрати одну з трьох текстових міток за ціною, і жоден товар не повинен лишитися без мітки.',
      'CASE із кількома гілками WHEN перевіряє межі по черзі, а ELSE забирає собі все, що не підійшло під жодну умову вище.',
      "Скелет: SELECT product_name, price, CASE WHEN price < 50 THEN 'budget' WHEN price < 200 THEN 'standard' ELSE 'premium' END AS price_tier FROM products ORDER BY price;",
    ],
    explanation:
      'ELSE означає «все інше», і саме він прибирає NULL, який лишався в попередньому завданні без такої гілки. Порядок умов тут — це пріоритет: якби WHEN price < 200 стояла першою, гілка WHEN price < 50 не спрацювала б жодного разу, бо дешеві товари підпадають під обидві умови одразу.',
  },
  {
    id: 'L7-department-or-none',
    level: 7,
    tier: 'basic',
    topic: ['coalesce'],
    title: 'Департамент або позначка',
    context:
      'HR готує загальний довідник співробітників і хоче, щоб відсутність департаменту в картці була видна явно, а не порожнім полем.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      "Виведи співробітників так, щоб замість порожнього департаменту стояло 'Not assigned'.",
    expectedOutputColumns: ['first_name', 'last_name', 'department'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        last_name,
        COALESCE(department, 'Not assigned') AS department
      FROM employees
      ORDER BY employee_id;
    `,
    hints: [
      'Там, де в співробітника не вказано департамент, потрібно підставити текстову заглушку замість порожнього значення.',
      'COALESCE перевіряє аргументи зліва направо і повертає перший із них, який не є NULL.',
      "Скелет: SELECT first_name, last_name, COALESCE(department, 'Not assigned') AS department FROM employees ORDER BY employee_id;",
    ],
    explanation:
      'COALESCE повертає перший непорожній аргумент зі списку. Замінити цю логіку умовою WHERE department = NULL не вийде: порівняння з NULL завжди дає NULL, а не хибу, тому такий рядок просто не проходить фільтр — для перевірки на порожнечу є оператор IS NULL.',
  },
  {
    id: 'L7-large-orders-per-manager',
    level: 7,
    tier: 'basic',
    topic: ['case-in-aggregate'],
    title: 'Великі замовлення менеджерів',
    context:
      'Керівник відділу продажів порівнює навантаження менеджерів і хоче знати, скільки замовлень у кожного великі, а скільки — усього.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для кожного менеджера виведи загальну кількість замовлень і скільки з них на 200 і більше.',
    expectedOutputColumns: ['manager_id', 'orders_count', 'large_orders'],
    orderMatters: false,
    referenceSql: `
      SELECT
        manager_id,
        COUNT(*) AS orders_count,
        COUNT(CASE WHEN amount >= 200 THEN 1 END) AS large_orders
      FROM orders
      GROUP BY manager_id
      ORDER BY manager_id;
    `,
    hints: [
      'Для кожного менеджера потрібні одразу два числа: скільки в нього замовлень загалом і скільки з них великі.',
      'COUNT не рахує NULL, тому CASE без ELSE всередині COUNT працює як умовний підрахунок — рахуються лише рядки, де умова справдилася.',
      'Скелет: SELECT manager_id, COUNT(*) AS orders_count, COUNT(CASE WHEN amount >= 200 THEN 1 END) AS large_orders FROM orders GROUP BY manager_id ORDER BY manager_id;',
    ],
    explanation:
      'COUNT не рахує NULL, тому CASE без ELSE всередині нього працює як фільтр: рядки, що не підійшли під умову, перетворюються на NULL і просто не потрапляють у підрахунок. Додати сюди ELSE 0 було б помилкою — тоді COUNT рахував би й нулі, і large_orders у кожного менеджера дорівнював би тому самому числу, що й orders_count.',
  },
  {
    id: 'L7-loyal-customers',
    level: 7,
    tier: 'basic',
    topic: ['intersect'],
    title: 'Клієнти обох кварталів',
    context:
      'Відділ маркетингу планує програму лояльності й хоче знайти клієнтів, які лишаються активними другий квартал поспіль.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText: 'Знайди клієнтів, які замовляли і в першому кварталі 2024 року, і в другому.',
    expectedOutputColumns: ['customer_id'],
    orderMatters: false,
    referenceSql: `
      SELECT customer_id
      FROM orders
      WHERE order_date < DATE '2024-04-01'
      INTERSECT
      SELECT customer_id
      FROM orders
      WHERE order_date >= DATE '2024-04-01';
    `,
    hints: [
      'Потрібні лише ті клієнти, які зробили хоча б одне замовлення в кожному з двох періодів — і в першому, і в другому.',
      'INTERSECT лишає тільки ті рядки, які присутні одночасно в обох результатах запитів.',
      "Скелет: SELECT customer_id FROM orders WHERE order_date < DATE '2024-04-01' INTERSECT SELECT customer_id FROM orders WHERE order_date >= DATE '2024-04-01';",
    ],
    explanation:
      'INTERSECT лишає тільки рядки, присутні в обох результатах, і сам прибирає дублікати — тому DISTINCT тут зайвий. Замінити його на одну умову WHERE не можна: order_date < ... AND order_date >= ... для одного й того самого рядка ніколи не буде істинним, бо це перевірка на рядок, а не на клієнта.',
  },
  {
    id: 'L7-never-ordered',
    level: 7,
    tier: 'basic',
    topic: ['except'],
    title: 'Товари без жодного продажу',
    context:
      'Категорійний менеджер перевіряє каталог і хоче знайти товари, які жодного разу не продавалися, щоб вирішити їхню долю.',
    schemaDescription: `${PRODUCTS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ORDER_ITEMS_SQL,
    taskText: 'Знайди товари, які не потрапили в жодне замовлення.',
    expectedOutputColumns: ['product_id'],
    orderMatters: false,
    referenceSql: `
      SELECT product_id
      FROM products
      EXCEPT
      SELECT product_id
      FROM order_items;
    `,
    hints: [
      'Потрібні товари з каталогу, яких немає серед товарів, що колись входили в замовлення.',
      'EXCEPT віднімає від першого результату всі рядки, що трапляються в другому, і лишає саме різницю.',
      'Скелет: SELECT product_id FROM products EXCEPT SELECT product_id FROM order_items;',
    ],
    explanation:
      'EXCEPT віднімає другий результат від першого, і операнди тут не можна поміняти місцями: order_items EXCEPT products відповів би на зовсім інше питання — які продані товари зникли з каталогу, — і на наших даних дав би порожній результат.',
  },
  {
    id: 'L7-contact-directory',
    level: 7,
    tier: 'basic',
    topic: ['union'],
    title: 'Єдиний довідник контактів',
    context:
      'Для розсилки потрібен один список імен: і співробітників, і клієнтів, з позначкою, хто є хто.',
    schemaDescription: `${EMPLOYEES_SCHEMA}\n${CUSTOMERS_SCHEMA}`,
    setupSql: EMPLOYEES_SQL + CUSTOMERS_SQL,
    taskText:
      "Обʼєднай в один список імена співробітників і клієнтів. Для співробітників у колонці source має бути 'employee', для клієнтів — 'customer'.",
    expectedOutputColumns: ['person_name', 'source'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name AS person_name,
        'employee' AS source
      FROM employees
      UNION ALL
      SELECT
        name AS person_name,
        'customer' AS source
      FROM customers;
    `,
    hints: [
      'Тут не потрібно зʼєднувати таблиці по колонках — треба поставити рядки одні під одними.',
      "UNION ALL складає результати двох SELECT. Позначку можна задати константою: 'employee' AS source.",
      "Скелет: SELECT first_name AS person_name, 'employee' AS source FROM employees UNION ALL SELECT name, 'customer' FROM customers;",
    ],
    explanation:
      'JOIN додає колонки, UNION — рядки. Обидва запити мусять мати однакову кількість колонок сумісних типів. UNION прибирає дублікати й тому виконує додаткову роботу (хешування чи сортування), UNION ALL просто склеює й працює швидше — бери ALL, якщо дублікатів свідомо не боїтеся.',
  },
  {
    id: 'L7-price-extremes',
    level: 7,
    tier: 'basic',
    topic: ['union-all'],
    title: 'Крайні позиції прайса',
    context:
      'Для огляду цінового діапазону потрібен короткий список: найдешевші й найдорожчі товари в одній таблиці.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      "Обʼєднай два списки: два найдешевші товари з позначкою 'cheapest' і два найдорожчі з позначкою 'priciest'.",
    expectedOutputColumns: ['product_name', 'price', 'label'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        price,
        'cheapest' AS label
      FROM (
        SELECT product_name, price
        FROM products
        ORDER BY price ASC
        LIMIT 2
      ) AS cheap
      UNION ALL
      SELECT
        product_name,
        price,
        'priciest' AS label
      FROM (
        SELECT product_name, price
        FROM products
        ORDER BY price DESC
        LIMIT 2
      ) AS pricey;
    `,
    hints: [
      'Потрібні два різні набори рядків, складені один під одним.',
      'ORDER BY і LIMIT стосуються всього UNION, тому кожну половину варто обгорнути в підзапит.',
      "Скелет: SELECT ..., 'cheapest' AS label FROM (SELECT ... ORDER BY price ASC LIMIT 2) AS cheap UNION ALL SELECT ..., 'priciest' FROM (SELECT ... ORDER BY price DESC LIMIT 2) AS pricey;",
    ],
    explanation:
      'Важлива деталь: ORDER BY і LIMIT наприкінці UNION застосовуються до обʼєднаного результату, а не до кожної частини окремо. Щоб обмежити саме половину, її треба ізолювати в підзапиті — інакше запит або впаде, або поверне не те.',
  },
  {
    id: 'L7-department-priority',
    level: 7,
    tier: 'medium',
    topic: ['case-in-order-by'],
    title: 'Департаменти у порядку пріоритету',
    context:
      'HR-директор готує список співробітників для наради правління і хоче, щоб перелік відкривався ключовими для компанії департаментами, а не йшов за абеткою чи ідентифікатором.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Виведи співробітників із департаментом, впорядкувавши їх спершу за пріоритетом департаменту — IT, потім Sales, потім Marketing, потім решта, — а всередині кожного за спаданням зарплати.',
    expectedOutputColumns: ['first_name', 'department', 'salary'],
    orderMatters: true,
    referenceSql: `
      SELECT
        first_name,
        department,
        salary
      FROM employees
      WHERE department IS NOT NULL
      ORDER BY
        CASE department
          WHEN 'IT' THEN 1
          WHEN 'Sales' THEN 2
          WHEN 'Marketing' THEN 3
          ELSE 4
        END,
        salary DESC;
    `,
    hints: [
      'Департаменти потрібно розставити не за абеткою і не за кодом, а у власному наперед заданому порядку — спершу IT, потім Sales, потім Marketing, а решта — після них; усередині кожної групи — від найбільшої зарплати до найменшої.',
      'ORDER BY може сортувати за будь-яким виразом, а не лише за назвою колонки — сюди підійде CASE, що перетворює назву департаменту на число-пріоритет: чим менше число, тим вище рядок.',
      "Скелет: SELECT first_name, department, salary FROM employees WHERE department IS NOT NULL ORDER BY CASE department WHEN 'IT' THEN 1 ... END, salary DESC;",
    ],
    explanation:
      'ORDER BY приймає будь-який вираз, а не тільки колонку, — це єдиний спосіб задати порядок, якого немає ні в абетці, ні в числах. Тут використана коротка форма CASE department WHEN значення, яка порівнює на рівність; для перевірки діапазонів вона не підходить — там потрібна довга форма CASE WHEN умова.',
  },
  {
    id: 'L7-salary-grade',
    level: 7,
    tier: 'medium',
    topic: ['nested-case'],
    title: 'Грейд співробітника',
    context:
      'HR-менеджер готує звіт про грейди й хоче, щоб поріг «висока зарплата» для IT відрізнявся від порогу для решти департаментів.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      "Присвой грейд: для IT це 'IT senior' від 7000 і 'IT regular' нижче, для решти — 'senior' від 5500 і 'regular' нижче.",
    expectedOutputColumns: ['first_name', 'department', 'salary', 'grade'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        department,
        salary,
        CASE
          WHEN department = 'IT' THEN
            CASE WHEN salary >= 7000 THEN 'IT senior' ELSE 'IT regular' END
          ELSE
            CASE WHEN salary >= 5500 THEN 'senior' ELSE 'regular' END
        END AS grade
      FROM employees
      ORDER BY employee_id;
    `,
    hints: [
      'Потрібно присвоїти співробітнику грейд, причому межа «висока/невисока зарплата» різна для IT і для всіх інших департаментів.',
      'У гілку THEN одного CASE можна вкласти ще один CASE — так задають правило, що залежить від категорії: спершу перевіряють департамент, а вже всередині нього — зарплату.',
      "Скелет: SELECT ..., CASE WHEN department = 'IT' THEN CASE WHEN salary >= 7000 THEN 'IT senior' ELSE 'IT regular' END ELSE CASE WHEN salary >= 5500 THEN 'senior' ELSE 'regular' END END AS grade FROM employees;",
    ],
    explanation:
      'У гілку THEN можна поставити ще один CASE — так роблять, коли поріг залежить від категорії. Кожен END закриває саме свій CASE, і забутий END — найчастіша помилка з вкладеністю: база вкаже на синтаксичну помилку в геть іншому рядку, ніж той, де насправді загубився END.',
  },
  {
    id: 'L7-quarter-pivot',
    level: 7,
    tier: 'medium',
    topic: ['pivot', 'case-in-aggregate'],
    title: 'Квартали пліч-о-пліч',
    context:
      'Фінансовий аналітик порівнює виручку по кварталах і хоче бачити суми першого й другого кварталу поруч в одному рядку клієнта, а не в двох окремих звітах.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для кожного клієнта виведи суму замовлень першого кварталу 2024 року і суму другого — двома сусідніми колонками.',
    expectedOutputColumns: ['customer_id', 'q1', 'q2'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        SUM(
          CASE WHEN order_date < DATE '2024-04-01' THEN amount ELSE 0 END
        ) AS q1,
        SUM(
          CASE WHEN order_date >= DATE '2024-04-01' THEN amount ELSE 0 END
        ) AS q2
      FROM orders
      GROUP BY customer_id
      ORDER BY customer_id;
    `,
    hints: [
      'Для кожного клієнта потрібні одразу дві суми — за перший квартал і за другий, — розкладені по двох сусідніх колонках, а не по окремих рядках.',
      'SUM(CASE ...) усередині агрегації рахує суму лише для тих рядків, що відповідають умові в CASE, — так з одного стовпця сум роблять кілька колонок.',
      "Скелет: SELECT customer_id, SUM(CASE WHEN order_date < DATE '2024-04-01' THEN amount ELSE 0 END) AS q1, SUM(CASE ...) AS q2 FROM orders GROUP BY customer_id;",
    ],
    explanation:
      'SUM(CASE …) перетворює рядки на колонки — так будують зведені таблиці там, де окремого оператора pivot немає. ELSE 0 тут навмисний: без нього клієнт, який не замовляв у першому кварталі, отримав би в q1 порожнє значення замість чесного нуля.',
  },
  {
    id: 'L7-small-per-large',
    level: 7,
    tier: 'medium',
    topic: ['nullif', 'case-in-aggregate'],
    title: 'Скільки дрібних на одне велике',
    context:
      'Керівник відділу продажів оцінює структуру замовлень менеджерів і хоче бачити співвідношення дрібних замовлень до великих одним числом.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Порахуй для кожного менеджера, скільки замовлень до 200 припадає на одне замовлення від 200, округливши до двох знаків.',
    expectedOutputColumns: ['manager_id', 'small_per_large'],
    orderMatters: false,
    referenceSql: `
      SELECT
        manager_id,
        ROUND(
          COUNT(CASE WHEN amount < 200 THEN 1 END)::NUMERIC
            / NULLIF(COUNT(CASE WHEN amount >= 200 THEN 1 END), 0),
          2
        ) AS small_per_large
      FROM orders
      GROUP BY manager_id
      ORDER BY manager_id;
    `,
    hints: [
      'Для кожного менеджера потрібне одне число — скільки дрібних замовлень припадає на одне велике, — і воно має рахуватися коректно, навіть якщо великих замовлень у менеджера взагалі немає.',
      'NULLIF(x, 0) перетворює нуль на NULL, тому ділення на нього не падає з помилкою, а дає NULL; приведення ::NUMERIC не дає результату округлитися до цілого замість дробового.',
      'Скелет: SELECT manager_id, ROUND(COUNT(...)::NUMERIC / NULLIF(COUNT(...), 0), 2) AS small_per_large FROM orders GROUP BY manager_id;',
    ],
    explanation:
      'NULLIF(x, 0) перетворює нуль на NULL, а ділення на NULL дає NULL замість падіння — саме це рятує менеджера, у якого немає жодного великого замовлення. Виміряно: без NULLIF цей запит падає з помилкою division by zero. Приведення ::NUMERIC теж не окраса: COUNT повертає ціле число, а ділення двох цілих у PostgreSQL відкидає дробову частину.',
  },
  {
    id: 'L7-recent-events',
    level: 7,
    tier: 'medium',
    topic: ['set-case-combo', 'union-all'],
    title: 'Стрічка останніх подій',
    context:
      'Операційний директор хоче переглянути одним поглядом останні значущі події компанії — і нові замовлення, і нових співробітників.',
    schemaDescription: `${ORDERS_SCHEMA}\n${EMPLOYEES_SCHEMA}`,
    setupSql: ORDERS_SQL + EMPLOYEES_SQL,
    taskText:
      "Збери в одну стрічку замовлення від 1 червня 2024 року з позначкою 'order' і наймання від 1 січня 2024 року з позначкою 'hire'. Масштаб події: для замовлення 'large' від 200, інакше 'small'; для наймання 'senior' від зарплати 6000, інакше 'junior'.",
    expectedOutputColumns: ['event_date', 'event_type', 'scale'],
    orderMatters: false,
    referenceSql: `
      SELECT
        order_date AS event_date,
        'order' AS event_type,
        CASE WHEN amount >= 200 THEN 'large' ELSE 'small' END AS scale
      FROM orders
      WHERE order_date >= DATE '2024-06-01'
      UNION ALL
      SELECT
        hire_date,
        'hire',
        CASE WHEN salary >= 6000 THEN 'senior' ELSE 'junior' END
      FROM employees
      WHERE hire_date >= DATE '2024-01-01';
    `,
    hints: [
      'Потрібна одна спільна стрічка подій із двох різних таблиць — недавніх замовлень і недавніх наймань, — і в кожного рядка позначка типу події та її масштабу.',
      'UNION ALL складає результати двох SELECT один під одним; масштаб кожної події визначає свій CASE — окремий набір міток для замовлень і окремий для наймань.',
      "Скелет: SELECT order_date, 'order', CASE WHEN amount >= 200 THEN 'large' ELSE 'small' END FROM orders WHERE ... UNION ALL SELECT hire_date, 'hire', CASE ... END FROM employees WHERE ...;",
    ],
    explanation:
      'Назви колонок для всього результату бере перший SELECT — у другому аліаси можна взагалі не писати, вони нічого не змінили б. Від другої половини вимагається лише однакова кількість колонок сумісних типів; переплутати їхній порядок — помилка, яку база не помітить, якщо типи все одно збігаються.',
  },
  {
    id: 'L7-customer-segments',
    level: 7,
    tier: 'complex',
    topic: ['case-when', 'coalesce'],
    title: 'Сегменти клієнтів',
    context:
      'Керівник відділу продажів хоче розподілити клієнтів на сегменти за активністю й виручкою, щоб зосередити увагу саме на ключових.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      "Розподіли клієнтів по сегментах: без замовлень — 'inactive', з виручкою від 1000 — 'key', від чотирьох замовлень — 'regular', решта — 'occasional'. Клієнти без замовлень мають показувати нульову виручку.",
    expectedOutputColumns: ['name', 'orders_count', 'revenue', 'segment'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        COUNT(o.order_id) AS orders_count,
        COALESCE(SUM(o.amount), 0) AS revenue,
        CASE
          WHEN COUNT(o.order_id) = 0 THEN 'inactive'
          WHEN SUM(o.amount) >= 1000 THEN 'key'
          WHEN COUNT(o.order_id) >= 4 THEN 'regular'
          ELSE 'occasional'
        END AS segment
      FROM customers AS c
      LEFT JOIN orders AS o ON o.customer_id = c.customer_id
      GROUP BY c.customer_id, c.name
      ORDER BY revenue DESC;
    `,
    hints: [
      'Клієнтів потрібно розкласти на чотири групи одразу: без жодного замовлення, з великою виручкою, з частими замовленнями і всіх інших, — причому в клієнтів без замовлень виручка має показуватися як нуль, а не порожньо.',
      'LEFT JOIN зберігає клієнтів без замовлень у результаті, COUNT і SUM після нього рахують по кожному клієнту, а CASE зверху накладає правило вибору сегмента; COALESCE підставляє нуль там, де SUM повернув би NULL.',
      "Скелет: SELECT c.name, COUNT(o.order_id), COALESCE(SUM(o.amount), 0), CASE WHEN COUNT(o.order_id) = 0 THEN 'inactive' ... END FROM customers AS c LEFT JOIN orders AS o ON ... GROUP BY c.customer_id, c.name;",
    ],
    explanation:
      'Гілки CASE перевіряються за пріоритетом, тому перевірка на нуль замовлень стоїть першою: інакше клієнт без жодного замовлення провалився б у ELSE і став би occasional. COUNT(o.order_id) тут теж навмисний вибір: COUNT(*) після LEFT JOIN повернув би для такого клієнта 1, бо рядок у результаті існує — просто з порожніми колонками з боку orders.',
  },
  {
    id: 'L7-assortment-shift',
    level: 7,
    tier: 'complex',
    topic: ['except', 'union-all'],
    title: 'Зміна асортименту між кварталами',
    context:
      'Категорійний менеджер аналізує, як змінився асортимент продажів між першим і другим кварталом, щоб побачити, що з нього зникло, а що зʼявилося.',
    schemaDescription: `${PRODUCTS_SCHEMA}\n${ORDERS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ORDERS_SQL + ORDER_ITEMS_SQL,
    taskText:
      "Покажи, що змінилося в продажах між кварталами 2024 року: товари, які продавалися лише в першому, з позначкою 'only Q1', і ті, що зʼявилися лише в другому, з позначкою 'only Q2'.",
    expectedOutputColumns: ['product_name', 'period'],
    orderMatters: false,
    referenceSql: `
      WITH q1_products AS (
        SELECT oi.product_id
        FROM order_items AS oi
        JOIN orders AS o ON o.order_id = oi.order_id
        WHERE o.order_date < DATE '2024-04-01'
      ),
      q2_products AS (
        SELECT oi.product_id
        FROM order_items AS oi
        JOIN orders AS o ON o.order_id = oi.order_id
        WHERE o.order_date >= DATE '2024-04-01'
      )
      SELECT
        p.product_name,
        'only Q1' AS period
      FROM products AS p
      JOIN (
        SELECT product_id
        FROM q1_products
        EXCEPT
        SELECT product_id
        FROM q2_products
      ) AS gone ON gone.product_id = p.product_id
      UNION ALL
      SELECT
        p.product_name,
        'only Q2'
      FROM products AS p
      JOIN (
        SELECT product_id
        FROM q2_products
        EXCEPT
        SELECT product_id
        FROM q1_products
      ) AS fresh ON fresh.product_id = p.product_id
      ORDER BY period, product_name;
    `,
    hints: [
      'Потрібно знайти дві групи товарів: ті, що продавалися лише в першому кварталі й зникли з продажів у другому, і ті, що зʼявилися лише в другому, — і зібрати обидві групи в один список із поміткою, до якої вони належать.',
      'EXCEPT знаходить рядки одного запиту, яких немає в іншому — саме так шукають товари «лише тут»; два таких запити для двох напрямків склеюють в один список через UNION ALL.',
      "Скелет: WITH q1_products AS (...), q2_products AS (...) SELECT p.product_name, 'only Q1' FROM products AS p JOIN (SELECT product_id FROM q1_products EXCEPT SELECT product_id FROM q2_products) AS gone ON ...;",
    ],
    explanation:
      'EXCEPT несиметричний, тому питання «що змінилося» — це завжди два запити, а не один: A EXCEPT B і B EXCEPT A відповідають на різні питання. Складає їх в одну відповідь UNION ALL, а не UNION: половини за побудовою не перетинаються, і дедуплікація була б платою за роботу, яка нічого не знайде.',
  },
];
