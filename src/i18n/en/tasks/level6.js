// Англійський текст завдань рівня 6 (дати та рядки).
//
// Тут найгустіше SQL у прозі: EXTRACT, DATE_TRUNC, TO_CHAR, AGE, INTERVAL,
// SPLIT_PART, TRIM, LOWER, UPPER, INITCAP, REPLACE, LENGTH, POSITION,
// SUBSTRING. Усе це лишається великими літерами — тест звіряє набір.
export default {
  'L6-hires-per-year': {
    title: 'Hiring by year',
    context:
      'HR is preparing a report on hiring pace by year to plan next year’s recruitment budget.',
    taskText: 'Count how many employees were hired in each year.',
    hints: [
      'The employees have to be grouped not by the exact hire date but by the year visible in it.',
      'EXTRACT(YEAR FROM ...) pulls only the year out of a date as a number — and that is what you can group by.',
      'Skeleton: SELECT EXTRACT(YEAR FROM hire_date) AS hire_year, COUNT(*) AS hired FROM employees GROUP BY hire_year ORDER BY hire_year;',
    ],
    explanation:
      'EXTRACT(YEAR FROM ...) turns a date into a number — the year. Grouping by hire_date itself makes no sense: every date is unique, so GROUP BY hire_date would give as many groups as there are rows, and no real yearly total would come out of it.',
  },

  'L6-orders-by-weekday': {
    title: 'Weekdays of the orders',
    context:
      'A warehouse manager wants to know which weekdays take the most orders, in order to plan the staff shifts.',
    taskText: 'Count the number of orders for each day of the week.',
    hints: [
      'The orders have to be counted not by a particular date but by which day of the week it is.',
      'EXTRACT(DOW FROM ...) returns the number of the weekday for a date.',
      'Skeleton: SELECT EXTRACT(DOW FROM order_date) AS weekday, COUNT(*) AS orders_count FROM orders GROUP BY weekday ORDER BY weekday;',
    ],
    explanation:
      'EXTRACT(DOW FROM ...) numbers the weekdays from zero to six. The trap is that zero means Sunday rather than Monday, as people intuitively expect — which is why this column is often misread in reports and the weekend is attributed to the wrong days.',
  },

  'L6-revenue-by-month': {
    title: 'Revenue by month',
    context: 'Finance wants to see the revenue dynamics by month in order to compare the seasons.',
    taskText: 'Calculate the order total for each month.',
    hints: [
      'The order total has to be computed not for every single day but with the dates reduced to their month.',
      "DATE_TRUNC('month', ...) cuts a date down to the first day of its month.",
      "Skeleton: SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount) AS revenue FROM orders GROUP BY month ORDER BY month;",
    ],
    explanation:
      "DATE_TRUNC('month', ...) zeroes out everything smaller than a month, so 3 and 17 January both turn into the same 2024-01-01 and land in one group. Grouping by order_date directly makes no sense — it is almost always unique, and GROUP BY would collapse nothing.",
  },

  'L6-trim-names': {
    title: 'Remove the extra spaces',
    context:
      'A contact centre agent has imported a contact list from a CRM where the fields were filled in by hand and with all sorts of spaces.',
    taskText: 'Show the contact number and the name without spaces at the edges.',
    hints: [
      'The names have to be shown with the spaces that stand before or after the name removed.',
      'TRIM(...) removes the spaces from both edges of a string.',
      'Skeleton: SELECT contact_id, TRIM(raw_name) AS clean_name FROM raw_contacts ORDER BY contact_id;',
    ],
    explanation:
      'TRIM removes spaces only from the start and the end of a string and does not touch what is inside. The contact with id 3 has a double space between the words — TRIM does not see it, and in the result “Olena  Shevchenko” keeps its two spaces in the middle.',
  },

  'L6-lower-emails': {
    title: 'Email in a single case',
    context:
      'A marketer is preparing a mailing and wants to find duplicate addresses that differ only in letter case.',
    taskText: 'Show the contact number and the email address in lower case.',
    hints: [
      'All the email addresses have to be brought to one case so that identical addresses written differently look the same.',
      'LOWER(...) turns every letter of a string into lower case.',
      'Skeleton: SELECT contact_id, LOWER(raw_email) AS email FROM raw_contacts ORDER BY contact_id;',
    ],
    explanation:
      "String comparison in SQL is case-sensitive: 'ANNA.K@Example.COM' = 'anna.k@example.com' returns false, even though for a person it is the same address. That is why addresses are brought to one case before a comparison or a duplicate search — LOWER is the standard move here.",
  },

  'L6-contact-code': {
    title: 'A fixed-width contact code',
    context:
      'Support wants short contact codes of equal length for internal references inside tickets.',
    taskText:
      'Show a four-digit contact code with leading zeros and the length of its cleaned-up name.',
    hints: [
      'The contact number has to be turned into a string of fixed length with zeros in front, and the number of characters in the cleaned-up name counted separately.',
      "LPAD(..., 4, '0') pads a string on the left up to the required length, and LENGTH(...) counts the characters in a string.",
      "Skeleton: SELECT LPAD(contact_id::TEXT, 4, '0') AS contact_code, LENGTH(TRIM(raw_name)) AS name_length FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'LPAD works with text only, so the number contact_id is first brought to text with ::TEXT — otherwise LPAD refuses on types. LENGTH counts exactly the characters, and if the spaces are not removed beforehand with TRIM, they go into the length count as well.',
  },

  'L6-contact-signature': {
    title: 'A signature for the mailing',
    context:
      'The mailing team is building a “Name <email>” signature for the letter template of every contact.',
    taskText: 'Build a signature of the form “Name <email>” for each contact.',
    hints: [
      'One text field has to be assembled from the cleaned-up name and the email address in angle brackets.',
      'The || operator glues strings into one.',
      "Skeleton: SELECT contact_id, TRIM(raw_name) || ' <' || LOWER(raw_email) || '>' AS signature FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'The || operator glues all its operands into one string, one after another. The trap is that any NULL among the operands turns the whole result into NULL rather than just its own part — which is why the concatenation of raw fields, where empty values are possible, is usually insured with COALESCE.',
  },

  'L6-month-label': {
    title: 'The month as a text label',
    context:
      'Management needs a revenue report with the months as names rather than numbers, in natural chronological order.',
    taskText:
      'Show the revenue for each month, labelling the month with its name and year, in chronological order.',
    hints: [
      'The month has to be labelled not with a number but with a word such as “January 2024”, and the rows have to come out in time order rather than alphabetically by the name.',
      "TO_CHAR(..., 'FMMonth YYYY') formats a date into a text label with the month name; the FM prefix removes the extra padding spaces.",
      "Skeleton: SELECT TO_CHAR(order_date, 'FMMonth YYYY') AS month_label, SUM(amount) AS revenue FROM orders GROUP BY month_label ORDER BY MIN(order_date);",
    ],
    explanation:
      'Without the FM prefix TO_CHAR pads the month name with spaces up to an equal length, and FM removes that. Sorting by the label itself is not possible here: ORDER BY month_label would give alphabetical order — April, February, January — so the rows are ordered by the actual date through MIN(order_date).',
  },

  'L6-quarter-summary': {
    title: 'Quarterly totals',
    context:
      'Management reconciles the sales plan every quarter and wants the number and the amount of orders by quarter.',
    taskText: 'For each quarter, show the number of orders and their total amount.',
    hints: [
      'The orders have to be reduced to the quarter rather than the month, and both the count and the sum computed for each.',
      "DATE_TRUNC('quarter', ...) cuts a date down to the start of the quarter exactly as 'month' cuts it down to the start of the month.",
      "Skeleton: SELECT DATE_TRUNC('quarter', order_date) AS quarter, COUNT(*) AS orders_count, SUM(amount) AS revenue FROM orders GROUP BY quarter ORDER BY quarter;",
    ],
    explanation:
      "DATE_TRUNC takes different rounding units — 'month', 'quarter', 'year', 'week' — and works on the same principle. The result for a quarter is not a number from 1 to 4 but a date: the first day of the first month of the quarter, so the second quarter of 2024 is labelled 2024-04-01.",
  },

  'L6-return-deadline': {
    title: 'The return deadline for a product',
    context:
      'Support is checking whether the right of return is still valid for the orders placed from the beginning of June.',
    taskText:
      'For the orders from 1 June 2024 onwards, show the number, the date and the date on which the 30-day return period expires.',
    hints: [
      'For the not-too-old orders you have to show their date and the date that comes 30 days after it.',
      "INTERVAL '30 days' can be added to a date, and the result is a new date 30 days later.",
      "Skeleton: SELECT order_id, order_date, order_date + INTERVAL '30 days' AS return_deadline FROM orders WHERE order_date >= DATE '2024-06-01' ORDER BY order_id;",
    ],
    explanation:
      "An INTERVAL can be added to a DATE directly — the result is no longer a DATE but a timestamp, even if the time in it is zero. The word DATE in front of a literal sets the type explicitly, and that matters where the type has nowhere to come from: '2024-6-1' > '2024-12-01' gives true, because this compares two pieces of text, while DATE '2024-06-01' > '2024-12-01' gives false, because here dates are being compared.",
  },

  'L6-experience-at-date': {
    title: 'Length of service at the year end',
    context:
      'HR is preparing an annual report on length of service as of the year end rather than as of today.',
    taskText: 'Calculate the length of service of each employee as of 31 December 2024.',
    hints: [
      'You have to compute how much time passed from the hire date to one particular fixed date — 31 December 2024.',
      'AGE(date1, date2) returns the difference between two dates as years, months and days.',
      "Skeleton: SELECT first_name, hire_date, AGE(DATE '2024-12-31', hire_date) AS experience FROM employees ORDER BY hire_date;",
    ],
    explanation:
      "AGE with two arguments computes the difference between them, and with one argument the difference between it and today’s date. The second form will not do for a report: the result would change every day along with the current date, so the reference date is set explicitly here — DATE '2024-12-31'.",
  },

  'L6-source-parts': {
    title: 'The channel and the subchannel of a referral',
    context:
      'A marketer is breaking traffic sources into a channel and a subchannel in order to judge each one separately.',
    taskText: 'Break the referral source into a channel and a subchannel.',
    hints: [
      'The source is written as one string with a slash inside — it has to be split into two parts: before the slash and after it.',
      'SPLIT_PART(string, separator, number) returns the part of the string given by the number.',
      "Skeleton: SELECT contact_id, SPLIT_PART(source, '/', 1) AS channel, SPLIT_PART(source, '/', 2) AS subchannel FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      "SPLIT_PART numbers the parts of a string from one rather than from zero. If a part with that number does not exist, the function returns an empty string '' rather than NULL — so an IS NULL check will not find such “missing” values, and they have to be looked for by comparing with ''.",
  },

  'L6-email-domain': {
    title: 'The domain of an email address',
    context: 'An analyst wants to see which email domains occur most often among the contacts.',
    taskText:
      'Pull the domain out of every address — everything after the at sign — in lower case.',
    hints: [
      'The part after the @ character has to be cut out of the email address and brought to lower case.',
      'POSITION(substring IN string) finds the number of the character the substring starts at, and SUBSTRING(string FROM number) takes everything from that number to the end.',
      "Skeleton: SELECT contact_id, LOWER(SUBSTRING(raw_email FROM POSITION('@' IN raw_email) + 1)) AS domain FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      "POSITION returns the character number from one rather than from zero, so 1 is added to the result to make SUBSTRING start cutting right after the at sign rather than at the sign itself. If the string has no '@' character, POSITION returns 0, and SUBSTRING FROM 1 silently gives back the whole original string instead of an error or a NULL.",
  },

  'L6-clean-contacts': {
    title: 'A full clean-up of a contact',
    context:
      'Before the upload into the new CRM the contacts have to be brought to one tidy format.',
    taskText:
      'Tidy the contacts up: the name without extra spaces and with every word capitalised, the email in lower case.',
    hints: [
      'The name has to be cleaned of the extra spaces and have every word capitalised at the same time, and the email brought to lower case.',
      'REPLACE removes the repeated spaces, TRIM cuts the edges, and INITCAP capitalises every word — they can be nested inside one another.',
      "Skeleton: SELECT contact_id, INITCAP(TRIM(REPLACE(raw_name, '  ', ' '))) AS clean_name, LOWER(TRIM(raw_email)) AS clean_email FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'Nested functions are executed from the inside out, and the order matters here: had INITCAP been applied to the uncleaned string, the double spaces between the words would still be there. REPLACE looks for exactly pairs of spaces and replaces them with one — with three spaces in a row one extra would still be left, which is why the fixtures deliberately have two and not three.',
  },

  'L6-monthly-customer-report': {
    title: 'A monthly report by customer',
    context:
      'Finance is rolling sales up by month and customer for the monthly report, in the business format “SURNAME, First name”.',
    taskText:
      'Roll the order totals up by month and customer: the month as 2024-01, the customer as “SURNAME, First name”.',
    hints: [
      'The order total has to be computed separately for each “month plus customer” pair, and the customer name shown in the “SURNAME, First name” format.',
      "TO_CHAR(..., 'YYYY-MM') gives the month label, SPLIT_PART breaks the full name into surname and first name by the space, and UPPER and INITCAP set the case of each half.",
      "Skeleton: SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS month, UPPER(SPLIT_PART(c.name, ' ', 2)) || ', ' || INITCAP(SPLIT_PART(c.name, ' ', 1)) AS customer, SUM(o.amount) AS total FROM orders o JOIN customers c ON c.customer_id = o.customer_id GROUP BY month, customer ORDER BY month, customer;",
    ],
    explanation:
      "PostgreSQL allows grouping by the aliases of computed columns (GROUP BY month, customer), so the bulky expressions from SELECT do not have to be duplicated in GROUP BY. TO_CHAR(..., 'YYYY-MM') turns a date into a text label in year-month format, for example 2026-08. Such a format is convenient for sorting, because it keeps the right chronological order — unlike month names in words, where the alphabetical and the chronological order may differ. UPPER and INITCAP set the format of the two halves of the name separately: the surname comes out in upper case and the first name capitalised.",
  },
};
