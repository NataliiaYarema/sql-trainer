import level1 from './level1.js';
import level2 from './level2.js';
import level3 from './level3.js';
import level4 from './level4.js';
import level5 from './level5.js';
import level6 from './level6.js';
import level7 from './level7.js';
import level8 from './level8.js';

const tasks = [
  ...level1,
  ...level2,
  ...level3,
  ...level4,
  ...level5,
  ...level6,
  ...level7,
  ...level8,
];

export default tasks;

export const LEVELS = [...new Set(tasks.map((task) => task.level))].sort((a, b) => a - b);

export function tasksByLevel(level) {
  return tasks.filter((task) => task.level === level);
}

// Дзеркало tasksByLevel для наскрізних кейсів. Загальна кількість кроків
// рахується звідси, а не зберігається в завданні: інакше доданий пʼятий крок
// вимагав би правити всі попередні.
export function tasksByCaseStudy(caseStudyId) {
  return tasks.filter((task) => caseStudyId !== undefined && task.caseStudy?.id === caseStudyId);
}

export const LEVEL_NAMES = {
  1: 'Основи вибірки',
  2: 'Групування й агрегація',
  3: "Об'єднання таблиць",
  4: 'Підзапити й CTE',
  5: 'Віконні функції',
  6: 'Дати та рядки',
  7: 'Умови й множини',
  8: 'Аналітичні кейси',
};

export const TIER_LABELS = {
  basic: 'Базове',
  medium: 'Середнє',
  complex: 'Комплексне',
};

// Які теги topic дозволені на кожному рівні. Це не документація, а обмеження:
// тест не пропустить завдання з чужим тегом, тому JOIN більше не зможе
// опинитися в рівні про групування, а UNION — жити на двох рівнях одразу.
export const LEVEL_TOPICS = {
  1: [
    'select',
    'columns',
    'alias',
    'expression',
    'where',
    'equality',
    'comparison',
    'logical',
    'between',
    'in-list',
    'like',
    'is-null',
    'distinct',
    'order-by',
    'limit',
    'offset',
  ],
  2: [
    'aggregation',
    'count',
    'sum',
    'avg',
    'min-max',
    'count-distinct',
    'group-by',
    'group-by-multi',
    'having',
    'order-by-aggregate',
    'round',
    'multiple-conditions',
  ],
  3: [
    'inner-join',
    'left-join',
    'right-join',
    'full-join',
    'cross-join',
    'self-join',
    'multi-join',
    'anti-join',
    'join-condition',
    'using',
    'join-group-by',
    'count-distinct',
    'revenue',
  ],
  4: [
    'subquery',
    'scalar-subquery',
    'in',
    'not-in',
    'exists',
    'not-exists',
    'correlated-subquery',
    'subquery-from',
    'select-clause',
    'cte',
    'multiple-cte',
    'cte-chain',
  ],
  5: [
    'window-functions',
    'row-number',
    'rank',
    'dense-rank',
    'ntile',
    'partition-by',
    'lag',
    'lead',
    'first-value',
    'last-value',
    'running-total',
    'moving-average',
    'window-frame',
    'top-n-per-group',
    'cte',
  ],
  6: [
    'date-trunc',
    'extract',
    'date-arithmetic',
    'interval',
    'age',
    'to-char',
    'concat',
    'case-change',
    'substring',
    'trim-replace',
    'split-part',
    'string-length',
    'string-date-combo',
  ],
  7: [
    'case-when',
    'case-in-aggregate',
    'case-in-order-by',
    'nested-case',
    'pivot',
    'coalesce',
    'nullif',
    'union',
    'union-all',
    'intersect',
    'except',
    'set-case-combo',
  ],
  8: [
    'cohort',
    'retention',
    'funnel',
    'conversion',
    'ltv',
    'rfm',
    'case-study',
    'session',
    'active-users',
    'segmentation',
    'revenue',
  ],
};

// Склад кожного рівня описаний явно, а не зашитий у тест: рівні різного
// розміру, і «рівно 10 завдань» більше не було б правдою. Тест звіряє
// фактичний банк саме з цією картою.
export const LEVEL_PLAN = {
  1: { total: 15, basic: 8, medium: 5, complex: 2 },
  2: { total: 15, basic: 8, medium: 5, complex: 2 },
  3: { total: 20, basic: 10, medium: 7, complex: 3 },
  4: { total: 15, basic: 8, medium: 5, complex: 2 },
  5: { total: 15, basic: 8, medium: 5, complex: 2 },
  6: { total: 15, basic: 8, medium: 5, complex: 2 },
  7: { total: 15, basic: 8, medium: 5, complex: 2 },
  8: { total: 15, basic: 8, medium: 5, complex: 2 },
};
