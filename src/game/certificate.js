// Правило видачі сертифіката. Чистий модуль без DOM і сховища — тому
// тестується звичайним node-скриптом, як metrics.js.
//
// Поріг рахується від фактичного банку, а не числами: нове завдання в рівні
// перерахує його саме. Банк звіряє з LEVEL_PLAN verifyTasks.mjs.

const TIER_RANK = { basic: 1, distinction: 2 };

// Цілочисельно, без 0.9 * total: дробова дев'ятка в двійковому вигляді
// неточна, і для іншого розміру рівня ceil міг би з'їхати на одиницю.
function levelNeed(total) {
  return Math.ceil((total * 9) / 10);
}

export function certificateStatus(tasks, solved) {
  const levels = [...new Set(tasks.map((task) => task.level))].sort((a, b) => a - b);

  const perLevel = levels.map((level) => {
    const ids = tasks.filter((task) => task.level === level).map((task) => task.id);
    const solvedCount = ids.filter((id) => solved[id]?.status === 'solved').length;
    const need = levelNeed(ids.length);
    return {
      level,
      solved: solvedCount,
      total: ids.length,
      need,
      missing: Math.max(0, need - solvedCount),
    };
  });

  const solvedTotal = perLevel.reduce((sum, l) => sum + l.solved, 0);
  const total = perLevel.reduce((sum, l) => sum + l.total, 0);
  // Підглянуте рахується й тоді, коли завдання потім розв'язали: слід
  // підглядання лишається в записі назавжди (див. GameState.registerSolved).
  const distinctionPossible = !tasks.some((task) => solved[task.id]?.peeked);

  let tier = null;
  if (solvedTotal === total && total > 0 && distinctionPossible) tier = 'distinction';
  else if (perLevel.length > 0 && perLevel.every((l) => l.missing === 0)) tier = 'basic';

  return { tier, perLevel, solvedTotal, total, distinctionPossible };
}

// Отриманий сертифікат не зникає й не знижується: інакше підглянута після
// отримання відповідь забрала б у людини вже видану відзнаку.
export function nextCertificate(current, tier, today) {
  if (!tier) return current ?? null;
  if (current && TIER_RANK[current.tier] >= TIER_RANK[tier]) return current;
  return { tier, date: today };
}

// Локальна дата, а не toISOString: та дає UTC, і ввечері за Києвом сертифікат
// отримав би завтрашню дату.
export function localDateString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isCertificateRecord(value) {
  return (
    Boolean(value) &&
    Object.hasOwn(TIER_RANK, value.tier) &&
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date)
  );
}
