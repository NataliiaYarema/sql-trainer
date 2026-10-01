// Англійський текст завдань рівня 8 (аналітичні кейси).
//
// Числа в поясненнях — виміряні прогоном, тому переписані точно. Змінився лише
// десятковий роздільник: англійською точка (58.8%), українською й іспанською
// кома. Помилитися тут дорого: verifyAnalytics.mjs тримає ці самі величини, і
// текст, що з ними розійшовся, брехав би тихо.
//
// Чотири завдання кейса «User conversion analysis» несуть caseStudyTitle.
export default {
  'L8-signup-cohorts': {
    title: 'Cohort size by signup month',
    context:
      'A product analyst wants to understand whether the inflow of new users is growing month by month.',
    taskText:
      'Count how many users signed up in each month, showing the month as the first date of the period.',
    hints: [
      'Count how many new users joined the app in each calendar month and show that month as a date.',
      "DATE_TRUNC('month', ...) moves a date to the first day of its month, and that date becomes the label used for GROUP BY.",
      "Skeleton: SELECT DATE_TRUNC('month', signup_date)::date AS cohort_month, COUNT(*) AS users FROM app_users GROUP BY DATE_TRUNC('month', signup_date) ORDER BY cohort_month;",
    ],
    explanation:
      "DATE_TRUNC('month', ...) returns the first day of the month rather than its name, so that date can serve as the cohort label. A cohort is determined by a user’s signup month and remains their cohort regardless of what they do in the app later. Measured result: 18 months, with 6 to 16 users in each.",
  },
  'L8-funnel-steps': {
    title: 'The funnel steps',
    context: 'The team wants to see how many people reach each step of a purchase funnel.',
    taskText: 'Count the number of events of each type, from the most frequent to the rarest.',
    hints: [
      'Count how many times each user action occurred in the app and sort the result from the most common action to the rarest.',
      'GROUP BY puts the events into groups by type and COUNT(*) measures the size of each group; a descending ORDER BY sorts them from largest to smallest.',
      'Skeleton: SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type ORDER BY events DESC;',
    ],
    explanation:
      'The descending sort shows the event types from most frequent to least frequent, and here that is also the funnel order: in this data every next step is a subset of the previous one (to place an order you first have to put something in the basket), so the counts fall by construction rather than by chance. Note that this query counts events, not people: the same user can generate several events, and a single session can contain several events. Measured result: 1187, 843, 541, 373, 274.',
  },
  'L8-active-users-by-month': {
    title: 'Active users by month',
    context:
      'A product analyst is tracking whether the number of people who actually use the app each month is growing.',
    taskText: 'Count how many different users took actions in the app in each month.',
    hints: [
      'Count how many different people used the app each month, not how many actions they took in total.',
      "DATE_TRUNC('month', ...) moves the timestamp to the first day of its month, and COUNT(DISTINCT user_id) counts each user once even if they generated many events.",
      "Skeleton: SELECT DATE_TRUNC('month', occurred_at)::date AS month, COUNT(DISTINCT user_id) AS active_users FROM app_events GROUP BY DATE_TRUNC('month', occurred_at) ORDER BY month;",
    ],
    explanation:
      'There are 3218 events and 190 people, so COUNT(*) would answer a different question here. A user with ten events in one month still counts as one active user. Measured: 18 months, from 5 active users in January 2023 to 69 in April 2024 — the series grows almost monotonically.',
  },
  'L8-sessions-per-user': {
    title: 'The most active users by sessions',
    context: 'A product manager wants to find the ten most engaged users by number of sessions.',
    taskText:
      'Find the ten users with the largest number of sessions, from the most active downwards.',
    hints: [
      'Find the ten people who had the most sessions in the app and show them from the most active downwards.',
      'COUNT(DISTINCT session_id) counts unique sessions per user; GROUP BY groups the events by user_id, and LIMIT caps the result at ten rows.',
      'Skeleton: SELECT user_id, COUNT(DISTINCT session_id) AS sessions FROM app_events GROUP BY user_id ORDER BY sessions DESC, user_id LIMIT 10;',
    ],
    explanation:
      'Why COUNT(DISTINCT session_id) rather than COUNT(*): one session contains between one and five events, so counting events would produce a different ranking. The second ORDER BY key, user_id, is a tie-breaker: without it, the relative order of users with the same session count is not guaranteed, and a task with LIMIT needs one unambiguous answer. Measured: 10 rows, from 14 down to 12 sessions.',
  },
  'L8-revenue-by-month': {
    title: 'App revenue by month',
    context:
      'A financial analyst wants to see the number of purchases and the total revenue for each month.',
    taskText: 'Calculate the number of purchases and the total revenue for each month.',
    hints: [
      'Count how many purchases happened in each calendar month and how much they were worth in total.',
      "DATE_TRUNC('month', ...) moves the purchase date to the first day of the month; COUNT(*) counts the purchases and SUM(amount) adds their amounts. ROUND(..., 2) rounds the result to two decimal places.",
      "Skeleton: SELECT DATE_TRUNC('month', purchase_date)::date AS month, COUNT(*) AS purchases, ROUND(SUM(amount), 2) AS revenue FROM app_purchases GROUP BY DATE_TRUNC('month', purchase_date) ORDER BY month;",
    ],
    explanation:
      'ROUND(SUM(amount), 2) makes the reporting precision explicit: the total is displayed to two decimal places, which is appropriate for a monetary report. Measured: 18 months, starting from 72.12 in January 2023.',
  },
  'L8-avg-check-by-country': {
    title: 'The average ticket by country',
    context:
      'A sales manager is comparing countries not by total revenue, but by the average amount spent in a single purchase.',
    taskText:
      'Calculate the number of purchases and the average purchase amount in each user country, rounding the average to cents.',
    hints: [
      'Count how many purchases were made in each country and calculate the average purchase amount, rounded to two decimal places.',
      'JOIN adds the user’s country to each purchase, GROUP BY groups the purchases by country, and AVG with ROUND calculates the average purchase amount.',
      'Skeleton: SELECT u.country, COUNT(*) AS purchases, ROUND(AVG(p.amount), 2) AS avg_check FROM app_purchases AS p JOIN app_users AS u ON u.user_id = p.user_id GROUP BY u.country ORDER BY avg_check DESC;',
    ],
    explanation:
      'Average ticket and total revenue answer different questions. A country can have many purchases but a lower average purchase amount, while another country can have fewer purchases but a higher average. In this data, Ukraine has the most purchases (73) but the lowest average ticket (137.95), while the United States has 37 purchases and the highest average ticket (210.29). Measured: 6 rows, one per country.',
  },
  'L8-buyers-by-channel': {
    title: 'How many users of a channel reach a purchase',
    context:
      'A marketer is evaluating acquisition channels not only by how many users they bring in, but by how many of those users make at least one purchase.',
    taskText:
      'For each acquisition channel, count how many users came through it and how many of them made at least one purchase.',
    hints: [
      'Every acquisition channel needs two numbers: how many users came through it and how many of them bought something at least once.',
      'LEFT JOIN keeps users with no purchases in the result; COUNT(DISTINCT ...) counts each user once even if they have several purchases.',
      'Skeleton: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, COUNT(DISTINCT p.user_id) AS buyers FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY users DESC;',
    ],
    explanation:
      'Why LEFT JOIN rather than a plain JOIN: with an INNER JOIN, users without any purchases would disappear from the result, reducing the denominator for their channel. Both COUNT expressions use DISTINCT because a user with several purchases produces several joined rows, but should still count as one user and one buyer. Measured: organic 86 users and 61 buyers, ads 59/40, email 30/17, referral 25/18.',
  },
  'L8-ltv-by-channel': {
    title: 'LTV by acquisition channel',
    context:
      'A product manager wants to compare acquisition channels by the money an acquired user generates, not just by the number of buyers.',
    taskText:
      'Calculate the LTV of each acquisition channel — the average purchase amount per registered user, including users who bought nothing.',
    hints: [
      'Calculate how much money each acquired user generates on average, including users who have not made a purchase.',
      'SUM(p.amount) after a LEFT JOIN gives the total purchase amount for the channel, COALESCE replaces a NULL total with zero, and dividing by COUNT(DISTINCT u.user_id) gives the average per registered user.',
      'Skeleton: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT u.user_id), 2) AS ltv FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY ltv DESC;',
    ],
    explanation:
      'The denominator is every registered user in the channel, not only the buyers. Otherwise, the result would be the average purchase amount among buyers rather than revenue per acquired user. COALESCE prevents a channel with no purchases from producing NULL as its total. Measured: organic 247.27, referral 240.16, email 210.40, ads 192.19 — the largest channel (organic, 86 users) is also the best by revenue per user, which is not always the case.',
  },
  'L8-step-conversion': {
    title: 'Conversion step by step',
    context:
      'A product analyst wants to identify the funnel transition where the app loses the most people rather than looking only at the overall counts.',
    taskText:
      'Count the number of events of each type and, for every step except the first, calculate what percentage of the previous step it represents, rounded to one decimal place.',
    hints: [
      'First count how many times each action occurred and sort the steps from most common to least common. Then, for every step except the first, calculate what percentage of the previous step it represents.',
      'A CTE counts the events per step, and the window function LAG(events) OVER (ORDER BY events DESC) looks at the count from the previous row in that ordering.',
      'Skeleton: WITH funnel AS (SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type) SELECT event_type, events, ROUND(100.0 * events / LAG(events) OVER (ORDER BY events DESC), 1) AS step_conversion FROM funnel ORDER BY events DESC;',
    ],
    explanation:
      'For the first row (visit), step_conversion is NULL because there is no previous row to compare it with. That is the expected result. This query compares event counts, not unique users. ORDER BY events DESC matches the funnel order here only because every next step is a subset of the previous one (checkout can only be reached through add_to_cart); if the count at a step could grow, an explicit step-order expression would be needed instead. Multiplying these four percentages and calling 71% the end-to-end conversion is a mistake: 71.0% × 64.2% × 68.9% × 73.5% gives about 23%, and that is the share of first visits that actually reach a purchase. Measured: 71.0 / 64.2 / 68.9 / 73.5.',
  },
  'L8-first-month-retention': {
    title: 'First-month retention by cohort',
    context:
      'A product manager wants to know whether new users come back during the first month after signing up, not just how many new users arrive.',
    taskText:
      'For each signup cohort (a month), count the cohort size, how many users took at least one action in the next calendar month, and what percentage that represents.',
    hints: [
      'Group users by signup month. For each group, check whether each user did anything in the app during the next calendar month, then calculate that number as a share of the whole cohort.',
      "The first CTE determines each user’s cohort with DATE_TRUNC('month', signup_date). The second selects users who had an event exactly in the following calendar month; DISTINCT prevents multiple events from counting the same user more than once. A LEFT JOIN keeps cohorts with no retained users.",
      "Skeleton: WITH cohort AS (SELECT user_id, DATE_TRUNC('month', signup_date) AS cohort_month FROM app_users), retained AS (SELECT DISTINCT c.user_id, c.cohort_month FROM cohort AS c JOIN app_events AS e ON e.user_id = c.user_id WHERE DATE_TRUNC('month', e.occurred_at) = c.cohort_month + INTERVAL '1 month') SELECT c.cohort_month::date AS cohort_month, COUNT(*) AS cohort_size, COUNT(r.user_id) AS retained, ROUND(100.0 * COUNT(r.user_id) / COUNT(*), 1) AS retention_rate FROM cohort AS c LEFT JOIN retained AS r ON r.user_id = c.user_id GROUP BY c.cohort_month ORDER BY cohort_month;",
    ],
    explanation:
      'The LEFT JOIN is essential here: with an INNER JOIN, a cohort in which no user returned would disappear instead of showing 0%. DISTINCT inside retained ensures that a user with several events in the following month is still counted once — without it, a cohort could even show retention above 100%. The last cohort, 2024-06, shows 0%, but not because of a product failure: the data ends on 2024-06-30, so there is no July data in which to observe returns. Measured: 18 rows, starting at 42.9% in January 2023.',
  },
  'L8-rfm-quartiles': {
    title: 'RFM quartiles of the buyers',
    context:
      'A marketer wants to group buyers using three different measures at once, so the resulting segments can be combined later.',
    taskText:
      'For each buyer, calculate the date of their last purchase, the number of purchases and the total amount, then split the buyers into four roughly equal-sized groups separately for each of those three measures.',
    hints: [
      'First find each buyer’s last purchase date, number of purchases and total amount. Then divide the buyers into four roughly equal-sized groups separately by last purchase date, purchase count and total amount.',
      'NTILE(4) OVER (ORDER BY ...) divides the sorted rows into four groups with roughly the same number of rows. Three separate NTILE expressions can be calculated independently, each with its own ORDER BY.',
      'Skeleton: WITH base AS (SELECT user_id, MAX(purchase_date) AS last_purchase, COUNT(*) AS frequency, SUM(amount) AS monetary FROM app_purchases GROUP BY user_id) SELECT user_id, NTILE(4) OVER (ORDER BY last_purchase) AS recency_quartile, NTILE(4) OVER (ORDER BY frequency) AS frequency_quartile, NTILE(4) OVER (ORDER BY monetary) AS monetary_quartile FROM base ORDER BY user_id;',
    ],
    explanation:
      'NTILE(4) creates four groups based on the number of rows, not four equal ranges of values. The group boundaries therefore adapt to the data so that each quartile contains roughly the same number of buyers. The three NTILE expressions are independent windows, each with its own ORDER BY, so the same buyer can be in quartile 1 by frequency and quartile 4 by monetary value. Measured: 136 rows, one per buyer.',
  },
  'L8-repeat-buyer-share': {
    title: 'How many buyers come back for a second purchase',
    caseStudyTitle: 'User conversion analysis',
    context:
      'The team wants to understand what happens after a user’s first purchase, starting with a simple question: what share of buyers makes at least one additional purchase?',
    taskText:
      'Count the total number of buyers, how many made two or more purchases, and what percentage that represents, rounded to one decimal place.',
    hints: [
      'First count the purchases made by each buyer. Then count all buyers, the buyers with at least two purchases, and the share of the latter among all buyers.',
      'FILTER (WHERE ...) lets COUNT(*) count only rows that satisfy a condition, while the overall COUNT(*) is calculated in the same query.',
      'Skeleton: WITH buyer_purchases AS (SELECT user_id, COUNT(*) AS purchases FROM app_purchases GROUP BY user_id) SELECT COUNT(*) AS buyers, COUNT(*) FILTER (WHERE purchases >= 2) AS repeat_buyers, ROUND(100.0 * COUNT(*) FILTER (WHERE purchases >= 2) / COUNT(*), 1) AS repeat_rate FROM buyer_purchases;',
    ],
    explanation:
      'The denominator is the number of buyers, not all registered users, because the question concerns repeat purchasing among people who have already made a purchase. FILTER (WHERE ...) counts the matching subset alongside the overall COUNT(*), so both figures come from the same set of buyers. Measured: 136 buyers, 80 repeat buyers, 58.8%.',
  },
  'L8-days-to-second-purchase': {
    title: 'How long it takes to reach a second purchase',
    caseStudyTitle: 'User conversion analysis',
    context:
      'Step one showed that more than half of the buyers make another purchase. The next question is when that second purchase happens.',
    taskText:
      'For buyers with two or more purchases, count how many there are and calculate the average number of days between the first and second purchase, rounded to one decimal place.',
    hints: [
      'Number each buyer’s purchases in date order. Then bring purchase number one and purchase number two for the same buyer into one row and calculate the difference between their dates.',
      'ROW_NUMBER() with PARTITION BY user_id numbers the purchases separately for each buyer. The second key, purchase_id, is needed when two purchases have the same purchase_date, so the ordering remains deterministic.',
      'Skeleton: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT COUNT(*) AS repeat_buyers, ROUND(AVG(later.purchase_date - first_buy.purchase_date), 1) AS avg_days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1;',
    ],
    explanation:
      'ROW_NUMBER() with PARTITION BY user_id numbers purchases within each buyer rather than across the whole table, so purchase number 1 and purchase number 2 refer to that particular user’s first and second purchases. The second ORDER BY key, purchase_id, makes the ordering deterministic when two purchases have the same date. The self-join then places the first and second purchases on the same row so their dates can be subtracted. Subtracting two DATE values in PostgreSQL gives the number of days between them. Measured: 80 users, 67.9 days.',
  },
  'L8-repeat-purchase-products': {
    title: 'What people buy when they come back',
    caseStudyTitle: 'User conversion analysis',
    context:
      'The team knows that 58.8% of buyers make another purchase and that the average gap to the second purchase is 67.9 days. The next question is which products those returning buyers purchase.',
    taskText:
      'For each product, count how many times it was bought as something other than a user’s first purchase, and show the products from the most frequent to the least frequent.',
    hints: [
      'For each product, count purchases made by users who had already made an earlier purchase — that is, purchases after the user’s first one.',
      'ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) numbers each user’s purchases from 1 onward; WHERE purchase_number >= 2 keeps only purchases after the first.',
      'Skeleton: WITH ranked AS (SELECT product_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT pr.product_name, COUNT(*) AS repeat_purchases FROM ranked AS r JOIN products AS pr ON pr.product_id = r.product_id WHERE r.purchase_number >= 2 GROUP BY pr.product_name ORDER BY repeat_purchases DESC, pr.product_name;',
    ],
    explanation:
      'What gets counted is not every purchase of a product, but only purchases that are not the user’s first purchase. ROW_NUMBER() numbers the purchases within each user, and WHERE purchase_number >= 2 keeps the later purchases. This answers “which products do users buy after their first purchase?”, not necessarily “which product do they buy immediately after their first purchase?” A product purchased much later still counts as a repeat purchase here. Measured: 25 products, from 9 repeat purchases down to 2.',
  },
  'L8-conversion-report-by-channel': {
    title: 'The closing return report by channel',
    caseStudyTitle: 'User conversion analysis',
    context:
      'The three previous steps measured repeat purchasing, time to a second purchase and repeat-purchase products across all buyers. The final step breaks the repeat-purchase metrics down by acquisition channel.',
    taskText:
      'For each acquisition channel, count the number of buyers, how many made a second purchase, what percentage that represents (rounded to one decimal place), and the average number of days before the second purchase (rounded to one decimal place).',
    hints: [
      'For every acquisition channel, count how many people bought at least once, how many bought a second time, what percentage that represents, and the average number of days between the first and second purchase.',
      'The three CTEs correspond to the previous steps: ranked numbers each user’s purchases, buyers lists the unique buyers, and second_gap puts the first and second purchases into one row. A LEFT JOIN attaches second_gap so that buyers without a second purchase remain in the result.',
      'Skeleton: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases), buyers AS (SELECT DISTINCT user_id FROM app_purchases), second_gap AS (SELECT first_buy.user_id, later.purchase_date - first_buy.purchase_date AS days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1) SELECT u.channel, COUNT(*) AS buyers, COUNT(g.user_id) AS repeat_buyers, ROUND(100.0 * COUNT(g.user_id) / COUNT(*), 1) AS repeat_rate, ROUND(AVG(g.days_to_second), 1) AS avg_days_to_second FROM buyers AS b JOIN app_users AS u ON u.user_id = b.user_id LEFT JOIN second_gap AS g ON g.user_id = b.user_id GROUP BY u.channel ORDER BY u.channel;',
    ],
    explanation:
      'Each CTE corresponds to a piece of the earlier analysis: ranked determines purchase order, buyers lists everyone who purchased at least once, and second_gap calculates the time to the second purchase. The LEFT JOIN with second_gap is essential because buyers without a second purchase must remain in the denominator. COUNT(g.user_id) counts only buyers with a matching second purchase, while COUNT(*) counts all buyers. The conclusion the case was built for: organic brings both the most buyers (61) and the highest repeat rate (65.6%), while ads, with 40 buyers, retains noticeably worse (50.0%) — the channel that brings the most people does not necessarily bring the most loyal ones. Measured: ads 40/20/50.0/73.9, email 17/9/52.9/56.3, organic 61/40/65.6/70.4, referral 18/11/61.1/57.5.',
  },
};
