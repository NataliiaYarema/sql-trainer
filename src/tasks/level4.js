import {
  EMPLOYEES_SQL,
  CUSTOMERS_SQL,
  ORDERS_SQL,
  PRODUCTS_SQL,
  ORDER_ITEMS_SQL,
} from './fixtures.js';
import {
  EMPLOYEES_SCHEMA,
  CUSTOMERS_SCHEMA,
  ORDERS_SCHEMA,
  PRODUCTS_SCHEMA,
  ORDER_ITEMS_SCHEMA,
} from './schemas.js';

export default [
  {
    id: 'L4-big-order-customers',
    level: 4,
    tier: 'basic',
    topic: ['subquery', 'in'],
    title: 'Клієнти з великими замовленнями',
    context: 'Відділ ключових клієнтів шукає всіх, хто хоч раз замовляв більше ніж на 300.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Виведи імена та країни клієнтів, які мають хоча б одне замовлення на суму понад 300.',
    expectedOutputColumns: ['name', 'country'],
    orderMatters: false,
    referenceSql: `
      SELECT
        name,
        country
      FROM customers
      WHERE customer_id IN (
        SELECT customer_id
        FROM orders
        WHERE amount > 300
      );
    `,
    hints: [
      'Спершу знайди ідентифікатори клієнтів із великими замовленнями, потім відбери їх у довіднику.',
      'Оператор IN приймає не лише список значень, а й цілий підзапит.',
      'Скелет: SELECT name, country FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount > 300);',
    ],
    explanation:
      'Підзапит у IN виконується першим і повертає набір значень, з яким звіряється зовнішній запит. На відміну від JOIN, клієнт не задублюється, навіть якщо великих замовлень у нього кілька — саме те, що треба для списку унікальних клієнтів.',
  },
  {
    id: 'L4-bulk-products',
    level: 4,
    tier: 'basic',
    topic: ['subquery', 'in'],
    title: 'Товари, які замовляли великими партіями',
    context: 'Логістика планує палетне зберігання для позицій, що їх беруть по три й більше штук.',
    schemaDescription: `${PRODUCTS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ORDER_ITEMS_SQL,
    taskText: 'Виведи товари, які хоча б раз замовляли в кількості 3 або більше.',
    expectedOutputColumns: ['product_name', 'category'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        category
      FROM products
      WHERE product_id IN (
        SELECT product_id
        FROM order_items
        WHERE quantity >= 3
      );
    `,
    hints: [
      'Підзапит має повернути список product_id, які підходять за умовою.',
      'Зовнішній запит фільтрує довідник товарів за цим списком через IN.',
      'Скелет: SELECT product_name, category FROM products WHERE product_id IN (SELECT product_id FROM order_items WHERE quantity >= 3);',
    ],
    explanation:
      'Підзапит у WHERE зручний, коли з другої таблиці потрібна лише умова відбору, а не її колонки. Якби зробити JOIN, довелося б додавати DISTINCT, щоб прибрати дублікати від кількох підхожих позицій.',
  },
  {
    id: 'L4-above-average-salary',
    level: 4,
    tier: 'basic',
    topic: ['subquery', 'scalar-subquery'],
    title: 'Хто заробляє більше за середнє',
    context: 'HR аналізує розкид зарплат і шукає тих, хто отримує більше за середню по компанії.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Виведи співробітників із зарплатою вищою за середню по компанії.',
    expectedOutputColumns: ['first_name', 'salary'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        salary
      FROM employees
      WHERE salary > (
        SELECT AVG(salary)
        FROM employees
      );
    `,
    hints: [
      'Середнє треба порахувати окремим запитом і використати як число в умові.',
      'Скалярний підзапит у дужках повертає одне значення, придатне для порівняння.',
      'Скелет: SELECT first_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    ],
    explanation:
      'Скалярний підзапит повертає рівно одне значення і може стояти будь-де, де очікується число. Так обходять заборону писати агрегатну функцію прямо у WHERE: підзапит рахується окремо, а потім його результат порівнюється з кожним рядком.',
  },
  {
    id: 'L4-price-vs-average',
    level: 4,
    tier: 'basic',
    topic: ['subquery', 'scalar-subquery', 'select-clause'],
    title: 'Ціна товару проти середньої',
    context:
      'Категорійний менеджер хоче бачити ціну кожного товару поруч із середньою по каталогу.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Для кожного товару виведи його ціну та середню ціну по всьому каталогу.',
    expectedOutputColumns: ['product_name', 'price', 'avg_price'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        price,
        (SELECT AVG(price) FROM products) AS avg_price
      FROM products;
    `,
    hints: [
      'Підзапит можна поставити не лише у WHERE, а й прямо в список колонок.',
      'Значення однакове для всіх рядків, бо підзапит не залежить від зовнішнього запиту.',
      'Скелет: SELECT product_name, price, (SELECT AVG(price) FROM products) AS avg_price FROM products;',
    ],
    explanation:
      'Скалярний підзапит у SELECT приписує одне й те саме значення кожному рядку — зручно для порівняння «показник проти орієнтира». Оскільки підзапит не посилається на зовнішні колонки, СУБД обчислює його один раз, а не для кожного рядка.',
  },
  {
    id: 'L4-customers-with-orders',
    level: 4,
    tier: 'basic',
    topic: ['subquery', 'exists'],
    title: 'Клієнти, які щось замовляли',
    context: 'Перед розсилкою маркетинг лишає в базі лише тих, у кого є хоч одне замовлення.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText: 'Виведи клієнтів, у яких існує хоча б одне замовлення.',
    expectedOutputColumns: ['name', 'country'],
    orderMatters: false,
    referenceSql: `
      SELECT
        name,
        country
      FROM customers AS c
      WHERE EXISTS (
        SELECT 1
        FROM orders AS o
        WHERE o.customer_id = c.customer_id
      );
    `,
    hints: [
      'Питання не «скільки замовлень», а «чи є хоч одне» — достатньо факту існування.',
      'EXISTS дає істину, щойно підзапит поверне хоча б один рядок.',
      'Скелет: SELECT name, country FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);',
    ],
    explanation:
      'EXISTS перевіряє наявність рядків, а не їхній вміст — тому всередині традиційно пишуть SELECT 1. Від JOIN відрізняється тим, що клієнт не задублюється, скільки б замовлень у нього не було.',
  },
  {
    id: 'L4-departments-without-hires',
    level: 4,
    tier: 'basic',
    topic: ['subquery', 'not-exists'],
    title: 'Департаменти без новачків',
    context:
      'HR перевіряє, які департаменти жодного разу не наймали людей у 2024 році — можливо, там спинилося зростання.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Виведи департаменти, у яких немає жодного співробітника, найнятого у 2024 році.',
    expectedOutputColumns: ['department'],
    orderMatters: false,
    referenceSql: `
      SELECT DISTINCT
        e.department
      FROM employees AS e
      WHERE e.department IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM employees AS e2
          WHERE e2.department = e.department
            AND EXTRACT(YEAR FROM e2.hire_date) = 2024
        );
    `,
    hints: [
      'Сформулюй протилежне: «у департаменті є хтось, найнятий у 2024». Потім запереч це.',
      'NOT EXISTS істинний саме тоді, коли підзапит не повернув жодного рядка.',
      'Скелет: SELECT DISTINCT department FROM employees e WHERE department IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees e2 WHERE e2.department = e.department AND EXTRACT(YEAR FROM e2.hire_date) = 2024);',
    ],
    explanation:
      'NOT EXISTS — стандартний спосіб сказати «немає жодного повʼязаного рядка». На відміну від NOT IN, він коректно поводиться з NULL: якщо підзапит поверне хоч один NULL, NOT IN дасть порожній результат, а NOT EXISTS працюватиме як очікується.',
  },
  {
    id: 'L4-first-cte',
    level: 4,
    tier: 'basic',
    topic: ['cte'],
    title: 'Перший крок із WITH',
    context:
      'Аналітик хоче розбити довгий запит на зрозумілі кроки, починаючи з відбору дорогих товарів.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText: 'Через CTE відбери товари дорожчі за 200, а потім виведи їхні назви й ціни.',
    expectedOutputColumns: ['product_name', 'price'],
    orderMatters: false,
    referenceSql: `
      WITH expensive AS (
        SELECT
          product_name,
          price
        FROM products
        WHERE price > 200
      )
      SELECT
        product_name,
        price
      FROM expensive;
    `,
    hints: [
      'CTE — це іменований проміжний результат, оголошений перед основним запитом.',
      'Синтаксис: WITH назва AS (запит) SELECT ... FROM назва;',
      'Скелет: WITH expensive AS (SELECT product_name, price FROM products WHERE price > 200) SELECT product_name, price FROM expensive;',
    ],
    explanation:
      'CTE (Common Table Expression) дає підзапиту імʼя й виносить його на початок. Тут він ще не спрощує нічого — сенс зʼявиться, коли кроків стане кілька. Головне зараз — звикнути до форми WITH назва AS (...).',
  },
  {
    id: 'L4-cte-aggregate',
    level: 4,
    tier: 'basic',
    topic: ['cte'],
    title: 'CTE з агрегацією',
    context: 'Менеджер хоче побачити суми по клієнтах, порахованих окремим зрозумілим кроком.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Через CTE порахуй суму замовлень кожного клієнта, а потім виведи лише тих, хто витратив понад 500.',
    expectedOutputColumns: ['customer_id', 'total_spent'],
    orderMatters: false,
    referenceSql: `
      WITH totals AS (
        SELECT
          customer_id,
          SUM(amount) AS total_spent
        FROM orders
        GROUP BY customer_id
      )
      SELECT
        customer_id,
        total_spent
      FROM totals
      WHERE total_spent > 500;
    `,
    hints: [
      'Спершу агрегація в CTE, потім звичайний фільтр над її результатом.',
      'До колонки, порахованої в CTE, у зовнішньому запиті можна звертатися просто у WHERE.',
      'Скелет: WITH totals AS (SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id) SELECT * FROM totals WHERE total_spent > 500;',
    ],
    explanation:
      'Ось де CTE вигідний: агрегат порахований на попередньому кроці, тому фільтрувати його можна звичайним WHERE, без HAVING. Запит читається згори вниз як послідовність дій, а не як вкладені дужки.',
  },
  {
    id: 'L4-loyal-avg-check',
    level: 4,
    tier: 'medium',
    topic: ['subquery', 'subquery-from'],
    title: 'Середній чек серед постійних клієнтів',
    context:
      'Аналітик рахує середній чек, але лише для тих, у кого щонайменше чотири замовлення — випадкові покупці спотворюють картину.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText: 'Виведи імена клієнтів із 4+ замовленнями та їхній середній чек.',
    expectedOutputColumns: ['name', 'avg_order'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        stats.avg_order
      FROM (
        SELECT
          customer_id,
          AVG(amount) AS avg_order
        FROM orders
        GROUP BY customer_id
        HAVING COUNT(*) >= 4
      ) AS stats
      JOIN customers AS c
        ON c.customer_id = stats.customer_id;
    `,
    hints: [
      'Порахуй агрегати окремим запитом, а потім приєднай до нього довідник клієнтів.',
      'Підзапит у FROM працює як тимчасова таблиця, і йому варто дати аліас.',
      'Скелет: SELECT c.name, s.avg_order FROM (SELECT customer_id, AVG(amount) AS avg_order FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4) s JOIN customers c ON ...;',
    ],
    explanation:
      'Підзапит у FROM (derived table) дає змогу спершу агрегувати дані, а потім працювати з результатом як зі звичайною таблицею. Саме з цієї ідеї виросли CTE, які щойно траплялися тобі на цьому ж рівні: вони роблять те саме, але читаються значно краще, тому в нових запитах зазвичай беруть WITH.',
  },
  {
    id: 'L4-department-top-salary',
    level: 4,
    tier: 'medium',
    topic: ['correlated-subquery'],
    title: 'Найвища зарплата у своєму департаменті',
    context:
      'Керівництво виділяє найбільш високооплачуваного співробітника в кожному департаменті.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Виведи співробітників, чия зарплата максимальна в межах їхнього департаменту.',
    expectedOutputColumns: ['first_name', 'department', 'salary'],
    orderMatters: false,
    referenceSql: `
      SELECT
        e.first_name,
        e.department,
        e.salary
      FROM employees AS e
      WHERE e.salary = (
        SELECT MAX(e2.salary)
        FROM employees AS e2
        WHERE e2.department = e.department
      );
    `,
    hints: [
      'Порівнювати треба не з глобальним максимумом, а з максимумом усередині того самого департаменту.',
      'Корельований підзапит може посилатися на колонку зовнішнього запиту: WHERE e2.department = e.department.',
      'Скелет: SELECT ... FROM employees e WHERE e.salary = (SELECT MAX(e2.salary) FROM employees e2 WHERE e2.department = e.department);',
    ],
    explanation:
      'Корельований підзапит виконується заново для кожного рядка зовнішнього запиту й «бачить» його колонки. Це потужно, але дорого: на великих таблицях така конструкція перетворюється на прихований цикл, і краще працюють віконні функції з наступного рівня.',
  },
  {
    id: 'L4-order-count-subquery',
    level: 4,
    tier: 'medium',
    topic: ['correlated-subquery', 'select-clause'],
    title: 'Лічильник замовлень підзапитом',
    context: 'Менеджер хоче єдиний список клієнтів із кількістю замовлень поруч із кожним.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Для кожного клієнта виведи кількість його замовлень, порахувавши її корельованим підзапитом. Клієнти без замовлень мають показати 0.',
    expectedOutputColumns: ['name', 'order_count'],
    orderMatters: false,
    referenceSql: `
      SELECT
        c.name,
        (
          SELECT COUNT(*)
          FROM orders AS o
          WHERE o.customer_id = c.customer_id
        ) AS order_count
      FROM customers AS c;
    `,
    hints: [
      'Підзапит у SELECT може посилатися на поточний рядок зовнішнього запиту.',
      'COUNT(*) для клієнта без замовлень поверне 0, тому додаткових хитрощів не потрібно.',
      'Скелет: SELECT c.name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS order_count FROM customers c;',
    ],
    explanation:
      'Корельований підзапит у SELECT дає той самий результат, що LEFT JOIN з GROUP BY, але читається простіше. Приємний бонус: COUNT у порожньому підзапиті природно повертає 0, тоді як у LEFT JOIN довелося б стежити, щоб не порахувати сам рядок клієнта.',
  },
  {
    id: 'L4-two-cte-steps',
    level: 4,
    tier: 'medium',
    topic: ['cte', 'multiple-cte', 'cte-chain'],
    title: 'Два кроки в одному запиті',
    context:
      'Аналітик порівнює виручку по категоріях із середньою виручкою категорії, щоб знайти лідерів.',
    schemaDescription: `${PRODUCTS_SCHEMA}\n${ORDER_ITEMS_SCHEMA}`,
    setupSql: PRODUCTS_SQL + ORDER_ITEMS_SQL,
    taskText:
      'Через два CTE порахуй виручку кожної категорії, потім середню виручку серед категорій, і виведи категорії з виручкою вище цієї середньої.',
    expectedOutputColumns: ['category', 'revenue'],
    orderMatters: false,
    referenceSql: `
      WITH category_revenue AS (
        SELECT
          p.category,
          SUM(oi.quantity * p.price) AS revenue
        FROM order_items AS oi
        JOIN products AS p
          ON p.product_id = oi.product_id
        GROUP BY p.category
      ),
      average_revenue AS (
        SELECT AVG(revenue) AS avg_revenue
        FROM category_revenue
      )
      SELECT
        category,
        revenue
      FROM category_revenue, average_revenue
      WHERE revenue > avg_revenue;
    `,
    hints: [
      'Кілька CTE перелічуються через кому після одного WITH.',
      'Другий CTE може посилатися на перший — саме так рахується середнє від уже готових сум.',
      'Скелет: WITH category_revenue AS (...), average_revenue AS (SELECT AVG(revenue) FROM category_revenue) SELECT ... FROM category_revenue, average_revenue WHERE revenue > avg_revenue;',
    ],
    explanation:
      'Кілька CTE утворюють ланцюжок кроків, де кожен наступний спирається на попередній — запит читається як послідовність дій. Без CTE ту саму логіку довелося б писати вкладеними підзапитами, дублюючи агрегацію двічі.',
  },
  {
    id: 'L4-employees-not-managers',
    level: 4,
    tier: 'medium',
    topic: ['subquery', 'not-exists'],
    title: 'Хто нікого не веде',
    context: 'HR планує навчання для керівників і спершу відсіює тих, у кого поки немає підлеглих.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Виведи імена та прізвища співробітників, у яких немає жодного підлеглого. Скористайся NOT EXISTS.',
    expectedOutputColumns: ['first_name', 'last_name'],
    orderMatters: false,
    referenceSql: `
      SELECT
        e.first_name,
        e.last_name
      FROM employees AS e
      WHERE NOT EXISTS (
        SELECT 1
        FROM employees AS m
        WHERE m.manager_id = e.employee_id
      );
    `,
    hints: [
      'Сформулюй протилежне: «є хтось, чий керівник — ця людина». Потім запереч це.',
      'NOT EXISTS істинний саме тоді, коли підзапит не повернув жодного рядка.',
      'Скелет: SELECT e.first_name, e.last_name FROM employees e WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.employee_id);',
    ],
    explanation:
      'Це завдання існує заради однієї конкретної пастки. Очевидний запис WHERE employee_id NOT IN (SELECT manager_id FROM employees) повертає нуль рядків — і мовчки, без жодної помилки. Причина в тому, що серед manager_id є NULL: вираз x NOT IN (8, 3, NULL) розкривається в x <> 8 AND x <> 3 AND x <> NULL, а останній доданок дає «невідомо», тому весь вираз ніколи не буває істинним. NOT EXISTS перевіряє не значення, а наявність рядків, і NULL його не збиває. Тому з підзапитом, у якому можливі порожні значення, беруть саме NOT EXISTS.',
  },
  {
    id: 'L4-managers-above-average',
    level: 4,
    tier: 'complex',
    topic: ['cte', 'subquery', 'scalar-subquery'],
    title: 'Менеджери, що переганяють середню',
    context:
      'Керівник відділу продажів шукає, хто з менеджерів приносить більше за середній результат по відділу.',
    schemaDescription: `${EMPLOYEES_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: EMPLOYEES_SQL + ORDERS_SQL,
    taskText:
      'Порахуй сумарні продажі кожного менеджера й виведи тих, чия сума перевищує середню суму по менеджерах.',
    expectedOutputColumns: ['first_name', 'total_sales'],
    orderMatters: false,
    referenceSql: `
      WITH manager_sales AS (
        SELECT
          e.employee_id,
          e.first_name,
          SUM(o.amount) AS total_sales
        FROM orders AS o
        JOIN employees AS e
          ON e.employee_id = o.manager_id
        GROUP BY e.employee_id, e.first_name
      )
      SELECT
        first_name,
        total_sales
      FROM manager_sales
      WHERE total_sales > (
        SELECT AVG(total_sales)
        FROM manager_sales
      );
    `,
    hints: [
      'Спершу зведи замовлення до сум по менеджерах — це природний CTE.',
      'Потім порівняй кожну суму із середнім, порахованим з того самого CTE скалярним підзапитом.',
      'Скелет: WITH manager_sales AS (SELECT e.first_name, SUM(o.amount) AS total_sales FROM orders o JOIN employees e ON e.employee_id = o.manager_id GROUP BY ...) SELECT * FROM manager_sales WHERE total_sales > (SELECT AVG(total_sales) FROM manager_sales);',
    ],
    explanation:
      'Підсумкове завдання рівня зводить разом JOIN, агрегацію, CTE та скалярний підзапит. Ключова перевага CTE тут у тому, що на нього можна послатися двічі — і в основному запиті, і всередині підзапиту — не переписуючи агрегацію вдруге.',
  },
  {
    id: 'L4-three-step-report',
    level: 4,
    tier: 'complex',
    topic: ['cte', 'multiple-cte', 'cte-chain'],
    title: 'Звіт у три кроки',
    context:
      'Аналітик готує огляд ринків: спершу зводить витрати клієнтів, потім країни, і лише тоді порівнює країни між собою.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Через три CTE порахуй витрати кожного клієнта, зведи їх у виручку по країнах, знайди середню виручку країни й виведи країни, що її перевищують.',
    expectedOutputColumns: ['country', 'country_total'],
    orderMatters: false,
    referenceSql: `
      WITH customer_totals AS (
        SELECT
          customer_id,
          SUM(amount) AS total
        FROM orders
        GROUP BY customer_id
      ),
      country_totals AS (
        SELECT
          c.country,
          SUM(t.total) AS country_total
        FROM customer_totals AS t
        JOIN customers AS c
          ON c.customer_id = t.customer_id
        GROUP BY c.country
      ),
      overall AS (
        SELECT AVG(country_total) AS avg_country
        FROM country_totals
      )
      SELECT
        country,
        country_total
      FROM country_totals, overall
      WHERE country_total > avg_country;
    `,
    hints: [
      'Кроків рівно три, і кожен наступний працює з результатом попереднього, а не з вихідними таблицями.',
      'Кілька CTE перелічуються через кому після одного WITH, і другий може посилатися на перший.',
      'Скелет: WITH customer_totals AS (...), country_totals AS (... FROM customer_totals ...), overall AS (SELECT AVG(country_total) FROM country_totals) SELECT ... FROM country_totals, overall WHERE country_total > avg_country;',
    ],
    explanation:
      'Ланцюжок CTE розгортає запит згори вниз як послідовність кроків, а не як три рівні вкладених дужок — саме цим він і цінний, коли логіка звіту багатоетапна. Зверни увагу на агрегат від агрегату в другому кроці: SUM(t.total) підсумовує вже пораховані суми клієнтів. Написати там SUM(o.amount) було б неможливо, бо на цьому кроці окремих замовлень уже не існує — попередній CTE згорнув їх у підсумки.',
  },
];
