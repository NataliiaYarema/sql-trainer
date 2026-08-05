const STORAGE_KEY = 'sqlTrainer:v1:state';
const SCHEMA_VERSION = 1;

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION }));
  } catch {
    // Приватний режим браузера може забороняти запис — прогрес просто не збережеться.
  }
}

// Журнал подій навмисно лежить в окремому ключі, а не в STORAGE_KEY.
// saveState викликається кожні 400 мс під час набору чернетки — якби журнал
// був у тому самому блобі, ми серіалізували б десятки кілобайт історії на
// кожне натискання клавіші.
const EVENTS_KEY = 'sqlTrainer:v1:events';

export function loadEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEvents(events) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Журнал — не критичні дані. Якщо сховище недоступне або переповнене,
    // мовчки втрачаємо історію, але не ламаємо тренажер.
  }
}

// Запит із пісочниці лежить в окремому ключі, а не серед чернеток завдань.
// normalize() у state.js викидає записи, чиїх id немає в банку, — запит
// пісочниці такого id не має й зникав би після кожного перезавантаження.
const SANDBOX_KEY = 'sqlTrainer:v1:sandbox';

export function loadSandboxSql() {
  try {
    return localStorage.getItem(SANDBOX_KEY);
  } catch {
    return null;
  }
}

export function saveSandboxSql(sql) {
  try {
    localStorage.setItem(SANDBOX_KEY, sql);
  } catch {
    // Приватний режим браузера може забороняти запис — запит просто не збережеться.
  }
}

// Прибираємо ключ, а не пишемо порожній рядок: порожнє значення означало б
// «користувач стер текст сам», і пісочниця відкрилася б без початкового запиту.
export function clearSandboxSql() {
  try {
    localStorage.removeItem(SANDBOX_KEY);
  } catch {
    // Сховище недоступне — отже й чистити нічого.
  }
}
