import tasks, { LEVELS, LEVEL_TOPICS } from '../src/tasks/index.js';
import { LEVEL_SKILLS, skillsForLevel } from '../src/tasks/skills.js';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

check(
  'уміння описані для кожного рівня',
  LEVELS.every((level) => LEVEL_SKILLS[level])
);

LEVELS.forEach((level) => {
  const skills = LEVEL_SKILLS[level] ?? [];
  check(`рівень ${level}: від 4 до 6 умінь`, skills.length >= 4 && skills.length <= 6);
  check(
    `рівень ${level}: у кожного вміння є текст і теги`,
    skills.every((s) => s.text.trim() !== '' && s.topics.length > 0)
  );
  check(
    `рівень ${level}: усі теги належать цьому рівню`,
    skills.every((s) => s.topics.every((t) => LEVEL_TOPICS[level].includes(t)))
  );
  // Тег, оголошений у LEVEL_TOPICS, але не використаний у жодному завданні,
  // зробив би вміння недосяжним: розв'язувати нічого, відмітка не з'явиться.
  check(
    `рівень ${level}: теги вміння справді є в завданнях`,
    skills.every((s) =>
      s.topics.every((topic) =>
        tasks.some((task) => task.level === level && (task.topic ?? []).includes(topic))
      )
    )
  );
});

// Відмітка ставиться лише тоді, коли розв'язані всі завдання всіх тегів уміння.
const first = LEVEL_SKILLS[1][0];
const firstTasks = tasks.filter(
  (task) => task.level === 1 && (task.topic ?? []).some((t) => first.topics.includes(t))
);
const allSolved = Object.fromEntries(firstTasks.map((task) => [task.id, 'solved']));

check(
  'без прогресу жодне вміння не позначене',
  skillsForLevel(1, {}, tasks).every((s) => !s.done)
);
check(
  'повністю розвʼязане вміння позначається',
  skillsForLevel(1, allSolved, tasks).find((s) => s.text === first.text).done === true
);
check(
  'підглянуте завдання вміння не закриває',
  skillsForLevel(1, { ...allSolved, [firstTasks[0].id]: 'revealed' }, tasks).find(
    (s) => s.text === first.text
  ).done === false
);
check('порядок умінь збережено', skillsForLevel(1, {}, tasks)[0].text === first.text);

console.log(
  failures === 0 ? '\nУсі перевірки умінь пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
