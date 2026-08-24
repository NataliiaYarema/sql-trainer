import {
  EMPLOYEES_SQL,
  CUSTOMERS_SQL,
  PRODUCTS_SQL,
  ORDERS_SQL,
  ORDER_ITEMS_SQL,
  RAW_CONTACTS_SQL,
} from '../tasks/fixtures.js';
import { ANALYTICS_SQL } from '../tasks/analyticsFixtures.js';
import { dedent } from '../utils/dom.js';

// Теорія працює на тих самих таблицях, що й практика, але свідомо іншими
// запитами: tests/verifyTheory.mjs звіряє кожен приклад з банком referenceSql
// і виконує його проти setupSql, тож описка в назві колонки завалить тести.
//
// SQL пишемо так, як його пишуть у роботі: кожна секція з нового рядка,
// аргументи з відступом. dedent прибирає відступ самого JS-файлу, тож у теорію
// потрапляє рівно те, що видно тут. Тест стежить, щоб рядок не був довший за
// 72 символи — інакше приклад поїде за край панелі.

const topics = [
  {
    level: 1,
    title: 'Основи вибірки',
    keywords: ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'LIMIT', 'DISTINCT'],
    summary: 'Запит починається з того, що ти називаєш потрібні колонки (SELECT) і таблицю (FROM).',
    summaryBlocks: [
      [
        'WHERE лишає тільки ті рядки, що підходять під умову.',
        'ORDER BY впорядковує рядки, що лишилися.',
        'LIMIT обрізає результат до кількох перших.',
      ],
      'Порядок частин фіксований: SELECT → FROM → WHERE → ORDER BY → LIMIT.',
      'Ще на цьому рівні знадобляться агрегати COUNT, SUM, MIN, MAX — ' +
        'без GROUP BY вони згортають усю вибірку в один рядок.',
    ],
    setupSql: PRODUCTS_SQL,
    examples: [
      {
        label: 'ORDER BY + LIMIT — верхівка списку',
        sql: dedent(`
          SELECT
            product_name,
            price
          FROM products
          ORDER BY price DESC
          LIMIT 3;
        `),
        result:
          'Три найдорожчі товари: Standing Desk за 430, Coffee Machine за 380 і 4K Monitor за 320. LIMIT обрізає вже впорядкований список, тому без ORDER BY він віддав би просто три випадкові рядки.',
      },
      {
        label: 'DISTINCT — прибрати повтори',
        sql: dedent(`
          SELECT DISTINCT
            category
          FROM products;
        `),
        result:
          'Одна колонка з переліком категорій, кожна рівно раз, без урахування кількості товарів у ній.',
      },
      {
        label: 'BETWEEN — діапазон замість двох порівнянь',
        sql: dedent(`
          SELECT
            product_name,
            price
          FROM products
          WHERE price BETWEEN 50 AND 150
          ORDER BY price;
        `),
        result:
          'Товари з ціною від 50 до 150 включно, від найдешевшого до найдорожчого. Те саме, що price >= 50 AND price <= 150.',
      },
      {
        label: 'LIKE — пошук за фрагментом тексту',
        sql: dedent(`
          SELECT
            product_name,
            price
          FROM products
          WHERE product_name LIKE '%Set%';
        `),
        result:
          'Назви, всередині яких трапляється «Set». Символ % означає «будь-скільки будь-яких символів».',
      },
      {
        label: 'Агрегати без GROUP BY',
        sql: dedent(`
          SELECT
            COUNT(*) AS total,
            MIN(price) AS cheapest,
            MAX(price) AS priciest
          FROM products;
        `),
        result:
          'Рівно один рядок із трьома числами по всій таблиці: скільки товарів, найнижча ціна, найвища ціна.',
      },
    ],
    pitfalls: [
      {
        title: 'ORDER BY сам нічого не обмежує',
        text: 'Сортування лише міняє порядок рядків — їх залишається стільки ж. Щоб узяти три найдорожчі товари, потрібні обидві частини: ORDER BY price DESC LIMIT 3.',
      },
      {
        title: '= NULL ніколи не спрацює',
        text: 'NULL — це «значення невідоме», і будь-яке порівняння з ним дає не «так» і не «ні», а «невідомо». Тому WHERE department = NULL завжди повертає порожньо; правильно писати IS NULL або IS NOT NULL.',
      },
      {
        title: 'Текст — в одинарних лапках',
        text: 'WHERE category = \'Kitchen\' працює, а WHERE category = "Kitchen" — ні: подвійні лапки PostgreSQL вважає назвою колонки, а не текстом, і поскаржиться, що колонки «Kitchen» не існує.',
      },
    ],
  },

  {
    level: 2,
    title: 'Групування й агрегація',
    keywords: ['GROUP BY', 'HAVING', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'],
    summary:
      'GROUP BY складає рядки в купки за спільним значенням, а агрегат ' +
      '(COUNT, SUM, AVG, MIN, MAX) перетворює кожну купку на один рядок відповіді.',
    summaryBlocks: [
      [
        'У SELECT після GROUP BY можна брати лише колонки, за якими групували, та агрегати від решти.',
        'HAVING — це фільтр самих груп: він працює вже після підрахунку, тоді як WHERE відсіює окремі рядки ще до групування.',
      ],
    ],
    setupSql: `${PRODUCTS_SQL}${ORDERS_SQL}${EMPLOYEES_SQL}`,
    examples: [
      {
        label: 'Сума в межах кожної групи',
        sql: dedent(`
          SELECT
            category,
            SUM(stock) AS units
          FROM products
          GROUP BY category
          ORDER BY units DESC;
        `),
        result:
          'По одному рядку на категорію: скільки всього одиниць товару цієї категорії лежить на складі, від найбільшої купи до найменшої.',
      },
      {
        label: 'Кілька агрегатів за один прохід',
        sql: dedent(`
          SELECT
            manager_id,
            COUNT(*) AS orders_count,
            ROUND(AVG(amount), 2) AS avg_amount
          FROM orders
          GROUP BY manager_id;
        `),
        result:
          'Рядок на кожного менеджера: скільки замовлень він провів і який у нього середній чек, округлений до копійок.',
      },
      {
        label: 'MIN і MAX — межі кожної групи',
        sql: dedent(`
          SELECT
            category,
            MIN(price) AS cheapest,
            MAX(price) AS priciest
          FROM products
          GROUP BY category
          ORDER BY category;
        `),
        result:
          'Пʼять категорій, у кожної — ціна найдешевшого й найдорожчого товару. У Stationery розкид від 4.20 до 15.00, у Furniture — від 45.50 до 430.00.',
      },
      {
        label: 'HAVING — фільтр уже готових груп',
        sql: dedent(`
          SELECT
            customer_id,
            SUM(amount) AS total
          FROM orders
          GROUP BY customer_id
          HAVING SUM(amount) > 1000;
        `),
        result:
          'Тільки ті клієнти, чия сумарна вартість замовлень перевищила 1000. Клієнти з меншою сумою в купки складаються, але у відповідь не потрапляють.',
      },
      {
        label: 'COUNT(*) проти COUNT(колонка)',
        sql: dedent(`
          SELECT
            COUNT(*) AS all_rows,
            COUNT(department) AS with_department
          FROM employees;
        `),
        result:
          'Два різні числа: 12 і 11. COUNT(*) рахує всі рядки, COUNT(department) — лише ті, де department не NULL.',
      },
    ],
    pitfalls: [
      {
        title: 'WHERE не бачить агрегатів',
        text: 'WHERE COUNT(*) > 4 — помилка, бо WHERE відпрацьовує до того, як групи взагалі утворилися. Умови на COUNT, SUM чи AVG ставлять у HAVING. І навпаки: звичайну умову на рядок (наприклад price > 100) дешевше поставити у WHERE, а не в HAVING.',
      },
      {
        title: 'Колонка поза GROUP BY і поза агрегатом',
        text: 'Якщо вибрати колонку, якої немає ні в GROUP BY, ні всередині агрегата, PostgreSQL відмовиться виконувати запит: «column must appear in the GROUP BY clause». Це не прискіпливість — без такого правила незрозуміло, яке саме значення з групи мала б показати ця колонка.',
      },
      {
        title: 'AVG пропускає NULL, а не рахує їх нулями',
        text: 'AVG(salary) по 10 рядках, де у двох salary порожній, поділить суму на 8, а не на 10. Якщо порожнє значення має означати нуль, це треба сказати явно: AVG(COALESCE(salary, 0)).',
      },
    ],
  },

  {
    level: 3,
    title: "Об'єднання таблиць",
    keywords: ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'ON', 'USING'],
    summary: 'JOIN зшиває рядки двох таблиць за умовою в ON — зазвичай це збіг ідентифікатора.',
    summaryBlocks: [
      [
        'INNER JOIN лишає тільки пари, де знайшлися обидві половини.',
        'LEFT JOIN зберігає всі рядки лівої таблиці, а там, де пари не знайшлося, підставляє NULL.',
      ],
      'Саме тому звʼязка LEFT JOIN + IS NULL відповідає на питання «а в кого нічого немає».',
    ],
    setupSql: `${CUSTOMERS_SQL}${ORDERS_SQL}${PRODUCTS_SQL}${ORDER_ITEMS_SQL}`,
    examples: [
      {
        label: 'INNER JOIN — тільки збіги',
        sql: dedent(`
          SELECT
            c.name,
            o.order_date,
            o.amount
          FROM orders AS o
          INNER JOIN customers AS c
            ON c.customer_id = o.customer_id
          WHERE o.order_date >= '2024-06-01'
          ORDER BY o.order_date;
        `),
        result:
          'Червневі замовлення з іменем клієнта поруч. Клієнт без замовлень у червні не з’явиться жодного разу. Слово INNER тут необовʼязкове: самотній JOIN означає рівно те саме, але в назві теми конструкція зветься повним іменем.',
      },
      {
        label: 'LEFT JOIN + IS NULL — знайти тих, у кого нічого немає',
        sql: dedent(`
          SELECT
            c.name
          FROM customers AS c
          LEFT JOIN orders AS o
            ON o.customer_id = c.customer_id
          WHERE o.order_id IS NULL;
        `),
        result:
          'Клієнти, які не зробили жодного замовлення. LEFT JOIN лишив їх у вибірці з порожніми колонками замовлення, а WHERE залишив саме такі рядки.',
      },
      {
        label: 'JOIN + GROUP BY — топ товарів за проданими одиницями',
        sql: dedent(`
          SELECT
            p.product_name,
            SUM(oi.quantity) AS units
          FROM order_items AS oi
          JOIN products AS p
            ON p.product_id = oi.product_id
          GROUP BY p.product_name
          ORDER BY units DESC
          LIMIT 5;
        `),
        result:
          'П’ять товарів, яких купили найбільше штук. Спершу позиції замовлень отримують назву товару, потім результат групується.',
      },
      {
        label: 'USING — ланцюжок із трьох таблиць коротшим записом',
        sql: dedent(`
          SELECT
            o.order_date,
            p.product_name,
            oi.quantity
          FROM order_items AS oi
          JOIN orders AS o USING (order_id)
          JOIN products AS p USING (product_id)
          ORDER BY o.order_date
          LIMIT 5;
        `),
        result:
          'Пʼять найраніших позицій із датою замовлення й назвою товару — тепер у ланцюжку справді три таблиці. USING (order_id) коротший за ON o.order_id = oi.order_id і водночас лишає в результаті одну колонку order_id замість двох однойменних.',
      },
    ],
    pitfalls: [
      {
        title: 'JOIN без ON множить рядки',
        text: 'Якщо забути умову з’єднання, кожен рядок лівої таблиці склеїться з кожним рядком правої: 8 клієнтів і 31 замовлення дадуть 248 рядків замість 31. Раптове зростання кількості рядків — перша ознака загубленого ON.',
      },
      {
        title: 'Умова на праву таблицю у WHERE вбиває LEFT JOIN',
        text: 'LEFT JOIN orders o ... WHERE o.amount > 100 викине всіх клієнтів без замовлень, бо NULL не більший за 100 — і LEFT JOIN тихо перетвориться на INNER. Якщо клієнтів без замовлень треба зберегти, умову ставлять у ON: ON o.customer_id = c.customer_id AND o.amount > 100.',
      },
      {
        title: 'COUNT(*) після LEFT JOIN рахує 1 замість 0',
        text: 'LEFT JOIN лишає рядок навіть тоді, коли справа не знайшлося нічого — просто з порожніми колонками. COUNT(*) рахує рядки, тому для клієнта без жодного замовлення він поверне 1. Рахувати треба колонку з правої таблиці: COUNT(o.order_id) дасть чесний 0, бо COUNT не рахує NULL.',
      },
    ],
  },

  {
    level: 4,
    title: 'Підзапити й CTE',
    keywords: ['WITH', 'AS', 'IN', 'NOT IN', 'NOT EXISTS'],
    summary: 'Підзапит — це запит усередині запиту, взятий у дужки.',
    summaryBlocks: [
      [
        'Скалярний підзапит найчастіше рахує одне число (наприклад середню зарплату), ' +
          'з яким далі порівнюють кожен рядок.',
        'CTE — той самий підзапит, але винесений угору через WITH і названий: ' +
          'далі на нього посилаються як на звичайну таблицю.',
      ],
      'Результат однаковий, читається краще, і один CTE можна використати кілька разів або ' +
        'побудувати на ньому наступний. Коли розвʼязок не вміщається в голову — ' +
        'розклади його на іменовані кроки.',
    ],
    setupSql: `${EMPLOYEES_SQL}${PRODUCTS_SQL}${ORDERS_SQL}${CUSTOMERS_SQL}`,
    examples: [
      {
        label: 'Скалярний підзапит у WHERE',
        sql: dedent(`
          SELECT
            product_name,
            price
          FROM products
          WHERE price > (
            SELECT AVG(price)
            FROM products
            WHERE category = 'Electronics'
          );
        `),
        result:
          'Спочатку рахується середня ціна електроніки — одне число. Далі кожен товар будь-якої категорії порівнюється саме з ним.',
      },
      {
        label: 'Підзапит у списку колонок',
        sql: dedent(`
          SELECT
            product_name,
            price,
            (SELECT MAX(price) FROM products) - price AS below_top
          FROM products
          WHERE stock < 10;
        `),
        result:
          'Товари, яких лишилося менше 10 штук, і поруч — наскільки кожен дешевший за найдорожчий товар прайса.',
      },
      {
        label: 'NOT IN — виключити за готовим списком',
        sql: dedent(`
          SELECT
            name
          FROM customers
          WHERE customer_id NOT IN (
            SELECT customer_id
            FROM orders
          );
        `),
        result:
          'Один рядок: Sofia Rossi — єдина клієнтка без жодного замовлення. Підзапит спершу збирає список тих, хто замовляв, і зовнішній запит відкидає всіх із цього списку.',
      },
      {
        label: 'NOT EXISTS — виключити за умовою',
        sql: dedent(`
          SELECT
            c.name
          FROM customers AS c
          WHERE NOT EXISTS (
            SELECT 1
            FROM orders AS o
            WHERE o.customer_id = c.customer_id
          );
        `),
        result:
          'Та сама Sofia Rossi, але дорогою іншою: підзапит тут не збирає список, а для кожного клієнта питає «чи існує хоч одне замовлення». Саме тому в SELECT стоїть 1 — значення не потрібне, важлива лише наявність рядка.',
      },
      {
        label: 'WITH — назвати проміжний крок',
        sql: dedent(`
          WITH busy_days AS (
            SELECT
              order_date,
              COUNT(*) AS orders_count
            FROM orders
            GROUP BY order_date
          )
          SELECT
            order_date,
            orders_count
          FROM busy_days
          WHERE orders_count > 1;
        `),
        result:
          'Дати, коли надійшло більше одного замовлення. Перший крок рахує замовлення по днях, другий — фільтрує готовий результат.',
      },
      {
        label: 'Два CTE поспіль',
        sql: dedent(`
          WITH per_customer AS (
            SELECT
              customer_id,
              SUM(amount) AS total
            FROM orders
            GROUP BY customer_id
          ),
          average AS (
            SELECT AVG(total) AS avg_total
            FROM per_customer
          )
          SELECT
            c.name,
            p.total
          FROM per_customer AS p
          JOIN customers AS c
            ON c.customer_id = p.customer_id
          WHERE p.total > (SELECT avg_total FROM average);
        `),
        result:
          'Клієнти, чия сума покупок вища за середню суму по клієнтах. Другий CTE будується на першому — так задача розпадається на два прості кроки.',
      },
    ],
    pitfalls: [
      {
        title: 'Скалярний підзапит має віддати одне значення',
        text: 'Конструкція price > (SELECT ...) чекає рівно один рядок і одну колонку. Якщо підзапит поверне кілька рядків, буде помилка. Коли кілька значень і потрібні — беруть IN замість >: WHERE customer_id IN (SELECT customer_id FROM orders).',
      },
      {
        title: 'NOT IN ламається об NULL',
        text: 'Якщо серед значень підзапиту трапиться хоч один NULL, NOT IN не поверне жодного рядка — і жодної помилки при цьому не буде. Для питань «кого немає у списку» надійніше писати NOT EXISTS або LEFT JOIN ... IS NULL.',
      },
      {
        title: 'CTE живе тільки в межах свого запиту',
        text: 'Після крапки з комою назва, оголошена у WITH, зникає — це не створена таблиця. І послатися на CTE можна лише нижче за місцем оголошення: другий CTE бачить перший, але не навпаки.',
      },
    ],
  },

  {
    level: 5,
    title: 'Віконні функції',
    keywords: ['OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'NTILE'],
    summary:
      'Віконна функція рахує так само, як агрегат, але не склеює рядки: кожен рядок ' +
      'лишається на місці й отримує додаткову колонку. Що саме рахувати — визначає OVER.',
    summaryBlocks: [
      [
        'PARTITION BY ділить таблицю на незалежні частини — наприклад, окремо кожен департамент.',
        'ORDER BY задає порядок рядків усередині такої частини.',
      ],
      'Так зʼявляються нумерація (ROW_NUMBER, RANK), доступ до сусідніх рядків (LAG, LEAD) ' +
        'і накопичувальні підсумки.',
      'Це відповідь на питання «а як цей рядок виглядає на тлі своєї групи».',
    ],
    setupSql: `${EMPLOYEES_SQL}${PRODUCTS_SQL}${ORDERS_SQL}`,
    examples: [
      {
        label: 'Нумерація всередині кожної групи',
        sql: dedent(`
          SELECT
            product_name,
            category,
            price,
            ROW_NUMBER() OVER (
              PARTITION BY category
              ORDER BY price DESC
            ) AS place
          FROM products;
        `),
        result:
          'Усі 25 товарів на місці, у кожного — його місце за ціною всередині своєї категорії. Нумерація починається з 1 наново для кожної категорії.',
      },
      {
        label: 'RANK і DENSE_RANK — два способи рахувати нічиї',
        sql: dedent(`
          SELECT
            product_name,
            price,
            RANK() OVER (ORDER BY price DESC) AS rank_place,
            DENSE_RANK() OVER (ORDER BY price DESC) AS dense_place
          FROM products
          ORDER BY price DESC
          LIMIT 8;
        `),
        result:
          'Вісім найдорожчих товарів. Office Chair і Docking Station коштують по 210 і обидва отримують пʼяте місце — а далі шляхи розходяться: RANK перестрибує на сьоме, DENSE_RANK іде на шосте. Різницю видно лише там, де є нічия, тому дивитися на них поодинці марно.',
      },
      {
        label: 'Порівняти рядок з його ж групою',
        sql: dedent(`
          SELECT
            department,
            first_name,
            salary,
            salary - MIN(salary) OVER (PARTITION BY department) AS above_min
          FROM employees
          WHERE department IS NOT NULL;
        `),
        result:
          'Кожен співробітник і різниця між його зарплатою та найнижчою зарплатою в його департаменті. GROUP BY тут не підійшов би: він лишив би по одному рядку на департамент.',
      },
      {
        label: 'LAG і LEAD — заглянути в сусідній рядок',
        sql: dedent(`
          SELECT
            order_date,
            amount,
            LAG(amount) OVER (ORDER BY order_date) AS prev_amount,
            LEAD(amount) OVER (ORDER BY order_date) AS next_amount
          FROM orders
          ORDER BY order_date
          LIMIT 6;
        `),
        result:
          'Кожне замовлення бачить сусідів по даті: LAG дає суму попереднього, LEAD — наступного. У найпершого рядка prev_amount порожній, бо попереднього просто немає, — на цьому й будують різницю «поточне мінус попереднє».',
      },
      {
        label: 'NTILE — розкласти на рівні частини',
        sql: dedent(`
          SELECT
            product_name,
            price,
            NTILE(4) OVER (ORDER BY price) AS price_quartile
          FROM products;
        `),
        result:
          'Товари, поділені за ціною на чотири приблизно рівні за кількістю групи: 1 — найдешевша чверть прайса, 4 — найдорожча.',
      },
      {
        label: 'Рамка вікна — ковзне середнє',
        sql: dedent(`
          SELECT
            order_date,
            amount,
            ROUND(
              AVG(amount) OVER (
                ORDER BY order_date
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
              ),
              2
            ) AS moving_avg
          FROM orders;
        `),
        result:
          'Для кожного замовлення — середня сума за ним і двома попередніми. ROWS BETWEEN звужує вікно з «усієї частини» до трьох сусідніх рядків.',
      },
    ],
    pitfalls: [
      {
        title: 'OVER не можна написати у WHERE',
        text: 'Вікна рахуються вже після того, як WHERE відсіяв рядки, тому WHERE ROW_NUMBER() OVER (...) = 1 — помилка. Робочий спосіб: порахувати номер у CTE, а фільтрувати зовнішнім запитом за готовою колонкою.',
      },
      {
        title: 'RANK, DENSE_RANK і ROW_NUMBER рахують по-різному',
        text: 'На однакових значеннях RANK лишає діри (1, 2, 2, 4), DENSE_RANK не лишає (1, 2, 2, 3), а ROW_NUMBER просто нумерує підряд (1, 2, 3, 4) і на рівних результатах обирає порядок довільно. Питання «хто на другому місці» без цієї різниці не має однозначної відповіді.',
      },
      {
        title: 'PARTITION BY — це не GROUP BY',
        text: 'GROUP BY зменшує кількість рядків, PARTITION BY — ніколи. Якщо у відповіді очікувався один рядок на департамент, а їх вийшло стільки ж, скільки співробітників, значить потрібен був звичайний агрегат, а не віконна функція.',
      },
    ],
  },

  {
    level: 6,
    title: 'Дати та рядки',
    keywords: [
      'DATE_TRUNC',
      'EXTRACT',
      'INTERVAL',
      'AGE',
      'TO_CHAR',
      'TRIM',
      'INITCAP',
      'SPLIT_PART',
    ],
    summary: 'Дати в PostgreSQL — окремий тип, а не текст, тому з ними працює арифметика.',
    summaryBlocks: [
      [
        'DATE_TRUNC зрізає дату до початку періоду — місяця, кварталу, року, — ' +
          'і саме так місячні звіти отримують одне значення на весь місяць.',
        'EXTRACT дістає з дати число: рік, місяць, день тижня.',
        "Додавання INTERVAL '30 days' дає нову дату.",
        'AGE рахує різницю між двома датами словами «стільки років, місяців і днів».',
        'TO_CHAR перетворює дату на текст за шаблоном — ним роблять читабельні мітки.',
      ],
      'Рядкові функції розвʼязують іншу задачу: привести до ладу те, що прийшло з форми.',
      [
        'TRIM прибирає пробіли по краях.',
        'INITCAP робить «Імʼя Прізвище» з будь-якого регістру.',
        'SPLIT_PART розрізає значення за роздільником.',
        'SUBSTRING разом із POSITION дістає шматок за позицією.',
        'Склеює все оператор ||.',
      ],
    ],
    setupSql: `${ORDERS_SQL}${RAW_CONTACTS_SQL}`,
    examples: [
      {
        label: 'DATE_TRUNC — звести дати до місяця',
        sql: dedent(`
          SELECT
            DATE_TRUNC('month', order_date) AS month,
            COUNT(*) AS orders_count,
            ROUND(AVG(amount), 2) AS avg_amount
          FROM orders
          GROUP BY month
          ORDER BY month;
        `),
        result:
          'Шість рядків — по одному на місяць. DATE_TRUNC зрізав кожну дату до першого числа її місяця, тому всі січневі замовлення злилися в один рядок: 3 замовлення, середній чек 131.83.',
      },
      {
        label: 'EXTRACT — дістати частину дати',
        sql: dedent(`
          SELECT
            order_id,
            order_date,
            EXTRACT(DOW FROM order_date) AS weekday,
            EXTRACT(MONTH FROM order_date) AS month_number
          FROM orders
          ORDER BY order_date
          LIMIT 5;
        `),
        result:
          'Пʼять найраніших замовлень із номером дня тижня й номером місяця. Нумерація днів починається з нуля-неділі, тому 5 — це пʼятниця, 4 — четвер, 6 — субота.',
      },
      {
        label: 'INTERVAL і AGE — арифметика дат',
        sql: dedent(`
          SELECT
            order_id,
            order_date,
            order_date + INTERVAL '30 days' AS due_date,
            AGE(DATE '2024-07-01', order_date) AS since_order
          FROM orders
          ORDER BY order_date
          LIMIT 5;
        `),
        result:
          'Перше замовлення від 5 січня має термін оплати 4 лютого, а від 1 липня його відділяє «5 mons 27 days». INTERVAL додає до дати проміжок і повертає дату, AGE віднімає одну дату від іншої й повертає проміжок словами.',
      },
      {
        label: 'TRIM і INITCAP — очистити сире імʼя',
        sql: dedent(`
          SELECT
            raw_name,
            INITCAP(TRIM(raw_name)) AS clean_name
          FROM raw_contacts
          ORDER BY contact_id;
        `),
        result:
          'Поруч видно сире значення й очищене: « anna kovalenko » стає «Anna Kovalenko». У третього контакту подвійний пробіл усередині лишився — TRIM його не бачить.',
      },
      {
        label: 'SPLIT_PART — розрізати значення за роздільником',
        sql: dedent(`
          SELECT
            contact_id,
            raw_email,
            LOWER(SPLIT_PART(raw_email, '@', 2)) AS domain
          FROM raw_contacts
          ORDER BY contact_id;
        `),
        result:
          'Десять контактів із доменом окремою колонкою: example.com, mail.ua, bondar.dev. Третій аргумент — номер шматка, тому 2 означає «те, що після равлика»; з 1 вийшло б імʼя скриньки.',
      },
      {
        label: 'TO_CHAR і || — зібрати читабельну мітку',
        sql: dedent(`
          SELECT
            order_id,
            TO_CHAR(order_date, 'DD.MM.YYYY') || ' — ' || amount AS label
          FROM orders
          ORDER BY order_id
          LIMIT 5;
        `),
        result:
          'Пʼять міток виду «05.01.2024 — 120.50»: TO_CHAR перетворив дату на текст за шаблоном, а || склеїв її із сумою.',
      },
    ],
    pitfalls: [
      {
        title: 'EXTRACT дає число, а не текст із нулем',
        text: "EXTRACT(YEAR FROM d) || '-' || EXTRACT(MONTH FROM d) дає 2024-1, а не 2024-01: число не має провідного нуля. Порівнювати з рядком (= '2024') при цьому можна — PostgreSQL зведе його до числа сам. А от мітку для звіту роблять через TO_CHAR(d, 'YYYY-MM'), який дає 2024-01.",
      },
      {
        title: 'TRIM прибирає пробіли лише по краях',
        text: "TRIM('  a  b  ') повертає 'a  b' — подвійний пробіл усередині лишається. Прибрати його — робота для REPLACE(x, '  ', ' '). І REPLACE шукає саме пари, тому на трьох пробілах поспіль за один прохід один вціліє.",
      },
      {
        title: 'DATE_TRUNC дає першу дату періоду, а не назву',
        text: "DATE_TRUNC('month', DATE '2024-03-17') повертає 2024-03-01 — початок періоду, мітку часу. Це зручно для групування й сортування, але не є підписом: «Березень 2024» робить TO_CHAR. І навпаки — сортувати за текстовою назвою місяця не можна: ORDER BY за нею дасть April, February, January, бо порядок алфавітний.",
      },
      {
        title: 'У SQLite це пишеться інакше',
        text: "Рівень 6 — місце, де діалекти розходяться найсильніше, а SQLite досі трапляється в старих проєктах і на співбесідах. Відповідності: DATE_TRUNC('month', d) ↔ date(d, 'start of month'), EXTRACT(YEAR FROM d) ↔ strftime('%Y', d), d + INTERVAL '30 days' ↔ date(d, '+30 days'). У нашому тренажері працює лише лівий стовпчик.",
      },
    ],
  },

  {
    level: 7,
    title: 'Умови й множини',
    keywords: [
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'COALESCE',
      'NULLIF',
      'UNION',
      'INTERSECT',
      'EXCEPT',
    ],
    summary:
      'CASE — це «якщо» всередині запиту: CASE WHEN умова THEN значення ' +
      '… ELSE значення END перевіряє умови згори вниз і повертає значення першої, що збіглася.',
    summaryBlocks: [
      [
        'Без ELSE незбіг дає NULL.',
        'COALESCE бере перший непорожній аргумент і тому підміняє порожнечу зрозумілим текстом.',
        'NULLIF робить навпаки — перетворює конкретне значення на NULL, ' +
          'і найчастіше саме нуль у знаменнику, щоб ділення не впало.',
      ],
      'Друга половина теми — операції з множинами: вони складають два результати не вбік, ' +
        'як JOIN, а вниз.',
      [
        'UNION обʼєднує й прибирає повтори.',
        'UNION ALL просто склеює.',
        'INTERSECT лишає спільне.',
        'EXCEPT віднімає друге від першого.',
      ],
      'Усі чотири вимагають однакової кількості колонок сумісних типів.',
    ],
    setupSql: `${EMPLOYEES_SQL}${PRODUCTS_SQL}`,
    examples: [
      {
        label: 'CASE з ELSE — рівень оплати',
        sql: dedent(`
          SELECT
            first_name,
            salary,
            CASE
              WHEN salary >= 7000 THEN 'high'
              WHEN salary >= 5000 THEN 'mid'
              ELSE 'low'
            END AS pay_band
          FROM employees
          ORDER BY salary DESC;
        `),
        result:
          'Дванадцять рядків від найвищої зарплати до найнижчої. ' +
          'Двоє потрапили в high, семеро в mid, троє в low. Умови ' +
          'перевіряються згори вниз, тому Oksana з 8100 зупиняється ' +
          'на першій же гілці й другої вже не бачить.',
      },
      {
        label: 'SUM(CASE) — рядки стають колонками',
        sql: dedent(`
          SELECT
            department,
            SUM(CASE WHEN salary >= 6000 THEN 1 ELSE 0 END) AS senior,
            SUM(CASE WHEN salary < 6000 THEN 1 ELSE 0 END) AS regular
          FROM employees
          GROUP BY department
          ORDER BY department;
        `),
        result:
          'Пʼять рядків — по одному на департамент, і окремий рядок ' +
          'для співробітника без департаменту. IT дає 4 і 0, HR — 0 ' +
          'і 2. Так будують зведені таблиці: категорія стає ' +
          'колонкою, а не значенням у колонці.',
      },
      {
        label: 'COALESCE і NULLIF — дві протилежні дії',
        sql: dedent(`
          SELECT
            first_name,
            department,
            COALESCE(department, 'Не вказано') AS filled,
            NULLIF(department, 'IT') AS hidden_it
          FROM employees
          ORDER BY employee_id;
        `),
        result:
          'Дванадцять рядків, у яких видно обидві дії поруч. У ' +
          'Богдана департамент порожній, і COALESCE підставив «Не ' +
          'вказано». У всіх айтішників NULLIF, навпаки, зробив ' +
          'порожньо — бо їхнє значення збіглося з тим, яке ми ' +
          'попросили сховати. У того ж Богдана hidden_it теж ' +
          "порожній, але з іншої причини: NULLIF(NULL, 'IT') сам " +
          'по собі дає NULL.',
      },
      {
        label: 'UNION — обʼєднати два списки без повторів',
        sql: dedent(`
          SELECT
            category
          FROM products
          WHERE price >= 200
          UNION
          SELECT
            category
          FROM products
          WHERE price < 50;
        `),
        result:
          'Пʼять рядків — усі категорії, де є хоч дуже дорогий, хоч ' +
          'дуже дешевий товар. Той самий запит із UNION ALL дає 15 ' +
          'рядків: категорія повторюється стільки разів, скільки ' +
          'її товарів підпало під умову.',
      },
      {
        label: 'INTERSECT — спільна частина двох списків',
        sql: dedent(`
          SELECT
            category
          FROM products
          WHERE price >= 200
          INTERSECT
          SELECT
            category
          FROM products
          WHERE price < 50;
        `),
        result:
          'Три категорії — Electronics, Furniture і Kitchen: у ' +
          'кожній є і товар від 200, і товар дешевший за 50. Це ' +
          'найширший ціновий розкид у каталозі.',
      },
      {
        label: 'EXCEPT — відняти один список від іншого',
        sql: dedent(`
          SELECT
            department
          FROM employees
          EXCEPT
          SELECT
            department
          FROM employees
          WHERE salary >= 6000;
        `),
        result:
          'Три рядки: HR, Marketing і порожній департамент — саме ' +
          'там немає нікого із зарплатою від 6000. Порожній рядок ' +
          'тут не випадковість: операції з множинами вважають NULL ' +
          'звичайним значенням і зіставляють його з NULL, тоді як ' +
          'звичайне порівняння NULL = NULL істинним не буває.',
      },
      {
        label: 'CASE в ORDER BY — свій порядок, якого немає в даних',
        sql: dedent(`
          SELECT
            product_name,
            category,
            price
          FROM products
          ORDER BY
            CASE category
              WHEN 'Electronics' THEN 1
              WHEN 'Furniture' THEN 2
              ELSE 3
            END,
            price DESC
          LIMIT 8;
        `),
        result:
          'Спершу вся електроніка від найдорожчої до найдешевшої, ' +
          'потім меблі — Standing Desk за 430. Ні алфавіт, ні числа ' +
          'такого порядку не дають: ORDER BY приймає вираз, і CASE ' +
          'перетворює назву категорії на номер, за яким і йде ' +
          'сортування. У результаті цього номера не видно.',
      },
    ],
    pitfalls: [
      {
        title: 'CASE без ELSE мовчки дає NULL',
        text:
          'Якщо жодна гілка не збіглася, а ELSE не написано, CASE ' +
          'повертає NULL — не порожній рядок і не нуль. У таблиці ' +
          'це виглядає як пропуск, а в підрахунках поводиться ' +
          'по-різному: COUNT такий рядок не порахує, SUM його ' +
          'проігнорує, а конкатенація через || перетворить на NULL ' +
          'увесь результат.',
      },
      {
        title: 'Порядок гілок CASE — це пріоритет',
        text:
          'Гілки перевіряються згори вниз, і перша, що збіглася, ' +
          'виграє. Тому ширшу умову не можна ставити перед вужчою: ' +
          "у CASE WHEN price < 200 THEN 'standard' WHEN price < 50 " +
          "THEN 'budget' END друга гілка не спрацює ніколи — усе " +
          'дешевше за 50 уже підпало під першу. Помилки не буде, ' +
          'буде мовчазно неправильний результат.',
      },
      {
        title: 'UNION прибирає дублікати, UNION ALL — ні',
        text:
          'На наших даних це видно буквально: обʼєднання категорій ' +
          'дорогих і дешевих товарів через UNION дає 5 рядків, а ' +
          'через UNION ALL — 15. Дедуплікація не безкоштовна: щоб ' +
          'знайти повтори, база мусить виконати додаткову роботу — ' +
          'хешування чи сортування, залежно від того, що обере ' +
          'планувальник. ' +
          'Якщо повторів свідомо немає або вони не заважають, ' +
          'бери UNION ALL.',
      },
      {
        title: 'EXCEPT несиметричний',
        text:
          'A EXCEPT B і B EXCEPT A — різні питання з різними ' +
          'відповідями. Категорії мінус категорії з дорогими ' +
          'товарами дають 2 рядки (Sports і Stationery — там ' +
          'немає нічого від 200), а навпаки — 0, бо кожна ' +
          'категорія з дорогим товаром є і серед усіх категорій. ' +
          'Порожній результат тут не «нічого не знайшлося», а ' +
          'ознака, що операнди переплутані.',
      },
    ],
  },

  {
    level: 8,
    title: 'Аналітичні кейси',
    keywords: ['WITH', 'DATE_TRUNC', 'COUNT', 'DISTINCT', 'FILTER', 'LAG', 'NTILE'],
    summary:
      'Когорти, воронки, утримання (Retention), LTV та RFM — це метрики, ' +
      'які показують реальний стан і зростання продукту. Кожна з них — це ' +
      'не просто окрема функція, а цілий ланцюжок логічних кроків.',
    summaryBlocks: [
      'На цьому рівні ти поєднуєш все вивчене в єдину аналітичну систему:',
      [
        'WITH (CTE) — стає основою твого коду: він розкладає складні ' +
          'розрахунки на прозорі та іменовані етапи.',
        'DATE_TRUNC — зрізає дату до початку місяця чи тижня, і саме тому ' +
          'сирий потік реєстрацій перетворюється на зрозумілі когорти.',
        'COUNT(DISTINCT …) — рахує саме унікальних людей, а не події, ' +
          'запобігаючи викривленню активної аудиторії.',
        'FILTER (WHERE …) — обчислює підмножини даних прямо в одному ' +
          'проході, дозволяючи збирати воронки без громіздких обʼєднань.',
        'LAG — зіставляє поточний період із попереднім в одному рядку для ' +
          'швидкого розрахунку динаміки (MoM / YoY).',
        'NTILE — рівномірно розбиває користувачів на групи за їхньою ' +
          'активністю чи чеком для побудови RFM-сегментації.',
      ],
      'Головне правило аналітика: написати запит — це лише 20% справи, ' +
        'решта 80% — порахувати саме те, що насправді запитав бізнес.',
    ],
    setupSql: ANALYTICS_SQL,
    subtitle: 'когорти, воронки, утримання (Retention), LTV та RFM',
    cases: [
      {
        title: 'Когортний аналіз утримання',
        about:
          'Відстежувати групи користувачів, які зареєструвалися того ' +
          'самого місяця, і дивитися, чи повертаються вони далі.',
        whenNeeded:
          'Коли питають «скільки з січневих у нас лишилося в березні» ' +
          'або «як утримання змінюється від когорти до когорти».',
        question:
          'Скільки користувачів, що зареєструвалися в січні, ще активні ' +
          'в лютому? А в березні? Як утримання змінюється від когорти до ' +
          'когорти?',
        sql: dedent(`
          WITH cohort AS (
            SELECT
              user_id,
              DATE_TRUNC('month', signup_date) AS cohort_month
            FROM app_users
          ),
          activity AS (
            SELECT DISTINCT
              c.cohort_month,
              c.user_id,
              DATE_TRUNC('month', e.occurred_at) AS active_month
            FROM cohort AS c
            JOIN app_events AS e ON e.user_id = c.user_id
          )
          SELECT
            cohort_month::date AS cohort_month,
            (EXTRACT(YEAR FROM AGE(active_month, cohort_month)) * 12
              + EXTRACT(MONTH FROM AGE(active_month, cohort_month)))::int
              AS month_no,
            COUNT(DISTINCT user_id) AS retained
          FROM activity
          GROUP BY cohort_month, month_no
          ORDER BY cohort_month, month_no
          LIMIT 5;
        `),
        steps: [
          'Крок 1 (cohort): присвоює кожному користувачу місяць ' + 'реєстрації один раз назавжди.',
          'Крок 2 (activity): кладе поруч когорту користувача й місяць ' +
            'кожної його активності.',
          'Крок 3: підсумкова вибірка рахує, скільки людей із когорти ' +
            'лишилося активними через month_no місяців.',
        ],
        result: {
          columns: ['cohort_month', 'month_no', 'retained'],
          values: [
            ['2023-01-01', 0, 5],
            ['2023-01-01', 1, 3],
            ['2023-01-01', 2, 5],
            ['2023-01-01', 3, 4],
            ['2023-01-01', 4, 3],
          ],
        },
        reading:
          'month_no — це вік когорти, а не календар: нуль означає місяць ' +
          'реєстрації. Січнева когорта 2023 року з семи людей дала ' +
          'пʼятьох активних у нульовому місяці й трьох у першому. Ряд не ' +
          'мусить спадати монотонно: користувач може пропустити місяць і ' +
          'повернутися, і саме тому утримання рахують матрицею, а не ' +
          'одним числом.',
        watchOut: [
          'Когорту визначає дата реєстрації, і вона лишається з ' +
            'користувачем назавжди. Якщо групувати за датою події, той ' +
            'самий користувач потрапить у кілька місяців одразу — і ' +
            'когорта перестане бути когортою.',
          'Активні користувачі по місяцях — це не утримання, хоч ряд і ' +
            'схожий. У ньому новачків не відрізнити від тих, хто ' +
            'повернувся, тому його спад чи зростання не каже нічого про ' +
            'те, чи люди залишаються з продуктом.',
          'Рахувати треба унікальних людей, а не події: у когорті кожен ' +
            'мусить бути врахований один раз, скільки б активностей за ' +
            'місяць він не зробив.',
          'Остання когорта завжди виглядає гірше за решту — просто тому, ' +
            'що вікно спостереження в неї коротше. У звіті її або ' +
            'виключають, або підписують окремо.',
        ],
      },
      {
        title: 'Воронка конверсії',
        about: 'Пройти послідовність кроків до покупки й знайти, де людей ' + 'губиться найбільше.',
        whenNeeded: 'Аналіз оплати, реєстрації, підписки — будь-якої послідовності дій.',
        question: 'На якому кроці воронки ми втрачаємо найбільше? Де оптимізувати?',
        sql: dedent(`
          WITH session_depth AS (
            SELECT
              session_id,
              MAX(ARRAY_POSITION(
                ARRAY['visit', 'view_product', 'add_to_cart', 'checkout',
                  'purchase'],
                event_type
              )) AS deepest_step
            FROM app_events
            GROUP BY session_id
          )
          SELECT
            COUNT(*) FILTER (WHERE deepest_step >= 1) AS step1_visit,
            COUNT(*) FILTER (WHERE deepest_step >= 2) AS step2_view,
            COUNT(*) FILTER (WHERE deepest_step >= 3) AS step3_cart,
            COUNT(*) FILTER (WHERE deepest_step >= 4) AS step4_checkout,
            COUNT(*) FILTER (WHERE deepest_step >= 5) AS step5_purchase
          FROM session_depth;
        `),
        steps: [
          'Крок 1 (session_depth): визначає для кожної сесії найглибший ' + 'досягнутий крок.',
          'Крок 2: підсумкова вибірка рахує сесії, що дійшли щонайменше ' +
            'до кожного кроку, — саме тому умови накопичувальні ' +
            '(>= 1, >= 2, …), а не рівність.',
        ],
        result: {
          columns: ['step1_visit', 'step2_view', 'step3_cart', 'step4_checkout', 'step5_purchase'],
          values: [[1187, 843, 541, 373, 274]],
        },
        reading:
          '1187 сесій почалося, 274 закінчилося покупкою — це 23 %. ' +
          'Найбільша втрата стоїть на самому початку: 344 сесії не дійшли ' +
          'навіть до перегляду товару, і це більше, ніж на будь-якому ' +
          'наступному кроці. Отже, оптимізувати треба вхід, а не оплату.',
        watchOut: [
          'Одиниця рахунку вирішує все. Порахуєш унікальних людей за ' +
            'весь час — і той, хто заходив десять разів, а купив один, ' +
            'потрапить в усі кроки однаково. Вийде втішна «конверсія», ' +
            'яка описує різні моменти життя тих самих людей, а не один ' +
            'прохід воронкою.',
          'Умови кроків мусять бути накопичувальні: сесія, що дійшла до ' +
            'покупки, зарахована й на всі попередні кроки. З рівністю ' +
            'замість «щонайменше» кроки перестають складатися у воронку.',
          'Порядок кроків задається явно, а не алфавітом чи часом появи ' +
            'у даних. Якщо твоя воронка має інші етапи — міняється саме ' +
            'цей перелік, і від його порядку залежить увесь результат.',
        ],
      },
      {
        title: 'LTV за когортою реєстрації',
        about:
          'Скільки грошей приносить користувач за весь час, і як це ' +
          'змінюється від когорти до когорти.',
        whenNeeded:
          'Коли треба зрозуміти, чи окупається залучення й чи не ' +
          'псується якість нових користувачів.',
        question:
          'Який LTV у користувачів за місяцем реєстрації? Чи падає він у ' + 'свіжих когортах?',
        sql: dedent(`
          WITH user_ltv AS (
            SELECT
              DATE_TRUNC('month', u.signup_date) AS signup_month,
              u.user_id,
              COALESCE(SUM(p.amount), 0) AS ltv
            FROM app_users AS u
            LEFT JOIN app_purchases AS p ON p.user_id = u.user_id
            GROUP BY DATE_TRUNC('month', u.signup_date), u.user_id
          )
          SELECT
            signup_month::date AS signup_month,
            COUNT(*) AS users,
            ROUND(AVG(ltv), 2) AS avg_ltv,
            ROUND(
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ltv)::numeric,
              2
            ) AS median_ltv,
            ROUND(MAX(ltv), 2) AS max_ltv
          FROM user_ltv
          GROUP BY signup_month
          ORDER BY signup_month
          LIMIT 4;
        `),
        steps: [
          'Крок 1 (user_ltv): дає по одному рядку на користувача — сума ' +
            'його покупок, або нуль, якщо він не купував нічого ' +
            '(LEFT JOIN плюс COALESCE).',
          'Крок 2: підсумкова вибірка усереднює вже ці числа по когорті ' +
            'й додає медіану, щоб побачити перекос.',
        ],
        result: {
          columns: ['signup_month', 'users', 'avg_ltv', 'median_ltv', 'max_ltv'],
          values: [
            ['2023-01-01', 7, '238.79', '13.16', '684.20'],
            ['2023-02-01', 8, '346.07', '178.88', '987.23'],
            ['2023-03-01', 6, '264.61', '214.65', '760.45'],
            ['2023-04-01', 13, '281.30', '156.14', '1277.13'],
          ],
        },
        reading:
          'У січневій когорті середній LTV 238,79, а медіанний — 13,16. ' +
          'Різниця в вісімнадцять разів означає, що середнє тягне вгору ' +
          'кілька великих покупців, а типовий користувач когорти не ' +
          'приносить майже нічого. Звітувати самим лише середнім тут — ' +
          'це вводити себе в оману.',
        watchOut: [
          'Порахувати «середнє від суми» одним агрегатом не вийде: ' +
            'PostgreSQL не дозволяє вкладати агрегат в агрегат. І ' +
            'правильно робить — спершу покупки зводяться до одного числа ' +
            'на кожного користувача, і лише потім ці числа усереднюються ' +
            'по когорті. Два змістовні кроки — два рівні групування.',
          'Обовʼязково саме LEFT JOIN. Зі звичайним обʼєднанням ' +
            'користувачі, які нічого не купили, зникнуть із розрахунку, і ' +
            'ти усередниш лише покупців, а не всю когорту — LTV вийде ' +
            'завищеним. COALESCE потрібен, щоб їхній нуль справді ' +
            'потрапив у середнє.',
          'Медіану варто рахувати поруч із середнім завжди, коли йдеться ' +
            'про гроші: розподіл покупок майже ніколи не симетричний, і ' +
            'саме розрив між цими двома числами показує, наскільки ' +
            'середнє оманливе.',
          'Свіжі когорти майже завжди виглядають гірше — у них просто ' +
            'було менше часу на покупки. Порівнювати когорти чесно можна ' +
            'лише на однаковому вікні спостереження.',
        ],
      },
      {
        title: 'RFM-сегментація',
        about:
          'Розкласти покупців на групи за трьома вимірами — коли купували ' +
          'востаннє, як часто й на скільки.',
        whenNeeded:
          'Коли треба вирішити, кому писати листа, кого утримувати, а ' +
          'кого вже не варто чіпати.',
        question:
          'Розділи покупців на сегменти: VIP, Loyal, Potential, At-Risk, ' +
          'Lost. Скільки людей у кожному й скільки вони приносять?',
        sql: dedent(`
          WITH metrics AS (
            SELECT
              p.user_id,
              DATE '2024-06-30' - MAX(p.purchase_date) AS days_since,
              COUNT(*) AS frequency,
              SUM(p.amount) AS monetary
            FROM app_purchases AS p
            GROUP BY p.user_id
          ),
          scores AS (
            SELECT
              NTILE(4) OVER (ORDER BY days_since DESC) AS r,
              NTILE(4) OVER (ORDER BY frequency) AS f,
              NTILE(4) OVER (ORDER BY monetary) AS m,
              monetary
            FROM metrics
          )
          SELECT
            CASE
              WHEN r >= 3 AND f >= 3 AND m >= 3 THEN 'VIP'
              WHEN f >= 3 AND m >= 3 THEN 'Loyal'
              WHEN m >= 3 AND r <= 2 THEN 'At-Risk'
              WHEN r >= 3 THEN 'Potential'
              ELSE 'Lost'
            END AS segment,
            COUNT(*) AS users,
            ROUND(AVG(monetary), 2) AS avg_monetary
          FROM scores
          GROUP BY segment
          ORDER BY avg_monetary DESC;
        `),
        steps: [
          'Крок 1 (metrics): рахує для кожного покупця три числа — ' + 'давність, частоту, суму.',
          'Крок 2 (scores): перетворює кожне з них на квартиль NTILE(4) ' + 'незалежно від інших.',
          'Крок 3: підсумковий CASE складає три квартилі в назву ' +
            'сегмента, і порядок гілок тут — це пріоритет.',
        ],
        result: {
          columns: ['segment', 'users', 'avg_monetary'],
          values: [
            ['Loyal', 33, '610.87'],
            ['VIP', 24, '548.59'],
            ['At-Risk', 5, '419.64'],
            ['Potential', 44, '150.36'],
            ['Lost', 30, '96.05'],
          ],
        },
        reading:
          '136 покупців розклалися на пʼять груп із зовсім різною ' +
          'цінністю: середній чек Loyal — 610,87, а Lost — 96,05, тобто ' +
          'вшестеро менше. Найменша група тут найцікавіша: пʼятеро ' +
          'At-Risk витрачали чимало, але давно не поверталися — саме їх ' +
          'має сенс повертати першими.',
        watchOut: [
          'Поділ за самими грішми — це ще не RFM. Той, хто витратив ' +
            'багато рік тому й пішов, опиниться в одній групі з тим, хто ' +
            'купує щомісяця. Саме розділення цих двох людей і є суть ' +
            'методу, і задля нього потрібні всі три виміри, а не один.',
          'Давність рахують від кінця даних, а не від сьогодні. На ' +
            'історичному наборі CURRENT_DATE зробить покинутим кожного ' +
            'покупця, і весь поділ поїде — тому дата закріплена в запиті ' +
            'явно.',
          'Порядок гілок CASE — це пріоритет, а не оформлення: перша ' +
            'умова, що збіглася, забирає покупця собі, решта вже не ' +
            'розглядаються. Перестав рядки місцями — і сегменти ' +
            'вийдуть іншими.',
          'Квартилі рівні за кількістю учасників, а не за сумою грошей. ' +
            '«Верхні 25 % покупців» і «чверть виручки» — різні речі, і ' +
            'плутати їх у звіті небезпечно.',
        ],
      },
      {
        title: 'Зміна від місяця до місяця',
        about: 'Порівняти метрику з попереднім періодом і побачити тренд та ' + 'аномалії.',
        whenNeeded: 'Щомісячні звіти про виручку, активних користувачів, конверсію.',
        question: 'На скільки виручка змінилася від місяця до місяця? Де просідання?',
        sql: dedent(`
          WITH monthly AS (
            SELECT
              DATE_TRUNC('month', purchase_date) AS month,
              SUM(amount) AS revenue
            FROM app_purchases
            GROUP BY DATE_TRUNC('month', purchase_date)
          )
          SELECT
            month::date AS month,
            ROUND(revenue, 2) AS revenue,
            ROUND(LAG(revenue) OVER (ORDER BY month), 2) AS prev_revenue,
            ROUND(
              100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
                / LAG(revenue) OVER (ORDER BY month),
              1
            ) AS change_pct
          FROM monthly
          ORDER BY month
          LIMIT 4;
        `),
        steps: [
          'Крок 1 (monthly): зводить покупки до одного рядка на місяць.',
          'Крок 2: LAG(revenue) OVER (ORDER BY month) кладе поруч ' +
            'виручку попереднього місяця.',
          'Крок 3: відсоток рахується від неї, а не від поточного місяця.',
        ],
        result: {
          columns: ['month', 'revenue', 'prev_revenue', 'change_pct'],
          values: [
            ['2023-01-01', '72.12', null, null],
            ['2023-02-01', '150.34', '72.12', '108.5'],
            ['2023-03-01', '885.24', '150.34', '488.8'],
            ['2023-04-01', '749.07', '885.24', '-15.4'],
          ],
        },
        reading:
          'У першого місяця обидві колонки порожні — попереднього немає, ' +
          'і це правильний результат, а не поломка. Далі видно різкий ' +
          'стрибок у березні й помірне просідання у квітні. Але перші ' +
          'місяці тут дуже малі за обсягом, тому відсотки в них ' +
          'вибухають: на маленькій базі будь-яка зміна виглядає драмою.',
        watchOut: [
          'У знаменнику мусить стояти попередній період, а не поточний. ' +
            'Інакше виходить не «наскільки зросли відносно минулого ' +
            'разу», а частка приросту в новому обсязі — інша величина, до ' +
            'того ж непорівнянна між місяцями.',
          'NULL у першому рядку — це норма, а не пропуск даних: ' +
            'порівнювати просто немає з чим. Замінити його нулем означає ' +
            'вигадати падіння на всі сто відсотків.',
          'Вікно без ORDER BY робить «попередній рядок» просто «якимось ' +
            'сусіднім». Порядок у вікні задається окремо від порядку ' +
            'виведення, і покладатися тут на ORDER BY наприкінці запиту ' +
            'не можна.',
          'Останній місяць у даних майже завжди неповний, тож його ' +
            'просідання може бути не подією, а лише тим, що місяць ще не ' +
            'закінчився.',
        ],
      },
    ],
    pitfalls: [
      {
        title: 'COUNT(*) рахує події, а не людей',
        text:
          'Активних користувачів рахують подіями й отримують число в ' +
          'рази більше за правду. У цих даних це 3218 проти 190. Лікує ' +
          'COUNT(DISTINCT user_id).',
        wrongSql: 'SELECT COUNT(*) AS active\nFROM app_events;',
        rightSql: 'SELECT COUNT(DISTINCT user_id) AS active\nFROM app_events;',
      },
      {
        title: 'Когорту визначає дата реєстрації',
        text:
          'Якщо групувати за датою події, той самий користувач ' +
          'потрапляє в кілька місяців одразу, і когорта перестає бути ' +
          'когортою.',
        wrongSql: dedent(`
          SELECT
            DATE_TRUNC('month', occurred_at)::date AS cohort,
            COUNT(DISTINCT user_id) AS users
          FROM app_events
          GROUP BY 1;
        `),
        rightSql: dedent(`
          SELECT
            DATE_TRUNC('month', signup_date)::date AS cohort,
            COUNT(*) AS users
          FROM app_users
          GROUP BY 1;
        `),
      },
      {
        title: 'Остання когорта завжди виглядає гірше',
        text:
          'У неї коротше вікно спостереження. У цих даних червнева ' +
          'когорта 2024 має утримання рівно 0 %, бо наступного місяця в ' +
          'даних просто немає. Це не поломка, а неповна когорта, і в ' +
          'звіті її треба або виключати, або підписувати.',
      },
      {
        title: 'LAG без ORDER BY не має сенсу',
        text:
          'Без ORDER BY у вікні «попередній рядок» означає «якийсь ' +
          'сусідній», і число щоразу може бути іншим. А от NULL у першому ' +
          'рядку — це норма: попереднього місяця справді немає, і ' +
          'замінювати його нулем означає вигадати падіння на 100 %.',
      },
      {
        title: 'NTILE ділить за кількістю, а не за сумою',
        text:
          'Квартилі рівні за числом учасників, а не за грошима. У цих ' +
          'даних верхній квартиль із 34 покупців дає 55 % усієї виручки — ' +
          'тож «верхні 25 %» і «чверть виручки» це різні речі.',
      },
      {
        title: 'Конверсія «крок до кроку» — не конверсія «від початку»',
        text:
          '71 % × 64 % × 69 % × 74 % дає 23 %, а не 71 %. Плутанина цих ' +
          'двох чисел — класична причина завищених звітів.',
      },
    ],
    tips: [
      {
        text:
          'Прочитай питання двічі й назви метрику вголос: утримання, ' +
          'воронка, LTV чи сегментація. Половина хибних запитів — це ' +
          'правильний SQL до іншої метрики.',
      },
      {
        text:
          'Уточни терміни на початку, а не після звіту: «активні» — це ' +
          'люди чи події; «конверсія» — крок-до-кроку чи наскрізна; ' +
          '«утримання» — від дати реєстрації чи від першої покупки.',
      },
      {
        text:
          'WITH робить логіку явною: кожен етап дістає імʼя, і запит ' +
          'читається згори вниз, як опис розрахунку.',
        sql: dedent(`
          WITH cohort AS (
            SELECT
              user_id,
              DATE_TRUNC('month', signup_date) AS cohort_month
            FROM app_users
          )
          SELECT
            cohort_month::date AS cohort_month,
            COUNT(*) AS users
          FROM cohort
          GROUP BY cohort_month
          ORDER BY cohort_month
          LIMIT 3;
        `),
      },
      {
        text:
          'Перевіряй розумність результату, перш ніж нести його далі: ' +
          'когорта не росте з часом, конверсія не буває понад 100 %, LTV ' +
          'не буває відʼємним. Порушення такого правила означає помилку ' +
          'в запиті, а не відкриття.',
      },
      {
        text:
          'Документуй припущення коментарем прямо в запиті — через ' +
          'місяць ти вже не згадаєш, чому давність рахується саме від ' +
          'цієї дати.',
        sql: dedent(`
          SELECT
            -- Давність рахуємо від кінця даних, а не від CURRENT_DATE.
            user_id,
            DATE '2024-06-30' - MAX(purchase_date) AS days_since
          FROM app_purchases
          GROUP BY user_id
          LIMIT 3;
        `),
      },
      {
        text:
          'Останній місяць у даних майже завжди неповний, і його ' +
          'утримання занижене за побудовою. Або виключай його зі звіту, ' +
          'або підписуй прямо на графіку.',
      },
    ],
  },
];

export default topics;

export function topicByLevel(level) {
  return topics.find((topic) => topic.level === level);
}

// Перелік конструкцій теми одним рядком — друга половина заголовка після назви
// рівня: «SELECT, FROM, WHERE, ORDER BY, LIMIT, DISTINCT». У розмітці він іде
// окремим span, щоб його можна було пофарбувати як ключові слова в прикладах SQL.
export function topicKeywords(topic) {
  return topic.keywords.join(', ');
}
