import { icon, escapeHtml } from '../utils/dom.js';
import { topicKeywords } from '../theory/topics.js';

// topics: [{ level, title, keywords, summary }] — секція під сіткою рівнів на головному екрані.
export function theoryListHtml(topics) {
  return `
    <div class="theory-list">
      <h2 class="theory-list__title">${icon('i-book')}Теорія</h2>
      <div class="theory-list__items">
        ${topics.map(theoryItemHtml).join('')}
      </div>
    </div>
  `;
}

function theoryItemHtml(topic) {
  const { level } = topic;

  return `
    <button class="theory-item" data-theory="${level}">
      <span class="theory-item__level">Рівень ${level}</span>
      <span class="theory-item__name">${escapeHtml(topic.title)}: <span class="theory-item__keywords">${escapeHtml(topic.subtitle ?? topicKeywords(topic))}</span></span>
      <span class="theory-item__go">${icon('i-arrow-right')}</span>
    </button>
  `;
}

export function renderTheoryList(root, topics, onPick) {
  root.innerHTML = theoryListHtml(topics);

  root.querySelectorAll('[data-theory]').forEach((item) => {
    item.addEventListener('click', () => onPick(Number(item.dataset.theory)));
  });
}
