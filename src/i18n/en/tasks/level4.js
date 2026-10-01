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
      'The IN operator accepts not only a list of values but also a whole subquery.',
      'Skeleton: SELECT name, country FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount > 300);',
    ],
    explanation:
      'A subquery inside IN runs as part of the condition and returns a set of values for the outer query to check against. Unlike a JOIN, it does not duplicate the customer when they have several large orders — which is exactly what we need when the result should contain each customer once.',
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
      'A subquery in WHERE is handy when all you need from the second table is a condition for selecting rows, rather than columns from that table. With a JOIN, several matching order lines could produce duplicate products, so you would need DISTINCT to remove them.',
  },
  'L4-above-average-salary': {
    title: 'Who earns above the average',
    context:
      'HR is analysing the salary spread and looking for those who earn more than the company average.',
    taskText: 'Show the employees whose salary is above the company average.',
    hints: [
      'The average has to be computed by a separate query and used as a number in the condition.',
      'A scalar subquery in brackets returns a single value that can be compared with each row.',
      'Skeleton: SELECT first_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    ],
    explanation:
      "A scalar subquery returns a single value and can be used wherever a single value is expected. This is how we can use an aggregate result in a WHERE condition: the average is calculated by the subquery, and the outer query compares each employee's salary with it.",
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
      'A scalar subquery in SELECT adds the same value to every row when it does not depend on the outer query — handy for comparing each row with a common benchmark. Because the subquery does not refer to columns from the outer query, its result is independent of the current product.',
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
      'EXISTS checks whether the subquery returns any rows, not what those rows contain — which is why SELECT 1 is traditionally written inside. It differs from a JOIN because a customer is returned once even if they have several orders.',
  },
  'L4-departments-without-hires': {
    title: 'Departments without newcomers',
    context:
      'HR is checking which departments hired nobody in 2024 — growth may have stalled there.',
    taskText: 'Show the departments that have no employee hired in 2024.',
    hints: [
      'State the opposite: “the department has somebody hired in 2024”. Then negate it.',
      'NOT EXISTS is true exactly when the subquery returns no rows.',
      'Skeleton: SELECT DISTINCT department FROM employees e WHERE department IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees e2 WHERE e2.department = e.department AND EXTRACT(YEAR FROM e2.hire_date) = 2024);',
    ],
    explanation:
      'NOT EXISTS is the standard way to say “there is no related row”. It is also a good fit when the value being checked may be NULL: unlike NOT IN, it checks for the existence of matching rows rather than comparing every value in a list. If a NOT IN subquery contains NULL, its condition can evaluate to UNKNOWN and exclude rows unexpectedly.',
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
      'A CTE (Common Table Expression) gives a subquery a name and places it before the main query. It does not necessarily make a simple query shorter, but it becomes useful when a query has several logical steps. For now, the important thing is getting used to the form WITH name AS (...).',
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
      'This is where a CTE starts to pay off: the aggregate is calculated in one step, then filtered with an ordinary WHERE in the outer query, without HAVING. The query reads top to bottom as a sequence of steps instead of nesting the aggregation inside another query.',
  },
  'L4-loyal-avg-check': {
    title: 'The average ticket among regular customers',
    context:
      'An analyst is computing the average ticket, but only for those with at least four orders — occasional buyers distort the picture.',
    taskText: 'Show the names of the customers with 4+ orders and their average ticket.',
    hints: [
      'Compute the aggregates in a separate query, then attach the customer reference table to it.',
      'A subquery in FROM works like a derived table, and it is worth giving it an alias.',
      'Skeleton: SELECT c.name, s.avg_order FROM (SELECT customer_id, AVG(amount) AS avg_order FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4) s JOIN customers c ON ...;',
    ],
    explanation:
      'A subquery in FROM, also called a derived table, lets you aggregate the data first and then use the result like a table. A CTE (WITH) can express the same kind of intermediate step, but often makes the query easier to read, especially when there are several steps.',
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
      "A correlated subquery can refer to columns from the outer query. Here, the inner query calculates the maximum salary for the current employee's department, and the outer query compares the employee's salary with that value. This can be less efficient than other approaches on large tables, but it is a useful pattern to understand before moving on to window functions.",
  },
  'L4-order-count-subquery': {
    title: 'An order counter by subquery',
    context: 'A manager wants a single list of customers with the number of orders next to each.',
    taskText:
      'For each customer, show the number of their orders, computed with a correlated subquery. Customers without orders have to show 0.',
    hints: [
      'A subquery in SELECT can refer to the current row of the outer query.',
      'COUNT(*) returns 0 when the correlated subquery finds no matching orders.',
      'Skeleton: SELECT c.name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS order_count FROM customers c;',
    ],
    explanation:
      'A correlated subquery in SELECT can produce the same result as a LEFT JOIN with GROUP BY, but the logic is expressed directly as “count the orders for this customer”. COUNT(*) returns 0 when there are no matching rows — whereas after a LEFT JOIN, COUNT(*) would count the customer’s own row and give 1.',
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
      'Several CTEs can form a chain of steps, with a later CTE referring to an earlier one. Here, the first CTE produces one revenue value per category, and the second calculates the average of those category-level values. Without CTEs, the same logic could be written with nested subqueries, but the CTE version makes the stages easier to read.',
  },
  'L4-employees-not-managers': {
    title: 'Who leads nobody',
    context:
      'HR is planning training for managers and first filters out those who have no subordinates yet.',
    taskText:
      'Show the first and last names of the employees who have no subordinates. Use NOT EXISTS.',
    hints: [
      'State the opposite: “there is somebody whose manager is this person”. Then negate it.',
      'NOT EXISTS is true exactly when the subquery returns no rows.',
      'Skeleton: SELECT e.first_name, e.last_name FROM employees e WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.employee_id);',
    ],
    explanation:
      'This task highlights an important NULL trap. A query such as WHERE employee_id NOT IN (SELECT manager_id FROM employees) can behave unexpectedly when manager_id contains NULL. For example, x NOT IN (8, 3, NULL) is equivalent to checking x <> 8 AND x <> 3 AND x <> NULL; the last comparison is UNKNOWN, so the whole condition is not TRUE. NOT EXISTS avoids that problem because it checks whether a matching row exists rather than comparing values in a list.',
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
      'The closing task of the level brings JOIN, aggregation, a CTE and a scalar subquery together. The CTE is useful because the manager-level totals can be reused both in the main query and inside the scalar subquery, without repeating the aggregation.',
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
      'A chain of CTEs unfolds the query top to bottom as a sequence of steps rather than as several levels of nested subqueries. That becomes especially useful when a report has multiple stages. Notice the aggregate over an aggregate in the second step: SUM(t.total) adds up the customer totals already calculated by the previous CTE. At that point, the individual orders are no longer part of the intermediate result, so SUM(o.amount) would not be available there.',
  },
};
