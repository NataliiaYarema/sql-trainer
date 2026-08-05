// Ключ дня — локальна дата, а не UTC: користувач мислить своїм календарем,
// і подія о 01:00 має лягти в свій день, а не у вчорашній.
function dayKey(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Назва теми виводиться з тега, а не зі словника: тегів близько ста, і
// словник розходився б із LEVEL_TOPICS мовчки.
function topicLabel(topic) {
  return topic.replace(/-/g, ' ').toUpperCase();
}

function failsByTask(events) {
  const fails = new Map();
  events
    .filter((event) => event.k === 'attempt')
    .forEach((event) => fails.set(event.id, (fails.get(event.id) ?? 0) + 1));
  return fails;
}

// Позиція завдання всередині рівня рахується проходом по банку: він іде
// рівнями підряд (level1.js … level8.js), і саме цей порядок повертає
// tasksByLevel, якому потім віддається index.
function indexesWithinLevel(tasks) {
  const indexes = new Map();
  const seen = new Map();
  tasks.forEach((task) => {
    const index = seen.get(task.level) ?? 0;
    indexes.set(task.id, index);
    seen.set(task.level, index + 1);
  });
  return indexes;
}

// Найпізніша подія, чиє завдання ще існує в банку. Перенумерація завдань
// лишає в журналі мертві id, і показувати «Продовжити» на неіснуючому
// завданні не можна.
function buildLastActivity(tasks, events) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const indexes = indexesWithinLevel(tasks);
  const sorted = [...events].sort((a, b) => a.t - b.t);

  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const task = byId.get(sorted[i].id);
    if (task) {
      return {
        taskId: task.id,
        title: task.title,
        level: task.level,
        index: indexes.get(task.id),
        at: sorted[i].t,
      };
    }
  }
  return null;
}

// Тема вважається освоєною, коли розв'язані ВСІ її завдання на цьому рівні.
// Рівень у ключі не випадковий: тег може жити на двох рівнях (cte — 4 і 5),
// і закрита частина на рівні 4 має давати відмітку, не чекаючи рівня 5.
function buildMasteredSkills(tasks, statuses) {
  const counters = new Map();
  tasks.forEach((task) => {
    (task.topic ?? []).forEach((topic) => {
      const key = `${task.level}|${topic}`;
      const entry = counters.get(key) ?? { level: task.level, topic, total: 0, solved: 0 };
      entry.total += 1;
      if (statuses[task.id] === 'solved') entry.solved += 1;
      counters.set(key, entry);
    });
  });

  const byLevel = new Map();
  [...counters.values()]
    .filter((entry) => entry.solved === entry.total)
    .sort((a, b) => a.level - b.level || a.topic.localeCompare(b.topic))
    .forEach((entry) => {
      const list = byLevel.get(entry.level) ?? [];
      list.push(topicLabel(entry.topic));
      byLevel.set(entry.level, list);
    });

  return [...byLevel.entries()].map(([level, topics]) => ({ level, topics }));
}

const TOP_ERROR_TOPICS = 5;
const TOP_TASKS = 5;

// Куди веде «потренувати»: перше нерозв'язане завдання теми, а якщо всі
// розв'язані — те, де було найбільше невдалих спроб.
function practiceTarget(members, statuses, fails, indexes) {
  const target =
    members.find((task) => statuses[task.id] !== 'solved') ??
    [...members].sort((a, b) => (fails.get(b.id) ?? 0) - (fails.get(a.id) ?? 0))[0];
  return target ? { level: target.level, index: indexes.get(target.id) } : null;
}

function buildErrorTopics(tasks, statuses, events) {
  const fails = failsByTask(events);
  const touched = new Set(events.map((event) => event.id));
  const indexes = indexesWithinLevel(tasks);
  const byTopic = new Map();

  tasks.forEach((task) => {
    (task.topic ?? []).forEach((topic) => {
      const entry = byTopic.get(topic) ?? { topic, fails: 0, tasksTouched: 0, members: [] };
      entry.members.push(task);
      if (touched.has(task.id)) entry.tasksTouched += 1;
      entry.fails += fails.get(task.id) ?? 0;
      byTopic.set(topic, entry);
    });
  });

  return (
    [...byTopic.values()]
      .filter((entry) => entry.fails > 0)
      // Однакові значення впорядковуємо за назвою, щоб порядок рядків не
      // «плавав» між відкриттями екрана.
      .sort((a, b) => b.fails - a.fails || a.topic.localeCompare(b.topic))
      .slice(0, TOP_ERROR_TOPICS)
      .map((entry) => ({
        topic: entry.topic,
        label: topicLabel(entry.topic),
        fails: entry.fails,
        tasksTouched: entry.tasksTouched,
        failsPerTask: entry.tasksTouched > 0 ? entry.fails / entry.tasksTouched : 0,
        practice: practiceTarget(entry.members, statuses, fails, indexes),
      }))
  );
}

function buildHardTasks(tasks, statuses, events) {
  const fails = failsByTask(events);
  const indexes = indexesWithinLevel(tasks);

  return tasks
    .filter((task) => (fails.get(task.id) ?? 0) > 0)
    .map((task) => ({
      id: task.id,
      title: task.title,
      level: task.level,
      index: indexes.get(task.id),
      fails: fails.get(task.id),
      status: statuses[task.id] ?? 'new',
    }))
    .sort((a, b) => b.fails - a.fails || a.id.localeCompare(b.id))
    .slice(0, TOP_TASKS);
}

// Параметра now більше немає. Він був потрібен серії днів і календарю, які
// рахувалися відносно «сьогодні»; після їх прибирання всі метрики залежать
// лише від самих даних, і фіксувати час у тесті нема потреби.
export function computeMetrics({ tasks, statuses, events }) {
  const activeDays = new Set(events.map((event) => dayKey(new Date(event.t))));

  return {
    summary: {
      solved: Object.values(statuses).filter((status) => status === 'solved').length,
      total: tasks.length,
      activeDays: activeDays.size,
    },
    lastActivity: buildLastActivity(tasks, events),
    masteredSkills: buildMasteredSkills(tasks, statuses),
    errorTopics: buildErrorTopics(tasks, statuses, events),
    hardTasks: buildHardTasks(tasks, statuses, events),
  };
}
