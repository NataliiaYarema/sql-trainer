// Англійський текст завдань рівня 5 (віконні функції).
//
// Назви функцій і частин вікна лишаються як у SQL: ROW_NUMBER, RANK,
// DENSE_RANK, NTILE, LAG, LEAD, FIRST_VALUE, OVER, PARTITION BY, ROWS BETWEEN.
export default {
  'L5-number-by-salary': {
    title: 'Numbering by salary',
    context: 'HR is building a single list of employees ordered by pay level.',
    taskText: 'Give every employee a sequence number by descending salary.',
    hints: [
      'The rows have to be numbered without losing any of them.',
      'ROW_NUMBER() OVER (ORDER BY salary DESC) assigns the numbers in the given order.',
      'Skeleton: SELECT first_name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS position FROM employees;',
    ],
    explanation:
      'The main difference between window functions and GROUP BY is that window functions do not collapse rows. The OVER (...) clause defines the window the function works over, while ORDER BY determines the order used for the numbering. Here the window covers all employees. If several employees have the same salary, their relative order is not defined unless you add another expression to ORDER BY.',
  },
  'L5-tied-ranks': {
    title: 'Places with equal results',
    context:
      'An honours board needs a ranking where employees with the same salary share one place.',
    taskText:
      'Give every employee a place by salary so that equal salaries receive the same place.',
    hints: [
      'ROW_NUMBER would give different numbers even for equal values — a different function is needed.',
      'RANK() assigns the same place to equal values.',
      'Skeleton: SELECT first_name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;',
    ],
    explanation:
      'RANK gives the same place to equal values and leaves gaps after ties: after two employees share second place, the next rank is fourth. If you do not want gaps, use DENSE_RANK instead. ROW_NUMBER, RANK and DENSE_RANK solve different ranking problems, so choosing the right one matters.',
  },
  'L5-department-payroll': {
    title: 'The payroll of one’s own department',
    context: 'Finance wants to see the total budget of a unit next to every employee in it.',
    taskText: 'For each employee, show their salary and the total payroll of their department.',
    hints: [
      'The sum is computed by department, but every employee has to stay a separate row.',
      'PARTITION BY divides the window into groups: SUM(salary) OVER (PARTITION BY department).',
      'Skeleton: SELECT first_name, department, salary, SUM(salary) OVER (PARTITION BY department) AS department_total FROM employees;',
    ],
    explanation:
      'PARTITION BY divides the rows into independent groups within the window, but unlike GROUP BY, it does not collapse them. GROUP BY would leave one row per department and lose the individual employee rows. This is exactly the kind of “show each row alongside a value calculated for its group” problem that window functions handle well.',
  },
  'L5-vs-department-average': {
    title: 'A comparison with the unit average',
    context:
      'Before a salary review, HR wants to see the department average next to every pay figure.',
    taskText: 'For each employee, show their salary and the average salary of their department.',
    hints: [
      'This is the same construction as with the sum, only a different aggregate function.',
      'AVG(salary) OVER (PARTITION BY department) gives the window average for every row.',
      'Skeleton: SELECT first_name, department, salary, AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary FROM employees;',
    ],
    explanation:
      'Many aggregate functions — including SUM, AVG, COUNT, MIN and MAX — can also be used as window functions by adding OVER. The important difference is that the calculation is performed over a window while the original rows remain in the result.',
  },
  'L5-previous-order': {
    title: 'The customer’s previous order',
    context:
      'An analyst is studying buyer behaviour and wants to see the date of the previous order next to every order.',
    taskText:
      'For each order, show the date of the previous order of the same customer. For a customer’s first order the value has to be NULL.',
    hints: [
      'You have to look back, and separately within each customer.',
      'LAG(x) OVER (PARTITION BY customer_id ORDER BY order_date) takes the value from the previous row of the window.',
      'Skeleton: SELECT customer_id, order_date, LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_date FROM orders;',
    ],
    explanation:
      'LAG gives access to a value from a previous row in the window. PARTITION BY is critical here: without it, the previous row could belong to a different customer. The first row of each customer’s window has no previous row, so LAG returns NULL. If two orders have the same date, add another expression such as order_id to ORDER BY when a deterministic order is required.',
  },
  'L5-next-order': {
    title: 'The customer’s next order',
    context: 'To measure the time to a repeat purchase, the date of the next order is needed.',
    taskText:
      'For each order, show the date of the next order of the same customer. For the last order the value has to be NULL.',
    hints: [
      'This is a mirror image of the previous task.',
      'LEAD(x) works just like LAG but looks at the next row.',
      'Skeleton: SELECT customer_id, order_date, LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_order_date FROM orders;',
    ],
    explanation:
      'LAG and LEAD are a pair for working with neighbouring rows. They are useful when you need to compare an event with the one before or after it — for example, the time to the next purchase or the time since the previous login.',
  },
  'L5-dense-vs-rank': {
    title: 'Two ways of handing out places',
    context:
      'A category manager is making a price ranking and cannot decide how to number the items with equal value.',
    taskText:
      'For each product, show its place by price, computed in two ways: RANK and DENSE_RANK.',
    hints: [
      'Two columns with places are needed, computed by the same sorting rule.',
      'RANK and DENSE_RANK are separate window functions; both take the same OVER (ORDER BY ...).',
      'Skeleton: SELECT product_name, price, RANK() OVER (ORDER BY price DESC) AS price_rank, DENSE_RANK() OVER (ORDER BY price DESC) AS dense_price_rank FROM products;',
    ],
    explanation:
      'The difference shows up on ties, and the data has them: two products cost 210, and two more cost 89. RANK leaves gaps after tied values, while DENSE_RANK does not: for example, 1, 2, 2, 4 versus 1, 2, 2, 3. Use RANK when the number represents a competition-style position, and DENSE_RANK when you want consecutive rank values.',
  },
  'L5-best-order-alongside': {
    title: 'The largest purchase next to every one',
    context:
      'A manager is looking through a customer’s history and wants to see at once how far every order is from their record.',
    taskText:
      'For each order, show its amount and the amount of the largest order of the same customer.',
    hints: [
      'The record is computed within one customer, but every order has to stay in the result.',
      'FIRST_VALUE takes the value from the first row of the window, and which row is first is decided by the ORDER BY inside OVER.',
      'Skeleton: SELECT customer_id, order_id, amount, FIRST_VALUE(amount) OVER (PARTITION BY customer_id ORDER BY amount DESC) AS best_amount FROM orders;',
    ],
    explanation:
      'The key to FIRST_VALUE is the ordering inside OVER: ORDER BY amount DESC makes the largest amount the first row of each customer’s window. MAX(amount) with GROUP BY could calculate the same maximum, but it would produce one row per customer instead of keeping every order. FIRST_VALUE lets you keep the individual rows while showing the group’s largest value alongside them. If several orders have the same maximum amount, the value is the same either way; add a tie-breaker to ORDER BY if the identity of the first row matters.',
  },
  'L5-running-revenue': {
    title: 'Cumulative revenue',
    context:
      'An analyst is building a cumulative revenue chart to show the progress towards the annual target.',
    taskText:
      'Show every order together with the running total of all the orders from the earliest to the current one.',
    hints: [
      'The sum has to accumulate along the rows in a certain order rather than be computed once for the whole table.',
      'An aggregate function with OVER (ORDER BY ...) can produce a cumulative calculation.',
      'Skeleton: SELECT order_date, amount, SUM(amount) OVER (ORDER BY order_date, order_id) AS running_total FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'SUM() OVER (ORDER BY ...) without PARTITION BY produces a running total: for each row, the calculation includes the rows up to the current position in the window. The extra column in ORDER BY resolves ties between equal dates and makes the sequence deterministic. The final ORDER BY makes the displayed result follow the same order.',
  },
  'L5-largest-order-per-customer': {
    title: 'The largest order of each customer',
    context: 'The customer care team is preparing buyer cards showing their largest purchase.',
    taskText: 'For each customer who has orders, show their most expensive order.',
    hints: [
      'This is “top 1 within a group”: number the orders of each customer by amount and keep the first.',
      'A window function cannot be used in the WHERE of the same query — move it into a CTE.',
      'Skeleton: WITH ranked AS (SELECT ..., ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn FROM orders) SELECT ... FROM ranked r JOIN customers c ON ... WHERE r.rn = 1;',
    ],
    explanation:
      'Window functions are evaluated after WHERE, so you cannot filter on their result in the same query level. A CTE or subquery creates a separate step where the window result becomes an ordinary column that can be filtered. This is a useful pattern for “top 1 within a group” and, with rn <= N, for “top N within a group”.',
  },
  'L5-monthly-manager-rank': {
    title: 'A monthly ranking of managers',
    context: 'The head of sales works out every month which manager brought in the most money.',
    taskText:
      'For each month, rank the managers by their sales total (1 is the best in their own month).',
    hints: [
      'First roll the orders up into “manager × month” totals, and only then rank them.',
      'The window is split by month: PARTITION BY month ORDER BY monthly_sales DESC.',
      "Skeleton: WITH monthly AS (SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS month, e.first_name, SUM(o.amount) AS monthly_sales FROM orders o JOIN employees e ON ... GROUP BY 1, 2) SELECT ..., ROW_NUMBER() OVER (PARTITION BY month ORDER BY monthly_sales DESC) AS sales_rank FROM monthly;",
    ],
    explanation:
      'The two-stage construction “aggregate first, rank second” comes up often. The window function needs to work over the manager-by-month totals, not over individual orders. The first step reduces the data to one row per manager and month; the second ranks those rows within each month.',
  },
  'L5-salary-quartiles': {
    title: 'Salaries by quarters',
    context:
      'HR is preparing a compensation overview and wants to split all the employees into four roughly equal groups by salary.',
    taskText:
      'Split the employees into four roughly equal groups by salary, from the highest to the lowest, and show the group number for each.',
    hints: [
      'The groups are set not by the salary value but by a person’s place in the ordered list.',
      'NTILE(n) divides the rows of the window into n parts of roughly equal size.',
      'Skeleton: SELECT first_name, salary, NTILE(4) OVER (ORDER BY salary DESC) AS quartile FROM employees;',
    ],
    explanation:
      'NTILE divides the rows rather than the range of salary values: each group contains roughly the same number of employees, even if the salary values within a group vary considerably. Twelve employees split into four groups of exactly three. The group sizes differ by at most one. When the rows cannot be divided evenly, the earlier groups receive the extra rows.',
  },
  'L5-moving-average': {
    title: 'Smoothed ticket dynamics',
    context:
      'An analyst is building a chart and wants to smooth out individual order fluctuations while keeping the trend.',
    taskText:
      'For each order in chronological order, show its amount and the average amount over the current and the two previous orders, rounded to two digits.',
    hints: [
      'The average has to be computed not from the beginning of the history but over three neighbouring rows only.',
      'How many rows the window takes is set by the frame ROWS BETWEEN ... AND ...',
      'Skeleton: SELECT order_date, amount, ROUND(AVG(amount) OVER (ORDER BY order_date, order_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'The window frame specifies exactly which rows the aggregate uses for each calculation. Here, ROWS BETWEEN 2 PRECEDING AND CURRENT ROW gives a three-row moving average once three rows are available. In the first two rows the frame is shorter because there are not yet two previous rows. The extra column in ORDER BY resolves ties between equal dates and makes the sequence deterministic.',
  },
  'L5-daily-customer-spend': {
    title: 'A customer’s spending accumulated day by day',
    context:
      'Product analytics is building a cohort report: how the spending of each customer grows from purchase to purchase.',
    taskText:
      'For each order, show the customer name, the date, the amount, their spending accumulated up to and including this moment, and the amount of their previous order.',
    hints: [
      'Both window functions work over one window: separately for each customer, in date order.',
      'The accumulation is SUM(...) OVER (PARTITION BY ... ORDER BY ...), and the previous value is LAG over the same window.',
      'Skeleton: WITH customer_orders AS (SELECT c.name, o.customer_id, o.order_id, o.order_date, o.amount FROM orders o JOIN customers c ON ...) SELECT name, order_date, amount, SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS running_spend, LAG(amount) OVER (...) AS prev_amount FROM customer_orders;',
    ],
    explanation:
      'This combines several window functions with a CTE that prepares the data. Both calculations use the same customer-and-date ordering: SUM builds the accumulated spend, while LAG retrieves the previous order amount. If several window expressions use the same definition, a WINDOW clause can also be used to name that definition and avoid repeating it.',
  },
  'L5-top-two-per-manager': {
    title: 'The two largest deals of each manager',
    context:
      'The head of the department is preparing quarterly awards and wants to see the two best deals of every salesperson.',
    taskText:
      'For each manager, show their two largest orders. If there is only one order, show that one.',
    hints: [
      'This is “top N inside a group”: first number the orders of each manager by amount, then keep the first two.',
      'A window function cannot be used in the WHERE of the same query — move it into a CTE.',
      'Skeleton: WITH ranked AS (SELECT manager_id, order_id, amount, ROW_NUMBER() OVER (PARTITION BY manager_id ORDER BY amount DESC) AS rn FROM orders) SELECT manager_id, order_id, amount FROM ranked WHERE rn <= 2;',
    ],
    explanation:
      'A common pattern for “top N within a group” is to number the rows with a window function and then filter that number in an outer query. Here ROW_NUMBER gives each manager’s orders a separate position, so a manager with only one order naturally contributes one row — which is why there are seven rows rather than eight. If equal amounts should share a position and all tied orders should be included, RANK or DENSE_RANK may be more appropriate than ROW_NUMBER.',
  },
};
