import {
  certificateStatus,
  nextCertificate,
  localDateString,
  isCertificateRecord,
  isPeeked,
} from '../src/game/certificate.js';

let failures = 0;
function check(name, condition) {
  if (condition) console.log(`OK   ${name}`);
  else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

// Банк як у справжньому курсі за розміром рівнів: 15 і 20.
const tasks = [
  ...Array.from({ length: 15 }, (_, i) => ({ id: `a${i}`, level: 1 })),
  ...Array.from({ length: 20 }, (_, i) => ({ id: `b${i}`, level: 2 })),
];
const solvedOf = (ids, extra = {}) =>
  Object.fromEntries(
    ids.map((id) => [id, { status: 'solved', level: id[0] === 'a' ? 1 : 2, ...extra }])
  );
const first = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

let s = certificateStatus(tasks, {});
check('порожній стан — сертифіката немає', s.tier === null);
check('поріг 15 → 14', s.perLevel[0].need === 14);
check('поріг 20 → 18', s.perLevel[1].need === 18);
check('бракує рахується від порога', s.perLevel[0].missing === 14);
check('відзнака досяжна без підглядань', s.distinctionPossible);

s = certificateStatus(tasks, solvedOf([...first('a', 14), ...first('b', 18)]));
check('рівно 14/15 і 18/20 — звичайний', s.tier === 'basic');

s = certificateStatus(tasks, solvedOf([...first('a', 13), ...first('b', 20)]));
check('13/15 — ще ні', s.tier === null);

s = certificateStatus(tasks, solvedOf([...first('a', 15), ...first('b', 17)]));
check('17/20 — ще ні', s.tier === null);

s = certificateStatus(tasks, solvedOf([...first('a', 15), ...first('b', 20)]));
check('усе без підглядань — відзнака', s.tier === 'distinction');
check('лічильники загалом', s.solvedTotal === 35 && s.total === 35);

const peekedOne = { ...solvedOf([...first('a', 15), ...first('b', 20)]) };
peekedOne.a0 = { ...peekedOne.a0, peeked: true };
s = certificateStatus(tasks, peekedOne);
check("підглянуте й розв'язане — звичайний, не відзнака", s.tier === 'basic');
check('відзнака стає недосяжною', s.distinctionPossible === false);

const revealedOnly = {
  ...solvedOf([...first('a', 14), ...first('b', 18)]),
  a14: { status: 'revealed', level: 1, peeked: true },
};
s = certificateStatus(tasks, revealedOnly);
check("лише підглянуте не рахується розв'язаним", s.perLevel[0].solved === 14);

// Легасі запис «подивився відповідь» зберігався до появи прапорця peeked
// лише як { status: 'revealed' }. isPeeked і certificateStatus мусять
// визнавати його підглядом і без явного peeked — інакше стара відмітка
// мовчки відкривала б відзнаку.
check(
  'isPeeked визнає легасі revealed без прапорця',
  isPeeked({ status: 'revealed', level: 1 }) === true
);
check('isPeeked не плутає новий "new" запис із підгляданням', isPeeked({ status: 'new' }) !== true);
check('isPeeked на відсутньому записі — не підглянуто', isPeeked(undefined) !== true);

const legacyRevealedNoFlag = {
  ...solvedOf([...first('a', 15), ...first('b', 20)]),
  a0: { status: 'revealed', level: 1 },
};
s = certificateStatus(tasks, legacyRevealedNoFlag);
check(
  'легасі "revealed" без peeked теж робить відзнаку недосяжною',
  s.distinctionPossible === false
);

const solvedUnknown = { zz: { status: 'solved', level: 1 } };
check('записи поза банком ігноруються', certificateStatus(tasks, solvedUnknown).solvedTotal === 0);

check(
  'видача з нуля',
  JSON.stringify(nextCertificate(null, 'basic', '2026-10-03')) ===
    '{"tier":"basic","date":"2026-10-03"}'
);
check('без умови лишається null', nextCertificate(null, null, '2026-10-03') === null);
const basic = { tier: 'basic', date: '2026-10-01' };
check('отриманий не зникає', nextCertificate(basic, null, '2026-10-03') === basic);
check(
  'той самий рівень — дата не змінюється',
  nextCertificate(basic, 'basic', '2026-10-03') === basic
);
const up = nextCertificate(basic, 'distinction', '2026-10-03');
check('підвищення з новою датою', up.tier === 'distinction' && up.date === '2026-10-03');
const dist = { tier: 'distinction', date: '2026-10-01' };
check('не знижується', nextCertificate(dist, 'basic', '2026-10-03') === dist);

check('локальна дата', localDateString(new Date(2026, 0, 5)) === '2026-01-05');
check('валідний запис', isCertificateRecord({ tier: 'basic', date: '2026-10-03' }));
check('невідомий рівень відкидається', !isCertificateRecord({ tier: 'gold', date: '2026-10-03' }));
check('криву дату відкидаємо', !isCertificateRecord({ tier: 'basic', date: 'вчора' }));
check('null відкидається', !isCertificateRecord(null));

console.log(
  failures === 0 ? '\nУсі перевірки сертифіката пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
