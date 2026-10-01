// Англійський текст завдань рівня 2 (групування й агрегація).
//
// «Порахуй» перекладається двома різними словами: Count там, де йдеться про
// кількість рядків, і Calculate там, де про суму, середнє чи вартість. Дивитися
// треба в referenceSql, а не в українське слово.
export default {
  'L2-count-by-category': {
    title: 'How many products are in each category',
    context: 'A category manager is judging how evenly the catalogue is filled.',
    taskText: 'Count the number of products in each category.',
    hints: [
      'The counting goes not over the whole table, but separately for each category.',
      'GROUP BY category creates a separate group for each value, and COUNT(*) counts the rows in a group.',
      'Skeleton: SELECT category, COUNT(*) AS product_count FROM products GROUP BY category;',
    ],
    explanation:
      'GROUP BY splits the rows into groups based on a column value, and an aggregate function computes one value for each group. The rule: everything in SELECT that is not inside an aggregate has to be listed in GROUP BY.',
  },
  'L2-orders-per-customer': {
    title: 'How many orders each customer has',
    context: 'A manager is segmenting the customer base by buying activity.',
    taskText: 'Count the number of orders for each customer.',
    hints: [
      'Group by whatever identifies the customer.',
      'GROUP BY customer_id gathers all the orders of one customer into a single group.',
      'Skeleton: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id;',
    ],
    explanation:
      'The same technique, but the grouping goes by a numeric identifier. Note: only customers with at least one order make it into the result — customers with no orders simply do not appear in the result.',
  },
  'L2-avg-price-by-category': {
    title: 'Average price by category',
    context: 'An analyst is comparing the price levels of different parts of the catalogue.',
    taskText: 'Calculate the average product price in each category.',
    hints: [
      'Instead of counting rows you need the average value of a column.',
      'AVG(price) computes the average inside each group.',
      'Skeleton: SELECT category, AVG(price) AS avg_price FROM products GROUP BY category;',
    ],
    explanation:
      'AVG is calculated separately within each group, just like COUNT. If GROUP BY were removed, the result would be one average across the whole catalogue — an entirely different metric.',
  },
  'L2-revenue-by-customer': {
    title: 'Revenue by customer',
    context: 'Sales want to know how much money each customer has brought in over all time.',
    taskText: 'Calculate the total amount of each customer’s orders.',
    hints: [
      'You need the sum of all order amounts within each customer group.',
      'SUM(amount) with GROUP BY customer_id gives the total for each customer.',
      'Skeleton: SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id;',
    ],
    explanation:
      'This is a simple lifetime-spend calculation: the total amount a customer has spent so far. The pattern “group by an entity, add up a metric” is the backbone of many analytical reports: revenue by region, by channel, by period.',
  },
  'L2-salary-range-by-department': {
    title: 'The salary range inside a department',
    context: 'HR is preparing a compensation review and wants to see the spread inside each unit.',
    taskText: 'For each department, show the lowest and the highest salary.',
    hints: [
      'You need the two extreme values inside each group, not across the whole table.',
      'MIN and MAX are aggregates just like COUNT: with GROUP BY they are computed separately for each group.',
      'Skeleton: SELECT department, MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM employees GROUP BY department;',
    ],
    explanation:
      'A single SELECT can hold as many aggregates as you like — they are all computed in one pass over the same groups. Note the NULL department in the result: GROUP BY gathers all NULL values into one shared group, even though in a WHERE comparison, NULL = NULL does not evaluate to TRUE. These are different comparison mechanisms, and mixing them up is a classic mistake.',
  },
  'L2-country-count': {
    title: 'How many countries are in the database',
    context:
      'Management is planning an entry into new markets and is checking in how many countries there are buyers already.',
    taskText: 'Count how many different countries are represented among the customers.',
    hints: [
      'There are more customers than countries: one country appears several times, and it is the countries that have to be counted.',
      'DISTINCT can go inside COUNT — then repeats are not taken into account.',
      'Skeleton: SELECT COUNT(DISTINCT country) AS country_count FROM customers;',
    ],
    explanation:
      'COUNT(country) would count the rows where country is not NULL, that is eight customers rather than six countries. DISTINCT inside an aggregate counts each distinct non-NULL value once — it is the same DISTINCT as in SELECT, but it acts inside a single function. Confusing “how many records” with “how many different values” is a source of inflated numbers in reports.',
  },
  'L2-second-half-revenue': {
    title: 'Customer spending from April onwards',
    context:
      'Finance is reconciling the second quarter and counts the contribution of each customer separately.',
    taskText: 'Calculate how much each customer spent on orders placed from 1 April 2024 onwards.',
    hints: [
      'First the early orders have to be dropped, and only then what is left is added up.',
      'WHERE goes before GROUP BY and filters out individual rows before the groups are formed.',
      "Skeleton: SELECT customer_id, SUM(amount) AS total_spent FROM orders WHERE order_date >= DATE '2024-04-01' GROUP BY customer_id;",
    ],
    explanation:
      "The execution order decides everything: WHERE works with individual rows before grouping, so only the orders of the period you want get into the sum. Had the same condition been put into HAVING, it would apply to ready-made groups and would make no sense at all — a group has no date of its own. Writing DATE '2024-04-01' says explicitly that this is a date, not a piece of text.",
  },
  'L2-rounded-avg-salary': {
    title: 'Average salary in round numbers',
    context:
      'A slide for management needs unit average salaries without the pennies — the fractional tails only make them harder to read.',
    taskText: 'For each department, show the average salary rounded to a whole number.',
    hints: [
      'The average is computed as usual, but it has to be shown without the fractional part.',
      'ROUND(expression, number_of_digits) rounds the result; zero digits gives a whole number.',
      'Skeleton: SELECT department, ROUND(AVG(salary), 0) AS avg_salary FROM employees GROUP BY department;',
    ],
    explanation:
      'ROUND wraps the already computed average rather than the individual salaries — rounding first and averaging afterwards would produce a different result and can introduce rounding error. The second argument of ROUND sets the number of digits. ROUND(x) also gives a whole number, but specifying zero makes the intended precision explicit.',
  },
  'L2-catalog-size': {
    title: 'The size of the range',
    context: 'A manager asks for one figure: how many items there are in the catalogue at all.',
    taskText: 'Count the total number of products.',
    hints: [
      'What you need is not the table itself but one number — how many rows it has.',
      'COUNT(*) counts every row, and AS gives the result a clear name.',
      'Skeleton: SELECT COUNT(*) AS total_products FROM products;',
    ],
    explanation:
      'An aggregate function without GROUP BY squeezes the whole table into one row — that is, the entire table counts as a single group. COUNT(*) counts rows regardless of their contents; if you write COUNT(column), rows with NULL in that column are left out — a difference people stumble over often.',
  },
  'L2-total-revenue': {
    title: 'Total revenue',
    context: 'The finance director wants one bottom-line sales figure for the whole period.',
    taskText: 'Calculate the sum of all orders.',
    hints: [
      'The values of one column have to be added up across all the rows.',
      'SUM(amount) adds a column up; do not forget the alias with AS.',
      'Skeleton: SELECT SUM(amount) AS total_revenue FROM orders;',
    ],
    explanation:
      'SUM adds up the non-NULL values of a column across all the rows that passed the WHERE filter. It simply ignores NULL values rather than turning them into zeros — which is why a sum over a column with gaps may turn out smaller than you expect.',
  },
  'L2-premium-categories': {
    title: 'Categories with an expensive range',
    context:
      'Management is looking for premium directions: categories with an average price above 100.',
    taskText: 'Show the categories in which the average product price is above 100.',
    hints: [
      'What has to be filtered is the already computed average, not the individual prices.',
      'WHERE works before aggregation, HAVING after it. HAVING is what you need here.',
      'Skeleton: SELECT category, AVG(price) AS avg_price FROM products GROUP BY category HAVING AVG(price) > 100;',
    ],
    explanation:
      'The logical processing order is: WHERE drops rows → GROUP BY builds the groups → HAVING filters the finished groups. That is why a condition on AVG cannot go into WHERE: the average is calculated at the grouping stage, after WHERE has already filtered the rows.',
  },
  'L2-frequent-customers': {
    title: 'Customers who buy regularly',
    context: 'The loyalty programme starts with those who already have four or more orders.',
    taskText: 'Show the customers with four or more orders and the number of their orders.',
    hints: [
      'First count the orders of each customer, then drop those who have few.',
      'The condition applies to the result of COUNT(*), which means it goes into HAVING.',
      'Skeleton: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4;',
    ],
    explanation:
      'HAVING filters groups by their aggregates. In PostgreSQL, you cannot refer to a SELECT alias inside HAVING, so the aggregate expression has to be written again.',
  },
  'L2-top-categories-by-value': {
    title: 'The three most valuable categories in the warehouse',
    context:
      'Before the inventory count the warehouse manager wants to know which directions have the most money frozen in them.',
    taskText:
      'Calculate the value of the stock of each category as the sum of price × stock and show the three largest.',
    hints: [
      'First compute the total for each category, then line the categories up by that total and take the start of the list.',
      'ORDER BY may refer to an alias given in SELECT, and LIMIT keeps only the first rows of an already ordered result.',
      'Skeleton: SELECT category, SUM(price * stock) AS stock_value FROM products GROUP BY category ORDER BY stock_value DESC LIMIT 3;',
    ],
    explanation:
      'An alias from SELECT can be used in ORDER BY, because sorting happens after the result columns have been computed. In HAVING it cannot: HAVING runs earlier, so the aggregate has to be written again there. This asymmetry is what confuses people most often. Note also that the multiplication sits inside SUM: SUM(price) * SUM(stock) would give an entirely different number.',
  },
  'L2-big-and-pricey': {
    title: 'Big and expensive categories',
    context:
      'A separate premium catalogue takes the directions where the range is wide and the average ticket is high.',
    taskText:
      'Show the categories where the average price is above 100 and there are more than 5 products at the same time.',
    hints: [
      'There are two conditions, and both apply to a group rather than to an individual row.',
      'HAVING can combine several aggregate conditions with AND.',
      'Skeleton: SELECT category, COUNT(*) AS product_count, AVG(price) AS avg_price FROM products GROUP BY category HAVING AVG(price) > 100 AND COUNT(*) > 5;',
    ],
    explanation:
      'The closing task of the level: HAVING can combine multiple conditions, including conditions on different aggregate expressions. The data is picked to test understanding: there are categories with a high average price but few items — and the second condition is exactly what has to filter them out.',
  },
  'L2-loyal-and-valuable': {
    title: 'Steady customer–manager pairs',
    context:
      'The head of sales is looking for relationships that already work: the customer comes back to this very manager and leaves noticeable amounts.',
    taskText:
      'Find the customer–manager pairs that have gathered at least two orders with a total amount above 300. Show the number of orders and the amount.',
    hints: [
      'The group is formed not by the customer or the manager alone, but by their combination.',
      'GROUP BY takes several columns separated by commas, and in HAVING the conditions are joined with AND.',
      'Skeleton: SELECT customer_id, manager_id, COUNT(*) AS order_count, SUM(amount) AS total_spent FROM orders GROUP BY customer_id, manager_id HAVING COUNT(*) >= 2 AND SUM(amount) > 300;',
    ],
    explanation:
      'The closing task of the level: GROUP BY over two columns creates a group for every combination of values that actually occurs, not separate groups for each column. That is why one customer can land in several result rows — one per manager they worked with. And here is where the classic misreading of such reports hides: the total_spent column represents spending for one customer–manager pair, not the customer’s total revenue.',
  },
};
