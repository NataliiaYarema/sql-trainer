// Англійський текст завдань рівня 7 (умови й множини).
//
// CASE, WHEN, THEN, ELSE, END, UNION, UNION ALL, INTERSECT, EXCEPT, COALESCE,
// NULLIF лишаються великими літерами. Особливо CASE: англійською слово легко
// зливається з прозою, тому пишемо його тільки як конструкцію.
export default {
  'L7-stock-alert': {
    title: 'A stock alert',
    context:
      'A stock keeper is reviewing product stock and wants to see at a glance which items need an urgent reorder.',
    taskText:
      "Label the products by stock: below 10 is 'critical', below 30 is 'low'. The rest stay without a label.",
    hints: [
      'The products have to be labelled according to how much stock is left, while products with a larger stock should not receive a label.',
      'CASE checks the WHEN branches from top to bottom and returns the value from the first branch whose condition is true.',
      "Skeleton: SELECT product_name, stock, CASE WHEN stock < 10 THEN 'critical' WHEN stock < 30 THEN 'low' END AS stock_alert FROM products ORDER BY stock;",
    ],
    explanation:
      'CASE checks the conditions in order and stops at the first match, so later branches are ignored. If no condition matches and there is no ELSE, the result is NULL rather than an empty string or zero — which is exactly what you see for products with a larger stock.',
  },
  'L7-price-tier': {
    title: 'Price tiers of the products',
    context:
      'A purchasing manager is preparing a price list and wants to see at a glance which price segment each product belongs to.',
    taskText:
      "Split the products by price: up to 50 is 'budget', up to 200 is 'standard', and the rest is 'premium'.",
    hints: [
      'Every product has to receive one of three text labels based on its price, so no product should be left without a label.',
      'A CASE with several WHEN branches checks the conditions in order, while ELSE covers everything that did not match any previous condition.',
      "Skeleton: SELECT product_name, price, CASE WHEN price < 50 THEN 'budget' WHEN price < 200 THEN 'standard' ELSE 'premium' END AS price_tier FROM products ORDER BY price;",
    ],
    explanation:
      'ELSE means “everything else”, and it is what prevents the NULL values from the previous task. The order of the conditions matters: if WHEN price < 200 came first, the WHEN price < 50 branch would never be reached for the cheapest products, because they also satisfy price < 200.',
  },
  'L7-department-or-none': {
    title: 'A department or a label',
    context:
      'HR is preparing a general employee directory and wants a missing department to be shown explicitly rather than as a NULL value.',
    taskText:
      "Show the employees so that a NULL department is displayed as 'Not assigned' instead.",
    hints: [
      'Where an employee has no department, a text placeholder has to be shown instead of the NULL value.',
      'COALESCE checks its arguments from left to right and returns the first one that is not NULL.',
      "Skeleton: SELECT first_name, last_name, COALESCE(department, 'Not assigned') AS department FROM employees ORDER BY employee_id;",
    ],
    explanation:
      'COALESCE returns the first non-NULL argument in the list. Replacing this with a WHERE department = NULL condition will not work: a comparison with NULL does not evaluate to TRUE, so the row will not pass the filter. Use IS NULL when you need to check whether a value is NULL.',
  },
  'L7-large-orders-per-manager': {
    title: 'The large orders of the managers',
    context:
      'The head of sales is comparing the workload of the managers and wants to know how many of their orders are large and how many orders they have in total.',
    taskText:
      'For each manager, show the total number of orders and how many of them are 200 or above.',
    hints: [
      'Every manager needs two numbers: the total number of orders and the number of large orders.',
      'COUNT does not count NULL, so a CASE without ELSE inside COUNT works as a conditional count — only rows where the condition is true contribute a non-NULL value.',
      'Skeleton: SELECT manager_id, COUNT(*) AS orders_count, COUNT(CASE WHEN amount >= 200 THEN 1 END) AS large_orders FROM orders GROUP BY manager_id ORDER BY manager_id;',
    ],
    explanation:
      'COUNT does not count NULL, so a CASE without ELSE inside it works as a filter: rows that do not match the condition become NULL and are not counted. Adding ELSE 0 would be a mistake here — COUNT would count those zeros too, making large_orders equal to orders_count for every manager.',
  },
  'L7-loyal-customers': {
    title: 'Customers of both quarters',
    context:
      'Marketing is planning a loyalty programme and wants to find customers who stayed active across two consecutive quarters.',
    taskText: 'Find the customers who ordered both in the first quarter of 2024 and in the second.',
    hints: [
      'Only customers who placed at least one order in each of the two periods are needed — in the first quarter and in the second.',
      'INTERSECT keeps only the rows that are present in both query results.',
      "Skeleton: SELECT customer_id FROM orders WHERE order_date < DATE '2024-04-01' INTERSECT SELECT customer_id FROM orders WHERE order_date >= DATE '2024-04-01';",
    ],
    explanation:
      'INTERSECT keeps only the rows present in both results and removes duplicates automatically, so DISTINCT is redundant here. It cannot be replaced by a single WHERE condition: order_date < ... AND order_date >= ... can never be true for the same row, because that condition is checking one order row rather than whether the same customer appears in both periods.',
  },
  'L7-never-ordered': {
    title: 'Products without a single sale',
    context:
      'A category manager is reviewing the catalogue and wants to find products that have never been sold, in order to decide what to do with them.',
    taskText: 'Find the products that appeared in no order.',
    hints: [
      'You need the catalogue products that are absent from the products that have ever appeared in an order.',
      'EXCEPT subtracts from the first result all rows that also occur in the second result, leaving the difference.',
      'Skeleton: SELECT product_id FROM products EXCEPT SELECT product_id FROM order_items;',
    ],
    explanation:
      'EXCEPT subtracts the second result from the first, so the order of the operands matters. order_items EXCEPT products would answer a different question: which product IDs appear in orders but not in the catalogue. On this data, that result would be empty.',
  },
  'L7-contact-directory': {
    title: 'A single contact directory',
    context:
      'A mailing needs one list of names, combining employees and customers, with a mark showing which type of contact each person is.',
    taskText:
      "Combine the names of the employees and customers into one list. The source column has to read 'employee' for employees and 'customer' for customers.",
    hints: [
      'There is no need to join the tables by columns here — the rows have to be placed one underneath the other.',
      "UNION ALL combines the results of two SELECTs. The source can be set with a constant such as 'employee' AS source.",
      "Skeleton: SELECT first_name AS person_name, 'employee' AS source FROM employees UNION ALL SELECT name, 'customer' FROM customers;",
    ],
    explanation:
      'JOIN adds columns, while UNION adds rows. Both SELECTs must have the same number of columns with compatible types. UNION removes duplicates, which can require additional work to compare the result rows, while UNION ALL preserves them. Use UNION ALL when duplicates are intentional or do not need to be removed.',
  },
  'L7-price-extremes': {
    title: 'The extremes of the price list',
    context:
      'A review of the price range needs a short list containing the cheapest and most expensive products.',
    taskText:
      "Combine two lists: the two cheapest products marked 'cheapest' and the two most expensive marked 'priciest'.",
    hints: [
      'Two different sets of rows are needed, placed one underneath the other.',
      'ORDER BY and LIMIT at the end of a UNION apply to the combined result, so each half needs to be isolated in a subquery.',
      "Skeleton: SELECT ..., 'cheapest' AS label FROM (SELECT ... ORDER BY price ASC LIMIT 2) AS cheap UNION ALL SELECT ..., 'priciest' FROM (SELECT ... ORDER BY price DESC LIMIT 2) AS pricey;",
    ],
    explanation:
      'An important detail: ORDER BY and LIMIT at the end of a UNION apply to the combined result rather than to each part separately. To limit each half independently, isolate it in a subquery. Otherwise, the query may return the wrong rows or fail to express the intended logic.',
  },
  'L7-department-priority': {
    title: 'Departments in order of priority',
    context:
      'The HR director is preparing an employee list for the board meeting and wants it to start with the departments that are key for the company rather than follow alphabetical or identifier order.',
    taskText:
      'Show the employees who have a department, ordering them first by department priority — IT, then Sales, then Marketing, then the rest — and within each department by descending salary.',
    hints: [
      'The departments have to be arranged neither alphabetically nor by ID, but in a predefined order — IT first, then Sales, then Marketing, and the rest afterwards. Within each department, sort from the highest salary to the lowest.',
      'ORDER BY can sort by any expression, not just a column name. A CASE that turns each department name into a priority number works here: the smaller the number, the higher the priority.',
      "Skeleton: SELECT first_name, department, salary FROM employees WHERE department IS NOT NULL ORDER BY CASE department WHEN 'IT' THEN 1 ... END, salary DESC;",
    ],
    explanation:
      'ORDER BY accepts expressions, not just column names, which lets you define an order that does not exist naturally in the data. The short form CASE department WHEN value is used here and compares values for equality; it is not suitable for range checks. Those require the searched form, CASE WHEN condition.',
  },
  'L7-salary-grade': {
    title: 'The grade of an employee',
    context:
      'An HR manager is preparing a grade report and wants the salary threshold for a “senior” grade in IT to differ from the threshold used in other departments.',
    taskText:
      "Assign a grade: for IT, salary 7000 or above is 'IT senior' and anything below is 'IT regular'; for other departments, 5500 or above is 'senior' and anything below is 'regular'.",
    hints: [
      'Every employee needs a grade, but the salary threshold for a senior grade depends on the department.',
      'A CASE can be nested inside the THEN or ELSE branch of another CASE. That lets you check the department first and then apply the appropriate salary threshold.',
      "Skeleton: SELECT ..., CASE WHEN department = 'IT' THEN CASE WHEN salary >= 7000 THEN 'IT senior' ELSE 'IT regular' END ELSE CASE WHEN salary >= 5500 THEN 'senior' ELSE 'regular' END END AS grade FROM employees;",
    ],
    explanation:
      'Another CASE can be placed inside a THEN or ELSE branch. That is useful when the rule depends on a category. Every END closes its own CASE, so nested CASE expressions need careful matching. A missing END often causes the syntax error to be reported on a later line rather than exactly where the problem started.',
  },
  'L7-quarter-pivot': {
    title: 'Quarters side by side',
    context:
      'A financial analyst is comparing revenue by quarter and wants to see the first- and second-quarter amounts next to each other in one row per customer rather than in two separate reports.',
    taskText:
      'For each customer, show the order total for the first quarter of 2024 and the total for the second quarter as two neighbouring columns.',
    hints: [
      'Every customer needs two totals at once — one for the first quarter and one for the second — laid out in neighbouring columns rather than separate rows.',
      'SUM(CASE ...) inside an aggregate sums only the rows that match the condition in the CASE. This is how conditional aggregation can turn categories into separate columns.',
      "Skeleton: SELECT customer_id, SUM(CASE WHEN order_date < DATE '2024-04-01' THEN amount ELSE 0 END) AS q1, SUM(CASE ...) AS q2 FROM orders GROUP BY customer_id;",
    ],
    explanation:
      'SUM(CASE ...) is a common way to build a pivot-style result when there is no separate pivot operator. ELSE 0 is deliberate here: without it, a customer with no matching rows in a quarter would get NULL for that quarter instead of zero.',
  },
  'L7-small-per-large': {
    title: 'How many small ones per large one',
    context:
      'The head of sales is analysing the order structure of each manager and wants to see the ratio of small orders to large orders as a single number.',
    taskText:
      'For each manager, calculate how many orders below 200 there are per order of 200 or above, rounded to two decimal places.',
    hints: [
      'Every manager needs one number — the number of small orders per large order — and the calculation should still work when the manager has no large orders.',
      'NULLIF(x, 0) turns a zero into NULL, so dividing by it produces NULL instead of a division-by-zero error. The ::NUMERIC cast ensures that the division keeps its fractional part.',
      'Skeleton: SELECT manager_id, ROUND(COUNT(...)::NUMERIC / NULLIF(COUNT(...), 0), 2) AS small_per_large FROM orders GROUP BY manager_id;',
    ],
    explanation:
      'NULLIF(x, 0) turns zero into NULL, and division by NULL produces NULL instead of failing. That handles managers with no large orders. Without NULLIF, the query would fail with a division-by-zero error. The ::NUMERIC cast is important too: it makes the division use a numeric value so the fractional part is preserved.',
  },
  'L7-recent-events': {
    title: 'A feed of recent events',
    context:
      'The operations director wants to review the company’s recent significant events at a glance — both new orders and new hires.',
    taskText:
      "Gather into one feed the orders from 1 June 2024, marked 'order', and the hires from 1 January 2024, marked 'hire'. The scale of each event is: for an order, 'large' from 200 and 'small' otherwise; for a hire, 'senior' from a salary of 6000 and 'junior' otherwise.",
    hints: [
      'One shared event feed is needed from two different tables — recent orders and recent hires — with every row carrying an event type and scale.',
      'UNION ALL puts the results of two SELECTs one underneath the other. The scale of each event is decided by its own CASE — one set of labels for orders and another for hires.',
      "Skeleton: SELECT order_date, 'order', CASE WHEN amount >= 200 THEN 'large' ELSE 'small' END FROM orders WHERE ... UNION ALL SELECT hire_date, 'hire', CASE ... END FROM employees WHERE ...;",
    ],
    explanation:
      'The column names for the combined result are taken from the first SELECT. The second SELECT does not need aliases for those columns; its expressions simply occupy the corresponding positions. Both SELECTs must return the same number of columns with compatible types. The column order matters: if the types happen to be compatible, SQL may accept a swapped pair even though the resulting data would be wrong.',
  },
  'L7-customer-segments': {
    title: 'Customer segments',
    context:
      'The head of sales wants to split customers into segments by activity and revenue in order to focus attention on the key ones.',
    taskText:
      "Split the customers into segments: without orders is 'inactive', with revenue from 1000 is 'key', with at least four orders is 'regular', and the rest is 'occasional'. Customers without orders must show zero revenue.",
    hints: [
      'The customers have to be divided into four groups: without a single order, with high revenue, with frequent orders, and everyone else. Customers without orders should show zero revenue rather than NULL.',
      'LEFT JOIN keeps customers without orders in the result. COUNT and SUM then calculate per-customer values, CASE applies the segment rules, and COALESCE replaces a NULL total with zero.',
      "Skeleton: SELECT c.name, COUNT(o.order_id), COALESCE(SUM(o.amount), 0), CASE WHEN COUNT(o.order_id) = 0 THEN 'inactive' ... END FROM customers AS c LEFT JOIN orders AS o ON ... GROUP BY c.customer_id, c.name;",
    ],
    explanation:
      "The CASE branches are checked in order, so the zero-orders check comes first. Otherwise, a customer without any orders could fall through to ELSE and become 'occasional'. COUNT(o.order_id) is also deliberate: COUNT(*) after a LEFT JOIN would return 1 for such a customer because the preserved customer row still exists, even though the columns from orders are NULL.",
  },
  'L7-assortment-shift': {
    title: 'The shift in the range between quarters',
    context:
      'A category manager is analysing how the range of products sold changed between the first and second quarters, to see what disappeared and what appeared.',
    taskText:
      "Show what changed in sales between the quarters of 2024: products that sold only in the first quarter, marked 'only Q1', and products that appeared only in the second, marked 'only Q2'.",
    hints: [
      'Two groups of products have to be found: those that sold only in the first quarter and disappeared from sales in the second, and those that appeared only in the second. Both groups then need to be combined into one list with a label showing which group each product belongs to.',
      'EXCEPT finds rows from one query that are absent from another — exactly what is needed to find products that appear in one quarter but not the other. Two such queries, one in each direction, can then be combined with UNION ALL.',
      "Skeleton: WITH q1_products AS (...), q2_products AS (...) SELECT p.product_name, 'only Q1' FROM products AS p JOIN (SELECT product_id FROM q1_products EXCEPT SELECT product_id FROM q2_products) AS gone ON ...;",
    ],
    explanation:
      'EXCEPT is asymmetric, so “what changed” requires two comparisons: A EXCEPT B and B EXCEPT A answer different questions. They are combined with UNION ALL because the two sets represent opposite directions and should not contain the same product ID. Using UNION would perform duplicate removal that is unnecessary for this result.',
  },
};
