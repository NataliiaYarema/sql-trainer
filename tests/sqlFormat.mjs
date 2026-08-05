// Спільний стандарт запису SQL для теорії та еталонних розв'язків: запит має
// виглядати так, як його пишуть у роботі. Правила навмисно механічні — це
// перевірка форматування, а не смаку.

const MAX_LINE = 72;

// Рядок без відступу може починатися лише з нової секції запиту. Усе інше
// (колонки, ON, AND, тіло підзапиту) живе з відступом — саме це й робить
// структуру запиту видимою.
const SECTION_START = new RegExp(
  '^(?:' +
    [
      'SELECT\\b',
      'FROM\\b',
      'WHERE\\b',
      'GROUP BY\\b',
      'ORDER BY\\b',
      'HAVING\\b',
      'LIMIT\\b',
      'OFFSET\\b',
      'WITH\\b',
      'UNION(?: ALL)?\\b',
      'EXCEPT\\b',
      'INTERSECT\\b',
      '(?:LEFT |RIGHT |INNER |FULL |CROSS )?(?:OUTER )?JOIN\\b',
      '\\)',
      '\\w+ AS \\($',
    ].join('|') +
    ')'
);

// Повертає список проблем; порожній масив — запит відформатовано правильно.
export function sqlFormatProblems(sql) {
  const problems = [];

  if (sql !== sql.trim()) problems.push('зайві пробіли або порожні рядки на краях');
  if (!sql.trimEnd().endsWith(';')) problems.push('запит не завершується крапкою з комою');

  const lines = sql.split('\n');
  if (lines.length < 2) problems.push('запит записано одним рядком');

  for (const line of lines) {
    if (/[ \t]$/.test(line)) problems.push(`пробіли в кінці рядка: «${line}»`);
    if (line.length > MAX_LINE) problems.push(`рядок довший за ${MAX_LINE} символів: «${line}»`);
    if (line.trim() && !line.startsWith(' ') && !SECTION_START.test(line)) {
      problems.push(`рядок без відступу починається не з секції запиту: «${line}»`);
    }
  }

  return problems;
}

// Прогоняє набір запитів і друкує перший знайдений огріх кожного —
// без цього «FAIL» нічого не каже про те, що саме виправляти.
export function checkSqlFormatting(items, check, label) {
  const broken = items
    .map(({ name, sql }) => ({ name, problems: sqlFormatProblems(sql) }))
    .filter((item) => item.problems.length > 0);

  for (const item of broken) {
    console.error(`     ${item.name}: ${item.problems[0]}`);
  }

  check(label, broken.length === 0);
}
