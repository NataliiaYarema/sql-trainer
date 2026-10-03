import { GameState } from '../src/game/state.js';
import { loadLang, saveLang, loadCertName, saveCertName } from '../src/game/persistence.js';

// У Node немає localStorage, але persistence.js ловить це в try/catch,
// тому GameState стартує з порожнього стану і його можна перевіряти тут.

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

const tasks = [
  { id: 'A1', level: 1 },
  { id: 'A2', level: 1 },
  { id: 'B1', level: 2 },
];

const state = new GameState(tasks);
check("новий стан не має розв'язаних завдань", state.solvedCount === 0);
check('порожній рівень дає 0', state.solvedCountForLevel(1) === 0);

state.registerSolved(tasks[0]);
state.registerSolved(tasks[2]);
check("рахує розв'язані свого рівня", state.solvedCountForLevel(1) === 1);
check('не змішує рівні', state.solvedCountForLevel(2) === 1);
check('рівень без завдань дає 0', state.solvedCountForLevel(5) === 0);

state.registerGaveUp(tasks[1]);
check("показана відповідь не рахується як розв'язане", state.solvedCountForLevel(1) === 1);
check('загальний лічильник теж не рахує здачу', state.solvedCount === 2);

state.registerSolved(tasks[0]);
check("повторне розв'язання не подвоює лічильник", state.solvedCountForLevel(1) === 1);

check('нове завдання має статус new', state.statusOf('A9') === 'new');
check("розв'язане має статус solved", state.statusOf('A1') === 'solved');
check('підглянуте має статус revealed', state.statusOf('A2') === 'revealed');

state.registerSolved(tasks[1]);
check('правильна відповідь після підглядання піднімає статус', state.statusOf('A2') === 'solved');
check('піднятий статус зараховується в лічильник рівня', state.solvedCountForLevel(1) === 2);

check('без чернетки повертається порожній рядок', state.getDraft('A1') === '');

state.saveDraft('A1', 'SELECT 1');
check('чернетка зберігається', state.getDraft('A1') === 'SELECT 1');
check('чернетки не змішуються між завданнями', state.getDraft('A2') === '');

state.saveDraft('A1', 'SELECT 2');
check('чернетку можна переписати', state.getDraft('A1') === 'SELECT 2');

state.saveDraft('A1', '   ');
check('чернетка з самих пробілів видаляється', state.getDraft('A1') === '');

const oversizedDraft = 'x'.repeat(15000);
state.saveDraft('A1', oversizedDraft);
check('задовга чернетка обрізається до ліміту', state.getDraft('A1').length === 10000);

const normalDraft = 'SELECT * FROM employees';
state.saveDraft('A1', normalDraft);
check('звичайна чернетка не обрізається', state.getDraft('A1') === normalDraft);

check('без нотатки повертається порожній рядок', state.getNote('A1') === '');
check('без нотатки hasNote дає false', state.hasNote('A1') === false);

state.saveNote('A1', 'краще через JOIN');
check('нотатка зберігається', state.getNote('A1') === 'краще через JOIN');
check('нотатка робить hasNote true', state.hasNote('A1') === true);
check('нотатки не змішуються між завданнями', state.getNote('A2') === '');
check('нотатка не чіпає чернетку', state.getDraft('A1') !== 'краще через JOIN');

state.saveNote('A1', 'варіант із CTE');
check('нотатку можна переписати', state.getNote('A1') === 'варіант із CTE');

check('рівень із однією нотаткою рахується', state.notedCountForLevel(1) === 1);
check('рівень без нотаток дає 0', state.notedCountForLevel(2) === 0);

state.saveNote('B1', 'тут вікна');
check('нотатки не змішують рівні', state.notedCountForLevel(2) === 1);
check('рівень без завдань дає 0 нотаток', state.notedCountForLevel(5) === 0);

state.saveNote('A1', '   ');
check('нотатка з самих пробілів видаляється', state.getNote('A1') === '');
check('видалена нотатка не рахується', state.notedCountForLevel(1) === 0);

const oversizedNote = 'н'.repeat(15000);
state.saveNote('A1', oversizedNote);
check('задовга нотатка обрізається до ліміту', state.getNote('A1').length === 10000);

// «Почати заново» знімає проходження курсу, але не чіпає нотаток: це власні
// висновки користувача, а не прогрес, і відновити їх нізвідки.
state.saveDraft('B1', 'SELECT 3');
state.saveNote('B1', 'мій висновок');
state.registerSolved({ id: 'B1', level: 2 });
state.resetProgress();
check('скидання чистить чернетки', state.getDraft('B1') === '');
check("скидання чистить розв'язані", state.solvedCount === 0);
check('скидання зберігає нотатки', state.getNote('B1') === 'мій висновок');
check('нотатка після скидання рахується', state.notedCountForLevel(2) === 1);

