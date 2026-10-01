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
      'SELECT * is handy when you need a quick look inside a table. Production queries avoid it: it pulls data you do not need and breaks the moment a new column appears. For exploring — yes; for a dashboard — no.',
  },
  'L1-product-prices': {
    title: 'Just product names and prices',
    context:
      "A printed price list only needs product names and prices. The other fields aren't needed on paper.",
    taskText: 'Show the name and price of every product.',
    hints: [
      'Instead of all the columns you need only two specific ones.',
      'List the columns you need, separated by commas, right after SELECT.',
      'Skeleton: SELECT product_name, price FROM products;',
    ],
    explanation:
      'Listing columns explicitly is the norm for production queries: you get exactly the data you asked for, and the result will not change if new fields are added to the table. The order of columns in SELECT sets the order in the result.',
  },
  'L1-departments': {
    title: 'Which departments does the company have?',
    context:
      'A new HR manager is mapping the company structure and starts with a list of its departments.',
    taskText: 'Show the list of unique departments, without duplicates.',
    hints: [
      'The department repeats for every employee, but the list you need has no repeats.',
      'DISTINCT drops identical result rows, keeping one from each group.',
      'Skeleton: SELECT DISTINCT department FROM employees;',
    ],
    explanation:
      'Notice the empty row in the result: one employee has no department, and DISTINCT treats NULL as a value of its own — unlike conditions in WHERE, where NULL equals nothing. The second thing to remember: DISTINCT works on the whole result row, not on a single column, so SELECT DISTINCT department, salary would give you every pair of values instead.',
  },
  'L1-top-managers': {
    title: 'Who reports to nobody?',
    context:
      'HR is putting together a list of top-level managers for an invitation to a strategy session.',
    taskText: 'Show the first and last names of employees who have no manager.',
    hints: [
      'A missing manager is stored in the table not as a zero and not as an empty string, but as a special “unknown” value.',
      'An empty value is checked with IS NULL, not with an equals sign.',
      'Skeleton: SELECT first_name, last_name FROM employees WHERE manager_id IS NULL;',
    ],
    explanation:
      'NULL is not a value but the absence of one, so any comparison with it returns neither true nor false but “unknown”. That is why manager_id = NULL returns no rows and raises no error either — the query simply gives back an empty result. IS NULL exists for exactly this kind of check.',
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
      'WHERE throws rows away before the result is built. Equality is the simplest filter; remember that string comparison in SQL is case-sensitive, so Electronics and electronics are different values.',
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
      "The comparison operators >, <, >=, <=, = and <> behave in WHERE exactly as they do in maths. Note that numbers are written without quotes — PostgreSQL is strict about types and answers stock < '20' with an error about incompatible types.",
  },
  'L1-price-desc': {
    title: 'Price list from expensive to cheap',
    context: 'A salesperson is preparing a pitch and wants the premium items first.',
    taskText:
      'Show the names and prices of all products, sorted from the most expensive to the cheapest.',
    hints: [
      'The result has to be ordered by price.',
      'ORDER BY sets the sorting, and DESC flips it to descending.',
      'Skeleton: SELECT product_name, price FROM products ORDER BY price DESC;',
    ],
    explanation:
      'Without ORDER BY the row order is not guaranteed — the database may return them in any order it likes. Sorting is ascending by default (ASC), DESC makes it descending. This is the only way to control the order of the result.',
  },
  'L1-latest-orders': {
    title: 'The three newest orders',
    context: 'A support agent is looking at the most recent orders.',
    taskText:
      'Show the three most recent orders by date. If two orders have the same date, show the one with the higher order ID first.',
    hints: [
      'First put the rows in order, then cut off the extra ones.',
      'LIMIT n keeps only the first n rows of an already sorted result.',
      'Skeleton: SELECT order_id, order_date, amount FROM orders ORDER BY order_date DESC, order_id DESC LIMIT 3;',
    ],
    explanation:
      'LIMIT is applied after sorting, so the order of operations matters: ORDER BY lines the rows up first, and only then does LIMIT cut off the tail. The second column in ORDER BY is not decoration here: two dates are identical, and without it the database is free to return those rows in any order — a “top N” report would become unpredictable.',
  },
  'L1-top-furniture': {
    title: 'The most expensive furniture',
    context: 'A premium furniture display needs the two priciest items from that category.',
    taskText: "Show the two most expensive items in the 'Furniture' category.",
    hints: [
      'Three actions come together here: filter, sort, cut.',
      'The order of the query parts is fixed: WHERE, then ORDER BY, then LIMIT.',
      "Skeleton: SELECT product_name, price FROM products WHERE category = '...' ORDER BY price DESC LIMIT 2;",
    ],
    explanation:
      'The writing order of query parts is rigid: SELECT → FROM → WHERE → ORDER BY → LIMIT. The execution order is different: WHERE throws rows away first, then they are sorted, and only at the end does LIMIT cut off the extra. That is exactly why the filter cannot “see” the result of the sorting.',
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
      'BETWEEN includes both bounds: the form is equivalent to price >= 50 AND price <= 150. This is where the usual mistake hides — in everyday speech “from 50 to 150” often leaves the upper bound out, and then BETWEEN gives a few rows more than expected. The order of the bounds matters too: BETWEEN 150 AND 50 returns nothing.',
  },
  'L1-two-categories': {
    title: 'Two categories in one filter',
    context: 'A seasonal “home and sport” display needs items from two categories.',
    taskText:
      "Show the products from the 'Kitchen' and 'Sports' categories, together with their prices.",
    hints: [
      'It is not one specific category value that fits, but any of two.',
      "The IN operator checks membership in a list: category IN ('A', 'B').",
      "Skeleton: SELECT product_name, category, price FROM products WHERE category IN ('Kitchen', 'Sports');",
    ],
    explanation:
      "IN is a shorter way of writing a chain of OR: category = 'Kitchen' OR category = 'Sports'. The gain is not only in length: with OR it is easy to forget the brackets and mix the conditions up, while IN stays one whole expression. Be careful with NOT IN when the list may contain NULL — such a condition returns no rows at all.",
  },
  'L1-name-search': {
    title: 'Search by part of the name',
    context:
      'A support agent is looking for a product, but the customer remembers only part of its name.',
    taskText: "Show the names and categories of products whose name contains the word 'Desk'.",
    hints: [
      'The name must not equal the fragment but contain it — anywhere inside.',
      'LIKE compares against a pattern in which % means “any number of any characters”.',
      "Skeleton: SELECT product_name, category FROM products WHERE product_name LIKE '%Desk%';",
    ],
    explanation:
      "In a LIKE pattern % stands for any sequence of characters and _ for exactly one. Without % the pattern works like plain equality: LIKE 'Desk' would find only a product named exactly “Desk”, and there is none. In PostgreSQL LIKE is case-sensitive, so '%desk%' will not find these products — for a search that ignores case there is ILIKE.",
  },
  'L1-sorted-catalog': {
    title: 'Catalogue by category and price',
    context:
      'A stock keeper is preparing a paper catalogue for the inventory count: first, products are grouped by category, and within each category, the most expensive products come first.',
    taskText:
      'Show the name, category, and stock value (price × stock) for every product. Sort by category, and within each category, from the most expensive product to the cheapest.',
    hints: [
      'The sorting has two steps: first the groups, and only inside each one its own order.',
      'ORDER BY takes several columns separated by commas, and DESC applies only to the one it follows.',
      'Skeleton: SELECT product_name, category, price * stock AS stock_value FROM products ORDER BY category, price DESC;',
    ],
    explanation:
      'The second column in ORDER BY kicks in only where the first gave equal values — which is what orders the products inside a category. Note also that we sort by price although the result shows stock_value: ORDER BY is free to refer to table columns that are not in the output.',
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
      'The closing task of the level: a business wording breaks down into three technical steps. What matters is that LIMIT is applied after the filter — if you first took the five most expensive products overall and then filtered by stock, fewer than five items would be left on the list.',
  },
  'L1-restock-shortlist': {
    title: 'The urgent reorder shortlist',
    context:
      'Purchasing is preparing the weekly reorder request. Electronics are handled by another department, so the remaining products are selected based on two different urgency criteria.',
    taskText:
      "Show the products with fewer than 50 in stock that do not belong to the 'Electronics' category and either cost more than 100 or have fewer than 10 in stock.",
    hints: [
      'There are three conditions, but the last one consists of two options, and one of them is enough.',
      'AND requires both conditions, OR at least one, NOT flips a condition. Brackets say what is grouped with what.',
      "Skeleton: SELECT product_name, category, price, stock FROM products WHERE stock < 50 AND NOT category = 'Electronics' AND (price > 100 OR stock < 10);",
    ],
    explanation:
      'The brackets around OR are not decoration. AND binds more tightly than OR, so without them the condition would read as “(low in stock and not electronics and costing more than 100) or fewer than 10 left” — and the electronics we had just excluded would land in the result. When AND and OR meet in one condition, it is worth always adding brackets, even where they match the default behaviour: a query is read by people, not only by the database.',
  },
};
