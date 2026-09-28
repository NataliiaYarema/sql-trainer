// Плоский словник: ключ виду 'модуль.що це'. Плоский, а не вкладений, бо
// паритет трьох мов перевіряється порівнянням Object.keys — на вкладених
// об'єктах така перевірка вимагала б обходу дерева й мовчки пропускала б
// розбіжності в глибині.
//
// Значення — рядок або об'єкт форм множини (див. pluralForm в ../index.js).
export default {
  'nav.sandbox': 'Sandbox',
  'nav.progress': 'My progress',
  'nav.notes': 'My notes',
  'nav.home': 'Home',
  'nav.language': 'Interface language',
  'app.title': 'SQL trainer for data analytics',
  'app.brand': 'SQL trainer',
  'app.subtitle': 'Practise SQL queries for data analytics in PostgreSQL',
  'editor.label': 'Your SQL query',
  'editor.hint': 'Ctrl + Enter to check',
  'taskCard.counter': 'Task {current} of {total}',
  'result.rows': { one: '{count} row', other: '{count} rows' },
  'level.1.name': 'Query basics',
  'level.2.name': 'Grouping and aggregation',
  'level.3.name': 'Joining tables',
  'level.4.name': 'Subqueries and CTEs',
  'level.5.name': 'Window functions',
  'level.6.name': 'Dates and strings',
  'level.7.name': 'Conditions and sets',
  'level.8.name': 'Analytics case studies',
  'tier.basic': 'Basic',
  'tier.medium': 'Medium',
  'tier.complex': 'Complex',
  'taskCard.levelPill': 'Level {level} · {name}',
  'taskCard.solved': 'already solved',
  'taskCard.case': 'Case study: {title} — step {step} of {total}',
  'taskCard.context': 'Business context',
  'taskCard.schema': 'Data structure',
  'taskCard.task': 'Task',
  'taskCard.columns': 'Expected columns',
  'hint.numbered': 'Hint {number}.',
  'controls.check': 'Check',
  'controls.hint': 'Hint ({revealed}/{total})',
  'controls.giveUp': 'Show answer',
  'controls.prev': 'Previous',
  'controls.next': 'Next',
  'controls.finish': 'Finish',
  'taskNav.label': 'Tasks in this level',
  'feedback.success': [
    'Right on target!',
    "That's exactly how analysts do it.",
    'Great work!',
    'The query is correct — moving on.',
    'Perfect. The next level is waiting.',
  ],
  // Жодна фраза не відсилає до тексту поруч: під нею порожньо, бо renderFailure
  // не приймає завдання й розбору не показує.
  'feedback.failure': [
    "Not quite — but you're close.",
    'Not yet. Try again, or reveal the answer.',
    "The result doesn't match the expected one.",
    'Mistakes are a normal part of learning.',
  ],
  'feedback.queryFailed': 'The query did not run',
  'feedback.giveUpHead': 'Here is the solution',
  'feedback.giveUpText':
    'Read through the query below — then try writing it yourself on a similar task.',
  'feedback.solution': 'Correct query',
  'feedback.explanation': 'Explanation',
  'feedback.checkFailed': 'Could not check the task: {message}',
  'sql.empty': 'The query is empty. Write a SQL query before checking.',
  'sql.forbidden':
    'Only SELECT / WITH queries are allowed — this one contains a forbidden command.',
  'sql.multiple': 'Only one query can run at a time.',
  'sql.noResult': 'The query returned no result. Make sure it is a SELECT query.',
  'sql.error': 'SQL error: {message}',
};
