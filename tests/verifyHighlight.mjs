import { highlightSql } from '../src/ui/sqlHighlight.js';

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    console.error(`FAIL ${name}`);
    failures += 1;
  }
}

// Найважливіший інваріант: підсвітка лише розфарбовує текст. Якщо зняти теги
// й повернути символи з entity, має вийти рівно те, що подали на вхід —
// інакше користувач побачить не той запит, який насправді треба написати.
function plainText(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

const samples = [
  'SELECT * FROM customers;',
  "SELECT name FROM customers WHERE country = 'Ukraine';",
  'SELECT COUNT(*) AS total, ROUND(AVG(price), 2) AS avg FROM products;',
  'SELECT a FROM t WHERE x <> 1 AND y >= 2.5; -- коментар',
  "SELECT strftime('%Y', hire_date) FROM employees;",
  'SELECT product_name\nFROM products\nWHERE price BETWEEN 50 AND 150;',
];

check(
  'підсвітка не змінює жодного символа запиту',
  samples.every((sql) => plainText(highlightSql(sql)) === sql)
);

const basic = highlightSql('SELECT * FROM customers;');
check('ключове слово отримує свій клас', basic.includes('<span class="sql-keyword">SELECT</span>'));
check('FROM теж ключове слово', basic.includes('<span class="sql-keyword">FROM</span>'));
check('назва таблиці не фарбується', basic.includes('customers'));
check('назва таблиці не має власного span', !basic.includes('>customers</span>'));

check(
  'регістр ключового слова зберігається',
  highlightSql('select 1;').includes('<span class="sql-keyword">select</span>')
);

const withString = highlightSql("WHERE category = 'Electronics';");
check('рядковий літерал разом з лапками', withString.includes(`sql-string">'Electronics'</span>`));

check(
  'число отримує свій клас',
  highlightSql('WHERE price > 200;').includes('<span class="sql-number">200</span>')
);
check(
  'дробове число не розривається',
  highlightSql('WHERE price > 2.5;').includes('<span class="sql-number">2.5</span>')
);

const withFunc = highlightSql('SELECT COUNT(*) FROM t;');
check('функція отримує свій клас', withFunc.includes('<span class="sql-function">COUNT</span>'));
check(
  'ключове слово перед дужкою лишається ключовим',
  highlightSql('WHERE id IN (1);').includes('<span class="sql-keyword">IN</span>')
);
check(
  'віконна функція з підкресленням розпізнається',
  highlightSql('SELECT ROW_NUMBER() OVER (ORDER BY x) FROM t;').includes(
    '<span class="sql-function">ROW_NUMBER</span>'
  )
);
check(
  'OVER лишається ключовим словом',
  highlightSql('SELECT RANK() OVER (ORDER BY x) FROM t;').includes(
    '<span class="sql-keyword">OVER</span>'
  )
);

check(
  'коментар отримує свій клас',
  highlightSql('SELECT 1; -- пояснення').includes('<span class="sql-comment">-- пояснення</span>')
);

const escaped = highlightSql('WHERE a <> b AND c = "d";');
check('кутові дужки екрановані', escaped.includes('&lt;&gt;'));
check('у розмітку не потрапляє сирий <>', !escaped.includes('<>'));
check('подвійні лапки екрановані', escaped.includes('&quot;'));

check('порожній запит не ламає підсвітку', highlightSql('') === '');

console.log(
  failures === 0 ? '\nУсі перевірки підсвітки пройдено.' : `\n${failures} перевірок провалено.`
);
process.exit(failures === 0 ? 0 : 1);
