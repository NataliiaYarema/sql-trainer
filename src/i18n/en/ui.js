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
};
