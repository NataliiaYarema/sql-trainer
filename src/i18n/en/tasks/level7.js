// Англійський текст завдань рівня 7 (умови й множини).
//
// CASE, WHEN, THEN, ELSE, END, UNION, UNION ALL, INTERSECT, EXCEPT, COALESCE,
// NULLIF лишаються великими літерами. Особливо CASE: англійською слово легко
// зливається з прозою, тому пишемо його тільки як конструкцію.
export default {
  'L7-stock-alert': {
    title: 'A stock alert',
    context:
      'A stock keeper is looking through the product stock and wants to see at once which items need an urgent reorder.',
    taskText:
      "Label the products by stock: below 10 is 'critical', below 30 is 'low'. The rest stay without a label.",
    hints: [
      'The products have to be labelled according to how little is left in the warehouse, and the products with a large stock should not be labelled at all.',
      'CASE checks the WHEN branches one after another from the top down and returns the value of the first one that turned out to be true.',
      "Skeleton: SELECT product_name, stock, CASE WHEN stock < 10 THEN 'critical' WHEN stock < 30 THEN 'low' END AS stock_alert FROM products ORDER BY stock;",
    ],
    explanation:
      'CASE checks the conditions in turn and stops at the first match, ignoring the remaining branches. If no condition fired and no ELSE is written, the result becomes NULL rather than an empty string or a zero — and that NULL is exactly what you see for the products with a large stock.',
  },

  'L7-price-tier': {
    title: 'Price tiers of the products',
    context:
      'A purchasing manager is preparing a price list and wants to see at once which price segment every product belongs to.',
    taskText:
      "Split the products by price: up to 50 is 'budget', up to 200 is 'standard', the rest is 'premium'.",
    hints: [
      'Every product has to get one of three text labels by price, and no product may be left without a label.',
      'A CASE with several WHEN branches checks the bounds in turn, and ELSE takes everything that did not match any condition above.',
      "Skeleton: SELECT product_name, price, CASE WHEN price < 50 THEN 'budget' WHEN price < 200 THEN 'standard' ELSE 'premium' END AS price_tier FROM products ORDER BY price;",
    ],
    explanation:
      'ELSE means “everything else”, and it is exactly what removes the NULL that was left in the previous task without such a branch. The order of the conditions here is the priority: had WHEN price < 200 come first, the WHEN price < 50 branch would never fire, because the cheap products match both conditions at once.',
  },

  'L7-department-or-none': {
    title: 'A department or a label',
    context:
      'HR is preparing a general employee directory and wants a missing department to be visible explicitly rather than as an empty field.',
    taskText: "Show the employees so that an empty department reads 'Not assigned' instead.",
    hints: [
      'Where an employee has no department stated, a text placeholder has to be put in place of the empty value.',
      'COALESCE checks its arguments from left to right and returns the first one that is not NULL.',
      "Skeleton: SELECT first_name, last_name, COALESCE(department, 'Not assigned') AS department FROM employees ORDER BY employee_id;",
    ],
    explanation:
      'COALESCE returns the first non-empty argument from the list. Replacing this logic with a WHERE department = NULL condition will not work: a comparison with NULL always gives NULL rather than false, so such a row simply does not pass the filter — the IS NULL operator is there for checking emptiness.',
  },

  'L7-large-orders-per-manager': {
    title: 'The large orders of the managers',
    context:
      'The head of sales is comparing the workload of the managers and wants to know how many of each one’s orders are large and how many there are in total.',
    taskText:
      'For each manager, show the total number of orders and how many of them are 200 or above.',
    hints: [
      'Every manager needs two numbers at once: how many orders they have in total and how many of them are large.',
      'COUNT does not count NULL, so a CASE without ELSE inside COUNT works as a conditional count — only the rows where the condition held are counted.',
      'Skeleton: SELECT manager_id, COUNT(*) AS orders_count, COUNT(CASE WHEN amount >= 200 THEN 1 END) AS large_orders FROM orders GROUP BY manager_id ORDER BY manager_id;',
    ],
    explanation:
      'COUNT does not count NULL, so a CASE without ELSE inside it works as a filter: the rows that did not match the condition turn into NULL and simply do not get into the count. Adding ELSE 0 here would be a mistake — COUNT would then count the zeros too, and large_orders would equal the very same number as orders_count for every manager.',
  },

  'L7-loyal-customers': {
    title: 'Customers of both quarters',
    context:
      'Marketing is planning a loyalty programme and wants to find the customers who stay active for a second quarter in a row.',
    taskText: 'Find the customers who ordered both in the first quarter of 2024 and in the second.',
    hints: [
      'Only the customers who placed at least one order in each of the two periods are needed — in the first and in the second.',
      'INTERSECT keeps only the rows that are present in the results of both queries at the same time.',
      "Skeleton: SELECT customer_id FROM orders WHERE order_date < DATE '2024-04-01' INTERSECT SELECT customer_id FROM orders WHERE order_date >= DATE '2024-04-01';",
    ],
    explanation:
      'INTERSECT keeps only the rows present in both results and removes the duplicates by itself — so DISTINCT is redundant here. It cannot be replaced by a single WHERE condition: order_date < ... AND order_date >= ... will never be true for one and the same row, because that is a check on a row rather than on a customer.',
  },

  'L7-never-ordered': {
    title: 'Products without a single sale',
    context:
      'A category manager is reviewing the catalogue and wants to find the products that never sold, in order to decide their fate.',
    taskText: 'Find the products that got into no order.',
    hints: [
      'What you need are the catalogue products that are absent from the products that were ever part of an order.',
      'EXCEPT subtracts from the first result all the rows that occur in the second and leaves exactly the difference.',
      'Skeleton: SELECT product_id FROM products EXCEPT SELECT product_id FROM order_items;',
    ],
    explanation:
      'EXCEPT subtracts the second result from the first, and the operands cannot be swapped here: order_items EXCEPT products would answer an entirely different question — which sold products disappeared from the catalogue — and on our data it would give an empty result.',
  },

  'L7-contact-directory': {
    title: 'A single contact directory',
    context:
      'A mailing needs one list of names, both employees and customers, with a mark saying which is which.',
    taskText:
      "Combine the names of the employees and the customers into one list. The source column has to read 'employee' for the employees and 'customer' for the customers.",
    hints: [
      'There is no need to join the tables by columns here — the rows have to be put one under another.',
      "UNION ALL adds the results of two SELECTs together. The mark can be set by a constant: 'employee' AS source.",
      "Skeleton: SELECT first_name AS person_name, 'employee' AS source FROM employees UNION ALL SELECT name, 'customer' FROM customers;",
    ],
    explanation:
      'JOIN adds columns, UNION adds rows. Both queries must have the same number of columns of compatible types. UNION removes duplicates and therefore does extra work (hashing or sorting), while UNION ALL simply glues and runs faster — take ALL if you deliberately do not fear duplicates.',
  },

  'L7-price-extremes': {
    title: 'The extremes of the price list',
    context:
      'A review of the price range needs a short list: the cheapest and the most expensive products in one table.',
    taskText:
      "Combine two lists: the two cheapest products marked 'cheapest' and the two most expensive marked 'priciest'.",
    hints: [
      'Two different sets of rows are needed, put one under another.',
      'ORDER BY and LIMIT apply to the whole UNION, so each half is worth wrapping in a subquery.',
      "Skeleton: SELECT ..., 'cheapest' AS label FROM (SELECT ... ORDER BY price ASC LIMIT 2) AS cheap UNION ALL SELECT ..., 'priciest' FROM (SELECT ... ORDER BY price DESC LIMIT 2) AS pricey;",
    ],
    explanation:
      'An important detail: ORDER BY and LIMIT at the end of a UNION apply to the combined result rather than to each part separately. To limit one half exactly, it has to be isolated in a subquery — otherwise the query either fails or returns the wrong thing.',
  },

  'L7-department-priority': {
    title: 'Departments in order of priority',
    context:
      'The HR director is preparing an employee list for the board meeting and wants it to open with the departments that are key for the company rather than to follow the alphabet or the identifier.',
    taskText:
      'Show the employees who have a department, ordering them first by the priority of the department — IT, then Sales, then Marketing, then the rest — and inside each one by descending salary.',
    hints: [
      'The departments have to be arranged neither alphabetically nor by code, but in your own predefined order — IT first, then Sales, then Marketing, and the rest after them; inside each group from the highest salary to the lowest.',
      'ORDER BY can sort by any expression rather than only by a column name — a CASE that turns a department name into a priority number fits here: the smaller the number, the higher the row.',
      "Skeleton: SELECT first_name, department, salary FROM employees WHERE department IS NOT NULL ORDER BY CASE department WHEN 'IT' THEN 1 ... END, salary DESC;",
    ],
    explanation:
      'ORDER BY takes any expression and not only a column — that is the only way to set an order that exists neither in the alphabet nor in numbers. The short form CASE department WHEN value is used here, which compares for equality; it does not suit range checks — those need the long form CASE WHEN condition.',
  },

  'L7-salary-grade': {
    title: 'The grade of an employee',
    context:
      'An HR manager is preparing a grade report and wants the “high salary” threshold for IT to differ from the threshold for the other departments.',
    taskText:
      "Assign a grade: for IT that is 'IT senior' from 7000 and 'IT regular' below, for the rest 'senior' from 5500 and 'regular' below.",
    hints: [
      'An employee has to be given a grade, and the border between a high and a not-so-high salary is different for IT and for all the other departments.',
      'Another CASE can be nested into the THEN branch of one CASE — that is how a rule depending on a category is set: the department is checked first, and the salary inside it.',
      "Skeleton: SELECT ..., CASE WHEN department = 'IT' THEN CASE WHEN salary >= 7000 THEN 'IT senior' ELSE 'IT regular' END ELSE CASE WHEN salary >= 5500 THEN 'senior' ELSE 'regular' END END AS grade FROM employees;",
    ],
    explanation:
      'Another CASE can be put into a THEN branch — that is what is done when the threshold depends on a category. Every END closes its own CASE, and a forgotten END is the most common mistake with nesting: the database will point at a syntax error in a completely different line from the one where the END actually went missing.',
  },

  'L7-quarter-pivot': {
    title: 'Quarters side by side',
    context:
      'A financial analyst is comparing revenue by quarter and wants to see the first and second quarter amounts next to each other in one customer row rather than in two separate reports.',
    taskText:
      'For each customer, show the order total of the first quarter of 2024 and the total of the second — as two neighbouring columns.',
    hints: [
      'Every customer needs two totals at once — for the first quarter and for the second — laid out in two neighbouring columns rather than in separate rows.',
      'SUM(CASE ...) inside an aggregate sums only the rows that match the condition in the CASE — that is how one column of sums is turned into several.',
      "Skeleton: SELECT customer_id, SUM(CASE WHEN order_date < DATE '2024-04-01' THEN amount ELSE 0 END) AS q1, SUM(CASE ...) AS q2 FROM orders GROUP BY customer_id;",
    ],
    explanation:
      'SUM(CASE …) turns rows into columns — that is how pivot tables are built where there is no separate pivot operator. ELSE 0 here is deliberate: without it a customer who did not order in the first quarter would get an empty value in q1 instead of an honest zero.',
  },

  'L7-small-per-large': {
    title: 'How many small ones per large one',
    context:
      'The head of sales is judging the order structure of the managers and wants to see the ratio of small orders to large ones as a single number.',
    taskText:
      'For each manager, calculate how many orders below 200 there are per one order of 200 or above, rounded to two digits.',
    hints: [
      'Every manager needs one number — how many small orders there are per one large one — and it has to be computed correctly even if the manager has no large orders at all.',
      'NULLIF(x, 0) turns a zero into NULL, so dividing by it does not fail with an error but gives NULL; the ::NUMERIC cast keeps the result from being rounded to a whole number instead of a fraction.',
      'Skeleton: SELECT manager_id, ROUND(COUNT(...)::NUMERIC / NULLIF(COUNT(...), 0), 2) AS small_per_large FROM orders GROUP BY manager_id;',
    ],
    explanation:
      'NULLIF(x, 0) turns a zero into NULL, and division by NULL gives NULL instead of failing — which is exactly what saves the manager who has no large orders at all. Measured: without NULLIF this query fails with a division by zero error. The ::NUMERIC cast is not decoration either: COUNT returns a whole number, and dividing two integers in PostgreSQL throws the fractional part away.',
  },

  'L7-recent-events': {
    title: 'A feed of recent events',
    context:
      'The operations director wants to look over the company’s recent significant events at a glance — both new orders and new employees.',
    taskText:
      "Gather into one feed the orders from 1 June 2024 marked 'order' and the hires from 1 January 2024 marked 'hire'. The scale of the event: for an order 'large' from 200, otherwise 'small'; for a hire 'senior' from a salary of 6000, otherwise 'junior'.",
    hints: [
      'One shared feed of events is needed out of two different tables — the recent orders and the recent hires — and every row carries a mark of the event type and its scale.',
      'UNION ALL puts the results of two SELECTs one under another; the scale of each event is decided by its own CASE — one set of labels for the orders and another for the hires.',
      "Skeleton: SELECT order_date, 'order', CASE WHEN amount >= 200 THEN 'large' ELSE 'small' END FROM orders WHERE ... UNION ALL SELECT hire_date, 'hire', CASE ... END FROM employees WHERE ...;",
    ],
    explanation:
      'The column names for the whole result are taken from the first SELECT — in the second one the aliases can be left out entirely, they would change nothing. All that is required of the second half is the same number of columns of compatible types; mixing up their order is a mistake the database will not notice if the types match anyway.',
  },

  'L7-customer-segments': {
    title: 'Customer segments',
    context:
      'The head of sales wants to split the customers into segments by activity and revenue, in order to focus attention on the key ones.',
    taskText:
      "Split the customers into segments: without orders is 'inactive', with revenue from 1000 is 'key', from four orders is 'regular', the rest is 'occasional'. Customers without orders have to show zero revenue.",
    hints: [
      'The customers have to be laid out into four groups at once: without a single order, with large revenue, with frequent orders and all the others — and for the customers without orders the revenue has to show as a zero rather than as empty.',
      'LEFT JOIN keeps the customers without orders in the result, COUNT and SUM after it compute per customer, and a CASE on top applies the segment rule; COALESCE puts a zero where SUM would return NULL.',
      "Skeleton: SELECT c.name, COUNT(o.order_id), COALESCE(SUM(o.amount), 0), CASE WHEN COUNT(o.order_id) = 0 THEN 'inactive' ... END FROM customers AS c LEFT JOIN orders AS o ON ... GROUP BY c.customer_id, c.name;",
    ],
    explanation:
      'The CASE branches are checked by priority, so the check for zero orders comes first: otherwise a customer without a single order would fall through into ELSE and become occasional. COUNT(o.order_id) is a deliberate choice here too: COUNT(*) after a LEFT JOIN would return 1 for such a customer, because the row in the result does exist — simply with empty columns on the orders side.',
  },

  'L7-assortment-shift': {
    title: 'The shift in the range between quarters',
    context:
      'A category manager is analysing how the sales range changed between the first and the second quarter, in order to see what disappeared from it and what appeared.',
    taskText:
      "Show what changed in sales between the quarters of 2024: the products that sold only in the first, marked 'only Q1', and those that appeared only in the second, marked 'only Q2'.",
    hints: [
      'Two groups of products have to be found: those that sold only in the first quarter and disappeared from the sales in the second, and those that appeared only in the second — and both groups have to be gathered into one list with a mark of which they belong to.',
      'EXCEPT finds the rows of one query that are absent from another — that is exactly how the products “only here” are looked for; two such queries for the two directions are glued into one list with UNION ALL.',
      "Skeleton: WITH q1_products AS (...), q2_products AS (...) SELECT p.product_name, 'only Q1' FROM products AS p JOIN (SELECT product_id FROM q1_products EXCEPT SELECT product_id FROM q2_products) AS gone ON ...;",
    ],
    explanation:
      'EXCEPT is asymmetric, so the question “what changed” is always two queries rather than one: A EXCEPT B and B EXCEPT A answer different questions. They are put into one answer by UNION ALL rather than UNION: by construction the halves do not overlap, and the deduplication would be paying for work that will find nothing.',
  },
};
