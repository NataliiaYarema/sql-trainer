import { EMPLOYEES_SQL, CUSTOMERS_SQL, ORDERS_SQL, PRODUCTS_SQL } from './fixtures.js';
import { EMPLOYEES_SCHEMA, CUSTOMERS_SCHEMA, ORDERS_SCHEMA, PRODUCTS_SCHEMA } from './schemas.js';

export default [
  {
    id: 'L5-number-by-salary',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'row-number'],
    title: 'Пронумерувати за зарплатою',
    context: 'HR будує єдиний список співробітників, упорядкований за рівнем оплати.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText: 'Присвойте кожному співробітнику порядковий номер за спаданням зарплати.',
    expectedOutputColumns: ['first_name', 'salary', 'position'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        salary,
        ROW_NUMBER() OVER (ORDER BY salary DESC) AS position
      FROM employees;
    `,
    hints: [
      'Потрібно пронумерувати рядки, не втрачаючи жодного з них.',
      'ROW_NUMBER() OVER (ORDER BY salary DESC) присвоює номери в заданому порядку.',
      'Скелет: SELECT first_name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS position FROM employees;',
    ],
    explanation:
      'Головна відмінність віконних функцій від GROUP BY: вони не схлопують рядки. Конструкція OVER (...) описує «вікно» — набір рядків, у межах якого працює функція. Тут вікно охоплює всю таблицю, а ORDER BY задає порядок нумерації.',
  },
  {
    id: 'L5-tied-ranks',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'rank'],
    title: 'Місця з однаковими результатами',
    context:
      'Для дошки пошани потрібен рейтинг, де співробітники з однаковою зарплатою ділять одне місце.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Присвойте кожному співробітнику місце за зарплатою так, щоб однакові зарплати отримали однакове місце.',
    expectedOutputColumns: ['first_name', 'salary', 'salary_rank'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        salary,
        RANK() OVER (ORDER BY salary DESC) AS salary_rank
      FROM employees;
    `,
    hints: [
      'ROW_NUMBER дав би різні номери навіть за однакових значень — потрібна інша функція.',
      'RANK() присвоює однакове місце однаковим значенням.',
      'Скелет: SELECT first_name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;',
    ],
    explanation:
      'RANK дає однакове місце однаковим значенням, а далі «перестрибує» номери: після двох других місць іде четверте. Якщо пропуски небажані, беруть DENSE_RANK. Три функції — ROW_NUMBER, RANK, DENSE_RANK — вирішують три різні задачі, і плутати їх не варто.',
  },
  {
    id: 'L5-department-payroll',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'partition-by'],
    title: 'Фонд оплати свого департаменту',
    context: 'Фінанси хочуть бачити поруч із кожним співробітником загальний бюджет його відділу.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Для кожного співробітника виведіть його зарплату та сумарний фонд оплати його департаменту.',
    expectedOutputColumns: ['first_name', 'department', 'salary', 'department_total'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        department,
        salary,
        SUM(salary) OVER (PARTITION BY department) AS department_total
      FROM employees;
    `,
    hints: [
      'Сума рахується по департаменту, але кожен співробітник має лишитися окремим рядком.',
      'PARTITION BY розбиває вікно на групи: SUM(salary) OVER (PARTITION BY department).',
      'Скелет: SELECT first_name, department, salary, SUM(salary) OVER (PARTITION BY department) AS department_total FROM employees;',
    ],
    explanation:
      'PARTITION BY — аналог GROUP BY всередині вікна, але без схлопування рядків. Через GROUP BY такого не досягти: він лишив би по одному рядку на департамент і знищив дані окремих людей. Саме тому «значення поруч із підсумком групи» — задача для віконних функцій.',
  },
  {
    id: 'L5-vs-department-average',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'partition-by'],
    title: 'Порівняння із середнім по відділу',
    context: 'Перед ревʼю зарплат HR хоче бачити середнє по департаменту поруч із кожним окладом.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Для кожного співробітника виведіть його зарплату та середню зарплату його департаменту.',
    expectedOutputColumns: ['first_name', 'department', 'salary', 'dept_avg_salary'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        department,
        salary,
        AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary
      FROM employees;
    `,
    hints: [
      'Це та сама конструкція, що й із сумою, тільки інша агрегатна функція.',
      'AVG(salary) OVER (PARTITION BY department) дає середнє вікна для кожного рядка.',
      'Скелет: SELECT first_name, department, salary, AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary FROM employees;',
    ],
    explanation:
      'Будь-яка агрегатна функція — SUM, AVG, COUNT, MIN, MAX — стає віконною, щойно ви додаєте OVER. Порівняння значення рядка з агрегатом його групи в одному запиті — саме те, заради чого віконні функції й придумали.',
  },
  {
    id: 'L5-previous-order',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'lag'],
    title: 'Попереднє замовлення клієнта',
    context:
      'Аналітик вивчає поведінку покупців і хоче бачити поруч із кожним замовленням дату попереднього.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для кожного замовлення виведіть дату попереднього замовлення того самого клієнта. Для першого замовлення клієнта значення має бути NULL.',
    expectedOutputColumns: ['customer_id', 'order_date', 'prev_order_date'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        order_date,
        LAG(order_date) OVER (
          PARTITION BY customer_id
          ORDER BY order_date
        ) AS prev_order_date
      FROM orders;
    `,
    hints: [
      'Заглядати треба назад, і окремо в межах кожного клієнта.',
      'LAG(x) OVER (PARTITION BY customer_id ORDER BY order_date) бере значення з попереднього рядка вікна.',
      'Скелет: SELECT customer_id, order_date, LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_date FROM orders;',
    ],
    explanation:
      'LAG дає доступ до попереднього рядка вікна. PARTITION BY тут критичний: без нього функція взяла б дату замовлення зовсім іншого клієнта. У першого рядка кожного вікна попереднього немає, тому LAG повертає NULL.',
  },
  {
    id: 'L5-next-order',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'lead'],
    title: 'Наступне замовлення клієнта',
    context: 'Щоб рахувати час до повторної покупки, потрібна дата наступного замовлення.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для кожного замовлення виведіть дату наступного замовлення того самого клієнта. Для останнього замовлення значення має бути NULL.',
    expectedOutputColumns: ['customer_id', 'order_date', 'next_order_date'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        order_date,
        LEAD(order_date) OVER (
          PARTITION BY customer_id
          ORDER BY order_date
        ) AS next_order_date
      FROM orders;
    `,
    hints: [
      'Це дзеркальне відображення попереднього завдання.',
      'LEAD(x) працює так само, як LAG, але дивиться на наступний рядок.',
      'Скелет: SELECT customer_id, order_date, LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_order_date FROM orders;',
    ],
    explanation:
      'LAG і LEAD — пара для роботи із сусідніми рядками. На їхній різниці будують інтервали між подіями: час до наступної покупки, час від попереднього логіну, тривалість між етапами воронки.',
  },
  {
    id: 'L5-dense-vs-rank',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'rank', 'dense-rank'],
    title: 'Два способи роздати місця',
    context:
      'Категорійний менеджер робить рейтинг цін і не може вирішити, як нумерувати позиції з однаковою вартістю.',
    schemaDescription: PRODUCTS_SCHEMA,
    setupSql: PRODUCTS_SQL,
    taskText:
      'Для кожного товару виведіть його місце за ціною, пораховане двома способами: RANK і DENSE_RANK.',
    expectedOutputColumns: ['product_name', 'price', 'price_rank', 'dense_price_rank'],
    orderMatters: false,
    referenceSql: `
      SELECT
        product_name,
        price,
        RANK() OVER (ORDER BY price DESC) AS price_rank,
        DENSE_RANK() OVER (ORDER BY price DESC) AS dense_price_rank
      FROM products;
    `,
    hints: [
      'Потрібні дві колонки з місцями, пораховані за тим самим правилом сортування.',
      'RANK і DENSE_RANK — окремі віконні функції; обидві приймають однакове OVER (ORDER BY ...).',
      'Скелет: SELECT product_name, price, RANK() OVER (ORDER BY price DESC) AS price_rank, DENSE_RANK() OVER (ORDER BY price DESC) AS dense_price_rank FROM products;',
    ],
    explanation:
      'Різниця видно лише на нічиїх, і в даних вони є: по 210 коштують два товари, по 89 — теж два. Після пари однакових значень RANK пропускає номер (1, 2, 2, 4), а DENSE_RANK не пропускає (1, 2, 2, 3). Обирайте свідомо: RANK чесно каже «третього місця не існує, бо двоє поділили друге», DENSE_RANK зручніший, коли номер потрібен як мітка рівня, а не як позиція в перегонах.',
  },
  {
    id: 'L5-best-order-alongside',
    level: 5,
    tier: 'basic',
    topic: ['window-functions', 'first-value', 'partition-by'],
    title: 'Найбільша покупка поруч із кожною',
    context:
      'Менеджер дивиться історію клієнта й хоче одразу бачити, наскільки кожне замовлення далеке від його рекорду.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для кожного замовлення виведіть його суму й суму найбільшого замовлення цього ж клієнта.',
    expectedOutputColumns: ['customer_id', 'order_id', 'amount', 'best_amount'],
    orderMatters: false,
    referenceSql: `
      SELECT
        customer_id,
        order_id,
        amount,
        FIRST_VALUE(amount) OVER (
          PARTITION BY customer_id
          ORDER BY amount DESC
        ) AS best_amount
      FROM orders;
    `,
    hints: [
      'Рекорд рахується в межах одного клієнта, але всі замовлення мають лишитися в результаті.',
      'FIRST_VALUE бере значення з першого рядка вікна, а який рядок перший — вирішує ORDER BY всередині OVER.',
      'Скелет: SELECT customer_id, order_id, amount, FIRST_VALUE(amount) OVER (PARTITION BY customer_id ORDER BY amount DESC) AS best_amount FROM orders;',
    ],
    explanation:
      'Уся суть FIRST_VALUE у сортуванні всередині OVER: воно визначає, який рядок вважати першим, тому ORDER BY amount DESC перетворює «перший» на «найбільший». MAX(amount) з GROUP BY дав би те саме число, але знищив би окремі замовлення — лишився б один рядок на клієнта. Віконна функція навпаки: рахує по групі, а рядки лишає на місці.',
  },
  {
    id: 'L5-running-revenue',
    level: 5,
    tier: 'medium',
    topic: ['window-functions', 'running-total'],
    title: 'Накопичувальна виручка',
    context: 'Аналітик будує графік накопиченої виручки, щоб показати прогрес до річної цілі.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Виведіть кожне замовлення разом із накопичувальною сумою всіх замовлень від найранішого до поточного.',
    expectedOutputColumns: ['order_date', 'amount', 'running_total'],
    orderMatters: true,
    referenceSql: `
      SELECT
        order_date,
        amount,
        SUM(amount) OVER (ORDER BY order_date, order_id) AS running_total
      FROM orders
      ORDER BY order_date, order_id;
    `,
    hints: [
      'Сума має накопичуватись по рядках у певному порядку, а не рахуватись одна на всю таблицю.',
      'Агрегатна функція з OVER (ORDER BY ...) перетворюється на накопичувальну.',
      'Скелет: SELECT order_date, amount, SUM(amount) OVER (ORDER BY order_date, order_id) AS running_total FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'SUM() OVER (ORDER BY ...) без PARTITION BY рахує running total: для кожного рядка підсумовує всі попередні плюс поточний. Додаткова колонка в ORDER BY розвʼязує нічиї між однаковими датами — без неї порядок, а отже й накопичена сума, стають непередбачуваними.',
  },
  {
    id: 'L5-largest-order-per-customer',
    level: 5,
    tier: 'medium',
    topic: ['window-functions', 'cte', 'top-n-per-group'],
    title: 'Найбільше замовлення кожного клієнта',
    context: 'Відділ роботи з клієнтами готує картки покупців із їхньою найбільшою покупкою.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText: 'Для кожного клієнта, який має замовлення, виведіть його найдорожче замовлення.',
    expectedOutputColumns: ['name', 'order_date', 'amount'],
    orderMatters: false,
    referenceSql: `
      WITH ranked AS (
        SELECT
          customer_id,
          order_date,
          amount,
          ROW_NUMBER() OVER (
            PARTITION BY customer_id
            ORDER BY amount DESC
          ) AS rn
        FROM orders
      )
      SELECT
        c.name,
        r.order_date,
        r.amount
      FROM ranked AS r
      JOIN customers AS c
        ON c.customer_id = r.customer_id
      WHERE r.rn = 1;
    `,
    hints: [
      'Це «top-1 у межах групи»: пронумеруйте замовлення кожного клієнта за сумою й лишіть перше.',
      'Віконну функцію не можна використати у WHERE того самого запиту — винесіть її в CTE.',
      'Скелет: WITH ranked AS (SELECT ..., ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn FROM orders) SELECT ... FROM ranked r JOIN customers c ON ... WHERE r.rn = 1;',
    ],
    explanation:
      'Віконні функції обчислюються після WHERE, тому фільтрувати за ними в тому самому рівні запиту неможливо. CTE виносить обчислення на окремий крок — і це універсальний розвʼязок цілого класу задач «останнє, найбільше, перше в межах групи».',
  },
  {
    id: 'L5-monthly-manager-rank',
    level: 5,
    tier: 'medium',
    topic: ['window-functions', 'cte', 'partition-by'],
    title: 'Рейтинг менеджерів за місяцями',
    context:
      'Керівник відділу продажів щомісяця визначає, хто з менеджерів приніс найбільше грошей.',
    schemaDescription: `${EMPLOYEES_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: EMPLOYEES_SQL + ORDERS_SQL,
    taskText:
      'Для кожного місяця проранжуйте менеджерів за сумою продажів (1 — найкращий у своєму місяці).',
    expectedOutputColumns: ['month', 'first_name', 'monthly_sales', 'sales_rank'],
    orderMatters: false,
    referenceSql: `
      WITH monthly AS (
        SELECT
          TO_CHAR(o.order_date, 'YYYY-MM') AS month,
          e.first_name,
          SUM(o.amount) AS monthly_sales
        FROM orders AS o
        JOIN employees AS e
          ON e.employee_id = o.manager_id
        GROUP BY TO_CHAR(o.order_date, 'YYYY-MM'), e.first_name
      )
      SELECT
        month,
        first_name,
        monthly_sales,
        ROW_NUMBER() OVER (
          PARTITION BY month
          ORDER BY monthly_sales DESC
        ) AS sales_rank
      FROM monthly;
    `,
    hints: [
      'Спершу зведіть замовлення до сум «менеджер × місяць», і лише потім ранжуйте.',
      'Вікно розбивається по місяцю: PARTITION BY month ORDER BY monthly_sales DESC.',
      "Скелет: WITH monthly AS (SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS month, e.first_name, SUM(o.amount) AS monthly_sales FROM orders o JOIN employees e ON ... GROUP BY 1, 2) SELECT ..., ROW_NUMBER() OVER (PARTITION BY month ORDER BY monthly_sales DESC) AS sales_rank FROM monthly;",
    ],
    explanation:
      'Двоетапна конструкція «спершу агрегувати, потім ранжувати» трапляється постійно. Порядок принциповий: віконна функція має працювати вже над підсумками, а не над окремими замовленнями — інакше ранг рахувався б для кожного чека окремо.',
  },
  {
    id: 'L5-salary-quartiles',
    level: 5,
    tier: 'medium',
    topic: ['window-functions', 'ntile'],
    title: 'Зарплати по чвертях',
    context:
      'HR готує огляд компенсацій і хоче розкласти всіх співробітників на чотири рівні групи за зарплатою.',
    schemaDescription: EMPLOYEES_SCHEMA,
    setupSql: EMPLOYEES_SQL,
    taskText:
      'Розділіть співробітників на чотири рівні групи за зарплатою, від найвищої до найнижчої, і виведіть номер групи для кожного.',
    expectedOutputColumns: ['first_name', 'salary', 'quartile'],
    orderMatters: false,
    referenceSql: `
      SELECT
        first_name,
        salary,
        NTILE(4) OVER (ORDER BY salary DESC) AS quartile
      FROM employees;
    `,
    hints: [
      'Групи задає не значення зарплати, а місце людини в упорядкованому списку.',
      'NTILE(n) ділить рядки вікна на n частин приблизно однакового розміру.',
      'Скелет: SELECT first_name, salary, NTILE(4) OVER (ORDER BY salary DESC) AS quartile FROM employees;',
    ],
    explanation:
      'NTILE ділить не діапазон значень, а саме рядки: у кожній чверті буде приблизно однакова кількість людей, навіть якщо зарплати всередині них дуже різні. Дванадцять співробітників діляться на чотири рівно по три; якби їх було тринадцять, зайвий рядок дістався б першій групі, а не останній — розміри груп відрізняються щонайбільше на одиницю, і надлишок завжди йде на початок.',
  },
  {
    id: 'L5-moving-average',
    level: 5,
    tier: 'medium',
    topic: ['window-functions', 'moving-average', 'window-frame'],
    title: 'Згладжена динаміка чеків',
    context:
      'Аналітик будує графік і хоче прибрати з нього стрибки окремих замовлень, лишивши тенденцію.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для кожного замовлення в хронологічному порядку виведіть його суму й середню суму за поточним і двома попередніми замовленнями, округлену до двох знаків.',
    expectedOutputColumns: ['order_date', 'amount', 'moving_avg'],
    orderMatters: true,
    referenceSql: `
      SELECT
        order_date,
        amount,
        ROUND(AVG(amount) OVER (
          ORDER BY order_date, order_id
          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 2) AS moving_avg
      FROM orders
      ORDER BY order_date, order_id;
    `,
    hints: [
      'Середнє має рахуватися не від початку історії, а лише за трьома сусідніми рядками.',
      'Скільки саме рядків бере вікно, задає рамка ROWS BETWEEN ... AND ...',
      'Скелет: SELECT order_date, amount, ROUND(AVG(amount) OVER (ORDER BY order_date, order_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'Рамка вікна — це відповідь на питання «за якими саме рядками рахувати». Без ROWS BETWEEN агрегат з ORDER BY бере всі рядки від початку до поточного, тобто дає накопичувальне середнє, а не ковзне. У перших двох рядках рамка коротша, бо попередніх рядків просто немає, — це не помилка, а нормальний край ряду. Друга колонка в ORDER BY розвʼязує нічиї між однаковими датами й робить результат відтворюваним.',
  },
  {
    id: 'L5-daily-customer-spend',
    level: 5,
    tier: 'complex',
    topic: ['window-functions', 'cte', 'running-total', 'lag'],
    title: 'Накопичені витрати клієнта день за днем',
    context:
      'Продуктова аналітика будує когортний звіт: як зростають витрати кожного клієнта від покупки до покупки.',
    schemaDescription: `${CUSTOMERS_SCHEMA}\n${ORDERS_SCHEMA}`,
    setupSql: CUSTOMERS_SQL + ORDERS_SQL,
    taskText:
      'Для кожного замовлення виведіть імʼя клієнта, дату, суму, накопичену суму його витрат до цього моменту включно та суму його попереднього замовлення.',
    expectedOutputColumns: ['name', 'order_date', 'amount', 'running_spend', 'prev_amount'],
    orderMatters: false,
    referenceSql: `
      WITH customer_orders AS (
        SELECT
          c.name,
          o.customer_id,
          o.order_id,
          o.order_date,
          o.amount
        FROM orders AS o
        JOIN customers AS c
          ON c.customer_id = o.customer_id
      )
      SELECT
        name,
        order_date,
        amount,
        SUM(amount) OVER (
          PARTITION BY customer_id
          ORDER BY order_date, order_id
        ) AS running_spend,
        LAG(amount) OVER (
          PARTITION BY customer_id
          ORDER BY order_date, order_id
        ) AS prev_amount
      FROM customer_orders;
    `,
    hints: [
      'Обидві віконні функції працюють над одним вікном: окремо для кожного клієнта, у порядку дат.',
      'Накопичення — це SUM(...) OVER (PARTITION BY ... ORDER BY ...), а попереднє значення — LAG над тим самим вікном.',
      'Скелет: WITH customer_orders AS (SELECT c.name, o.customer_id, o.order_id, o.order_date, o.amount FROM orders o JOIN customers c ON ...) SELECT name, order_date, amount, SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS running_spend, LAG(amount) OVER (...) AS prev_amount FROM customer_orders;',
    ],
    explanation:
      'Підсумкове завдання курсу: кілька віконних функцій над одним вікном плюс CTE для підготовки даних. Саме так рахують когортні метрики — накопичений дохід, LTV у часі, крок до наступної покупки. Зверніть увагу, що обидві функції описують однакове вікно: коли таких виразів багато, його виносять в окремий блок WINDOW, щоб не повторюватися.',
  },
  {
    id: 'L5-top-two-per-manager',
    level: 5,
    tier: 'complex',
    topic: ['window-functions', 'row-number', 'top-n-per-group', 'cte'],
    title: 'Дві найбільші угоди кожного менеджера',
    context:
      'Керівник відділу готує щоквартальні відзнаки й хоче бачити по дві найкращі угоди кожного продавця.',
    schemaDescription: ORDERS_SCHEMA,
    setupSql: ORDERS_SQL,
    taskText:
      'Для кожного менеджера виведіть два його найбільші замовлення. Якщо замовлення лише одне, показати саме його.',
    expectedOutputColumns: ['manager_id', 'order_id', 'amount'],
    orderMatters: false,
    referenceSql: `
      WITH ranked AS (
        SELECT
          manager_id,
          order_id,
          amount,
          ROW_NUMBER() OVER (
            PARTITION BY manager_id
            ORDER BY amount DESC
          ) AS rn
        FROM orders
      )
      SELECT
        manager_id,
        order_id,
        amount
      FROM ranked
      WHERE rn <= 2;
    `,
    hints: [
      'Це «топ-N усередині групи»: спершу пронумеруйте замовлення кожного менеджера за сумою, потім лишіть перші два.',
      'Віконну функцію не можна використати у WHERE того самого запиту — винесіть її в CTE.',
      'Скелет: WITH ranked AS (SELECT manager_id, order_id, amount, ROW_NUMBER() OVER (PARTITION BY manager_id ORDER BY amount DESC) AS rn FROM orders) SELECT manager_id, order_id, amount FROM ranked WHERE rn <= 2;',
    ],
    explanation:
      'Універсальний прийом для цілого класу задач «перші N у межах групи»: пронумерувати вікном, а потім відфільтрувати номер уже над готовим результатом. Прямо у WHERE цього не зробити, бо віконні функції обчислюються після WHERE, — звідси CTE. Зверніть увагу, що рядків сім, а не вісім: в одного менеджера є лише одне замовлення, і ROW_NUMBER не вигадує другого. «Топ-2» для групи з одного елемента чесно дає один рядок.',
  },
];
