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

// Мова в окремому ключі, а не в STORAGE_KEY: це налаштування, а не прогрес,
// тому «Очистити весь прогрес» його не скидає. Ключ читається ще до першого
// рендера, тоді як стан прогресу — разом із банком завдань.
const LANG_KEY = 'sqlTrainer:v1:lang';

export function loadLang() {
  try {
    return localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

export function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Приватний режим браузера може забороняти запис — мова просто не
    // запам'ятається до наступного разу.
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

// Ім'я для сертифіката — налаштування, а не прогрес, як і мова: «Почати
// заново» його не скидає. Рядок короткий, тому пишемо на кожну зміну.
const CERT_NAME_KEY = 'sqlTrainer:v1:certName';
const MAX_CERT_NAME = 80;

export function loadCertName() {
  try {
    return localStorage.getItem(CERT_NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveCertName(name) {
  try {
    localStorage.setItem(CERT_NAME_KEY, String(name).slice(0, MAX_CERT_NAME));
  } catch {
    // Приватний режим може забороняти запис — ім'я просто не запам'ятається.
  }
}
