import { escapeHtml, icon } from '../utils/dom.js';
import { t, levelName, getLanguage } from '../i18n/index.js';
import { routeFor, bindNav } from './progressBar.js';

// Аркуш верстається в розмірі A4 альбомно при 96 dpi і на екрані лише
// масштабується. Так підбір шрифту рівнів робиться один раз, і PDF збігається
// з тим, що видно на екрані.
export const SHEET_WIDTH = 1123;
export const SHEET_HEIGHT = 794;

export function formatCertificateDate(isoDate, lang) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(new Date(y, m - 1, d));
}

// Емблема — SVG, а не картинка: напис по дузі перекладається разом з усім
// іншим. Розмір шрифту дуги підбирається під довжину напису, а textLength
// розтягує його рівно на дугу — інакше довгий напис обрізався б.
function badgeSvg(tier) {
  const ring = t(tier === 'distinction' ? 'certificate.ringDistinction' : 'certificate.ringBasic');
  const size = Math.min(13, 250 / ring.length);
  const stars = tier === 'distinction' ? '★ ★ ★' : '';
  let stripes = '';
  for (let i = 0; i < 9; i += 1) {
    const y = 66 + i * 8;
    stripes += `<line x1="62" x2="138" y1="${y}" y2="${y}" stroke="#fff" stroke-width="1.2" opacity=".18"/>`;
  }
  return `
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="cert-arc-top" d="M 28 100 A 72 72 0 0 1 172 100"/>
        <path id="cert-arc-bottom" d="M 22 100 A 78 78 0 0 0 178 100"/>
        <clipPath id="cert-inner"><circle cx="100" cy="100" r="50"/></clipPath>
      </defs>
      <circle cx="100" cy="100" r="92" fill="#fff"/>
      <circle cx="100" cy="100" r="84" fill="#1e2638"/>
      <circle cx="100" cy="100" r="56" fill="none" stroke="#fff" stroke-width="3"/>
      <g clip-path="url(#cert-inner)">${stripes}</g>
      <text class="cert-badge__ring" font-size="${size}" fill="#fff">
        <textPath href="#cert-arc-top" startOffset="50%" text-anchor="middle"
                  textLength="196" lengthAdjust="spacing">${escapeHtml(ring)}</textPath>
      </text>
      ${
        stars
          ? `<text class="cert-badge__stars" font-size="16">
               <textPath href="#cert-arc-bottom" startOffset="50%" text-anchor="middle"
                         dominant-baseline="hanging">${stars}</textPath>
             </text>`
          : ''
      }
      <g class="cert-badge__db" transform="translate(100 100)" fill="none" stroke-width="3.5">
        <ellipse cx="0" cy="-20" rx="24" ry="8"/>
        <path d="M -24 -20 V 18 A 24 8 0 0 0 24 18 V -20"/>
        <path d="M -24 -1 A 24 8 0 0 0 24 -1"/>
      </g>
    </svg>
  `;
}

function titleHtml(tier) {
  const lead = escapeHtml(t('certificate.titleLead'));
  if (tier !== 'distinction') return lead;
  return `${lead} <i>${escapeHtml(t('certificate.titleJoin'))}</i> ${escapeHtml(t('certificate.titleTail'))}`;
}

function levelsHtml(tier, perLevel) {
  return perLevel
    .map(({ level, solved, total }) => {
      const mark = tier === 'distinction' ? '✓' : `${solved}/${total}`;
      return `<div><b>${mark}</b>${escapeHtml(levelName(level))}</div>`;
    })
    .join('');
}

// Мова приходить аргументом лише для дати: решту бере t() з поточної мови,
// а Intl.DateTimeFormat мови не знає.
export function certificateSheetHtml({ tier, name, date, lang, perLevel, solvedTotal, total }) {
  const result =
    tier === 'distinction'
      ? t('certificate.resultAll', { count: total })
      : t('certificate.resultPart', { solved: solvedTotal, total });
  const praise = t(
    tier === 'distinction' ? 'certificate.praiseDistinction' : 'certificate.praiseBasic'
  );

  return `
    <div class="cert-sheet cert-sheet--${tier}">
      <div class="cert-top"></div>
      <svg class="cert-wave" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 34 C 60 64, 120 6, 190 26 S 270 40, 300 14 L300 0 L0 0 Z" fill="#1e2638"/>
      </svg>
      <div class="cert-title">${titleHtml(tier)}</div>
      <div class="cert-bars"><span></span><span></span></div>
      <div class="cert-badge">${badgeSvg(tier)}</div>
      <div class="cert-who">
        <div class="cert-name">${escapeHtml(name)}</div>
        <div class="cert-lead">${escapeHtml(t('certificate.lead'))}</div>
        <div class="cert-course">SQL</div>
      </div>
      <div class="cert-bottom">
        <div>
          <div class="cert-result">${escapeHtml(result)}</div>
          <div class="cert-praise">${escapeHtml(praise)}<br>${escapeHtml(t('certificate.praiseEnd'))}</div>
        </div>
        <div class="cert-levels-box">
          <div class="cert-levels">${levelsHtml(tier, perLevel)}</div>
        </div>
      </div>
      <div class="cert-date">${escapeHtml(t('certificate.issued'))} <b>${escapeHtml(formatCertificateDate(date, lang))}</b></div>
    </div>
  `;
}

