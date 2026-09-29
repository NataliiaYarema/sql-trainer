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
};
