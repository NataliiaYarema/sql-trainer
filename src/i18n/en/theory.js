// Англійський текст тем теорії, ключований рівнем теми.
//
// Поля title тут немає навмисно: назву теми topicsFor бере з levelName(level),
// тому вона фізично не може розійтися з назвою рівня. Так само немає SQL і
// записаних результатів кейсів — вони мовно незалежні.
//
// Порядок елементів у масивах мусить відповідати джерелу: накладання йде за
// індексом. Форма summaryBlocks теж: рядок малюється абзацом, вкладений масив —
// маркованим списком, і verifyTheory.mjs звіряє це поблоково.
export default {
  1: {
    summary:
      'A query starts by specifying the columns you need (SELECT) and the table you want to query (FROM).',
    summaryBlocks: [
      [
        'WHERE keeps only the rows that match a condition.',
        'ORDER BY arranges the rows that are left.',
        'LIMIT cuts the result down to the first rows.',
      ],
      'The order of the clauses is fixed: SELECT → FROM → WHERE → ORDER BY → LIMIT.',
      'This level also introduces the aggregate functions COUNT, SUM, MIN, and MAX. Without GROUP BY, they collapse all selected rows into a single result row.',
    ],
    examples: [
      {
        label: 'ORDER BY + LIMIT — the top of the list',
        result:
          'The three most expensive products: Standing Desk at 430, Coffee Machine at 380, and 4K Monitor at 320. LIMIT cuts an already ordered list, so without ORDER BY it would simply return three rows in an unspecified order.',
      },
      {
        label: 'DISTINCT — drop the repeats',
        result:
          'One column with the list of categories, each appearing exactly once, regardless of how many products belong to each category.',
      },
      {
        label: 'BETWEEN — a range instead of two comparisons',
        result:
          'The products priced from 50 to 150 inclusive, from the cheapest to the most expensive. This is the same as price >= 50 AND price <= 150.',
      },
      {
        label: 'LIKE — searching by a fragment of text',
        result:
          'The names that have “Set” somewhere inside them. The % character means “zero or more characters”.',
      },
      {
        label: 'Aggregates without GROUP BY',
        result:
          'Exactly one row with three values calculated over the whole table: the number of products, the lowest price, and the highest price.',
      },
    ],
    pitfalls: [
      {
        title: 'ORDER BY limits nothing by itself',
        text: 'Sorting only changes the order of the rows — there are still just as many of them. To take the three most expensive products, you need both parts: ORDER BY price DESC LIMIT 3.',
      },
      {
        title: '= NULL does not work',
        text: 'NULL means that a value is unknown, and a comparison with it produces neither “yes” nor “no”, but UNKNOWN. That is why WHERE department = NULL does not return rows. The correct way to check for NULL is IS NULL or IS NOT NULL.',
      },
      {
        title: 'Text goes in single quotes',
        text: 'WHERE category = \'Kitchen\' works, while WHERE category = "Kitchen" does not: PostgreSQL treats double quotes as an identifier rather than text, so it will complain that a column named “Kitchen” does not exist.',
      },
    ],
  },

  2: {
    summary:
      'GROUP BY groups rows by a shared value, and an aggregate (COUNT, SUM, AVG, MIN, MAX) summarizes each group as one row in the result.',
    summaryBlocks: [
      [
        'In a SELECT after GROUP BY, you can use only the columns you grouped by, plus aggregates of the other columns.',
        'HAVING filters the groups themselves: it works after the grouping and aggregation, while WHERE filters individual rows before the grouping.',
      ],
    ],
    examples: [
      {
        label: 'A sum within each group',
        result:
          'One row per category: the total number of units of that category in the warehouse, from the largest total to the smallest.',
      },
      {
        label: 'Several aggregates in one query',
        result:
          'A row per manager: how many orders they handled and their average order amount, rounded to two decimal places.',
      },
      {
        label: 'MIN and MAX — the bounds of each group',
        result:
          'Five categories, each with the price of its cheapest and most expensive product. Stationery ranges from 4.20 to 15.00, while Furniture ranges from 45.50 to 430.00.',
      },
      {
        label: 'HAVING — filtering the finished groups',
        result:
          'Only customers whose total order value is above 1000. Customers with a smaller total still form groups, but they do not appear in the result.',
      },
      {
        label: 'COUNT(*) versus COUNT(column)',
        result:
          'Two different numbers: 12 and 11. COUNT(*) counts every row, while COUNT(department) counts only rows where department is not NULL.',
      },
    ],
    pitfalls: [
      {
        title: 'WHERE does not see aggregates',
        text: 'WHERE COUNT(*) > 4 is an error because WHERE runs before the groups and their aggregates exist. Conditions on COUNT, SUM, or AVG go into HAVING. Conversely, an ordinary row-level condition such as price > 100 is better placed in WHERE than in HAVING, because it can filter rows before grouping.',
      },
      {
        title: 'A column outside GROUP BY and outside an aggregate',
        text: 'If you select a column that is neither in GROUP BY nor inside an aggregate, PostgreSQL rejects the query with an error such as “column must appear in the GROUP BY clause”. Without this rule, it would be unclear which value from the group that column should show.',
      },
      {
        title: 'AVG skips NULL rather than treating it as zero',
        text: 'AVG(salary) over 10 rows where two salaries are NULL divides the sum by 8, not by 10. If a NULL value is meant to represent zero, that has to be stated explicitly: AVG(COALESCE(salary, 0)).',
      },
    ],
  },

  3: {
    summary:
      'JOIN combines rows from two tables using the condition in ON — usually by matching identifiers.',
    summaryBlocks: [
      [
        'INNER JOIN keeps only the pairs where both tables have a match.',
        'LEFT JOIN keeps every row from the left table and fills the right-side columns with NULL when no match is found.',
      ],
      'That is why the LEFT JOIN + IS NULL pattern is useful for answering questions like “who has nothing at all?”',
    ],
    examples: [
      {
        label: 'INNER JOIN — matches only',
        result:
          'The June orders with the customer name beside them. A customer without any June orders will not appear in the result. The word INNER is optional here: a plain JOIN means the same thing. The topic title uses the full name.',
      },
      {
        label: 'LEFT JOIN + IS NULL — find those who have nothing',
        result:
          'The customers who have never placed an order. LEFT JOIN keeps them in the result and sets the order columns to NULL when no order is found. WHERE then keeps exactly those rows.',
      },
      {
        label: 'JOIN + GROUP BY — the top products by units sold',
        result:
          'The five products bought in the largest quantities. First, the order lines are combined with the product name; then the result is grouped and the quantities are added up.',
      },
      {
        label: 'USING — a three-table chain written more concisely',
        result:
          'The five earliest order lines with the order date and product name — this time the chain really does combine three tables. USING (order_id) is shorter than ON o.order_id = oi.order_id and also keeps a single order_id column in the result instead of two columns with the same name.',
      },
    ],
    pitfalls: [
      {
        title: 'A JOIN without ON multiplies the rows',
        text: 'If the join condition is forgotten, every row of the left table is combined with every row of the right one: 8 customers and 31 orders produce 248 rows instead of 31. A sudden increase in the number of rows is a common sign that the ON condition is missing.',
      },
      {
        title: 'A condition on the right table in WHERE can undo a LEFT JOIN',
        text: 'LEFT JOIN orders o ... WHERE o.amount > 100 removes every customer without orders, because NULL is not greater than 100. The result therefore contains only customers with matching orders above 100, just as it would with an INNER JOIN. If customers without qualifying orders need to be kept, put the condition in ON: ON o.customer_id = c.customer_id AND o.amount > 100.',
      },
      {
        title: 'COUNT(*) after a LEFT JOIN counts 1 instead of 0',
        text: 'A LEFT JOIN keeps the left-side row even when nothing matches on the right — with the right-side columns set to NULL. COUNT(*) counts rows, so for a customer with no orders it returns 1. To count matching orders, use a column from the right table: COUNT(o.order_id) returns 0 because COUNT does not count NULL.',
      },
    ],
  },

  4: {
    summary: 'A subquery is a query inside another query, enclosed in parentheses.',
    summaryBlocks: [
      [
        'A scalar subquery typically computes one value (the average salary, for example) that every row is then compared with.',
        'A CTE is a named query expression introduced with WITH: from then on, it can be referenced like an ordinary table.',
      ],
      'The result can be the same, but the query is easier to read. One CTE can also be used several times or serve as the basis for another CTE. When a solution becomes difficult to follow, split it into named steps.',
    ],
    examples: [
      {
        label: 'A scalar subquery in WHERE',
        result:
          'First, the average price of electronics is calculated — one value. Then every product, regardless of category, is compared with that value.',
      },
      {
        label: 'A subquery in the list of columns',
        result:
          'The products with fewer than 10 units left, with the difference between each price and the most expensive product shown beside it.',
      },
      {
        label: 'NOT IN — exclude by a ready-made list',
        result:
          'One row: Sofia Rossi, the only customer without an order. The subquery first gathers the list of customers who placed an order, and the outer query excludes everyone on that list.',
      },
      {
        label: 'NOT EXISTS — exclude by a condition',
        result:
          'The same Sofia Rossi, but by a different route: here, the subquery does not build a list. Instead, for each customer it asks, “Does at least one order exist?” That is why SELECT contains 1 — the value itself does not matter; only the existence of a row matters.',
      },
      {
        label: 'WITH — give an intermediate step a name',
        result:
          'The dates on which more than one order arrived. The first step counts the orders per day; the second filters the finished result.',
      },
      {
        label: 'Two CTEs in a row',
        result:
          'The customers whose total purchase amount is above the average total across customers. The second CTE is built from the first, so the problem is split into two simple steps.',
      },
    ],
    pitfalls: [
      {
        title: 'A scalar subquery has to return one value',
        text: 'The expression price > (SELECT ...) expects exactly one row and one column. If the subquery returns several rows, PostgreSQL raises an error. When several values are what you need, use IN instead of >: WHERE customer_id IN (SELECT customer_id FROM orders).',
      },
      {
        title: 'NOT IN can break on NULL',
        text: 'If the subquery returns even one NULL, NOT IN can evaluate to UNKNOWN rather than TRUE, so the query may return no rows — without raising an error. For “who is not on the list?” questions, NOT EXISTS or LEFT JOIN ... IS NULL is often safer.',
      },
      {
        title: 'A CTE lives only inside its own query',
        text: 'After the semicolon, the name declared in WITH disappears — it is not a table you have created. A CTE can also only be referenced after the point where it was declared: the second CTE can see the first, but not the other way around.',
      },
    ],
  },

  5: {
    summary:
      'A window function works like an aggregate in that it calculates a value from a set of rows, but it does not collapse those rows: every row stays in the result and gets an additional calculated column. OVER defines the window and how the calculation is performed.',
    summaryBlocks: [
      [
        'PARTITION BY divides the rows into independent groups — each department separately, for example.',
        'ORDER BY defines the order of the rows within each group.',
      ],
      'That is how numbering (ROW_NUMBER, RANK), access to neighbouring rows (LAG, LEAD), and running calculations are built.',
      'This answers questions like: “How does this row compare with the other rows in its group?”',
    ],
    examples: [
      {
        label: 'Numbering inside each group',
        result:
          'All 25 products remain in the result, each with its position by price within its own category. The numbering starts at 1 again for every category.',
      },
      {
        label: 'RANK and DENSE_RANK — two ways of handling ties',
        result:
          'The eight most expensive products. Office Chair and Docking Station both cost 210, so both get fifth place. From there the results diverge: RANK jumps to seventh, while DENSE_RANK goes to sixth. The difference matters when values are tied, so the two functions are useful for different kinds of ranking.',
      },
      {
        label: 'Compare a row with its own group',
        result:
          'Every employee appears with the difference between their salary and the lowest salary in their department. GROUP BY would not work for this result: it would reduce the data to one row per department.',
      },
      {
        label: 'LAG and LEAD — look at neighbouring rows',
        result:
          'Each order can access its neighbours by date: LAG gives the amount from the previous row, while LEAD gives the amount from the next. In the first row, prev_amount is NULL because there is no previous row — and a “current minus previous” calculation naturally reflects that.',
      },
      {
        label: 'NTILE — divide the rows into roughly equal groups',
        result:
          'The products are divided by price into four groups of roughly equal size: 1 contains the lowest-priced products, while 4 contains the highest-priced ones.',
      },
      {
        label: 'The window frame — a moving average',
        result:
          'For every order, the average amount over the current order and the two previous rows. ROWS BETWEEN narrows the window to those three rows instead of using the entire ordered set.',
      },
    ],
    pitfalls: [
      {
        title: 'Window functions cannot be used directly in WHERE',
        text: 'A window function is calculated for the rows that reach the windowed calculation, so you cannot write WHERE ROW_NUMBER() OVER (...) = 1 in the same query level. The usual solution is to calculate the row number in a CTE and then filter on the finished column in the outer query.',
      },
      {
        title: 'RANK, DENSE_RANK and ROW_NUMBER handle ties differently',
        text: 'With equal values, RANK leaves gaps (1, 2, 2, 4), DENSE_RANK does not (1, 2, 2, 3), and ROW_NUMBER assigns a different number to every row (1, 2, 3, 4). For ROW_NUMBER, the order of tied rows is unspecified unless the ORDER BY includes an additional criterion that breaks the tie.',
      },
      {
        title: 'PARTITION BY is not GROUP BY',
        text: 'GROUP BY reduces the number of rows; PARTITION BY does not. If you expected one row per department but got one row per employee, you probably need an ordinary aggregate rather than a window function.',
      },
    ],
  },

  6: {
    summary:
      'Dates in PostgreSQL are their own data type rather than text, which is why you can perform arithmetic with them.',
    summaryBlocks: [
      [
        'DATE_TRUNC moves a date to the start of a period — a month, a quarter, a year — which is useful for grouping dates into reporting periods.',
        'EXTRACT pulls a numeric value from a date: the year, the month, the day of the week, and so on.',
        "Adding INTERVAL '30 days' to a date produces a new date.",
        'AGE calculates the difference between two dates and returns an interval expressed in years, months, and days.',
        'TO_CHAR converts a date to text using a format template — useful for readable labels.',
      ],
      'String functions solve a different problem: cleaning up text that came from a form or another input source.',
      [
        'TRIM removes spaces from the beginning and end.',
        'INITCAP converts text to title case, such as “First Last”.',
        'SPLIT_PART splits a value at a separator and returns one of the resulting parts.',
        'SUBSTRING together with POSITION can extract a piece of text based on its position.',
        'The || operator concatenates text values.',
      ],
    ],
    examples: [
      {
        label: 'DATE_TRUNC — reduce dates to a month',
        result:
          'Six rows, one per month. DATE_TRUNC moves every date to the first day of its month, so all the January orders are grouped into one row: 3 orders, with an average order amount of 131.83.',
      },
      {
        label: 'EXTRACT — pull a part out of a date',
        result:
          'The five earliest orders with the numeric day of the week and month. In PostgreSQL, DOW starts at 0 for Sunday, so 5 is Friday, 4 is Thursday, and 6 is Saturday.',
      },
      {
        label: 'INTERVAL and AGE — date arithmetic',
        result:
          'The first order, from 5 January, has a due date of 4 February, and the interval from that order to 1 July is displayed as “5 mons 27 days”. INTERVAL adds a time span to a date and produces a new date, while AGE calculates the difference between two dates and returns an interval.',
      },
      {
        label: 'TRIM and INITCAP — clean up a raw name',
        result:
          'The raw value and the cleaned one are shown side by side: “ anna kovalenko ” becomes “Anna Kovalenko”. In the third contact, the double space inside the name is still there — TRIM only removes spaces from the beginning and end.',
      },
      {
        label: 'SPLIT_PART — split a value at a separator',
        result:
          'Ten contacts with the domain in a separate column: example.com, mail.ua, bondar.dev. The third argument is the number of the part, so 2 means “what comes after the @ sign”; with 1, you would get the mailbox name.',
      },
      {
        label: 'TO_CHAR and || — assemble a readable label',
        result:
          'Five labels in the form “05.01.2024 — 120.50”: TO_CHAR converts the date to text using the format template, and || concatenates it with the amount.',
      },
    ],
    pitfalls: [
      {
        title: 'EXTRACT gives a number, not formatted text',
        text: "EXTRACT(YEAR FROM d) || '-' || EXTRACT(MONTH FROM d) can produce 2024-1 rather than 2024-01, because EXTRACT returns numeric values rather than formatted text. If you need a report label such as 2024-01, use TO_CHAR(d, 'YYYY-MM'). Comparing an extracted number with a numeric value is fine, for example EXTRACT(YEAR FROM d) = 2024. If you compare it with a text literal such as '2024', PostgreSQL may perform an implicit type conversion, but it is clearer to use the appropriate numeric type explicitly.",
      },
      {
        title: 'TRIM removes spaces from the edges only',
        text: "TRIM(' a  b ') returns 'a  b' — the double space inside remains. To replace pairs of spaces, you can use REPLACE(x, '  ', ' '). If there are three or more consecutive spaces, one replacement may not normalize them all.",
      },
      {
        title: 'DATE_TRUNC gives the start of a period, not its name',
        text: "DATE_TRUNC('month', DATE '2024-03-17') returns 2024-03-01 as a timestamp — the start of the month. That is useful for grouping and sorting, but it is not a display label. “March 2024” can be produced with TO_CHAR. You can sort by a textual month name, but ORDER BY on it gives an alphabetical rather than a chronological result: April, February, January, and so on. For chronological sorting, use the truncated date or another numeric date value.",
      },
      {
        title: 'In SQLite this is written differently',
        text: "Level 6 is where the SQL dialects diverge more noticeably, and SQLite still appears in older projects and some interview exercises. Some equivalents are: DATE_TRUNC('month', d) ↔ date(d, 'start of month'), EXTRACT(YEAR FROM d) ↔ strftime('%Y', d), d + INTERVAL '30 days' ↔ date(d, '+30 days'). Only the syntax in the left column works in our trainer.",
      },
    ],
  },

  7: {
    summary:
      'CASE lets you return different values depending on a condition. It checks the conditions in order and returns the result of the first one that matches. If no condition matches, ELSE is used. If there is no ELSE, the result is NULL. END marks the end of the CASE expression.',
    summaryBlocks: [
      'COALESCE is used when a NULL value needs to be replaced with another value. It returns the first value in the list that is not NULL. This is useful when you want to display readable text instead of a missing value or provide a fallback value.',
      'NULLIF works in the opposite direction: it returns NULL when its two arguments are equal; otherwise, it returns the first argument. This is often used to turn zero into NULL before a division, avoiding division by zero.',
      'UNION, UNION ALL, INTERSECT, and EXCEPT let you combine or compare the results of two queries.',
      'Unlike JOIN, which adds columns from another table, set operations work with rows: the results of two queries are combined vertically.',
      [
        'UNION — combines the results and removes duplicates.',
        'UNION ALL — combines the results and keeps duplicates.',
        'INTERSECT — keeps the rows that appear in both results.',
        'EXCEPT — keeps the rows from the first result that are absent from the second.',
      ],
      'For all four operations, both queries must return the same number of columns, and the corresponding columns must have compatible data types.',
    ],
    examples: [
      {
        label: 'CASE with ELSE — the pay level',
        result:
          'Twelve rows from the highest salary to the lowest. Two are in high, seven in mid, and three in low. The conditions are checked from top to bottom, so Oksana, with a salary of 8100, matches the first branch and never reaches the second.',
      },
      {
        label: 'SUM(CASE) — rows become columns',
        result:
          'Five rows, one per department, plus a separate row for the employee without a department. IT has 4 senior and 0 regular employees, while HR has 0 senior and 2 regular employees. This is one way to build a pivot-style result: a category becomes a column rather than a value in a single column.',
      },
      {
        label: 'COALESCE and NULLIF — two opposite actions',
        result:
          "Twelve rows with both actions shown side by side. Bohdan's department is NULL, so COALESCE displays “Not stated”. For everyone in IT, NULLIF does the opposite and returns NULL because their department matches the value we asked to hide. For Bohdan, hidden_it is also NULL, but for a different reason: NULLIF(NULL, 'IT') returns NULL.",
      },
      {
        label: 'UNION — combine two lists without duplicates',
        result:
          'Five rows — every category that has either a very expensive or a very cheap product. The same query with UNION ALL gives 15 rows because matching categories can appear multiple times.',
      },
      {
        label: 'INTERSECT — the common part of two lists',
        result:
          'Three categories — Electronics, Furniture, and Kitchen — each have both a product priced at 200 or more and a product priced below 50. They therefore have products at both ends of this price range.',
      },
      {
        label: 'EXCEPT — subtract one list from another',
        result:
          'Three rows: HR, Marketing, and the NULL department — these are the groups where nobody earns 6000 or more. The NULL row is not accidental: set operations treat NULL values as equal for the purpose of matching rows, even though an ordinary comparison such as NULL = NULL evaluates to UNKNOWN.',
      },
      {
        label: 'CASE in ORDER BY — a custom order that is not stored in the data',
        result:
          'First come all the electronics, from most expensive to least expensive, followed by the furniture — with Standing Desk at 430. Neither alphabetical order nor the category values themselves would produce this order. ORDER BY can use an expression, and CASE turns each category into a number that controls the sort order. That number does not appear in the result.',
      },
    ],
    pitfalls: [
      {
        title: 'A CASE without ELSE silently returns NULL',
        text: 'If no branch matches and there is no ELSE, CASE returns NULL — not an empty string and not zero. In a table this may look like a missing value, and in calculations it has specific consequences: COUNT(column) does not count it, SUM ignores it, and concatenation with || produces NULL if one of the operands is NULL.',
      },
      {
        title: 'The order of CASE branches is the priority',
        text: "The branches are checked from top to bottom, and the first matching branch wins. That is why a broader condition should not come before a narrower one: in CASE WHEN price < 200 THEN 'standard' WHEN price < 50 THEN 'budget' END the second branch can never be reached, because every price below 50 has already matched the first condition. There is no error — just an incorrect result.",
      },
      {
        title: 'UNION removes duplicates, UNION ALL does not',
        text: 'On our data, this is visible directly: combining the categories of expensive and cheap products with UNION gives 5 rows, while UNION ALL gives 15. Removing duplicates requires extra work, such as hashing or sorting, depending on the plan chosen by the database. If duplicates are meaningful or you know they cannot occur, UNION ALL avoids that deduplication step.',
      },
      {
        title: 'EXCEPT is asymmetric',
        text: 'A EXCEPT B and B EXCEPT A ask different questions and can produce different results. Subtracting the categories with expensive products from all categories leaves 2 rows — Sports and Stationery, where there are no products priced at 200 or more. Reversing the operands gives 0 rows because every category with an expensive product is already included in the full list of categories. An empty result here is not necessarily a sign that something was “not found”; it can simply mean that the operands were used in the opposite order.',
      },
    ],
  },

  8: {
    subtitle: 'cohorts, funnels, retention, LTV and RFM',
    summary:
      'Cohorts, funnels, retention, LTV, and RFM are useful ways to understand how a product is performing and how user behaviour changes over time. Each one is not just a single function, but a chain of logical steps.',
    summaryBlocks: [
      'At this level, you bring everything you have learned together into one analytical workflow:',
      [
        'WITH (CTE) becomes the backbone of the query: it lays complex calculations out as transparent, named stages.',
        'DATE_TRUNC moves a date to the start of a month or week, which is useful for turning a stream of signups into readable cohorts.',
        'COUNT(DISTINCT ...) counts unique people rather than events, so repeated activity from the same person does not inflate the active-user count.',
        'FILTER (WHERE ...) calculates subsets within an aggregate, which is useful for building funnel summaries without separate queries for every step.',
        'LAG puts the current period next to the previous one, making month-on-month or year-on-year comparisons straightforward.',
        'NTILE divides users into groups of roughly equal size by measures such as recency, frequency, or monetary value, which can be used for RFM segmentation.',
      ],
      'The main rule of an analyst is simple: writing the SQL is only part of the job. The important part is understanding the business question correctly and calculating exactly the metric that question requires.',
    ],
    cases: [
      {
        title: 'Cohort retention analysis',
        about:
          'Track groups of users who signed up in the same month and see whether they are active again in later months.',
        whenNeeded:
          'When you are asked questions such as “how many of the January users are still active in March?” or “how does retention change from cohort to cohort?”',
        question:
          'How many users who signed up in January are still active in February? And in March? How does retention change from cohort to cohort?',
        steps: [
          'Step 1 (cohort): assigns every user their signup month.',
          'Step 2 (activity): puts each user’s cohort next to the month of each of their activities.',
          'Step 3: the final query counts how many users from each cohort were active month_no months after the cohort month.',
        ],
        reading:
          'month_no is the age of the cohort rather than the calendar month: zero means the signup month. The January 2023 cohort has seven users, of whom five were active in month 0 and three in month 1. The series does not have to decrease monotonically: a user can skip a month and return later, which is why retention is usually viewed as a matrix rather than a single number.',
        watchOut: [
          'A cohort is determined by the signup date, and that cohort assignment stays with the user. If you group by event date, the same user can appear in several months, and you no longer have a stable cohort definition.',
          'Active users by month are not the same as retention, even if the numbers look similar. New users cannot be distinguished from returning users, so changes in the active-user count do not tell you whether existing users are staying.',
          'What needs to be counted is unique people rather than events: each user should count once per cohort/month combination, regardless of how many activities they had during that month.',
          'The last cohort always has a shorter observation window than the earlier ones. In a report, it should therefore be excluded from comparable retention periods or clearly labelled as incomplete.',
        ],
      },
      {
        title: 'The conversion funnel',
        about:
          'Follow a sequence of steps towards a purchase and see how many sessions reach each stage.',
        whenNeeded:
          'For signup, payment, subscription, purchase, or any other sequence of actions.',
        question:
          'At which step does the largest drop occur? Where should the investigation focus?',
        steps: [
          'Step 1 (session_depth): determines the deepest recognised funnel step reached by each session.',
          'Step 2: the final query counts sessions that reached at least each step, which is why the conditions are cumulative (>= 1, >= 2, and so on).',
        ],
        reading:
          '1,187 sessions reached the first step and 274 reached the purchase step — an end-to-end conversion of about 23%. The largest absolute drop is between the visit and product-view steps: 344 sessions did not reach a product view. That identifies where the largest drop occurs, but it does not by itself tell you which part of the product should be optimised. That requires additional context about the stages, their costs, and the business objective.',
        watchOut: [
          'The unit of analysis determines what the funnel means. If you count unique people over the whole period, someone who visited ten times and purchased once can contribute to every stage based on their combined history. The result then describes user-level reach across the period, not one individual journey through the funnel.',
          'The step counts have to be cumulative: a session that reached purchase also counts towards all earlier stages. With equality instead of “at least”, the funnel stages would no longer represent cumulative reach.',
          'The order of the steps must be defined explicitly rather than inferred from the data. If your funnel has different stages, change the ordered array accordingly. Also note that this query identifies the deepest recognised event type in each session; it does not verify that the events occurred in the expected chronological order. A strict ordered funnel needs additional logic to enforce that sequence.',
        ],
      },
      {
        title: 'LTV by signup cohort',
        about:
          'Measure how much revenue users generate over their observed lifetime and how that varies between signup cohorts.',
        whenNeeded:
          'When you need to understand revenue per user and compare the observed value of users from different signup periods.',
        question: 'What is the LTV of users by signup month? Does it differ across cohorts?',
        steps: [
          'Step 1 (user_ltv): creates one row per user with the total of their purchases, or zero if they made none. LEFT JOIN plus COALESCE keeps non-buyers in the calculation.',
          'Step 2: the final query averages those user-level values over each cohort and also calculates the median and maximum.',
        ],
        reading:
          'In the January cohort, the average observed LTV is 238.79 while the median is 13.16. The large gap shows that a small number of high-value buyers pull the average upward, while at least half of the users generated much less revenue.',
        watchOut: [
          'You cannot calculate an average of user-level totals with a single aggregate. PostgreSQL does not allow one aggregate to be nested directly inside another. More importantly, the analysis needs two levels: first reduce purchases to one value per user, then average those values across the cohort.',
          'A LEFT JOIN is essential here. With a regular JOIN, users who made no purchases disappear, so the average is calculated only across buyers. COALESCE turns their missing purchase total into zero.',
          'The median is useful alongside the average when analysing revenue because purchase distributions are often highly skewed. A large difference between the two can reveal that a relatively small number of users contribute a disproportionate share of revenue.',
          'Recent cohorts often have lower observed LTV simply because they have had less time to generate purchases. Cohorts should therefore be compared over the same observation window when the goal is a like-for-like comparison.',
        ],
      },
      {
        title: 'RFM segmentation',
        about:
          'Group buyers along three dimensions: how recently they bought, how often they buy, and how much they spend.',
        whenNeeded:
          'When you need to describe customer groups for different types of analysis or outreach.',
        question:
          'Split the buyers into segments: VIP, Loyal, Potential, At-Risk, Lost. How many people are in each, and how much do they spend?',
        steps: [
          'Step 1 (metrics): computes three numbers for every buyer — recency, frequency, and monetary value.',
          'Step 2 (scores): divides each metric independently into four roughly equal-sized groups using NTILE(4).',
          'Step 3: the final CASE combines the three quartile scores into segment names. The order of the branches determines which segment wins when more than one condition matches.',
        ],
        reading:
          '136 buyers are divided into five segments with different spending patterns. The average monetary value is 610.87 for Loyal and 96.05 for Lost.',
        watchOut: [
          'A split by money alone is not RFM. Someone who spent a lot a year ago and has not returned is different from someone who buys every month. Distinguishing recency, frequency, and monetary value is the point of the method.',
          'Recency is calculated from the end of the data, not from today. On a historical dataset, using CURRENT_DATE would make the scores depend on when the query is run, which is why the reference date is fixed explicitly here.',
          'The order of the CASE branches determines the priority. The first matching condition wins, so changing the order can change the resulting segments.',
          'NTILE(4) creates groups with roughly equal numbers of participants, not groups containing equal amounts of revenue. “The top 25% of buyers” and “a quarter of the revenue” are different measurements. Ties can also be split across NTILE buckets, because NTILE divides rows rather than distinct values.',
        ],
      },
      {
        title: 'Month-on-month change',
        about: 'Compare a metric with the previous period and identify trends and changes.',
        whenNeeded: 'For monthly reports on revenue, active users, conversion, or similar metrics.',
        question: 'By how much did revenue change from month to month? Where are the dips?',
        steps: [
          'Step 1 (monthly): reduces the purchases to one row per month.',
          'Step 2: LAG(revenue) OVER (ORDER BY month) places the previous month’s revenue alongside the current month.',
          'Step 3: the percentage change is calculated using the previous month’s revenue as the denominator.',
        ],
        reading:
          'In the first month, both comparison columns are NULL because there is no previous month. That is the correct result, not missing data. Later, there is a sharp increase in March and a moderate decrease in April. The first months also have a small revenue base, so percentage changes can become very large.',
        watchOut: [
          'The denominator must be the previous period when calculating growth relative to the previous period. Using the current period would produce a different metric.',
          'A NULL in the first row is normal: there is simply nothing to compare with. Replacing it with zero would invent a 100% decline.',
          'The ORDER BY inside the window defines what “previous” means. The ORDER BY at the end of the query only controls the presentation order; it does not define the window order.',
          'The last month in the data may be incomplete, so an apparent decline may simply reflect the fact that the month is still in progress.',
        ],
      },
    ],
    pitfalls: [
      {
        title: 'COUNT(*) counts events, not people',
        text: 'If active users are counted with COUNT(*), users with several events are counted several times. In this data the result is 3,218 events versus 190 unique users. Use COUNT(DISTINCT user_id) when the metric is people.',
      },
      {
        title: 'A cohort is determined by the signup date',
        text: 'If you group by event date, the same user can appear in several months, and the cohort no longer represents a fixed signup group.',
      },
      {
        title: 'The last cohort always has a shorter observation window',
        text: 'Its observation window is shorter than those of earlier cohorts. In this data, the June 2024 cohort has 0% observed retention for the following month simply because July is not present in the data. That is not a product finding; it is an incomplete observation window. Exclude the cohort from that comparison or label it clearly.',
      },
      {
        title: 'LAG without ORDER BY does not define a previous row',
        text: 'Without an ORDER BY inside the window, “previous row” has no defined ordering. The value is therefore not a reliable previous period. A NULL in the first row, on the other hand, is normal: there is no previous period to compare with.',
      },
      {
        title: 'NTILE divides by row count, not by amount',
        text: 'The quartiles contain roughly equal numbers of participants rather than equal amounts of money. In this data, the top quartile of 34 buyers accounts for 55% of revenue, so “the top 25% of buyers” and “a quarter of the revenue” describe different things.',
      },
      {
        title: 'Step-by-step conversion is not end-to-end conversion',
        text: '71% × 64% × 69% × 74% gives about 23%, not 71%. The first number describes one step of the funnel; the product of the step-by-step conversion rates describes the overall conversion across all four steps.',
      },
    ],
    tips: [
      {
        text: 'Read the question twice and say the metric out loud: retention, funnel, LTV, or segmentation. Many incorrect queries are perfectly valid SQL calculating a different metric.',
      },
      {
        text: 'Settle the definitions before writing the report: are “active” users or events? Is “conversion” step-by-step or end-to-end? Is “retention” measured from signup or from the first purchase?',
      },
      {
        text: 'Use WITH to make the logic explicit: give each stage a name so the query reads from top to bottom like a description of the calculation.',
      },
      {
        text: 'Check that the result is sensible before building further calculations on it. For example, a cohort size should not increase over time, a conversion rate should not exceed 100%, and an LTV based on non-negative purchase amounts should not be negative. When such a check fails, investigate the query before treating the result as a discovery.',
      },
      {
        text: 'Document important assumptions in a comment inside the query. A month later, you may no longer remember why recency was calculated from that particular date.',
      },
      {
        text: 'The last month in the data is often incomplete, and its observed retention is therefore understated by construction. Either exclude it from comparable reporting or label it clearly on the chart.',
      },
    ],
  },
};