// Найбільший шрифт, за якого обидві колонки рівнів уміщаються без переносу.
// Лише в браузері: потрібні справжні розміри тексту.
export function fitCertificateLevels(root) {
  const levels = root.querySelector('.cert-levels');
  if (!levels) return;
  const box = levels.parentElement;
  let lo = 6;
  let hi = 28;
  for (let i = 0; i < 18; i += 1) {
    const mid = (lo + hi) / 2;
    levels.style.fontSize = `${mid}px`;
    if (levels.scrollWidth <= box.clientWidth) lo = mid;
    else hi = mid;
  }
  levels.style.fontSize = `${lo}px`;
}

// Посилання, а не кнопка: як пункти шапки, його можна відкрити новою вкладкою.
export function openLinkHtml(label) {
  return `
    <a class="btn btn--primary" href="${routeFor(getLanguage(), 'certificate')}" data-action="certificate">
      ${icon('i-award')}${escapeHtml(label)}
    </a>
  `;
}

// Одна картка на три місця: головний екран (compact), дашборд і екран
// сертифіката без виконаної умови.
export function certificateProgressHtml({ status, record, compact }) {
  if (record) {
    return `
      <section class="panel cert-card cert-card--ready">
        <h3 class="panel__title">${icon('i-award')}${escapeHtml(t('certificate.ready'))}</h3>
        ${openLinkHtml(t('certificate.open'))}
      </section>
    `;
  }

  const ready = status.perLevel.filter((l) => l.missing === 0).length;
  const rows = compact
    ? ''
    : `<ul class="cert-card__levels">
        ${status.perLevel
          .map(
            (l) => `
          <li>
            <span>${escapeHtml(levelName(l.level))}</span>
            <span class="${l.missing === 0 ? 'cert-card__done' : ''}">${escapeHtml(
              l.missing === 0
                ? t('certificate.levelDone')
                : t('certificate.levelMissing', { count: l.missing })
            )}</span>
          </li>`
          )
          .join('')}
      </ul>
      <p class="cert-card__note">${escapeHtml(
        t(
          status.distinctionPossible ? 'certificate.distinctionOpen' : 'certificate.distinctionLost'
        )
      )}</p>`;

  return `
    <section class="panel cert-card">
      <h3 class="panel__title">${icon('i-award')}${escapeHtml(t('nav.certificate'))}</h3>
      <p class="cert-card__rule">${escapeHtml(t('certificate.rule', { total: status.total }))}</p>
      <p class="cert-card__ready">${escapeHtml(
        t('certificate.levelsReady', { ready, total: status.perLevel.length })
      )}</p>
      ${rows}
    </section>
  `;
}

export function certificateScreenHtml({ status, record, name, lang }) {
  if (!record) {
    return `
      <div class="cert-screen">
        <h2 class="dashboard__title">${escapeHtml(t('certificate.notYet'))}</h2>
        ${certificateProgressHtml({ status, record, compact: false })}
      </div>
    `;
  }

  return `
    <div class="cert-screen">
      <div class="cert-controls">
        <label class="cert-controls__label">
          ${escapeHtml(t('certificate.nameLabel'))}
          <input class="cert-controls__input" data-action="cert-name" maxlength="80"
                 value="${escapeHtml(name)}" placeholder="${escapeHtml(t('certificate.namePlaceholder'))}">
        </label>
        <button class="btn btn--primary" data-action="cert-print">
          ${escapeHtml(t('certificate.save'))}
        </button>
      </div>
      <div class="cert-stage">
        ${certificateSheetHtml({
          tier: record.tier,
          name,
          date: record.date,
          lang,
          perLevel: status.perLevel,
          solvedTotal: status.solvedTotal,
          total: status.total,
        })}
      </div>
    </div>
  `;
}

function scaleSheet(root) {
  const stage = root.querySelector('.cert-stage');
  if (!stage) return;
  stage.style.setProperty('--cert-scale', String(stage.clientWidth / SHEET_WIDTH));
}

// Ім'я на аркуші оновлюється без перерендеру: перемальований input втратив
// би фокус і курсор посеред набору (та сама причина, що на екрані нотаток).
export function renderCertificateScreen(root, data, handlers) {
  root.innerHTML = certificateScreenHtml(data);
  bindNav(root.querySelector('[data-action="certificate"]'), () => handlers.onOpen?.());

  const input = root.querySelector('[data-action="cert-name"]');
  if (!input) return;
  const nameEl = root.querySelector('.cert-name');
  input.addEventListener('input', () => {
    nameEl.textContent = input.value;
    handlers.onNameChange(input.value);
  });
  root.querySelector('[data-action="cert-print"]').addEventListener('click', () => window.print());

  scaleSheet(root);
  fitCertificateLevels(root);
  // Шрифти доїжджають асинхронно, і до того ширина тексту інша.
  document.fonts?.ready.then(() => fitCertificateLevels(root));
  new ResizeObserver(() => scaleSheet(root)).observe(root.querySelector('.cert-stage'));
}
