import { EventLog, MAX_EVENTS } from '../src/game/eventLog.js';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

// У Node немає localStorage. Підсовуємо свій, як це вже робить verifyState.mjs.
function fakeStorage() {
  const box = { value: null };
  globalThis.localStorage = {
    getItem: () => box.value,
    setItem: (key, next) => {
      box.value = next;
    },
    removeItem: () => {
      box.value = null;
    },
  };
  return box;
}

fakeStorage();

const log = new EventLog();
check('новий журнал порожній', log.all().length === 0);

log.record('open', 'L1-01');
check('подія записується', log.all().length === 1);
check('подія знає своє завдання', log.all()[0].id === 'L1-01');
check('подія знає свій вид', log.all()[0].k === 'open');
check('подія має час', typeof log.all()[0].t === 'number' && log.all()[0].t > 0);

log.record('attempt', 'L1-01', { r: 'data-mismatch' });
check('додаткові поля зберігаються', log.all()[1].r === 'data-mismatch');

log.record('solved', 'L1-01', { ms: 184000 });
check('тривалість зберігається', log.all()[2].ms === 184000);
check(
  'порядок подій зберігається',
  log
    .all()
    .map((e) => e.k)
    .join() === 'open,attempt,solved'
);

// Журнал переживає перезавантаження сторінки: другий екземпляр читає те саме
// сховище й має побачити ті самі події.
const reopened = new EventLog();
check('журнал читається зі сховища', reopened.all().length === 3);

reopened.record('hint', 'L1-02', { n: 2 });
check('дописування не стирає старе', new EventLog().all().length === 4);

// Без обмеження журнал ріс би вічно й рано чи пізно вичерпав квоту сховища —
// а тоді saveState тихо перестав би зберігати ще й прогрес.
const overflowing = new EventLog();
for (let i = 0; i < MAX_EVENTS + 250; i += 1) {
  overflowing.record('attempt', 'L1-01', { r: 'sql-error' });
}
check('журнал не перевищує ліміт', overflowing.all().length === MAX_EVENTS);
check('при переповненні відкидаються найстаріші', overflowing.all()[0].k === 'attempt');

overflowing.clear();
check('очищення спорожняє журнал', overflowing.all().length === 0);
check('очищення дістає й до сховища', new EventLog().all().length === 0);

// Пошкоджене сховище не має ронити застосунок: журнал — не критичні дані.
globalThis.localStorage.setItem('sqlTrainer:v1:events', '{зламаний json');
check('пошкоджений журнал читається як порожній', new EventLog().all().length === 0);

delete globalThis.localStorage;

console.log(
  failures === 0 ? '\nУсі перевірки журналу подій пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
