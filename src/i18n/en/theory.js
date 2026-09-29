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
    summary: 'A query starts with you naming the columns you need (SELECT) and the table (FROM).',
    summaryBlocks: [
      [
        'WHERE keeps only the rows that match a condition.',
        'ORDER BY arranges the rows that are left.',
        'LIMIT cuts the result down to the first few.',
      ],
      'The order of the parts is fixed: SELECT → FROM → WHERE → ORDER BY → LIMIT.',
      'This level will also need the aggregates COUNT, SUM, MIN, MAX — without GROUP BY they collapse the whole selection into one row.',
    ],
    examples: [
      {
        label: 'ORDER BY + LIMIT — the top of the list',
        result:
          'The three most expensive products: Standing Desk at 430, Coffee Machine at 380 and 4K Monitor at 320. LIMIT cuts an already ordered list, so without ORDER BY it would simply give three arbitrary rows.',
      },
      {
        label: 'DISTINCT — drop the repeats',
        result:
          'One column with the list of categories, each exactly once, with no regard for how many products are in it.',
      },
      {
        label: 'BETWEEN — a range instead of two comparisons',
        result:
          'The products priced from 50 to 150 inclusive, from the cheapest to the most expensive. The same as price >= 50 AND price <= 150.',
      },
      {
        label: 'LIKE — searching by a fragment of text',
        result:
          'The names that have “Set” somewhere inside. The % character means “any number of any characters”.',
      },
      {
        label: 'Aggregates without GROUP BY',
        result:
          'Exactly one row with three numbers over the whole table: how many products there are, the lowest price, the highest price.',
      },
    ],
    pitfalls: [
      {
        title: 'ORDER BY limits nothing by itself',
        text: 'Sorting only changes the order of the rows — there are still as many of them. To take the three most expensive products you need both parts: ORDER BY price DESC LIMIT 3.',
      },
      {
        title: '= NULL will never work',
        text: 'NULL means “the value is unknown”, and any comparison with it gives neither “yes” nor “no” but “unknown”. That is why WHERE department = NULL always comes back empty; the right way to write it is IS NULL or IS NOT NULL.',
      },
      {
        title: 'Text goes in single quotes',
        text: 'WHERE category = \'Kitchen\' works, while WHERE category = "Kitchen" does not: PostgreSQL treats double quotes as a column name rather than text, and will complain that a column “Kitchen” does not exist.',
      },
    ],
  },

  2: {
    summary:
      'GROUP BY puts the rows into piles by a shared value, and an aggregate (COUNT, SUM, AVG, MIN, MAX) turns every pile into one row of the answer.',
    summaryBlocks: [
      [
        'In a SELECT after GROUP BY you may take only the columns you grouped by, plus aggregates of the rest.',
        'HAVING is a filter of the groups themselves: it works after the counting, whereas WHERE throws individual rows away before the grouping.',
      ],
    ],
    examples: [
      {
        label: 'A sum within each group',
        result:
          'One row per category: how many units of that category lie in the warehouse in total, from the biggest pile to the smallest.',
      },
      {
        label: 'Several aggregates in one pass',
        result:
          'A row per manager: how many orders they ran and what their average ticket is, rounded to cents.',
      },
      {
        label: 'MIN and MAX — the bounds of each group',
        result:
          'Five categories, each with the price of its cheapest and its most expensive product. Stationery spreads from 4.20 to 15.00, Furniture from 45.50 to 430.00.',
      },
      {
        label: 'HAVING — a filter of the finished groups',
        result:
          'Only the customers whose total order value went above 1000. Customers with a smaller total are still gathered into piles, but they do not make it into the answer.',
      },
      {
        label: 'COUNT(*) versus COUNT(column)',
        result:
          'Two different numbers: 12 and 11. COUNT(*) counts every row, COUNT(department) only those where department is not NULL.',
      },
    ],
    pitfalls: [
      {
        title: 'WHERE does not see aggregates',
        text: 'WHERE COUNT(*) > 4 is an error, because WHERE runs before the groups exist at all. Conditions on COUNT, SUM or AVG go into HAVING. And the other way round: an ordinary condition on a row (price > 100, say) is cheaper to put into WHERE than into HAVING.',
      },
      {
        title: 'A column outside GROUP BY and outside an aggregate',
        text: 'If you pick a column that is neither in GROUP BY nor inside an aggregate, PostgreSQL refuses to run the query: “column must appear in the GROUP BY clause”. That is not fussiness — without such a rule it would be unclear which value from the group that column is supposed to show.',
      },
      {
        title: 'AVG skips NULL rather than counting it as zero',
        text: 'AVG(salary) over 10 rows where two salaries are empty divides the sum by 8 and not by 10. If an empty value is meant to mean zero, that has to be said explicitly: AVG(COALESCE(salary, 0)).',
      },
    ],
  },

  3: {
    summary:
      'JOIN stitches the rows of two tables together by the condition in ON — usually a match of identifiers.',
    summaryBlocks: [
      [
        'INNER JOIN keeps only the pairs where both halves were found.',
        'LEFT JOIN keeps every row of the left table and puts NULL where no pair was found.',
      ],
      'That is exactly why the LEFT JOIN + IS NULL pairing answers the question “and who has nothing at all”.',
    ],
    examples: [
      {
        label: 'INNER JOIN — matches only',
        result:
          'The June orders with the customer name beside them. A customer without June orders will not appear even once. The word INNER is optional here: a lone JOIN means exactly the same, but in the topic title the construction goes by its full name.',
      },
      {
        label: 'LEFT JOIN + IS NULL — find those who have nothing',
        result:
          'The customers who placed no order at all. LEFT JOIN kept them in the selection with empty order columns, and WHERE left exactly those rows.',
      },
      {
        label: 'JOIN + GROUP BY — the top products by units sold',
        result:
          'The five products bought in the largest quantity. First the order lines get the product name, then the result is grouped.',
      },
      {
        label: 'USING — a chain of three tables written shorter',
        result:
          'The five earliest lines with the order date and the product name — now the chain really does hold three tables. USING (order_id) is shorter than ON o.order_id = oi.order_id and at the same time leaves one order_id column in the result instead of two with the same name.',
      },
    ],
    pitfalls: [
      {
        title: 'A JOIN without ON multiplies the rows',
        text: 'If the join condition is forgotten, every row of the left table is glued to every row of the right one: 8 customers and 31 orders give 248 rows instead of 31. A sudden growth in the number of rows is the first sign of a lost ON.',
      },
      {
        title: 'A condition on the right table in WHERE kills a LEFT JOIN',
        text: 'LEFT JOIN orders o ... WHERE o.amount > 100 throws out every customer without orders, because NULL is not greater than 100 — and the LEFT JOIN quietly turns into an INNER one. If the customers without orders have to be kept, the condition goes into ON: ON o.customer_id = c.customer_id AND o.amount > 100.',
      },
      {
        title: 'COUNT(*) after a LEFT JOIN counts 1 instead of 0',
        text: 'A LEFT JOIN keeps the row even when nothing was found on the right — simply with empty columns. COUNT(*) counts rows, so for a customer without a single order it returns 1. What has to be counted is a column from the right table: COUNT(o.order_id) gives an honest 0, because COUNT does not count NULL.',
      },
    ],
  },

  4: {
    summary: 'A subquery is a query inside a query, taken in brackets.',
    summaryBlocks: [
      [
        'A scalar subquery most often computes one number (the average salary, say) that every row is then compared with.',
        'A CTE is the same subquery, but moved to the top through WITH and given a name: from then on it is referred to like an ordinary table.',
      ],
      'The result is the same, it reads better, and one CTE can be used several times or have the next one built on top of it. When a solution no longer fits in your head, lay it out as named steps.',
    ],
    examples: [
      {
        label: 'A scalar subquery in WHERE',
        result:
          'First the average price of electronics is computed — one number. Then every product of any category is compared with exactly that.',
      },
      {
        label: 'A subquery in the list of columns',
        result:
          'The products with fewer than 10 left, and beside them how much cheaper each is than the most expensive product of the price list.',
      },
      {
        label: 'NOT IN — exclude by a ready-made list',
        result:
          'One row: Sofia Rossi, the only customer without a single order. The subquery first gathers the list of those who ordered, and the outer query drops everyone on that list.',
      },
      {
        label: 'NOT EXISTS — exclude by a condition',
        result:
          'The same Sofia Rossi, but by a different road: the subquery here does not gather a list; instead, for every customer it asks “does at least one order exist”. That is exactly why SELECT holds a 1 — the value is not needed, only the presence of a row matters.',
      },
      {
        label: 'WITH — give an intermediate step a name',
        result:
          'The dates on which more than one order came in. The first step counts the orders per day, the second filters the finished result.',
      },
      {
        label: 'Two CTEs in a row',
        result:
          'The customers whose purchase total is above the average total across customers. The second CTE is built on the first — that is how the problem falls apart into two simple steps.',
      },
    ],
    pitfalls: [
      {
        title: 'A scalar subquery has to give back one value',
        text: 'The form price > (SELECT ...) expects exactly one row and one column. If the subquery returns several rows, there will be an error. When several values are what you need, IN is taken instead of >: WHERE customer_id IN (SELECT customer_id FROM orders).',
      },
      {
        title: 'NOT IN breaks on NULL',
        text: 'If even one NULL turns up among the values of the subquery, NOT IN returns no rows at all — and there will be no error either. For questions of the “who is not on the list” kind it is safer to write NOT EXISTS or LEFT JOIN ... IS NULL.',
      },
      {
        title: 'A CTE lives only inside its own query',
        text: 'After the semicolon the name declared in WITH disappears — it is not a table you created. And a CTE can only be referred to below the place it was declared: the second CTE sees the first, but not the other way round.',
      },
    ],
  },

  5: {
    summary:
      'A window function computes just like an aggregate but does not glue the rows together: every row stays in place and gets one more column. What exactly to compute is decided by OVER.',
    summaryBlocks: [
      [
        'PARTITION BY divides the table into independent parts — each department separately, for instance.',
        'ORDER BY sets the order of the rows inside such a part.',
      ],
      'That is how numbering (ROW_NUMBER, RANK), access to neighbouring rows (LAG, LEAD) and running totals appear.',
      'This is the answer to the question “and how does this row look against its own group”.',
    ],
    examples: [
      {
        label: 'Numbering inside each group',
        result:
          'All 25 products in place, each with its position by price inside its own category. The numbering starts from 1 again for every category.',
      },
      {
        label: 'RANK and DENSE_RANK — two ways of handling ties',
        result:
          'The eight most expensive products. Office Chair and Docking Station both cost 210 and both get fifth place — and from there the paths diverge: RANK jumps to seventh, DENSE_RANK goes to sixth. The difference shows up only where there is a tie, so looking at them one at a time is pointless.',
      },
      {
        label: 'Compare a row with its own group',
        result:
          'Every employee and the difference between their salary and the lowest salary in their department. GROUP BY would not do here: it would leave one row per department.',
      },
      {
        label: 'LAG and LEAD — peek into a neighbouring row',
        result:
          'Every order sees its neighbours by date: LAG gives the amount of the previous one, LEAD the amount of the next. In the very first row prev_amount is empty, because there simply is no previous one — and the “current minus previous” difference is built on exactly that.',
      },
      {
        label: 'NTILE — lay the rows out into equal parts',
        result:
          'The products divided by price into four groups of roughly equal size: 1 is the cheapest quarter of the price list, 4 the most expensive.',
      },
      {
        label: 'The window frame — a moving average',
        result:
          'For every order, the average amount over it and the two previous ones. ROWS BETWEEN narrows the window from “the whole part” down to three neighbouring rows.',
      },
    ],
    pitfalls: [
      {
        title: 'OVER cannot be written in WHERE',
        text: 'Windows are computed after WHERE has thrown rows away, so WHERE ROW_NUMBER() OVER (...) = 1 is an error. The working way: compute the number inside a CTE and filter with the outer query by the finished column.',
      },
      {
        title: 'RANK, DENSE_RANK and ROW_NUMBER count differently',
        text: 'On equal values RANK leaves holes (1, 2, 2, 4), DENSE_RANK leaves none (1, 2, 2, 3), and ROW_NUMBER simply numbers in a row (1, 2, 3, 4) and picks the order among equals arbitrarily. Without that difference the question “who is in second place” has no unambiguous answer.',
      },
      {
        title: 'PARTITION BY is not GROUP BY',
        text: 'GROUP BY reduces the number of rows, PARTITION BY never does. If you expected one row per department in the answer and got as many rows as there are employees, then what you needed was an ordinary aggregate rather than a window function.',
      },
    ],
  },

  6: {
    summary:
      'Dates in PostgreSQL are a type of their own rather than text, which is why arithmetic works with them.',
    summaryBlocks: [
      [
        'DATE_TRUNC cuts a date down to the start of a period — a month, a quarter, a year — and that is exactly how monthly reports get one value for the whole month.',
        'EXTRACT pulls a number out of a date: the year, the month, the day of the week.',
        "Adding INTERVAL '30 days' gives a new date.",
        'AGE computes the difference between two dates in the words “so many years, months and days”.',
        'TO_CHAR turns a date into text by a template — that is what readable labels are made with.',
      ],
      'String functions solve a different problem: tidying up whatever came in from a form.',
      [
        'TRIM removes the spaces at the edges.',
        'INITCAP makes “First Last” out of any case.',
        'SPLIT_PART cuts a value apart at a separator.',
        'SUBSTRING together with POSITION pulls out a piece by position.',
        'It is the || operator that glues everything together.',
      ],
    ],
    examples: [
      {
        label: 'DATE_TRUNC — reduce the dates to a month',
        result:
          'Six rows, one per month. DATE_TRUNC cut every date down to the first day of its month, so all the January orders merged into one row: 3 orders, average ticket 131.83.',
      },
      {
        label: 'EXTRACT — pull a part out of a date',
        result:
          'The five earliest orders with the number of the weekday and the number of the month. The numbering of the days starts from zero-Sunday, so 5 is Friday, 4 is Thursday and 6 is Saturday.',
      },
      {
        label: 'INTERVAL and AGE — date arithmetic',
        result:
          'The first order, from 5 January, has a payment deadline of 4 February, and “5 mons 27 days” separate it from 1 July. INTERVAL adds a span to a date and returns a date, AGE subtracts one date from another and returns a span in words.',
      },
      {
        label: 'TRIM and INITCAP — clean up a raw name',
        result:
          'The raw value and the cleaned one are visible side by side: “ anna kovalenko ” becomes “Anna Kovalenko”. In the third contact the double space inside is still there — TRIM does not see it.',
      },
      {
        label: 'SPLIT_PART — cut a value apart at a separator',
        result:
          'Ten contacts with the domain as a separate column: example.com, mail.ua, bondar.dev. The third argument is the number of the piece, so 2 means “what comes after the at sign”; with 1 you would get the mailbox name.',
      },
      {
        label: 'TO_CHAR and || — assemble a readable label',
        result:
          'Five labels of the form “05.01.2024 — 120.50”: TO_CHAR turned the date into text by a template, and || glued it to the amount.',
      },
    ],
    pitfalls: [
      {
        title: 'EXTRACT gives a number, not text with a leading zero',
        text: "EXTRACT(YEAR FROM d) || '-' || EXTRACT(MONTH FROM d) gives 2024-1 rather than 2024-01: a number has no leading zero. Comparing with a string (= '2024') is fine meanwhile — PostgreSQL will reduce it to a number itself. A label for a report, though, is made with TO_CHAR(d, 'YYYY-MM'), which gives 2024-01.",
      },
      {
        title: 'TRIM removes the spaces at the edges only',
        text: "TRIM('  a  b  ') returns 'a  b' — the double space inside stays. Removing it is a job for REPLACE(x, '  ', ' '). And REPLACE looks for exactly pairs, so with three spaces in a row one survives a single pass.",
      },
      {
        title: 'DATE_TRUNC gives the first date of a period, not its name',
        text: "DATE_TRUNC('month', DATE '2024-03-17') returns 2024-03-01 — the start of the period, a timestamp. That is handy for grouping and sorting but is not a caption: “March 2024” is made by TO_CHAR. And the other way round — sorting by the textual name of a month is not allowed: ORDER BY on it gives April, February, January, because the order is alphabetical.",
      },
      {
        title: 'In SQLite this is written differently',
        text: "Level 6 is where the dialects diverge the most, and SQLite still turns up in old projects and at interviews. The equivalents: DATE_TRUNC('month', d) ↔ date(d, 'start of month'), EXTRACT(YEAR FROM d) ↔ strftime('%Y', d), d + INTERVAL '30 days' ↔ date(d, '+30 days'). Only the left column works in our trainer.",
      },
    ],
  },

  7: {
    summary:
      'CASE lets you return different values depending on a condition. It checks the conditions in turn and returns the result of the first one that holds. If no condition holds, ELSE is used. If no ELSE is given, the result will be NULL. END marks the end of the CASE construction.',
    summaryBlocks: [
      'COALESCE is used when a NULL has to be replaced with another value. It returns the first value from the list that is not NULL. That is handy, for example, when a readable text has to be shown in place of a missing value, or a fallback value used.',
      'NULLIF works the other way round: it turns a particular value into NULL if it matches the one given. This is often used to turn a zero into NULL before a division, in order to avoid dividing by zero.',
      'UNION, UNION ALL, INTERSECT and EXCEPT let you compare or combine the results of two queries.',
      'Unlike JOIN, which adds columns from another table, the set operations work with rows: the results of two queries are combined one under another.',
      [
        'UNION — combines the results and removes the duplicates.',
        'UNION ALL — combines the results, keeping the duplicates.',
        'INTERSECT — keeps the rows that are in both results.',
        'EXCEPT — keeps the rows of the first result that are absent from the second.',
      ],
      'For all four operations both queries have to return the same number of columns, and the corresponding columns have to have compatible data types.',
    ],
    examples: [
      {
        label: 'CASE with ELSE — the pay level',
        result:
          'Twelve rows from the highest salary to the lowest. Two landed in high, seven in mid, three in low. The conditions are checked from the top down, so Oksana with 8100 stops at the very first branch and never sees the second.',
      },
      {
        label: 'SUM(CASE) — rows become columns',
        result:
          'Five rows, one per department, and a separate row for the employee without a department. IT gives 4 and 0, HR gives 0 and 2. This is how pivot tables are built: a category becomes a column rather than a value in a column.',
      },
      {
        label: 'COALESCE and NULLIF — two opposite actions',
        result:
          "Twelve rows in which both actions are visible side by side. Bohdan’s department is empty, and COALESCE put “Not stated” there. For everyone in IT, NULLIF did the opposite and made it empty — because their value matched the one we asked to hide. For that same Bohdan hidden_it is empty too, but for another reason: NULLIF(NULL, 'IT') gives NULL by itself.",
      },
      {
        label: 'UNION — combine two lists without repeats',
        result:
          'Five rows — every category that has either a very expensive or a very cheap product. The same query with UNION ALL gives 15 rows: a category repeats as many times as it has products matching the condition.',
      },
      {
        label: 'INTERSECT — the common part of two lists',
        result:
          'Three categories — Electronics, Furniture and Kitchen: each has both a product from 200 and a product cheaper than 50. That is the widest price spread in the catalogue.',
      },
      {
        label: 'EXCEPT — subtract one list from another',
        result:
          'Three rows: HR, Marketing and the empty department — those are exactly where nobody earns 6000 or more. The empty row is no accident here: the set operations treat NULL as an ordinary value and match it against NULL, whereas an ordinary comparison NULL = NULL is never true.',
      },
      {
        label: 'CASE in ORDER BY — an order of your own that is not in the data',
        result:
          'First all the electronics from the most expensive down, then the furniture — Standing Desk at 430. Neither the alphabet nor the numbers give such an order: ORDER BY takes an expression, and CASE turns the category name into a number that the sorting then follows. That number is not visible in the result.',
      },
    ],
    pitfalls: [
      {
        title: 'A CASE without ELSE silently gives NULL',
        text: 'If no branch matched and no ELSE is written, CASE returns NULL — not an empty string and not a zero. In a table that looks like a gap, and in computations it behaves in different ways: COUNT will not count such a row, SUM will ignore it, and concatenation through || will turn the whole result into NULL.',
      },
      {
        title: 'The order of the CASE branches is the priority',
        text: "The branches are checked from the top down, and the first one that matches wins. That is why a wider condition must not stand before a narrower one: in CASE WHEN price < 200 THEN 'standard' WHEN price < 50 THEN 'budget' END the second branch will never fire — everything cheaper than 50 has already matched the first. There will be no error, there will be a silently wrong result.",
      },
      {
        title: 'UNION removes duplicates, UNION ALL does not',
        text: 'On our data this is visible literally: combining the categories of expensive and cheap products through UNION gives 5 rows, and through UNION ALL 15. Deduplication is not free: to find the repeats the database has to do extra work — hashing or sorting, depending on what the planner chooses. If there are deliberately no repeats, or they do not get in the way, take UNION ALL.',
      },
      {
        title: 'EXCEPT is asymmetric',
        text: 'A EXCEPT B and B EXCEPT A are different questions with different answers. The categories minus the categories with expensive products give 2 rows (Sports and Stationery — there is nothing from 200 there), and the other way round 0, because every category with an expensive product is also among all the categories. An empty result here is not “nothing was found” but a sign that the operands are the wrong way round.',
      },
    ],
  },
};
