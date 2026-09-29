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
      'A product analyst wants to understand whether the inflow of new users is growing month on month.',
    taskText:
      'Count how many users signed up in each month, showing the month as the first date of the period.',
    hints: [
      'You have to count how many new people joined the app in each calendar month and show that month as a date.',
      "DATE_TRUNC('month', ...) cuts a date down to the first day of its month — and that date becomes the label for GROUP BY.",
      "Skeleton: SELECT DATE_TRUNC('month', signup_date)::date AS cohort_month, COUNT(*) AS users FROM app_users GROUP BY DATE_TRUNC('month', signup_date) ORDER BY cohort_month;",
    ],
    explanation:
      "DATE_TRUNC('month', …) returns the first date of the month rather than its name, and that date becomes the cohort label. A cohort is determined by the user’s signup date and stays attached to them for good — regardless of when they do anything in the app. Measured result: 18 months, from 6 to 16 users in each.",
  },

  'L8-funnel-steps': {
    title: 'The funnel steps',
    context: 'The team wants to see how many people reach each step of a purchase.',
    taskText: 'Count the number of events of each type, from the most frequent to the rarest.',
    hints: [
      'You have to count how many times each user action happened in the app and lay the result out from the most common action to the rarest.',
      'GROUP BY puts the events into piles by type and COUNT(*) measures the size of each pile; a descending ORDER BY lays them out from the largest to the smallest.',
      'Skeleton: SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type ORDER BY events DESC;',
    ],
    explanation:
      'The descending sort here shows exactly the order of the funnel: every next step is a subset of the previous one (to place an order you first have to put something in the basket), so the counts fall by construction rather than by chance. COUNT(*) counts events here and not people: the same user could make several visits or product views. Measured result: 1187, 843, 541, 373, 274.',
  },

  'L8-active-users-by-month': {
    title: 'Active users by month',
    context:
      'A product analyst is watching whether the number of people who actually use the app each month is growing.',
    taskText: 'Count how many different users took actions in the app in each month.',
    hints: [
      'You have to count how many different people came into the app each month, not how many actions they took in total.',
      "DATE_TRUNC('month', ...) cuts a date down to the first day of its month, and COUNT(DISTINCT user_id) counts every user once, even if they have many events.",
      "Skeleton: SELECT DATE_TRUNC('month', occurred_at)::date AS month, COUNT(DISTINCT user_id) AS active_users FROM app_events GROUP BY DATE_TRUNC('month', occurred_at) ORDER BY month;",
    ],
    explanation:
      'There are 3218 events and 190 people, so COUNT(*) would answer a different question here; the same user with ten sessions in a month has to be counted once. Measured: 18 months, from 5 active in January 2023 to 69 in April 2024 — the series grows almost monotonically.',
  },

  'L8-sessions-per-user': {
    title: 'The most active users by sessions',
    context:
      'A product manager wants to find the ten most engaged users by their number of sessions.',
    taskText:
      'Find the ten users with the largest number of sessions, from the most active downwards.',
    hints: [
      'You have to find the ten people who came into the app most often and show them from the most active downwards.',
      'COUNT(DISTINCT session_id) counts the number of unique sessions per user; GROUP BY groups the events by user_id, and LIMIT caps the result at ten rows.',
      'Skeleton: SELECT user_id, COUNT(DISTINCT session_id) AS sessions FROM app_events GROUP BY user_id ORDER BY sessions DESC, user_id LIMIT 10;',
    ],
    explanation:
      'Why COUNT(DISTINCT session_id) and not COUNT(*): one session holds between one and five events, so counting events would give an entirely different ranking; and why there is a second key user_id in ORDER BY — without it the order among equal values is undefined, and a task with a LIMIT has to have one unambiguous answer. Measured: 10 rows, from 14 down to 12 sessions.',
  },

  'L8-revenue-by-month': {
    title: 'App revenue by month',
    context:
      'A financial analyst wants to see the number of purchases and the revenue for each month.',
    taskText: 'Calculate the number of purchases and the revenue total for each month.',
    hints: [
      'You have to count how many purchases happened and for what amount, for each calendar month.',
      "DATE_TRUNC('month', ...) cuts the purchase date down to the first day of the month; COUNT(*) counts the purchases and SUM(amount) with ROUND gives the amount rounded to cents.",
      "Skeleton: SELECT DATE_TRUNC('month', purchase_date)::date AS month, COUNT(*) AS purchases, ROUND(SUM(amount), 2) AS revenue FROM app_purchases GROUP BY DATE_TRUNC('month', purchase_date) ORDER BY month;",
    ],
    explanation:
      'What ROUND(SUM(amount), 2) is for: NUMERIC adds up exactly, but a sum of cents leaves a long tail, and a report about money is rounded to cents explicitly. Measured: 18 months, starting from 72.12 in January 2023.',
  },

  'L8-avg-check-by-country': {
    title: 'The average ticket by country',
    context:
      'A sales manager is comparing countries not by total revenue but by how large a ticket a buyer leaves in one purchase.',
    taskText:
      'Calculate the number of purchases and the average ticket in each user country, rounding the average to cents.',
    hints: [
      'You have to count how many purchases were made in each country and what the average amount of one purchase comes to, rounded to cents.',
      'JOIN adds the user’s country to a purchase, GROUP BY puts the purchases into piles by country, and AVG with ROUND computes the average amount in a pile.',
      'Skeleton: SELECT u.country, COUNT(*) AS purchases, ROUND(AVG(p.amount), 2) AS avg_check FROM app_purchases AS p JOIN app_users AS u ON u.user_id = p.user_id GROUP BY u.country ORDER BY avg_check DESC;',
    ],
    explanation:
      'The average ticket and the total revenue answer different questions: Ukraine gives the most purchases (73) but at the same time the lowest average ticket (137.95), while the United States is the opposite — only 37 purchases at the highest average (210.29). The country with the most purchases and the country with the highest average ticket are different countries here, and the two rankings must not be confused. Measured: 6 rows, one per country.',
  },

  'L8-buyers-by-channel': {
    title: 'How many users of a channel reach a purchase',
    context:
      'A marketer judges the acquisition channels not by the number of people but by what share of them buys anything at all.',
    taskText:
      'For each acquisition channel, count how many users came and how many of them made at least one purchase.',
    hints: [
      'Every acquisition channel needs two numbers at once: how many people came through it and how many of them bought something at least once.',
      'LEFT JOIN keeps in the result the users who have no purchases at all; COUNT(DISTINCT ...) counts every user once, even if they have several purchases.',
      'Skeleton: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, COUNT(DISTINCT p.user_id) AS buyers FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY users DESC;',
    ],
    explanation:
      'Why a LEFT JOIN rather than a plain JOIN: with a plain JOIN a user without a single purchase would vanish from the answer together with their row in the denominator, and the channel would look smaller than it actually is. Why both COUNTs have DISTINCT: after the join a user with three purchases gives three rows, and without DISTINCT they would be counted three times. Measured: organic 86 users and 61 buyers, ads 59/40, email 30/17, referral 25/18.',
  },

  'L8-ltv-by-channel': {
    title: 'LTV by acquisition channel',
    context:
      'A product manager wants to compare the acquisition channels by the money one acquired user brings in, not only by the number of buyers.',
    taskText:
      'Calculate the LTV of each acquisition channel — the average purchase amount per registered user, including those who bought nothing.',
    hints: [
      'You have to compute how much money one acquired user brings the channel on average — both the one who bought and the one who did not.',
      'SUM(p.amount) after a LEFT JOIN gives the total purchase amount of the channel, COALESCE puts a zero where there were no purchases, and dividing by COUNT(DISTINCT u.user_id) — everyone registered — gives the average per person.',
      'Skeleton: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT u.user_id), 2) AS ltv FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY ltv DESC;',
    ],
    explanation:
      'The denominator here is every registered user of the channel and not only the buyers: otherwise what would come out is the average ticket of a buyer rather than the return of the channel per acquired person. COALESCE saves a channel without a single purchase from a NULL in the numerator. Measured: organic 247.27, referral 240.16, email 210.40, ads 192.19 — and the largest channel (organic, 86 users) turns out to be the best by return at the same time, which is not always the case.',
  },

  'L8-step-conversion': {
    title: 'Conversion step by step',
    context:
      'A product analyst wants to find the exact funnel transition where the app loses the most people, rather than only see the overall figures by step.',
    taskText:
      'Count the number of events of each type and, for every step except the first, what share of the step before it that makes up, as a percentage rounded to one digit.',
    hints: [
      'First count how many times each action happened and lay the steps out from the most common to the rarest. Then, for every step except the first, compute what share of the previous step it makes up as a percentage.',
      'A CTE counts the events per step separately, and the window function LAG(events) OVER (ORDER BY events DESC) looks at the count of the previous row of the window — that is what the current step is compared with.',
      'Skeleton: WITH funnel AS (SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type) SELECT event_type, events, ROUND(100.0 * events / LAG(events) OVER (ORDER BY events DESC), 1) AS step_conversion FROM funnel ORDER BY events DESC;',
    ],
    explanation:
      'For the first row (visit) step_conversion is NULL: there is no previous step, and that is the correct result rather than a fault. The descending sort by count coincides with the funnel order here only because every next step is a subset of the previous one (checkout can only be reached through add_to_cart); if the count at a step could grow, ORDER BY events DESC would have to be replaced with an explicit step order. Multiplying these four percentages and saying “end-to-end conversion is 71%” is a mistake: 71.0% × 64.2% × 68.9% × 73.5% give about 23%, not 71% — and that is how many of the first visitors actually reach a purchase. Measured: 71.0 / 64.2 / 68.9 / 73.5.',
  },

  'L8-first-month-retention': {
    title: 'First-month retention by cohort',
    context:
      'A product manager wants to know whether new users come back in the first month after signing up, not only how many of them arrived.',
    taskText:
      'For each signup cohort (a month), count the cohort size, how many of its users took at least one action exactly in the next calendar month, and what share that is as a percentage.',
    hints: [
      'Split the users into groups by signup month. For each group, check whether the person did anything in the app exactly in the next calendar month after signing up, and compute that share of the whole group.',
      "The first CTE determines every user’s cohort through DATE_TRUNC('month', signup_date), the second picks with DISTINCT those who have an event exactly in cohort_month + INTERVAL '1 month'; a LEFT JOIN of those two CTEs does not lose a cohort that had no returns.",
      "Skeleton: WITH cohort AS (SELECT user_id, DATE_TRUNC('month', signup_date) AS cohort_month FROM app_users), retained AS (SELECT DISTINCT c.user_id, c.cohort_month FROM cohort AS c JOIN app_events AS e ON e.user_id = c.user_id WHERE DATE_TRUNC('month', e.occurred_at) = c.cohort_month + INTERVAL '1 month') SELECT c.cohort_month::date AS cohort_month, COUNT(*) AS cohort_size, COUNT(r.user_id) AS retained, ROUND(100.0 * COUNT(r.user_id) / COUNT(*), 1) AS retention_rate FROM cohort AS c LEFT JOIN retained AS r ON r.user_id = c.user_id GROUP BY c.cohort_month ORDER BY cohort_month;",
    ],
    explanation:
      'The LEFT JOIN is mandatory here: with a plain JOIN a cohort in which not a single user came back would vanish from the answer together with its row, although it has to show 0%. The DISTINCT inside retained keeps a user with several events in the next month from being counted several times — without it a cohort could show retention above 100%. The last cohort, 2024-06, shows 0% not because of a product failure: it simply has no next calendar month in the data (the data ends on 2024-06-30), so checking returns for it is impossible in principle. Measured: 18 rows, from 42.9% in January 2023.',
  },

  'L8-rfm-quartiles': {
    title: 'RFM quartiles of the buyers',
    context:
      'A marketer wants to lay the buyers out into groups by three different signs at once, in order to combine the segments afterwards.',
    taskText:
      'For each buyer, compute the date of their last purchase, the number of purchases and the amount, and then split the buyers into four equal groups separately by each of those three signs.',
    hints: [
      'First find, for every buyer, the date of their last purchase, the number of purchases and the total amount. Then split all the buyers into four equal groups — separately by how recent the last purchase is, separately by the number of purchases, separately by the amount.',
      'NTILE(4) OVER (ORDER BY ...) divides the sorted buyers into four groups so that each holds roughly the same number of people; three separate NTILEs in one SELECT are computed independently, each with its own ORDER BY.',
      'Skeleton: WITH base AS (SELECT user_id, MAX(purchase_date) AS last_purchase, COUNT(*) AS frequency, SUM(amount) AS monetary FROM app_purchases GROUP BY user_id) SELECT user_id, NTILE(4) OVER (ORDER BY last_purchase) AS recency_quartile, NTILE(4) OVER (ORDER BY frequency) AS frequency_quartile, NTILE(4) OVER (ORDER BY monetary) AS monetary_quartile FROM base ORDER BY user_id;',
    ],
    explanation:
      'NTILE(4) divides the buyers into quartiles by the number of people in a group rather than by the size of the value: the group borders adjust to the data so that each quartile ends up with roughly the same number of buyers, not so that the range of values is equal. Three NTILEs in one SELECT are three independent windows, each with its own ORDER BY, so the same buyer can perfectly well land in the first quartile by frequency and in the fourth by amount at the same time. Measured: 136 rows, one per buyer.',
  },

  'L8-repeat-buyer-share': {
    title: 'How many buyers come back for a second purchase',
    caseStudyTitle: 'User conversion analysis',
    context:
      'The team wants to understand what happens to a user after their first purchase, and begins the investigation with the simplest number: what share of buyers comes back for a second one at all.',
    taskText:
      'Count the total number of buyers, how many of them made two purchases or more, and what share that is as a percentage rounded to one digit.',
    hints: [
      'First count how many purchases each buyer made. Then count all the buyers, separately those with two purchases or more, and what share the latter make up of the whole.',
      'FILTER (WHERE …) lets COUNT(*) count only the subset of rows that satisfies a condition — and it does so in the same pass as the overall count.',
      'Skeleton: WITH buyer_purchases AS (SELECT user_id, COUNT(*) AS purchases FROM app_purchases GROUP BY user_id) SELECT COUNT(*) AS buyers, COUNT(*) FILTER (WHERE purchases >= 2) AS repeat_buyers, ROUND(100.0 * COUNT(*) FILTER (WHERE purchases >= 2) / COUNT(*), 1) AS repeat_rate FROM buyer_purchases;',
    ],
    explanation:
      'The denominator here is the buyers and not every registered user: the question of coming back makes sense only for those who have bought at least once. FILTER (WHERE …) counts the subset in the same pass as the overall COUNT(*), so both numbers come from one query and cannot drift apart from each other. Measured: 136 buyers, 80 repeat buyers, 58.8%.',
  },

  'L8-days-to-second-purchase': {
    title: 'How long it takes to reach a second purchase',
    caseStudyTitle: 'User conversion analysis',
    context:
      'Step one showed that more than half of the buyers come back. What is left is to understand exactly when that happens — so that the team knows when to remind them about a second purchase.',
    taskText:
      'For the buyers with two purchases or more, count how many they are and the average number of days between the first and the second purchase, rounded to one digit.',
    hints: [
      'For every buyer, number their purchases by date from the first to the last. Then bring purchase number one and purchase number two of the same buyer into one row and compute the difference in dates.',
      'ROW_NUMBER() with PARTITION BY user_id numbers the purchases inside each buyer separately; the second key purchase_id in ORDER BY is needed because two purchases may fall on the same day, and without it “the first” would be arbitrary.',
      'Skeleton: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT COUNT(*) AS repeat_buyers, ROUND(AVG(later.purchase_date - first_buy.purchase_date), 1) AS avg_days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1;',
    ],
    explanation:
      'ROW_NUMBER() with PARTITION BY user_id numbers the purchases within each buyer separately rather than straight through the whole table, so number 1 and number 2 always mean the first and the second purchase of that particular person. The second key purchase_id in ORDER BY is not cosmetic here: two purchases of one user may fall on the same day, and without that key which of them counts as the first would be a matter of chance — and the whole answer depends on it. Self-joining the ranked table with itself on numbers 1 and 2 is the standard way of putting two events of one user into one row in order to compute the difference between them. Subtracting two DATE values in PostgreSQL gives a whole number of days. Measured: 80 users, 67.9 days.',
  },

  'L8-repeat-purchase-products': {
    title: 'What people buy when they come back',
    caseStudyTitle: 'User conversion analysis',
    context:
      'The team already knows that 58.8% of buyers come back and do so in 67.9 days on average. One question is left: which product does a person come back with?',
    taskText:
      'For each product, count how many times it was bought as something other than a user’s first purchase, and show the result from the most popular return product to the least popular.',
    hints: [
      'For every product, count how many times it was bought at a moment when the person already had an earlier purchase — that is, on a return rather than for the first time.',
      'ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) numbers the purchases of each user separately from 1; WHERE purchase_number >= 2 keeps only the purchases that are not the first for their buyer.',
      'Skeleton: WITH ranked AS (SELECT product_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT pr.product_name, COUNT(*) AS repeat_purchases FROM ranked AS r JOIN products AS pr ON pr.product_id = r.product_id WHERE r.purchase_number >= 2 GROUP BY pr.product_name ORDER BY repeat_purchases DESC, pr.product_name;',
    ],
    explanation:
      'What gets counted is not every purchase of a product but only those that are not the first for their user: ROW_NUMBER() numbers the purchases inside each user, and WHERE purchase_number >= 2 keeps only the returns. It is worth admitting honestly that this is one way of reading the question: it answers “which product do people come back with” rather than “which product is bought twice in a row” — the same product bought after a completely different purchase half a year earlier counts as a return here just the same. Measured: 25 products, from 9 repeat purchases down to 2.',
  },

  'L8-conversion-report-by-channel': {
    title: 'The closing return report by channel',
    caseStudyTitle: 'User conversion analysis',
    context:
      'The three previous steps computed the share of returns, the time to a second purchase and the return product across the whole product at once. The finale of the case is the same broken down by acquisition channel, to see which channel brings the people who really come back.',
    taskText:
      'For each acquisition channel, count the number of buyers, how many of them made a second purchase, what share of them that is as a percentage (rounded to one digit) and how many days pass on average before the second purchase (rounded to one digit).',
    hints: [
      'For every acquisition channel, count how many people bought at all, how many of them bought a second time, what share that is as a percentage and how many days pass on average between the first and the second purchase.',
      'The three CTEs here are essentially the three previous steps of the case: ranked numbers a user’s purchases, buyers lists the unique buyers, second_gap brings the first and second purchase into one row; a LEFT JOIN attaches second_gap so that the buyers without a second purchase do not vanish from the result.',
      'Skeleton: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases), buyers AS (SELECT DISTINCT user_id FROM app_purchases), second_gap AS (SELECT first_buy.user_id, later.purchase_date - first_buy.purchase_date AS days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1) SELECT u.channel, COUNT(*) AS buyers, COUNT(g.user_id) AS repeat_buyers, ROUND(100.0 * COUNT(g.user_id) / COUNT(*), 1) AS repeat_rate, ROUND(AVG(g.days_to_second), 1) AS avg_days_to_second FROM buyers AS b JOIN app_users AS u ON u.user_id = b.user_id LEFT JOIN second_gap AS g ON g.user_id = b.user_id GROUP BY u.channel ORDER BY u.channel;',
    ],
    explanation:
      'Every CTE here is the solution of one of the previous steps of the case, brought together into one report: ranked and second_gap compute when the second purchase arrives, buyers lists those who bought at all. The LEFT JOIN with second_gap is mandatory: the buyers without a second purchase have to stay in the denominator, otherwise the reputation of a channel improves artificially. COUNT(g.user_id) counts only non-empty values and therefore gives exactly the number of repeat buyers rather than all of them. The conclusion the whole case was started for: organic gives both the most buyers (61) and the highest share of returns (65.6%), while ads, with 40 buyers, retains twice as poorly (50.0%) — the channel that brings the most people does not necessarily bring the most loyal. Measured: ads 40/20/50.0/73.9, email 17/9/52.9/56.3, organic 61/40/65.6/70.4, referral 18/11/61.1/57.5.',
  },
};