// Нотатки прибираються окремо від прогресу — і поштучно, і всі разом.
state.saveNote('A1', 'перша');
state.saveNote('A2', 'друга');
state.registerSolved({ id: 'A1', level: 1 });
state.saveNote('A1', '');
check('порожній текст видаляє одну нотатку', state.getNote('A1') === '');
check('сусідня нотатка лишається', state.getNote('A2') === 'друга');
check('видалення нотатки не чіпає прогрес', state.isSolved('A1') === true);

state.clearNotes();
check('очищення прибирає всі нотатки', state.getNote('A2') === '' && state.getNote('B1') === '');
check('очищення нотаток не чіпає прогрес', state.isSolved('A1') === true);

// Стан, збережений до появи нотаток, має читатися без втрат. Підсовуємо
// localStorage вручну: у Node його немає, тому persistence.js завжди повертав null.
globalThis.localStorage = {
  value: JSON.stringify({
    schemaVersion: 1,
    solved: { A1: { status: 'solved', level: 1 } },
    drafts: { A1: 'SELECT 1' },
  }),
  getItem() {
    return this.value;
  },
  setItem(key, next) {
    this.value = next;
  },
  removeItem() {
    this.value = null;
  },
};

const legacy = new GameState(tasks);
check('старий стан зберігає прогрес', legacy.isSolved('A1') === true);
check('старий стан зберігає чернетки', legacy.getDraft('A1') === 'SELECT 1');
check('старий стан без нотаток не ламається', legacy.getNote('A1') === '');
legacy.saveNote('A1', 'нотатка поверх старого стану');
check(
  'у старий стан можна дописати нотатку',
  legacy.getNote('A1') === 'нотатка поверх старого стану'
);

delete globalThis.localStorage;

// Після перенумерації завдань у сховищі лишаються записи зі старими id.
// Поле level у них ціле, а solvedCountForLevel рахує саме за ним — тому
// без чистки картка рівня показала б прогрес по неіснуючих завданнях.
globalThis.localStorage = {
  value: JSON.stringify({
    schemaVersion: 1,
    solved: {
      A1: { status: 'solved', level: 1 },
      ZZZ: { status: 'solved', level: 1 },
    },
    drafts: { A1: 'SELECT 1', ZZZ: 'SELECT 999' },
    notes: { A1: 'жива нотатка', ZZZ: 'нотатка привида' },
  }),
  getItem() {
    return this.value;
  },
  setItem(key, next) {
    this.value = next;
  },
  removeItem() {
    this.value = null;
  },
};

const cleaned = new GameState(tasks);
check('запис із невідомим id не рахується', cleaned.solvedCountForLevel(1) === 1);
check('запис із відомим id лишається', cleaned.isSolved('A1') === true);
check('невідомий id не має статусу solved', cleaned.statusOf('ZZZ') === 'new');
check('чернетка невідомого id прибирається', cleaned.getDraft('ZZZ') === '');
check('чернетка відомого id лишається', cleaned.getDraft('A1') === 'SELECT 1');
check('нотатка невідомого id прибирається', cleaned.getNote('ZZZ') === '');
check('нотатка відомого id лишається', cleaned.getNote('A1') === 'жива нотатка');
check('лічильник нотаток не рахує привидів', cleaned.notedCountForLevel(1) === 1);

delete globalThis.localStorage;

// Мова живе в окремому ключі, а не в стані прогресу: це налаштування, і
// «Очистити весь прогрес» не має його скидати.
check('без сховища мова невідома', loadLang() === null);
check(
  'запис без сховища не кидає винятку',
  (() => {
    saveLang('es');
    return true;
  })()
);

// --- Позначка підглядання й сертифікат ---
const certTasks = [
  { id: 'C1', level: 1 },
  { id: 'C2', level: 1 },
];
const cert = new GameState(certTasks);
cert.registerGaveUp(certTasks[0]);
check('підглядання ставить peeked', cert.data.solved.C1.peeked === true);
cert.registerSolved(certTasks[0]);
check("peeked переживає розв'язання", cert.data.solved.C1.peeked === true);
check("статус після розв'язання — solved", cert.statusOf('C1') === 'solved');

cert.registerSolved(certTasks[1]);
check('на 2 з 2 сертифікат видано', cert.certificate !== null);
check('на 2 з 2 з підгляданням — звичайний', cert.certificate.tier === 'basic');

