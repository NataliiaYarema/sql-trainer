import { icon } from '../utils/dom.js';
import { t } from '../i18n/index.js';

export function controlsHtml({ hintsRevealed, totalHints, isFirstTask, isLastTask }) {
  const hintsLeft = totalHints - hintsRevealed;

  return `
    <div class="controls">
      <button class="btn btn--primary" data-action="check">
        ${icon('i-play')}${t('controls.check')}
      </button>
      <button class="btn btn--hint" data-action="hint" ${hintsLeft === 0 ? 'disabled' : ''}>
        ${icon('i-bulb')}${t('controls.hint', { revealed: hintsRevealed, total: totalHints })}
      </button>
      <button class="btn btn--ghost" data-action="giveup">
        ${icon('i-flag')}${t('controls.giveUp')}
      </button>
      <div class="controls__nav">
        <button class="btn btn--nav" data-action="prev" ${isFirstTask ? 'disabled' : ''}>
          ${icon('i-arrow-left')}${t('controls.prev')}
        </button>
        <button class="btn btn--nav btn--next" data-action="next">
          ${isLastTask ? t('controls.finish') : t('controls.next')}${icon('i-arrow-right')}
        </button>
      </div>
    </div>
    <div class="controls-home">
      <button class="btn btn--ghost" data-action="to-home">
        ${icon('i-arrow-left')}${t('nav.home')}
      </button>
    </div>
  `;
}

export function renderControls(root, state, handlers) {
  root.innerHTML = controlsHtml(state);

  root.querySelector('[data-action="check"]').addEventListener('click', handlers.onCheck);
  root.querySelector('[data-action="hint"]').addEventListener('click', handlers.onHint);
  root.querySelector('[data-action="giveup"]').addEventListener('click', handlers.onGiveUp);
  root.querySelector('[data-action="prev"]').addEventListener('click', handlers.onPrev);
  root.querySelector('[data-action="next"]').addEventListener('click', handlers.onNext);
  root.querySelector('[data-action="to-home"]').addEventListener('click', handlers.onToHome);
}
