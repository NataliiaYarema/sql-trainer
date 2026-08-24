import { icon, escapeHtml } from '../utils/dom.js';
import { askConfirm } from './confirmDialog.js';

const EMPTY_HINT = 'Даних поки немає — історія збирається з моменту, коли ти відкриваєш завдання.';

const MASTERY_HINT = 'Відмітка зʼявиться, коли всі завдання теми будуть розвʼязані.';

// 1 задача / 2 задачі / 5 задач.
function taskWord(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'задач';
  if (last === 1) return 'задача';
  if (last >= 2 && last <= 4) return 'задачі';
  return 'задач';
}

// Кома як десятковий роздільник: у решті інтерфейсу числа теж українські.
function formatRate(value) {
  return value.toFixed(1).replace('.', ',');
}

function panelHtml(title, body) {
  return `
    <section class="panel">
      <h3 class="panel__title">${title}</h3>
      ${body}
    </section>
  `;
}

// Плитка «розв'язано» — єдине велике число екрана: воно зі статусів, тому
// показується завжди, навіть коли журнал порожній.
function summaryHtml({ solved, total, activeDays }, lastActivity) {
  return `
    <div class="stat-grid">
      <div class="stat-tile stat-tile--hero">
        <div class="stat-tile__label">Розв'язано</div>
        <div class="stat-tile__hero">${solved}</div>
        <div class="stat-tile__note">зі ${total}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Днів активності</div>
        <div class="stat-tile__value">${activeDays}</div>
      </div>
      ${lastActivityHtml(lastActivity)}
    </div>
  `;
}

// Порожня плитка без дії була б глухим кутом, тому без журналу вона
// пропонує почати з першого завдання рівня 1.
function lastActivityHtml(lastActivity) {
  const body = lastActivity
    ? `<div class="stat-tile__value stat-tile__value--sm">
         Рівень ${lastActivity.level} · Завдання ${lastActivity.index + 1}
       </div>
       <div class="stat-tile__note">${escapeHtml(lastActivity.title)}</div>`
    : `<div class="stat-tile__value stat-tile__value--sm">Ще не починали</div>`;

  const level = lastActivity ? lastActivity.level : 1;
  const index = lastActivity ? lastActivity.index : 0;
  const label = lastActivity ? 'Продовжити' : 'Почати';

  return `
    <div class="stat-tile">
      <div class="stat-tile__label">Остання активність</div>
      ${body}
      <button class="btn btn--primary stat-tile__action" data-level="${level}" data-index="${index}">
        ${label}${icon('i-arrow-right')}
      </button>
    </div>
  `;
}

function masteredSkillsHtml(groups) {
  if (groups.length === 0) {
    return panelHtml('Освоєні навички', `<p class="dashboard__empty">${MASTERY_HINT}</p>`);
  }

  const rows = groups
    .map(
      ({ level, topics }) => `
      <li class="skill-row">
        <span class="skill-row__level">Рівень ${level}</span>
        <span class="skill-row__chips">
          ${topics.map((topic) => `<span class="skill-chip">✓ ${escapeHtml(topic)}</span>`).join('')}
        </span>
      </li>`
    )
    .join('');

  return panelHtml('Освоєні навички', `<ul class="skill-list">${rows}</ul>`);
}

function errorTopicsHtml(topics) {
  if (topics.length === 0) {
    return panelHtml('Типові помилки', `<p class="dashboard__empty">${EMPTY_HINT}</p>`);
  }

  const max = topics[0].fails;
  // Дію несе лише перший рядок: решта — числа. Кнопка в кожному рядку
  // перетворила б панель на список кнопок і сховала б головне.
  const rows = topics.map((topic, i) => errorTopicRowHtml(topic, max, i === 0)).join('');

  return panelHtml('Типові помилки', `<ul class="rank-list">${rows}</ul>`);
}

