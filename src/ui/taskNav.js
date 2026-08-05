const STATUS_CLASS = {
  solved: ' task-nav__item--solved',
  revealed: ' task-nav__item--revealed',
  new: '',
};

// Смужка з номерами всіх завдань рівня: показує статус кожного й дозволяє перейти
// на будь-яке — зокрема назад, до вже розв'язаних, щоб доопрацювати відповідь.
export function taskNavHtml(items, currentIndex) {
  return `
    <nav class="task-nav" aria-label="Завдання рівня">
      ${items
        .map(
          ({ index, status, hasNote }) => `
            <button
              class="task-nav__item${STATUS_CLASS[status] ?? ''}${hasNote ? ' task-nav__item--noted' : ''}${index === currentIndex ? ' task-nav__item--current' : ''}"
              data-index="${index}"
              ${index === currentIndex ? 'aria-current="step"' : ''}>${index + 1}</button>
          `
        )
        .join('')}
    </nav>
  `;
}

export function renderTaskNav(root, items, currentIndex, onSelect) {
  root.innerHTML = taskNavHtml(items, currentIndex);
  root.querySelectorAll('[data-index]').forEach((button) => {
    button.addEventListener('click', () => onSelect(Number(button.dataset.index)));
  });
}
