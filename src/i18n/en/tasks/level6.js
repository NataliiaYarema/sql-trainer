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
      'The employees have to be grouped not by the exact hire date but by the year contained in it.',
      'EXTRACT(YEAR FROM ...) pulls the year out of a date as a number — and that is what you can group by.',
      'Skeleton: SELECT EXTRACT(YEAR FROM hire_date) AS hire_year, COUNT(*) AS hired FROM employees GROUP BY hire_year ORDER BY hire_year;',
    ],
    explanation:
      'EXTRACT(YEAR FROM ...) returns the year as a number. Grouping by hire_date itself would group employees by their exact dates, not by year, so employees hired on different dates would end up in different groups. In this data every hire date is unique, so GROUP BY hire_date would give as many groups as there are rows. Extracting the year first gives one group for each year.',
  },
  'L6-orders-by-weekday': {
    title: 'Weekdays of the orders',
    context:
      'A warehouse manager wants to know which weekdays take the most orders, in order to plan the staff shifts.',
    taskText: 'Count the number of orders for each day of the week.',
    hints: [
      'The orders have to be counted not by a particular date but by which day of the week it is.',
      'EXTRACT(DOW FROM ...) returns the weekday number for a date.',
      'Skeleton: SELECT EXTRACT(DOW FROM order_date) AS weekday, COUNT(*) AS orders_count FROM orders GROUP BY weekday ORDER BY weekday;',
    ],
    explanation:
      'In PostgreSQL, EXTRACT(DOW FROM ...) returns 0 for Sunday, 1 for Monday, and so on up to 6 for Saturday. This is worth remembering when interpreting the result: the numbering does not start with Monday.',
  },
  'L6-revenue-by-month': {
    title: 'Revenue by month',
    context: 'Finance wants to see the revenue dynamics by month in order to compare the seasons.',
    taskText: 'Calculate the order total for each month.',
    hints: [
      'The order total has to be computed not for every single day but with the dates reduced to their month.',
      "DATE_TRUNC('month', ...) moves a date to the start of its month.",
      "Skeleton: SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount) AS revenue FROM orders GROUP BY month ORDER BY month;",
    ],
    explanation:
      "DATE_TRUNC('month', ...) changes each date to the start of its month, so dates such as 3 January and 17 January both become 2024-01-01. Grouping by that value puts all orders from the same month into one group. Grouping by order_date instead would group by exact date and therefore produce separate totals for different days — and since the order dates here are almost all different, it would collapse almost nothing.",
  },
  'L6-trim-names': {
    title: 'Remove the extra spaces',
    context:
      'A contact centre agent has imported a contact list from a CRM where the fields were filled in by hand and with all sorts of spaces.',
    taskText: 'Show the contact number and the name without spaces at the edges.',
    hints: [
      'The names have to be shown with the spaces that stand before or after the name removed.',
      'TRIM(...) removes spaces from both edges of a string.',
      'Skeleton: SELECT contact_id, TRIM(raw_name) AS clean_name FROM raw_contacts ORDER BY contact_id;',
    ],
    explanation:
      'TRIM removes spaces from the start and end of a string, but does not change spaces inside it. The contact with id 3 has a double space between the words, so in the result “Olena  Shevchenko” keeps both spaces in the middle.',
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
      "In PostgreSQL, ordinary text comparison is case-sensitive: 'ANNA.K@Example.COM' = 'anna.k@example.com' does not evaluate to TRUE. Converting both values to the same case is therefore a common way to normalise text before comparison or duplicate detection.",
  },
  'L6-contact-code': {
    title: 'A fixed-width contact code',
    context:
      'Support wants short contact codes of equal length for internal references inside tickets.',
    taskText:
      'Show a four-digit contact code with leading zeros and the length of its cleaned-up name.',
    hints: [
      'The contact number has to be turned into a string of fixed length with zeros in front, and the number of characters in the cleaned-up name counted separately.',
      "LPAD(..., 4, '0') pads a string on the left up to the required length, and LENGTH(...) counts characters in a string.",
      "Skeleton: SELECT LPAD(contact_id::TEXT, 4, '0') AS contact_code, LENGTH(TRIM(raw_name)) AS name_length FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'LPAD works with text, so contact_id is explicitly converted with ::TEXT first. LENGTH counts the characters in the resulting string, and TRIM removes leading and trailing spaces before the name is measured.',
  },
  'L6-contact-signature': {
    title: 'A signature for the mailing',
    context:
      'The mailing team is building a “Name <email>” signature for the letter template of every contact.',
    taskText: 'Build a signature of the form “Name <email>” for each contact.',
    hints: [
      'One text field has to be assembled from the cleaned-up name and the email address in angle brackets.',
      'The || operator concatenates strings into one.',
      "Skeleton: SELECT contact_id, TRIM(raw_name) || ' <' || LOWER(raw_email) || '>' AS signature FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'The || operator concatenates its operands from left to right. If any operand is NULL, the resulting concatenation is NULL, so COALESCE can be useful when optional fields may be missing and you want to keep the rest of the text.',
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
      'Without the FM prefix, TO_CHAR pads the month name with spaces to a fixed width; FM removes that padding. The label itself is text, so ordering by month_label would sort alphabetically — April, February, January — rather than chronologically. ORDER BY MIN(order_date) keeps the months in time order.',
  },
  'L6-quarter-summary': {
    title: 'Quarterly totals',
    context:
      'Management reconciles the sales plan every quarter and wants the number and the amount of orders by quarter.',
    taskText: 'For each quarter, show the number of orders and their total amount.',
    hints: [
      'The orders have to be reduced to the quarter rather than the month, and both the count and the sum computed for each.',
      "DATE_TRUNC('quarter', ...) moves a date to the start of its quarter, just as 'month' moves it to the start of the month.",
      "Skeleton: SELECT DATE_TRUNC('quarter', order_date) AS quarter, COUNT(*) AS orders_count, SUM(amount) AS revenue FROM orders GROUP BY quarter ORDER BY quarter;",
    ],
    explanation:
      "DATE_TRUNC can work with units such as 'month', 'quarter', 'year' and 'week'. For a quarter, it returns the date at the start of that quarter rather than a number from 1 to 4: for example, dates in April, May and June 2024 become 2024-04-01. This gives you a value that can be grouped and sorted chronologically.",
  },
  'L6-return-deadline': {
    title: 'The return deadline for a product',
    context:
      'Support is checking whether the right of return is still valid for the orders placed from the beginning of June.',
    taskText:
      'For the orders from 1 June 2024 onwards, show the number, the date and the date on which the 30-day return period expires.',
    hints: [
      'For the not-too-old orders you have to show their date and the date that comes 30 days after it.',
      "INTERVAL '30 days' can be added to a date to move it 30 days forward.",
      "Skeleton: SELECT order_id, order_date, order_date + INTERVAL '30 days' AS return_deadline FROM orders WHERE order_date >= DATE '2024-06-01' ORDER BY order_id;",
    ],
    explanation:
      "Adding an interval to a date moves the date by that amount. In PostgreSQL, adding an INTERVAL to a DATE produces a timestamp rather than a DATE, even if its time part is zero. DATE '2024-06-01' is an explicitly typed date literal, which makes the comparison unambiguous and avoids relying on implicit type conversion. Where the type has nowhere else to come from, this matters: '2024-6-1' > '2024-12-01' is true, because two pieces of text are compared, while DATE '2024-06-01' > '2024-12-01' is false, because dates are compared.",
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
      'AGE with two arguments calculates the difference between those dates and returns an interval expressed in years, months and days. Using a fixed reference date makes the report reproducible: unlike AGE(hire_date), which uses the current date, the result will not change from one day to the next.',
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
      "SPLIT_PART numbers the parts of a string starting from 1. If the requested part does not exist, PostgreSQL returns an empty string rather than NULL. So checking for IS NULL will not detect a missing part; you would need to compare the result with ''.",
  },
  'L6-email-domain': {
    title: 'The domain of an email address',
    context: 'An analyst wants to see which email domains occur most often among the contacts.',
    taskText:
      'Pull the domain out of every address — everything after the at sign — in lower case.',
    hints: [
      'The part after the @ character has to be cut out of the email address and brought to lower case.',
      'POSITION(substring IN string) finds the position where the substring starts, and SUBSTRING(string FROM number) takes everything from that position to the end.',
      "Skeleton: SELECT contact_id, LOWER(SUBSTRING(raw_email FROM POSITION('@' IN raw_email) + 1)) AS domain FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'POSITION returns a character position starting from 1, so adding 1 makes SUBSTRING start immediately after the @ sign. If the email contains no @ character, POSITION returns 0, and adding 1 makes SUBSTRING start at the first character, so the original string is returned silently rather than an error or a NULL. If malformed emails are possible, this is worth handling explicitly rather than assuming every value contains @.',
  },
  'L6-clean-contacts': {
    title: 'A full clean-up of a contact',
    context:
      'Before the upload into the new CRM the contacts have to be brought to one tidy format.',
    taskText:
      'Tidy the contacts up: the name without extra spaces and with every word capitalised, the email in lower case.',
    hints: [
      'The name has to be cleaned of the extra spaces and have every word capitalised at the same time, and the email brought to lower case.',
      'REPLACE removes repeated spaces, TRIM cuts the edges, and INITCAP capitalises every word — they can be nested inside one another.',
      "Skeleton: SELECT contact_id, INITCAP(TRIM(REPLACE(raw_name, '  ', ' '))) AS clean_name, LOWER(TRIM(raw_email)) AS clean_email FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      "Nested functions are evaluated from the inside out, and the order matters here: REPLACE first reduces a pair of spaces to one, TRIM removes spaces at the edges, and INITCAP formats the words. The example uses REPLACE(raw_name, '  ', ' ') because replacing a single space with a single space would do nothing. This simple REPLACE handles pairs of spaces — with three spaces in a row one extra would remain, which is why the fixtures deliberately have two, not three. If arbitrary runs of repeated spaces are possible, a regular expression such as regexp_replace may be more appropriate.",
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
      "In PostgreSQL, you can use SELECT aliases in GROUP BY, so GROUP BY month, customer avoids repeating the longer expressions from SELECT. TO_CHAR(..., 'YYYY-MM') produces a text label such as 2026-08, and that format sorts chronologically because the year comes before the month. UPPER and INITCAP format the two parts of the name separately: the surname becomes upper case and the first name is capitalised.",
  },
};
