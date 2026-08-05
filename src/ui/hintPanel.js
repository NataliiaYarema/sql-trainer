import { icon, escapeHtml } from '../utils/dom.js';

export function renderHints(root, hints, revealedCount) {
  if (revealedCount === 0) {
    root.innerHTML = '';
    return;
  }

  const items = hints
    .slice(0, revealedCount)
    .map(
      (hint, i) => `
        <div class="hint-item">
          <span class="hint-item__icon">${icon('i-bulb')}</span>
          <div class="hint-item__text"><strong>Підказка ${i + 1}.</strong> ${escapeHtml(hint)}</div>
        </div>
      `
    )
    .join('');

  root.innerHTML = `<div class="hint-panel">${items}</div>`;
}
