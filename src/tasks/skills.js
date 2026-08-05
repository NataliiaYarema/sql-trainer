// Уміння — це те, що користувач може сказати про себе після рівня, тому вони
// сформульовані людською мовою, а не тегами. Прив'язка до тегів потрібна, щоб
// відмітка спиралася на факт, а не на добрі наміри.
//
// Покриття тегів навмисно неповне: це підсумок, а не покажчик. Тест стежить
// лише за тим, щоб згадані теги існували на своєму рівні й справді
// зустрічалися в завданнях.
export const LEVEL_SKILLS = {
  1: [
    { text: 'будувати прості вибірки', topics: ['select', 'columns'] },
    { text: 'фільтрувати дані за умовами', topics: ['where', 'comparison', 'logical'] },
    { text: 'шукати за шаблоном і за списком значень', topics: ['like', 'in-list', 'between'] },
    { text: 'сортувати результат', topics: ['order-by'] },
    { text: 'прибирати повтори', topics: ['distinct'] },
    { text: 'обмежувати кількість рядків', topics: ['limit'] },
  ],
  2: [
    { text: 'рахувати кількість записів', topics: ['count'] },
    { text: 'підсумовувати й усереднювати', topics: ['sum', 'avg'] },
    { text: 'знаходити мінімум і максимум', topics: ['min-max'] },
    { text: 'групувати дані', topics: ['group-by'] },
    { text: 'фільтрувати вже згруповане', topics: ['having'] },
    { text: 'рахувати унікальні значення', topics: ['count-distinct'] },
  ],
  3: [
    { text: 'зʼєднувати таблиці', topics: ['inner-join'] },
    { text: 'зберігати рядки без пари', topics: ['left-join'] },
    { text: 'знаходити записи без відповідності', topics: ['anti-join'] },
    { text: 'зʼєднувати таблицю саму з собою', topics: ['self-join'] },
    { text: 'рахувати показники по зʼєднаних таблицях', topics: ['join-group-by'] },
  ],
  4: [
    { text: 'вкладати запит у запит', topics: ['subquery'] },
    { text: 'перевіряти наявність повʼязаних записів', topics: ['exists', 'not-exists'] },
    // Тег not-in оголошений у LEVEL_TOPICS, але жодне завдання його поки не
    // несе, тому в уміння він не потрапляє: відмітка ніколи б не з'явилася.
    { text: 'відбирати за списком з іншого запиту', topics: ['in'] },
    { text: 'писати запит із CTE', topics: ['cte'] },
    { text: 'будувати ланцюжок кроків', topics: ['cte-chain'] },
  ],
  5: [
    { text: 'нумерувати й ранжувати рядки', topics: ['row-number', 'rank'] },
    { text: 'рахувати в межах груп', topics: ['partition-by'] },
    { text: 'порівнювати з попереднім і наступним', topics: ['lag'] },
    { text: 'рахувати наростаючий підсумок', topics: ['running-total'] },
    { text: 'знаходити топ у кожній групі', topics: ['top-n-per-group'] },
  ],
  6: [
    { text: 'групувати події за періодами', topics: ['date-trunc', 'extract'] },
    { text: 'рахувати різницю дат і строки', topics: ['date-arithmetic'] },
    { text: 'форматувати дати', topics: ['to-char'] },
    { text: 'чистити текстові дані', topics: ['trim-replace'] },
    { text: 'розбирати рядки на частини', topics: ['split-part'] },
  ],
  7: [
    { text: 'будувати умовні колонки', topics: ['case-when'] },
    { text: 'рахувати за умовою всередині агрегації', topics: ['case-in-aggregate'] },
    { text: 'підставляти значення замість NULL', topics: ['coalesce'] },
    { text: 'обʼєднувати результати запитів', topics: ['union'] },
    { text: 'знаходити спільне й відмінне', topics: ['intersect', 'except'] },
  ],
  8: [
    { text: 'рахувати активних користувачів', topics: ['active-users'] },
    { text: 'будувати воронку й конверсію', topics: ['funnel', 'conversion'] },
    { text: 'рахувати утримання по когортах', topics: ['cohort', 'retention'] },
    { text: 'оцінювати цінність клієнта', topics: ['ltv'] },
    { text: 'сегментувати базу', topics: ['rfm', 'segmentation'] },
  ],
};

// Уміння вважається здобутим, коли розв'язані всі завдання рівня, що несуть
// хоч один із його тегів. Підглянуте завдання (revealed) не рахується: екран
// не має стверджувати «ви вмієте» тому, хто натиснув «Здатися».
export function skillsForLevel(level, statuses, tasks) {
  return (LEVEL_SKILLS[level] ?? []).map((skill) => {
    const members = tasks.filter(
      (task) => task.level === level && (task.topic ?? []).some((t) => skill.topics.includes(t))
    );
    return {
      text: skill.text,
      done: members.length > 0 && members.every((task) => statuses[task.id] === 'solved'),
    };
  });
}