function errorTopicRowHtml({ label, fails, tasksTouched, failsPerTask, practice }, max, isFirst) {
  const note = isFirst
    ? `<div class="rank-row__note">
         ${tasksTouched} ${taskWord(tasksTouched)} · середня кількість спроб ${formatRate(failsPerTask)}
       </div>`
    : '';
  const action =
    isFirst && practice
      ? `<button class="btn btn--ghost rank-row__action"
                 data-level="${practice.level}" data-index="${practice.index}">
           потренувати${icon('i-arrow-right')}
         </button>`
      : '';

  return `
    <li class="rank-row">
      <div class="rank-row__head">
        <span class="rank-row__name rank-row__name--code">${escapeHtml(label)}</span>
        <span class="rank-row__value">${fails}</span>
      </div>
      <span class="bar-track">
        <span class="bar-fill" style="width: ${(fails / max) * 100}%"></span>
      </span>
      ${note}
      ${action}
    </li>
  `;
}

const STATUS_LABELS = {
  solved: "розв'язано",
  revealed: 'підглянуто',
  new: 'ще ні',
};

function hardTasksHtml(hardTasks) {
  if (hardTasks.length === 0) {
    return panelHtml('Потребують повторення', `<p class="dashboard__empty">${EMPTY_HINT}</p>`);
  }

  const rows = hardTasks
    .map(
      ({ title, level, index, fails, status }) => `
      <li class="hard-task">
        <div class="hard-task__main">
          <div class="hard-task__title">${escapeHtml(title)}</div>
          <div class="hard-task__note">
            Рівень ${level} · завдання ${index + 1} · невдалих спроб: ${fails} · ${STATUS_LABELS[status]}
          </div>
        </div>
        <button class="btn btn--ghost" data-level="${level}" data-index="${index}">
          Перейти${icon('i-arrow-right')}
        </button>
      </li>`
    )
    .join('');

  return panelHtml('Потребують повторення', `<ul class="hard-task-list">${rows}</ul>`);
}

export function dashboardHtml(metrics) {
  // Кнопки немає, коли очищати нічого. Крім розв'язаних дивимося й на дні
  // активності: відкрите завдання лишає слід у журналі ще до розв'язання,
  // тож написана чернетка не зникне з-під кнопки непомітно.
  const hasSomethingToClear = metrics.summary.solved > 0 || metrics.summary.activeDays > 0;

  return `
    <div class="dashboard">
      <div class="dashboard__head">
        <span class="level-pill">${icon('i-award')}Мій прогрес</span>
      </div>
      <h2 class="dashboard__title">Дашборд</h2>
      ${summaryHtml(metrics.summary, metrics.lastActivity)}
      ${masteredSkillsHtml(metrics.masteredSkills)}
      ${errorTopicsHtml(metrics.errorTopics)}
      ${hardTasksHtml(metrics.hardTasks)}
      <div class="dashboard__actions">
        <button class="btn btn--ghost" data-action="to-home">
          ${icon('i-arrow-left')}На головну
        </button>
      </div>
      ${
        hasSomethingToClear
          ? `<div class="dashboard__danger">
        <button class="btn btn--danger" data-action="clear-all">
          ${icon('i-refresh')}Очистити
        </button>
      </div>`
          : ''
      }
    </div>
  `;
}

export function renderDashboard(root, metrics, handlers) {
  root.innerHTML = dashboardHtml(metrics);

  // Одне прив'язування на всі кнопки переходу: «Продовжити», «потренувати» й
  // «Перейти» роблять те саме — відкривають конкретне завдання.
  root.querySelectorAll('[data-index]').forEach((button) => {
    button.addEventListener('click', () =>
      handlers.onOpenTask(Number(button.dataset.level), Number(button.dataset.index))
    );
  });

  // Кнопки може не бути: на чистому дашборді очищати нічого.
  root.querySelector('[data-action="clear-all"]')?.addEventListener('click', async () => {
    const confirmed = await askConfirm({
      title: 'Очистити весь прогрес?',
      note: 'Цю дію не можна буде скасувати.',
      confirmLabel: 'Очистити',
    });
    if (confirmed) handlers.onClearAll();
  });

  root.querySelector('[data-action="to-home"]').addEventListener('click', handlers.onToHome);
}
