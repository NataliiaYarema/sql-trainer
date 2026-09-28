import { icon, escapeHtml } from '../utils/dom.js';
import { askConfirm } from './confirmDialog.js';
import { t, formatNumber } from '../i18n/index.js';

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
        <div class="stat-tile__label">${escapeHtml(t('dashboard.solved'))}</div>
        <div class="stat-tile__hero">${solved}</div>
        <div class="stat-tile__note">${escapeHtml(t('dashboard.outOf', { total }))}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">${escapeHtml(t('dashboard.activeDays'))}</div>
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
         ${escapeHtml(t('dashboard.lastPlace', { level: lastActivity.level, number: lastActivity.index + 1 }))}
       </div>
       <div class="stat-tile__note">${escapeHtml(lastActivity.title)}</div>`
    : `<div class="stat-tile__value stat-tile__value--sm">${escapeHtml(t('dashboard.notStarted'))}</div>`;

  const level = lastActivity ? lastActivity.level : 1;
  const index = lastActivity ? lastActivity.index : 0;
  const label = lastActivity ? t('dashboard.continue') : t('dashboard.start');

  return `
    <div class="stat-tile">
      <div class="stat-tile__label">${escapeHtml(t('dashboard.lastActivity'))}</div>
      ${body}
      <button class="btn btn--primary stat-tile__action" data-level="${level}" data-index="${index}">
        ${escapeHtml(label)}${icon('i-arrow-right')}
      </button>
    </div>
  `;
}

function masteredSkillsHtml(groups) {
  if (groups.length === 0) {
    return panelHtml(
      t('dashboard.mastered'),
      `<p class="dashboard__empty">${escapeHtml(t('dashboard.masteryHint'))}</p>`
    );
  }

  const rows = groups
    .map(
      ({ level, topics }) => `
      <li class="skill-row">
        <span class="skill-row__level">${escapeHtml(t('levelSelect.level', { level }))}</span>
        <span class="skill-row__chips">
          ${topics.map((topic) => `<span class="skill-chip">✓ ${escapeHtml(topic)}</span>`).join('')}
        </span>
      </li>`
    )
    .join('');

  return panelHtml(t('dashboard.mastered'), `<ul class="skill-list">${rows}</ul>`);
}

function errorTopicsHtml(topics) {
  if (topics.length === 0) {
    return panelHtml(
      t('dashboard.errors'),
      `<p class="dashboard__empty">${escapeHtml(t('dashboard.emptyHint'))}</p>`
    );
  }

  const max = topics[0].fails;
  // Дію несе лише перший рядок: решта — числа. Кнопка в кожному рядку
  // перетворила б панель на список кнопок і сховала б головне.
  const rows = topics.map((topic, i) => errorTopicRowHtml(topic, max, i === 0)).join('');

  return panelHtml(t('dashboard.errors'), `<ul class="rank-list">${rows}</ul>`);
}

function errorTopicRowHtml({ label, fails, tasksTouched, failsPerTask, practice }, max, isFirst) {
  const note = isFirst
    ? `<div class="rank-row__note">
         ${escapeHtml(
           t('dashboard.errorNote', {
             tasks: t('dashboard.taskCount', { count: tasksTouched }),
             rate: formatNumber(failsPerTask, 1),
           })
         )}
       </div>`
    : '';
  const action =
    isFirst && practice
      ? `<button class="btn btn--ghost rank-row__action"
                 data-level="${practice.level}" data-index="${practice.index}">
           ${escapeHtml(t('dashboard.practise'))}${icon('i-arrow-right')}
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

function hardTasksHtml(hardTasks) {
  if (hardTasks.length === 0) {
    return panelHtml(
      t('dashboard.hardTasks'),
      `<p class="dashboard__empty">${escapeHtml(t('dashboard.emptyHint'))}</p>`
    );
  }

  const rows = hardTasks
    .map(
      ({ title, level, index, fails, status }) => `
      <li class="hard-task">
        <div class="hard-task__main">
          <div class="hard-task__title">${escapeHtml(title)}</div>
          <div class="hard-task__note">
            ${escapeHtml(t('dashboard.hardNote', { level, number: index + 1, fails, status: t(`status.${status}`) }))}
          </div>
        </div>
        <button class="btn btn--ghost" data-level="${level}" data-index="${index}">
          ${escapeHtml(t('dashboard.goTo'))}${icon('i-arrow-right')}
        </button>
      </li>`
    )
    .join('');

  return panelHtml(t('dashboard.hardTasks'), `<ul class="hard-task-list">${rows}</ul>`);
}

export function dashboardHtml(metrics) {
  // Кнопки немає, коли очищати нічого. Крім розв'язаних дивимося й на дні
  // активності: відкрите завдання лишає слід у журналі ще до розв'язання,
  // тож написана чернетка не зникне з-під кнопки непомітно.
  const hasSomethingToClear = metrics.summary.solved > 0 || metrics.summary.activeDays > 0;

  return `
    <div class="dashboard">
      <div class="dashboard__head">
        <span class="level-pill">${icon('i-award')}${escapeHtml(t('dashboard.pill'))}</span>
      </div>
      <h2 class="dashboard__title">${escapeHtml(t('dashboard.title'))}</h2>
      ${summaryHtml(metrics.summary, metrics.lastActivity)}
      ${masteredSkillsHtml(metrics.masteredSkills)}
      ${errorTopicsHtml(metrics.errorTopics)}
      ${hardTasksHtml(metrics.hardTasks)}
      <div class="dashboard__actions">
        <button class="btn btn--ghost" data-action="to-home">
          ${icon('i-arrow-left')}${escapeHtml(t('nav.home'))}
        </button>
      </div>
      ${
        hasSomethingToClear
          ? `<div class="dashboard__danger">
        <button class="btn btn--danger" data-action="clear-all">
          ${icon('i-refresh')}${escapeHtml(t('dialog.clear'))}
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
      title: t('dialog.clearProgress'),
      note: t('dialog.irreversible'),
      confirmLabel: t('dialog.clear'),
    });
    if (confirmed) handlers.onClearAll();
  });

  root.querySelector('[data-action="to-home"]').addEventListener('click', handlers.onToHome);
}