cert.registerGaveUp(certTasks[1]);
check("підглядання розв'язаного теж ставить peeked", cert.data.solved.C2.peeked === true);
check("підглядання розв'язаного не знімає solved", cert.statusOf('C2') === 'solved');
check('отриманий сертифікат не зникає', cert.certificate.tier === 'basic');

const clean = new GameState(certTasks);
check(
  "перше розв'язання — ще не сертифікат",
  clean.registerSolved(certTasks[0], '2026-10-01') === null
);
check('останнє — видача', clean.registerSolved(certTasks[1], '2026-10-02') === 'awarded');
check('без підглядань — відзнака', clean.certificate.tier === 'distinction');
check('дата — день видачі', clean.certificate.date === '2026-10-02');
check(
  "повторне розв'язання нічого не видає",
  clean.registerSolved(certTasks[1], '2026-10-05') === null
);

const upgrade = new GameState([
  ...Array.from({ length: 10 }, (_, i) => ({ id: `U${i}`, level: 1 })),
]);
for (let i = 0; i < 9; i += 1) upgrade.registerSolved({ id: `U${i}`, level: 1 }, '2026-10-01');
check('9 з 10 — звичайний', upgrade.certificate?.tier === 'basic');
check(
  'останнє — підвищення',
  upgrade.registerSolved({ id: 'U9', level: 1 }, '2026-10-04') === 'upgraded'
);
check('підвищення з новою датою', upgrade.certificate.date === '2026-10-04');

clean.resetProgress();
check('«Почати заново» скидає сертифікат', clean.certificate === null);
check('«Почати заново» скидає peeked', Object.keys(clean.data.solved).length === 0);

const store = {};
globalThis.localStorage = {
  getItem(key) {
    return Object.hasOwn(store, key) ? store[key] : null;
  },
  setItem(key, next) {
    store[key] = next;
  },
  removeItem(key) {
    delete store[key];
  },
};

saveLang('es');
check('мова зберігається й читається назад', loadLang() === 'es');
check('мова лежить під власним ключем', Object.keys(store).join() === 'sqlTrainer:v1:lang');

const langState = new GameState(tasks);
langState.saveNote('A1', 'нотатка');
langState.resetProgress();
check('очищення прогресу не скидає мову', loadLang() === 'es');

saveCertName('Ada Lovelace');
check("ім'я зберігається", loadCertName() === 'Ada Lovelace');
langState.resetProgress();
check("«Почати заново» не скидає ім'я", loadCertName() === 'Ada Lovelace');

store['sqlTrainer:v1:state'] = JSON.stringify({
  schemaVersion: 1,
  solved: { A1: { status: 'solved', level: 1 } },
  certificate: { tier: 'basic', date: '2026-10-03' },
});
check('сертифікат читається зі сховища', new GameState(tasks).certificate?.tier === 'basic');
store['sqlTrainer:v1:state'] = JSON.stringify({
  schemaVersion: 1,
  solved: {},
  certificate: { tier: 'x' },
});
check('зламаний запис сертифіката відкидається', new GameState(tasks).certificate === null);
store['sqlTrainer:v1:state'] = JSON.stringify({ schemaVersion: 1, solved: {} });
check('старий стан без сертифіката завантажується', new GameState(tasks).certificate === null);

// Легасі запис { status: 'revealed' } без прапорця peeked — зі сховища,
// заповненого до появи цього прапорця. registerSolved мусить розпізнати
// в ньому підглядання і через statusOf/status === 'revealed', а не лише
// через record.peeked, інакше розв'язання такого завдання виглядало б
// самостійним і давало б право на відзнаку.
store['sqlTrainer:v1:state'] = JSON.stringify({
  schemaVersion: 1,
  solved: { A1: { status: 'revealed', level: 1 } },
});
const legacyRevealed = new GameState(tasks);
check(
  'легасі "revealed" без peeked зі сховища читається як є',
  legacyRevealed.data.solved.A1.peeked === undefined
);
legacyRevealed.registerSolved(tasks[0], '2026-10-01');
check(
  'розв\'язання легасі "revealed" ставить peeked',
  legacyRevealed.data.solved.A1.peeked === true
);
legacyRevealed.registerSolved(tasks[1], '2026-10-01');
const legacyAward = legacyRevealed.registerSolved(tasks[2], '2026-10-01');
check(
  "усе розв'язано, але легасі підглядання не дає відзнаки",
  legacyAward === 'awarded' && legacyRevealed.certificate.tier === 'basic'
);

delete globalThis.localStorage;

console.log(
  failures === 0 ? '\nУсі перевірки стану пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
