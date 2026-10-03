// Англійський текст завдань рівня 3 (об'єднання таблиць).
//
// Назви видів з'єднання не перекладаються й пишуться великими літерами так
// само, як у джерелі: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN,
// CROSS JOIN. Саме за ними тест звіряє, що набір конструкцій не змінився.
export default {
  'L3-orders-with-names': {
    title: 'Orders with customer names',
    context: 'Support wants to see the customer’s name next to the order number.',
    taskText: 'Show the order number, the customer name and the amount.',
    hints: [
      'You need data from two tables, so they have to be joined on a shared column.',
      'The shared column is customer_id. The syntax: JOIN other_table ON condition.',
      'Skeleton: SELECT o.order_id, c.name, o.amount FROM orders o JOIN customers c ON c.customer_id = o.customer_id;',
    ],
    explanation:
      'INNER JOIN matches rows from two tables using the condition in ON and keeps only the pairs where a match is found. The aliases o and c shorten the query and remove ambiguity when both tables have columns with the same name.',
  },
  'L3-items-with-products': {
    title: 'Order lines with product names',
    context:
      'A stock keeper is picking an order and sees only product_id in the system instead of names.',
    taskText: 'Show the order number, the product name and the quantity.',
    hints: [
      'The product name lives in products, and the quantity in order_items.',
      'Join the tables on product_id.',
      'Skeleton: SELECT oi.order_id, p.product_name, oi.quantity FROM order_items oi JOIN products p ON p.product_id = oi.product_id;',
    ],
    explanation:
      'A classic “facts plus reference book” pair: order_items stores the sales events, while products stores the descriptions. JOIN brings human-readable names together with technical identifiers. This is how many schemas are structured: transactional data is kept separate from reference data.',
  },
  'L3-all-customers-orders': {
    title: 'All customers and their orders',
    context:
      'An analyst is preparing a full slice of the database: even customers who have bought nothing yet have to stay on the list.',
    taskText:
      'Show all the customers together with the numbers of their orders. Customers without orders have to be in the result too.',
    hints: [
      'INNER JOIN would throw the customers without orders away — a different join is needed.',
      'LEFT JOIN keeps every row of the left table; where there is no pair, there will be NULL.',
      'Skeleton: SELECT c.name, o.order_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;',
    ],
    explanation:
      'LEFT JOIN keeps all the rows of the left table regardless of whether a match is found on the right. The order of the tables is decisive here: customers has to be on the left, otherwise the “keep everyone” rule would apply to the wrong table.',
  },
  'L3-never-sold': {
    title: 'Products that were never bought',
    context: 'Purchasing is reviewing the range and looking for items without a single sale.',
    taskText: 'Show the products that are not in any order.',
    hints: [
      'First keep all the products, then leave only those for which no pair was found.',
      'After a LEFT JOIN the unmatched rows have NULL in the columns of the right table — that is what we filter by.',
      'Skeleton: SELECT p.product_name, p.category FROM products p LEFT JOIN order_items oi ON ... WHERE oi.order_item_id IS NULL;',
    ],
    explanation:
      'The anti-join pattern: LEFT JOIN plus WHERE ... IS NULL. Recognise it by words such as “never”, “not once” and “missing from”. The check has to go through IS NULL — a comparison with = NULL does not evaluate to TRUE.',
  },
  'L3-join-using': {
    title: 'A shorter way to write a join',
    context: 'An analyst is rewriting a long query and wants to drop the extra noise from it.',
    taskText:
      'Show the order number, the customer name and the amount, joining the tables through USING.',
    hints: [
      'The linking column has the same name in both tables, so writing the equality of two identical names is not required.',
      'USING (column) replaces ON when the column name is the same in both tables.',
      'Skeleton: SELECT order_id, name, amount FROM orders JOIN customers USING (customer_id);',
    ],
    explanation:
      'USING works when the join column has the same name on both sides. Unlike ON, it returns the shared column once rather than keeping a separate copy for each table — which is why you cannot write o.customer_id after USING. It is both a convenience and a limitation: when the join columns have different names, you need ON.',
  },
  'L3-orders-from-customer-side': {
    title: 'The same join from the other side',
    context:
      'An analyst has inherited a query where orders comes first, but the report has to keep every customer.',
    taskText:
      'Show all the customers and the numbers of their orders, putting orders as the first table in FROM. Customers without orders have to stay in the result.',
    hints: [
      'The rows to keep belong to the table that comes second, not first.',
      'RIGHT JOIN keeps every row of the right table — a mirror image of LEFT JOIN.',
      'Skeleton: SELECT c.name, o.order_id FROM orders o RIGHT JOIN customers c ON c.customer_id = o.customer_id;',
    ],
    explanation:
      'The result here is exactly the same as in the task “All customers and their orders”: RIGHT JOIN is equivalent to a LEFT JOIN with the table order reversed. That is precisely why RIGHT JOIN is less common in practice: when a query has several joins, keeping the table you want to preserve on the left can make the query easier to read.',
  },
  'L3-manager-subordinate': {
    title: 'Who reports to whom',
    context:
      'HR is building the reporting chart and wants to see “employee — their manager” pairs.',
    taskText:
      'Show the name of every employee next to the name of their manager. Those without a manager do not need to be shown.',
    hints: [
      'Both the subordinate and the manager live in the same table, just in different rows.',
      'A table can be joined to itself by giving it two different aliases.',
      'Skeleton: SELECT e.first_name AS employee, m.first_name AS manager FROM employees e JOIN employees m ON m.employee_id = e.manager_id;',
    ],
    explanation:
      'In a self-join the aliases stop being a convenience and become a necessity: without them, employees.employee_id would not make it clear which copy of the table is meant. Note that INNER JOIN drops the top managers because their manager_id is NULL, so no matching manager row is found for them. If they had to be kept, a LEFT JOIN would be needed.',
  },
  'L3-orders-per-customer-join': {
    title: 'How many orders everyone has, zero included',
    context:
      'Marketing is segmenting the base and is separately interested in those who have bought nothing yet.',
    taskText:
      'For each customer, show the number of their orders. Customers without orders have to show 0.',
    hints: [
      'First we keep every customer, then we count — but what has to be counted is orders, not rows.',
      'After a LEFT JOIN a customer without orders still has a row, just with NULL values on the right.',
      'Skeleton: SELECT c.name, COUNT(o.order_id) AS order_count FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.name;',
    ],
    explanation:
      'Here hides the most common mistake in the LEFT JOIN plus COUNT pattern: COUNT(*) would give a customer without orders a one, because the row after the join still exists — it simply has NULL values on the right. COUNT(o.order_id) counts only non-NULL values and therefore correctly returns zero. We group by customer_id together with the name because two customers could in theory have the same name.',
  },
  'L3-order-contents': {
    title: 'What is inside each order',
    context:
      'A stock keeper is printing picking sheets: the system has only codes, and the warehouse needs names.',
    taskText:
      'Show the number and the date of the order together with the product name and quantity.',
    hints: [
      'An order does not know which products are in it — a third table stands between them.',
      'Joins are put in a chain: first from the order to its lines, then from a line to the product reference book.',
      'Skeleton: SELECT o.order_id, o.order_date, p.product_name, oi.quantity FROM orders o JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'order_items is a link table: it exists precisely because one order can contain many products and one product can appear in many orders. There is no direct link between orders and products, so two joins in a row are needed. There are more rows in the result than orders — that is not an error but the nature of a one-to-many relationship.',
  },
  'L3-country-category-grid': {
    title: 'A “country × category” grid',
    context:
      'An analyst is preparing the frame of a market coverage report: the table has to contain every cell, even the empty ones.',
    taskText:
      'Build every possible “customer country — product category” pair, even if such sales never happened. Each pair has to appear once.',
    hints: [
      'There is nothing to match here: you simply need every combination of one list with the other.',
      'CROSS JOIN joins every row with every row and has no ON condition.',
      'Skeleton: SELECT DISTINCT c.country, p.category FROM customers c CROSS JOIN products p;',
    ],
    explanation:
      'CROSS JOIN deliberately builds a Cartesian product: every customer row is paired with every product row. DISTINCT then removes duplicate country–category pairs caused by repeated countries and categories in the source tables. This is useful when you need a complete grid of possible combinations, including combinations for which there are currently no sales. It is also the pattern you get accidentally when a regular JOIN is missing its ON condition. In that case, the number of rows can grow dramatically, so a sudden explosion in row count is often a sign that a join condition is missing.',
  },
  'L3-revenue-by-country': {
    title: 'Revenue by country',
    context:
      'Management is deciding which markets to invest in and looks at revenue broken down by country.',
    taskText: 'Calculate the total revenue for each country.',
    hints: [
      'The country lives in one table and the amounts in another, so a JOIN comes first.',
      'After the join, group by the column from customers and sum the column from orders.',
      'Skeleton: SELECT c.country, SUM(o.amount) AS total_revenue FROM orders o JOIN customers c ON ... GROUP BY c.country;',
    ],
    explanation:
      'JOIN and GROUP BY pair up beautifully: the joined set of rows is built first, and then it is grouped. Since INNER JOIN is used, countries with no matching orders will not make it into the report — which is exactly what was wanted here.',
  },
  'L3-revenue-by-category': {
    title: 'Revenue by category',
    context:
      'A category manager wants to see the money rather than the number of sales, broken down by direction.',
    taskText: 'Calculate the revenue of each category as the sum of quantity × price.',
    hints: [
      'The quantity lives in order_items and the price in products, so a JOIN comes first.',
      'The multiplication has to be inside SUM: SUM(oi.quantity * p.price).',
      'Skeleton: SELECT p.category, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... GROUP BY p.category;',
    ],
    explanation:
      'An expression inside an aggregate function is computed for each row separately, and only then are the results added up. SUM(quantity) * price would be a different calculation: it would multiply the total quantity by one price value rather than calculating quantity × price for each order line before summing. In fact, PostgreSQL would not even run that query: price would have to appear in GROUP BY or inside an aggregate.',
  },
  'L3-customer-purchases': {
    title: 'What exactly the customer bought',
    context:
      'Support is working through a ticket and wants to see the whole chain: customer, order, product.',
    taskText: 'Show which customer bought which product in which order, and in what quantity.',
    hints: [
      'The data is scattered across four tables, and each pair is joined by its own key.',
      'Joins are put in a chain: orders → customers, orders → order_items, order_items → products.',
      'Skeleton: SELECT ... FROM orders o JOIN customers c ON ... JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'Joins are built one after another: the result of the previous join becomes the input for the next join. Walking a normalised schema like this is common analyst work, because in real databases the data is often deliberately split across separate entities.',
  },
  'L3-managers-and-orders': {
    title: 'Nobody got lost',
    context:
      'Before the audit a slice is needed that shows both employees without sales and orders nobody is left to answer for.',
    taskText:
      'Bring employees and orders together so that the result keeps both the employees who ran no orders and the orders that have no existing employee assigned to them.',
    hints: [
      'The unmatched rows have to be kept from both sides at once, not from one of them.',
      'FULL JOIN keeps every row from both tables: matched rows are combined, and unmatched rows are kept with NULLs on the other side — in other words, everything a LEFT JOIN would keep plus everything a RIGHT JOIN would keep.',
      'Skeleton: SELECT e.first_name, o.order_id, o.amount FROM employees e FULL JOIN orders o ON e.employee_id = o.manager_id;',
    ],
    explanation:
      'FULL OUTER JOIN keeps unmatched rows from both sides. Here that means an employee with no matching order still appears, and an order whose manager_id has no matching employee also appears. In the latter case, the employee columns are NULL; in the former, the order columns are NULL. This makes FULL JOIN useful for finding unmatched records on both sides of a relationship.',
  },
  'L3-department-pairs': {
    title: 'Pairs of colleagues from one department',
    context:
      'For a peer learning programme they are putting together pairs of people who work in the same unit.',
    taskText:
      'Build a list of pairs of employees who work in the same department. Each pair has to appear only once, and a person cannot be paired with themselves.',
    hints: [
      'The table is joined to itself again, but this time the condition also has to filter out the extra repeats.',
      'Comparing the identifiers with “greater than” leaves only one variant of each pair.',
      'Skeleton: SELECT a.first_name AS employee_a, b.first_name AS employee_b, a.department FROM employees a JOIN employees b ON b.department = a.department AND b.employee_id > a.employee_id;',
    ],
    explanation:
      'The condition b.employee_id > a.employee_id does two things at once: it removes the pair of a person with themselves and drops the mirror duplicate. Had it been <>, every pair would appear twice — once in the direct and once in the reverse order. The second detail: an employee without a department does not make it into the result, because NULL = NULL evaluates to UNKNOWN rather than TRUE, so the join condition is not satisfied.',
  },
  'L3-big-orders-kept-customers': {
    title: 'Big orders, but all the customers',
    context:
      'A manager wants to see the full list of customers with only their large purchases beside them, so that those without any stand out at once.',
    taskText:
      'Show all the customers together with their orders above 200. A customer who has no such orders still has to stay in the result.',
    hints: [
      'The condition on the amount has to limit what is attached, not what stays in the result.',
      'One more condition can be added to ON with AND — it works during the join.',
      'Skeleton: SELECT c.name, o.order_id, o.amount FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.amount > 200;',
    ],
    explanation:
      'This difference is one of the most important in the topic of joins. A condition in ON is applied as part of the join: unmatched rows of the left table are kept anyway, simply with NULL values on the right. The same condition in WHERE is applied after the join and removes those rows, because NULL > 200 does not evaluate to TRUE. In this case, that makes the result behave like an INNER JOIN with respect to that condition. If rows suddenly disappear after a LEFT JOIN, the first thing to look for is a condition on the right table in WHERE.',
  },
  'L3-affordable-for-order': {
    title: 'What could have been upsold to the receipt',
    context:
      'Sales are looking for upsell ideas: for every receipt they want to see products of roughly the same value.',
    taskText:
      'For each order, pick the products whose price is between 80 and 100 per cent of its amount.',
    hints: [
      'Orders and products share no common key — it is the price condition itself that matches them.',
      'ON can hold a condition that determines whether a pair matches, including a range expressed with BETWEEN.',
      'Skeleton: SELECT o.order_id, o.amount, p.product_name, p.price FROM orders o JOIN products p ON p.price BETWEEN o.amount * 0.8 AND o.amount;',
    ],
    explanation:
      'ON does not have to contain an equality between keys — it can contain a range or another join condition. Range joins can be more expensive than simple equality joins, especially on large tables, because matching pairs may require more work. Note also that orders without a suitable product do not make it into the result: this is an INNER JOIN.',
  },
  'L3-diverse-buyers': {
    title: 'Customers with broad tastes',
    context:
      'Marketing is preparing cross-sales and looking for buyers who have already taken products from at least three different categories.',
    taskText:
      'Show the customers who bought products from three or more different categories, and the number of those categories.',
    hints: [
      'To get from a customer to a product category you have to walk through four tables.',
      'What has to be counted is not the rows but the different categories: COUNT(DISTINCT p.category).',
      'Skeleton: SELECT c.name, COUNT(DISTINCT p.category) AS category_count FROM customers c JOIN orders o ON ... JOIN order_items oi ON ... JOIN products p ON ... GROUP BY c.customer_id, c.name HAVING COUNT(DISTINCT p.category) >= 3;',
    ],
    explanation:
      'The closing task of the level brings everything together: a multi-table JOIN, grouping, DISTINCT inside an aggregate and a filter on it. The key detail is DISTINCT: a plain COUNT would count joined rows, so a customer who bought from the same category five times could be counted five times instead of once for that category.',
  },
  'L3-active-countries': {
    title: 'Markets where demand already exists',
    context:
      'Before splitting the budget, management picks the countries where sales are no longer one-offs.',
    taskText:
      'Show the countries from which at least four orders came, together with the number of orders and the total revenue.',
    hints: [
      'The country lives in one table and the orders in another, and what has to be filtered out are the totals, not the individual rows.',
      'First JOIN, then GROUP BY on the country, and only then HAVING on the counter you computed.',
      'Skeleton: SELECT c.country, COUNT(o.order_id) AS order_count, SUM(o.amount) AS revenue FROM customers c JOIN orders o ON ... GROUP BY c.country HAVING COUNT(o.order_id) >= 4;',
    ],
    explanation:
      'Follow the whole pipeline: JOIN builds the joined set of rows, GROUP BY groups it by country, and HAVING filters the finished groups. A country with customers but no orders does not appear because INNER JOIN removes unmatched customers before grouping. If the task demanded showing countries with zero orders too, a LEFT JOIN would be required — and then HAVING would still exclude those zero-order countries because they do not pass the “at least four” condition.',
  },
  'L3-category-reach': {
    title: 'Reach and money by category',
    context:
      'A category manager is comparing two numbers: whether many people buy a direction and how much it brings in.',
    taskText:
      'For each category, count how many different customers bought products from it and how much money it brought in.',
    hints: [
      'To get from an order line to the customer you have to walk through four tables, and the result holds two numbers.',
      'One aggregate has to see every row separately, and the other, on the contrary, has to collapse the repeats.',
      'Skeleton: SELECT p.category, COUNT(DISTINCT c.customer_id) AS buyer_count, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... JOIN orders o ON ... JOIN customers c ON ... GROUP BY p.category;',
    ],
    explanation:
      'The closing task of the level: two aggregates are computed over the same joined set of rows, yet they behave in different ways. SUM has to see every order line separately, otherwise the revenue will be incomplete; COUNT(DISTINCT …), on the contrary, has to collapse repeated customer IDs, otherwise “the number of customers” turns into “the number of joined rows”. That is exactly why DISTINCT goes inside a particular aggregate and not next to SELECT: there it would change the whole result row.',
  },
};
