import { loadEvents, saveEvents } from './persistence.js';

// 5000 подій при 130 завданнях — це історія на роки. Обмеження потрібне,
// щоб журнал не з'їв квоту localStorage: коли вона вичерпається, тихо
// перестане зберігатися вже й прогрес.
export const MAX_EVENTS = 5000;

export class EventLog {
  constructor() {
    this.events = loadEvents();
  }

  // kind: 'open' | 'attempt' | 'hint' | 'solved' | 'gave-up'
  // extra: довільні поля події — r (тип помилки), n (номер підказки),
  // ms (скільки часу зайняло завдання).
  record(kind, taskId, extra = {}) {
    this.events.push({ t: Date.now(), id: taskId, k: kind, ...extra });
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(this.events.length - MAX_EVENTS);
    }
    saveEvents(this.events);
  }

  all() {
    return this.events;
  }

  clear() {
    this.events = [];
    saveEvents(this.events);
  }
}
