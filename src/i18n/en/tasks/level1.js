// Англійський текст завдань рівня 1, ключований id завдання.
//
// Перекладено з відкритим referenceSql перед очима: умова мусить описувати саме
// те, що віддає запит. Набір SQL-конструкцій у тексті той самий, що в
// українському джерелі, — за цим стежить verifyTasks.mjs, бо перекладений
// GROUP BY прогін еталонного запиту не зловить.
export default {
  'L1-all-customers': {
    title: 'The full customer list',
    context:
      'A new manager is getting to know the database and wants to see the full customer list.',
    taskText: 'Show every column and every row in the customers table.',
    hints: [
      'You need all the columns — listing them one by one is not required.',
      'The asterisk * in SELECT means “every column of the table”.',
      'Skeleton: SELECT * FROM customers;',
    ],
    explanation:
      'SELECT * is handy when you need a quick look at a table. In production queries, it is usually better to list the columns you need explicitly: * can return data you do not need, and adding a new column to the table can unexpectedly change the result.',
  },
  'L1-product-prices': {
    title: 'Just product names and prices',
    context:
      "A printed price list only needs product names and prices. The other fields aren't needed on paper.",
    taskText: 'Show the name and price of every product.',
    hints: [
      'Instead of all the columns, you need only two specific ones.',
      'List the columns you need, separated by commas, right after SELECT.',
      'Skeleton: SELECT product_name, price FROM products;',
    ],
    explanation:
      'Listing columns explicitly is the norm for production queries: you get exactly the data you asked for, and the result will not change just because new columns are added to the table. The order of columns in SELECT determines their order in the result.',
  },
  'L1-departments': {
    title: 'Which departments does the company have?',
    context:
      'A new HR manager is mapping the company structure and starts with a list of its departments.',
    taskText: 'Show the list of unique departments, without duplicates.',
    hints: [
      'The department repeats for every employee, but the list you need has no duplicates.',
      'DISTINCT removes duplicate result rows, keeping one occurrence of each distinct row.',
      'Skeleton: SELECT DISTINCT department FROM employees;',
    ],
    explanation:
      'Notice the NULL in the result: one employee has no department. DISTINCT keeps a single NULL in the result because duplicate NULL values are treated as duplicates for DISTINCT. This is different from ordinary comparisons in WHERE, where NULL = NULL does not evaluate to true. Also remember that DISTINCT works on the whole result row, not on one column independently. So SELECT DISTINCT department, salary would return each distinct department-and-salary combination.',
  },
  'L1-top-managers': {
    title: 'Who reports to nobody?',
    context:
      'HR is putting together a list of top-level managers for an invitation to a strategy session.',
    taskText: 'Show the first and last names of employees who have no manager.',
    hints: [
      'A missing manager is stored in the table not as a zero and not as an empty string, but as the special NULL value.',
      'A NULL value is checked with IS NULL, not with an equals sign.',
      'Skeleton: SELECT first_name, last_name FROM employees WHERE manager_id IS NULL;',
    ],
    explanation:
      'NULL represents the absence of a value. Comparisons involving NULL do not evaluate to true or false; they evaluate to UNKNOWN. That is why manager_id = NULL does not match rows, while manager_id IS NULL correctly checks for a missing value.',
  },
  'L1-category-filter': {
    title: 'Products from one category',
    context: 'A category manager is reviewing the electronics range before a seasonal promotion.',
    taskText: "Show the products in the 'Electronics' category.",
    hints: [
      'You need not every row, but only those that match a condition.',
      "WHERE filters rows. Text values go in single quotes: category = 'Electronics'.",
      "Skeleton: SELECT product_name, price FROM products WHERE category = '...';",
    ],
    explanation:
      "WHERE filters rows before the final result is returned. Equality is the simplest kind of filter. In PostgreSQL, ordinary text comparison is case-sensitive, so 'Electronics' and 'electronics' are different values.",
  },
  'L1-low-stock': {
    title: 'Products running low in the warehouse',
    context: 'A buyer checks every week which items need to be reordered.',
    taskText: 'Show the products whose stock is below 20.',
    hints: [
      'The condition compares a number with a number.',
      'The < operator checks “less than”. Numbers are not quoted.',
      'Skeleton: SELECT product_name, stock FROM products WHERE stock < 20;',
    ],
    explanation:
      "The comparison operators >, <, >=, <=, = and <> work in WHERE as you would expect from mathematics. Write numbers without quotes. PostgreSQL will quietly convert stock < '20' to a number and the query still works, but only because '20' has no type of its own: an actual text value, such as '20'::text, fails with “operator does not exist: integer < text”.",
  },
  'L1-price-desc': {
    title: 'Price list from expensive to cheap',
    context: 'A salesperson is preparing a pitch and wants the premium items first.',
    taskText:
      'Show the names and prices of all products, sorted from the most expensive to the cheapest.',
    hints: [
      'The result has to be ordered by price.',
      'ORDER BY sets the sorting, and DESC makes it descending.',
      'Skeleton: SELECT product_name, price FROM products ORDER BY price DESC;',
    ],
    explanation:
      'Without ORDER BY, the order of rows in a result is not guaranteed. ORDER BY sorts in ascending order by default (ASC); DESC sorts in descending order. If you need a specific row order, use ORDER BY explicitly.',
  },
  'L1-latest-orders': {
    title: 'The three newest orders',
    context: 'A support agent is looking at the most recent orders.',
    taskText:
      'Show the three most recent orders by date. If two orders have the same date, show the one with the higher order ID first.',
    hints: [
      'First put the rows in order, then cut off the extra ones.',
      'LIMIT n keeps only the first n rows of the sorted result.',
      'Skeleton: SELECT order_id, order_date, amount FROM orders ORDER BY order_date DESC, order_id DESC LIMIT 3;',
    ],
    explanation:
      'LIMIT restricts the number of rows returned after the result has been ordered. The second column in ORDER BY matters here: two orders share the same date, and order_id DESC determines which one comes first. Without that tie-breaker, their relative order is not guaranteed.',
  },
  'L1-top-furniture': {
    title: 'The most expensive furniture',
    context: 'A premium furniture display needs the two priciest items from that category.',
    taskText: "Show the two most expensive items in the 'Furniture' category.",
    hints: [
      'Three actions come together here: filter, sort, cut.',
      'The query uses WHERE to filter, ORDER BY price DESC to sort, and LIMIT 2 to keep only two rows.',
      "Skeleton: SELECT product_name, price FROM products WHERE category = '...' ORDER BY price DESC LIMIT 2;",
    ],
    explanation:
      'The written order of the query clauses is fixed: SELECT → FROM → WHERE → ORDER BY → LIMIT. Conceptually, the filtering happens before the sorting, and LIMIT then keeps only the first two rows. That is why the query returns the two most expensive products within the furniture category.',
  },
  'L1-price-range': {
    title: 'Products inside a price range',
    context:
      'Marketing is preparing a mid-range promotion and wants to select items based on price.',
    taskText: 'Show the names and prices of products priced from 50 to 150, inclusive.',
    hints: [
      'The condition limits the price from both sides at once — from below and from above.',
      'BETWEEN a AND b writes a range more briefly than two conditions joined by AND.',
      'Skeleton: SELECT product_name, price FROM products WHERE price BETWEEN 50 AND 150;',
    ],
    explanation:
      'BETWEEN includes both bounds: it is equivalent to price >= 50 AND price <= 150. This is where a typical mistake hides: in everyday speech “from 50 to 150” often leaves out the upper bound, and then BETWEEN returns a few more rows than expected. The order of the bounds matters too: BETWEEN 150 AND 50 does not describe the intended range and will not match these prices.',
  },
  'L1-two-categories': {
    title: 'Two categories in one filter',
    context: 'A seasonal “home and sport” display needs items from two categories.',
    taskText:
      "Show the products from the 'Kitchen' and 'Sports' categories, together with their prices.",
    hints: [
      'It is not one specific category value that fits, but either of two.',
      "The IN operator checks membership in a list: category IN ('A', 'B').",
      "Skeleton: SELECT product_name, category, price FROM products WHERE category IN ('Kitchen', 'Sports');",
    ],
    explanation:
      "IN is a shorter way of writing a chain of OR conditions: category = 'Kitchen' OR category = 'Sports'. Be careful with NOT IN when the list or the value being tested can involve NULL. Because of SQL's three-valued logic, the condition can evaluate to UNKNOWN, so rows you might expect to keep can be excluded.",
  },
  'L1-name-search': {
    title: 'Search by part of the name',
    context:
      'A support agent is looking for a product, but the customer remembers only part of its name.',
    taskText: "Show the names and categories of products whose name contains the word 'Desk'.",
    hints: [
      'The name must not equal the fragment but contain it somewhere inside.',
      'LIKE compares against a pattern in which % means “any number of any characters”.',
      "Skeleton: SELECT product_name, category FROM products WHERE product_name LIKE '%Desk%';",
    ],
    explanation:
      "In a LIKE pattern, % stands for any sequence of characters and _ stands for exactly one character. Without %, LIKE 'Desk' matches only a product named exactly Desk, and there is none. In PostgreSQL, LIKE is case-sensitive, so '%desk%' does not match Desk. If you want a case-insensitive pattern match, PostgreSQL provides ILIKE.",
  },
  'L1-sorted-catalog': {
    title: 'Catalogue by category and price',
    context:
      'A stock keeper is preparing a paper catalogue for the inventory count: first, products are grouped by category, and within each category, the most expensive products come first.',
    taskText:
      'Show the name, category, and stock value (price × stock) for every product. Sort by category, and within each category, from the most expensive product to the cheapest.',
    hints: [
      'The sorting has two steps: first the categories, and then the order within each category.',
      'ORDER BY can contain several columns separated by commas, and DESC applies only to the column it follows.',
      'Skeleton: SELECT product_name, category, price * stock AS stock_value FROM products ORDER BY category, price DESC;',
    ],
    explanation:
      'The second expression in ORDER BY is used when rows have the same value for the first one. Here, products are sorted by category first, and by price within each category. Notice that the result shows stock_value, but the query sorts by price. ORDER BY can use a column that is not included in the output.',
  },
  'L1-expensive-low-stock': {
    title: 'Expensive products that are running out',
    context:
      'Purchasing is drawing up a list of urgent reorders: expensive items with low stock need to be reordered.',
    taskText: 'Show the five most expensive products whose stock is below 50.',
    hints: [
      'Break the wording into parts: first “stock below 50”, then “the most expensive”, then “five”.',
      'The filter goes into WHERE, “the most expensive” is ORDER BY price DESC, and “five” is LIMIT 5.',
      'Skeleton: SELECT product_name, price, stock FROM products WHERE stock < 50 ORDER BY price DESC LIMIT 5;',
    ],
    explanation:
      'The business wording breaks down into three technical steps: filter, sort, and limit. The filter must be applied before selecting the five most expensive products. Otherwise, you would take the five most expensive products overall, and after the stock check fewer than five would be left.',
  },
  'L1-restock-shortlist': {
    title: 'The urgent reorder shortlist',
    context:
      'Purchasing is preparing the weekly reorder request. Electronics are handled by another department, so the remaining products are selected based on two different urgency criteria.',
    taskText:
      "Show the products with fewer than 50 in stock that do not belong to the 'Electronics' category and either cost more than 100 or have fewer than 10 in stock.",
    hints: [
      'There are three conditions, but the last one consists of two options, and one of them is enough.',
      'AND requires both conditions, OR requires at least one, and NOT reverses a condition. Parentheses show which conditions belong together.',
      "Skeleton: SELECT product_name, category, price, stock FROM products WHERE stock < 50 AND NOT category = 'Electronics' AND (price > 100 OR stock < 10);",
    ],
    explanation:
      "The parentheses around OR are important. AND has higher precedence than OR, so without the parentheses the condition would be interpreted differently: (stock < 50 AND NOT category = 'Electronics' AND price > 100) OR stock < 10. Then any product with fewer than 10 in stock would pass without satisfying the other conditions, and the electronics we have just excluded would get into the result. When AND and OR appear together, parentheses make the intended logic explicit and easier to read.",
  },
};
