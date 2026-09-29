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
      'The main difference between window functions and GROUP BY: they do not collapse rows. The OVER (...) construction describes a “window” — the set of rows the function works within. Here the window covers the whole table, and ORDER BY sets the numbering order.',
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
      'RANK gives the same place to equal values and then “jumps over” numbers: after two second places comes the fourth. If the gaps are unwanted, DENSE_RANK is taken. Three functions — ROW_NUMBER, RANK, DENSE_RANK — solve three different problems, and mixing them up is not a good idea.',
  },

  'L5-department-payroll': {
    title: 'The payroll of one’s own department',
    context: 'Finance wants to see the total budget of a unit next to every employee in it.',
    taskText: 'For each employee, show their salary and the total payroll of their department.',
    hints: [
      'The sum is computed by department, but every employee has to stay a separate row.',
      'PARTITION BY splits the window into groups: SUM(salary) OVER (PARTITION BY department).',
      'Skeleton: SELECT first_name, department, salary, SUM(salary) OVER (PARTITION BY department) AS department_total FROM employees;',
    ],
    explanation:
      'PARTITION BY is the analogue of GROUP BY inside a window, but without collapsing rows. GROUP BY cannot achieve this: it would leave one row per department and destroy the data about individual people. That is exactly why “a value next to the total of its group” is a job for window functions.',
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
      'Any aggregate function — SUM, AVG, COUNT, MIN, MAX — becomes a window function the moment you add OVER. Comparing a row value with the aggregate of its group in one query is exactly what window functions were invented for.',
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
      'LAG gives access to the previous row of the window. PARTITION BY is critical here: without it the function would take the order date of an entirely different customer. The first row of every window has no predecessor, so LAG returns NULL.',
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
      'LAG and LEAD are a pair for working with neighbouring rows. Intervals between events are built on their difference: the time to the next purchase, the time since the previous login, the duration between funnel stages.',
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
      'The difference shows up only on ties, and the data has them: two products cost 210, and two more cost 89. After a pair of equal values RANK skips a number (1, 2, 2, 4) and DENSE_RANK does not (1, 2, 2, 3). Choose deliberately: RANK honestly says “there is no third place, because two shared the second”, while DENSE_RANK is handier when the number is needed as a level label rather than as a position in a race.',
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
      'The whole point of FIRST_VALUE is in the sorting inside OVER: it decides which row counts as the first, so ORDER BY amount DESC turns “the first” into “the largest”. MAX(amount) with GROUP BY would give the same number but would destroy the individual orders — one row per customer would be left. A window function does the opposite: it computes over the group and leaves the rows in place.',
  },

  'L5-running-revenue': {
    title: 'Cumulative revenue',
    context:
      'An analyst is building a cumulative revenue chart to show the progress towards the annual target.',
    taskText:
      'Show every order together with the running total of all the orders from the earliest to the current one.',
    hints: [
      'The sum has to accumulate along the rows in a certain order rather than be computed once for the whole table.',
      'An aggregate function with OVER (ORDER BY ...) turns into a cumulative one.',
      'Skeleton: SELECT order_date, amount, SUM(amount) OVER (ORDER BY order_date, order_id) AS running_total FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'SUM() OVER (ORDER BY ...) without PARTITION BY computes a running total: for every row it adds up all the previous ones plus the current. The extra column in ORDER BY resolves the ties between equal dates — without it the order, and therefore the accumulated sum, become unpredictable.',
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
      'Window functions are computed after WHERE, so filtering by them at the same query level is impossible. A CTE moves the computation into a separate step — and that is the universal solution for a whole class of “the last, the largest, the first within a group” problems.',
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
      'The two-stage construction “aggregate first, rank second” comes up all the time. The order is essential: the window function has to work over the totals rather than over individual orders — otherwise the rank would be computed for every single receipt.',
  },

  'L5-salary-quartiles': {
    title: 'Salaries by quarters',
    context:
      'HR is preparing a compensation overview and wants to split all the employees into four equal groups by salary.',
    taskText:
      'Split the employees into four equal groups by salary, from the highest to the lowest, and show the group number for each.',
    hints: [
      'The groups are set not by the salary value but by a person’s place in the ordered list.',
      'NTILE(n) divides the rows of the window into n parts of roughly equal size.',
      'Skeleton: SELECT first_name, salary, NTILE(4) OVER (ORDER BY salary DESC) AS quartile FROM employees;',
    ],
    explanation:
      'NTILE divides the rows rather than the range of values: every quarter holds roughly the same number of people, even if the salaries inside them differ a lot. Twelve employees split into four groups of exactly three; had there been thirteen, the extra row would go to the first group rather than the last — the group sizes differ by at most one, and the surplus always goes to the beginning.',
  },

  'L5-moving-average': {
    title: 'Smoothed ticket dynamics',
    context:
      'An analyst is building a chart and wants to remove the jumps of individual orders from it, keeping the trend.',
    taskText:
      'For each order in chronological order, show its amount and the average amount over the current and the two previous orders, rounded to two digits.',
    hints: [
      'The average has to be computed not from the beginning of the history but over three neighbouring rows only.',
      'How many rows the window takes is set by the frame ROWS BETWEEN ... AND ...',
      'Skeleton: SELECT order_date, amount, ROUND(AVG(amount) OVER (ORDER BY order_date, order_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'The window frame is the answer to the question “over which rows exactly to compute”. Without ROWS BETWEEN an aggregate with ORDER BY takes every row from the beginning to the current one, that is, gives a cumulative average rather than a moving one. In the first two rows the frame is shorter, because there simply are no previous rows — that is not an error but a normal edge of the series. The extra column in ORDER BY resolves the ties between equal dates and makes the result reproducible.',
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
      'The closing task of the course: several window functions over one window plus a CTE to prepare the data. This is exactly how cohort metrics are computed — accumulated income, LTV over time, the step to the next purchase. Note that both functions describe the same window: when there are many such expressions, it is moved into a separate WINDOW block to avoid repetition.',
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
      'A universal technique for a whole class of “the first N within a group” problems: number with a window and then filter the number over the finished result. It cannot be done straight in WHERE, because window functions are computed after WHERE — hence the CTE. Note that there are seven rows rather than eight: one manager has only one order, and ROW_NUMBER does not invent a second. A “top 2” of a one-element group honestly gives one row.',
  },
};
