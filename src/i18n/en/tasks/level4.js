// Англійський текст завдань рівня 4 (підзапити й CTE).
//
// EXISTS, NOT EXISTS, NOT IN і WITH лишаються великими літерами: це конструкції.
// Особливо важливо в L4-employees-not-managers, де все пояснення тримається на
// різниці між NOT IN і NOT EXISTS.
export default {
  'L4-big-order-customers': {
    title: 'Customers with large orders',
    context:
      'The key accounts team is looking for everyone who has ordered more than 300 at least once.',
    taskText:
      'Show the names and countries of the customers who have at least one order above 300.',
    hints: [
      'First find the identifiers of the customers with large orders, then pick them out of the reference table.',
      'The IN operator accepts not only a list of values but a whole subquery.',
      'Skeleton: SELECT name, country FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount > 300);',
    ],
    explanation:
      'A subquery inside IN runs first and returns a set of values the outer query is checked against. Unlike a JOIN, the customer is not duplicated even if they have several large orders — exactly what a list of unique customers needs.',
  },

  'L4-bulk-products': {
    title: 'Products ordered in bulk',
    context:
      'Logistics is planning pallet storage for the items people take three or more at a time.',
    taskText: 'Show the products that were ordered in a quantity of 3 or more at least once.',
    hints: [
      'The subquery has to return the list of product_id values that match the condition.',
      'The outer query filters the product reference table by that list with IN.',
      'Skeleton: SELECT product_name, category FROM products WHERE product_id IN (SELECT product_id FROM order_items WHERE quantity >= 3);',
    ],
    explanation:
      'A subquery in WHERE is handy when all you need from the second table is a selection condition rather than its columns. With a JOIN you would have to add DISTINCT to remove the duplicates coming from several matching lines.',
  },

  'L4-above-average-salary': {
    title: 'Who earns above the average',
    context:
      'HR is analysing the salary spread and looking for those who earn more than the company average.',
    taskText: 'Show the employees whose salary is above the company average.',
    hints: [
      'The average has to be computed by a separate query and used as a number in the condition.',
      'A scalar subquery in brackets returns a single value that can be compared against.',
      'Skeleton: SELECT first_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    ],
    explanation:
      'A scalar subquery returns exactly one value and can stand anywhere a number is expected. This is how the ban on writing an aggregate function directly in WHERE is worked around: the subquery is computed separately, and then its result is compared with every row.',
  },

  'L4-price-vs-average': {
    title: 'A product price against the average',
    context:
      'A category manager wants to see the price of every product next to the catalogue average.',
    taskText: 'For each product, show its price and the average price across the whole catalogue.',
    hints: [
      'A subquery can go not only into WHERE but straight into the list of columns.',
      'The value is the same for every row, because the subquery does not depend on the outer query.',
      'Skeleton: SELECT product_name, price, (SELECT AVG(price) FROM products) AS avg_price FROM products;',
    ],
    explanation:
      'A scalar subquery in SELECT assigns one and the same value to every row — handy for a “metric against a benchmark” comparison. Since the subquery does not refer to outer columns, the database computes it once rather than for every row.',
  },

  'L4-customers-with-orders': {
    title: 'Customers who ordered something',
    context:
      'Before a mailing, marketing keeps only those with at least one order in the database.',
    taskText: 'Show the customers who have at least one order.',
    hints: [
      'The question is not “how many orders” but “is there at least one” — the fact of existence is enough.',
      'EXISTS becomes true as soon as the subquery returns at least one row.',
      'Skeleton: SELECT name, country FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);',
    ],
    explanation:
      'EXISTS checks whether rows are present rather than what they contain — which is why SELECT 1 is traditionally written inside. It differs from a JOIN in that the customer is not duplicated, however many orders they may have.',
  },

  'L4-departments-without-hires': {
    title: 'Departments without newcomers',
    context:
      'HR is checking which departments hired nobody in 2024 — growth may have stalled there.',
    taskText: 'Show the departments that have no employee hired in 2024.',
    hints: [
      'State the opposite: “the department has somebody hired in 2024”. Then negate it.',
      'NOT EXISTS is true exactly when the subquery returned no rows.',
      'Skeleton: SELECT DISTINCT department FROM employees e WHERE department IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees e2 WHERE e2.department = e.department AND EXTRACT(YEAR FROM e2.hire_date) = 2024);',
    ],
    explanation:
      'NOT EXISTS is the standard way of saying “there is no related row”. Unlike NOT IN, it behaves correctly with NULL: if the subquery returns even one NULL, NOT IN gives an empty result, while NOT EXISTS works as expected.',
  },

  'L4-first-cte': {
    title: 'The first step with WITH',
    context:
      'An analyst wants to break a long query into readable steps, starting with picking the expensive products.',
    taskText: 'Using a CTE, pick the products above 200 and then show their names and prices.',
    hints: [
      'A CTE is a named intermediate result declared before the main query.',
      'The syntax: WITH name AS (query) SELECT ... FROM name;',
      'Skeleton: WITH expensive AS (SELECT product_name, price FROM products WHERE price > 200) SELECT product_name, price FROM expensive;',
    ],
    explanation:
      'A CTE (Common Table Expression) gives a subquery a name and moves it to the front. It simplifies nothing yet — the point will appear once there are several steps. What matters now is getting used to the form WITH name AS (...).',
  },

  'L4-cte-aggregate': {
    title: 'A CTE with aggregation',
    context: 'A manager wants to see the totals by customer, computed as a separate readable step.',
    taskText:
      'Using a CTE, calculate the order total of each customer, then show only those who spent more than 500.',
    hints: [
      'First the aggregation inside the CTE, then an ordinary filter over its result.',
      'A column computed inside a CTE can be addressed in the outer query with a plain WHERE.',
      'Skeleton: WITH totals AS (SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id) SELECT * FROM totals WHERE total_spent > 500;',
    ],
    explanation:
      'This is where a CTE pays off: the aggregate was computed at the previous step, so it can be filtered with an ordinary WHERE, without HAVING. The query reads top to bottom as a sequence of actions rather than as nested brackets.',
  },

  'L4-loyal-avg-check': {
    title: 'The average ticket among regular customers',
    context:
      'An analyst is computing the average ticket, but only for those with at least four orders — occasional buyers distort the picture.',
    taskText: 'Show the names of the customers with 4+ orders and their average ticket.',
    hints: [
      'Compute the aggregates in a separate query, then attach the customer reference table to it.',
      'A subquery in FROM works like a temporary table, and it is worth giving it an alias.',
      'Skeleton: SELECT c.name, s.avg_order FROM (SELECT customer_id, AVG(amount) AS avg_order FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4) s JOIN customers c ON ...;',
    ],
    explanation:
      'A subquery in FROM (a derived table) lets you aggregate the data first and then work with the result as with an ordinary table. CTEs grew out of exactly this idea — the ones you have just met on this same level: they do the same thing but read far better, which is why new queries usually take WITH.',
  },

  'L4-department-top-salary': {
    title: 'The highest salary in one’s own department',
    context: 'Management is singling out the highest-paid employee in each department.',
    taskText: 'Show the employees whose salary is the maximum inside their department.',
    hints: [
      'The comparison goes not against the global maximum but against the maximum inside the same department.',
      'A correlated subquery can refer to a column of the outer query: WHERE e2.department = e.department.',
      'Skeleton: SELECT ... FROM employees e WHERE e.salary = (SELECT MAX(e2.salary) FROM employees e2 WHERE e2.department = e.department);',
    ],
    explanation:
      'A correlated subquery is executed anew for every row of the outer query and “sees” its columns. That is powerful but expensive: on large tables such a construction turns into a hidden loop, and the window functions of the next level work better.',
  },

  'L4-order-count-subquery': {
    title: 'An order counter by subquery',
    context: 'A manager wants a single list of customers with the number of orders next to each.',
    taskText:
      'For each customer, show the number of their orders, computed with a correlated subquery. Customers without orders have to show 0.',
    hints: [
      'A subquery in SELECT can refer to the current row of the outer query.',
      'COUNT(*) returns 0 for a customer without orders, so no extra tricks are needed.',
      'Skeleton: SELECT c.name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS order_count FROM customers c;',
    ],
    explanation:
      'A correlated subquery in SELECT gives the same result as a LEFT JOIN with GROUP BY but reads more simply. A pleasant bonus: COUNT over an empty subquery naturally returns 0, whereas with a LEFT JOIN you would have to make sure the customer’s own row is not counted.',
  },

  'L4-two-cte-steps': {
    title: 'Two steps in one query',
    context:
      'An analyst is comparing the revenue by category with the average category revenue to find the leaders.',
    taskText:
      'Using two CTEs, calculate the revenue of each category, then the average revenue among the categories, and show the categories with revenue above that average.',
    hints: [
      'Several CTEs are listed after a single WITH, separated by commas.',
      'The second CTE may refer to the first — that is exactly how the average of the finished sums is computed.',
      'Skeleton: WITH category_revenue AS (...), average_revenue AS (SELECT AVG(revenue) FROM category_revenue) SELECT ... FROM category_revenue, average_revenue WHERE revenue > avg_revenue;',
    ],
    explanation:
      'Several CTEs form a chain of steps where each one leans on the previous — the query reads as a sequence of actions. Without CTEs the same logic would have to be written with nested subqueries, duplicating the aggregation twice.',
  },

  'L4-employees-not-managers': {
    title: 'Who leads nobody',
    context:
      'HR is planning training for managers and first filters out those who have no subordinates yet.',
    taskText:
      'Show the first and last names of the employees who have no subordinates. Use NOT EXISTS.',
    hints: [
      'State the opposite: “there is somebody whose manager is this person”. Then negate it.',
      'NOT EXISTS is true exactly when the subquery returned no rows.',
      'Skeleton: SELECT e.first_name, e.last_name FROM employees e WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.employee_id);',
    ],
    explanation:
      'This task exists for one particular trap. The obvious form WHERE employee_id NOT IN (SELECT manager_id FROM employees) returns zero rows — silently, without any error. The reason is that manager_id contains NULL values: the expression x NOT IN (8, 3, NULL) unfolds into x <> 8 AND x <> 3 AND x <> NULL, and the last term gives “unknown”, so the whole expression is never true. NOT EXISTS checks the presence of rows rather than values, and NULL does not throw it off. That is why NOT EXISTS is the one to use with a subquery that may contain empty values.',
  },

  'L4-managers-above-average': {
    title: 'Managers who beat the average',
    context:
      'The head of sales is looking for the managers who bring in more than the average result of the department.',
    taskText:
      'Calculate the total sales of each manager and show those whose total is above the average total among the managers.',
    hints: [
      'First reduce the orders to totals per manager — a natural CTE.',
      'Then compare each total with the average, computed from the same CTE with a scalar subquery.',
      'Skeleton: WITH manager_sales AS (SELECT e.first_name, SUM(o.amount) AS total_sales FROM orders o JOIN employees e ON e.employee_id = o.manager_id GROUP BY ...) SELECT * FROM manager_sales WHERE total_sales > (SELECT AVG(total_sales) FROM manager_sales);',
    ],
    explanation:
      'The closing task of the level brings JOIN, aggregation, a CTE and a scalar subquery together. The key advantage of the CTE here is that it can be referred to twice — both in the main query and inside the subquery — without writing the aggregation a second time.',
  },

  'L4-three-step-report': {
    title: 'A report in three steps',
    context:
      'An analyst is preparing a market overview: first the customer spending is totalled, then the countries, and only then are the countries compared with each other.',
    taskText:
      'Using three CTEs, calculate the spending of each customer, roll it up into revenue by country, find the average country revenue and show the countries above it.',
    hints: [
      'There are exactly three steps, and each next one works with the result of the previous, not with the original tables.',
      'Several CTEs are listed after a single WITH, separated by commas, and the second may refer to the first.',
      'Skeleton: WITH customer_totals AS (...), country_totals AS (... FROM customer_totals ...), overall AS (SELECT AVG(country_total) FROM country_totals) SELECT ... FROM country_totals, overall WHERE country_total > avg_country;',
    ],
    explanation:
      'A chain of CTEs unfolds the query top to bottom as a sequence of steps rather than as three levels of nested brackets — which is exactly what makes it valuable when the logic of a report has many stages. Note the aggregate over an aggregate in the second step: SUM(t.total) adds up the already computed customer totals. Writing SUM(o.amount) there would be impossible, because at that step individual orders no longer exist — the previous CTE has rolled them up into totals.',
  },
};
