// PGlite повертає { fields: [{ name, dataTypeID }], rows }, а весь UI і
// компаратор написані під { columns, values } — форму, яку давав sql.js.
// Адаптер тримаємо окремим чистим модулем: він не тягне wasm, тому його
// можна перевіряти у звичайному node, як і решту чистих модулів проєкту.

// Коди типів PostgreSQL (pg_type.oid). Решта типів проходить наскрізь:
// NUMERIC приїжджає рядком «120.50», і resultComparer уже вміє порівнювати
// числові рядки з числами.
const DATE_OID = 1082;
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;

function pad(value) {
  return String(value).padStart(2, '0');
}

// Дві гілки нижче виглядають однаково, але зводити їх до однієї не можна —
// драйвер конструює Date із двох типів по-різному.
//
// DATE (1082) і TIMESTAMPTZ (1184) приходять із відомим моментом часу, а
// інстанс PGlite стартує з timezone = 'UTC' — тому UTC-складові дають ті
// самі цифри, що показав би psql.
function utcParts(value) {
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
    hours: value.getUTCHours(),
    minutes: value.getUTCMinutes(),
    seconds: value.getUTCSeconds(),
  };
}

// TIMESTAMP (1114) приходить голим текстом «2024-06-19 00:00:00», і драйвер
// робить із нього new Date(2024, 5, 19) — у зоні машини. Прочитати з такого
// об'єкта UTC-складові означає відняти зсув зони: у Києві дата з'їхала б на
// добу назад, і DATE + INTERVAL '30 days' показував би 18 червня замість 19.
function localParts(value) {
  return {
    year: value.getFullYear(),
    month: value.getMonth() + 1,
    day: value.getDate(),
    hours: value.getHours(),
    minutes: value.getMinutes(),
    seconds: value.getSeconds(),
  };
}

function formatDate(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

// DATE_TRUNC та інші «початки періоду» мають нульовий час. Показувати
// «2024-03-01 00:00:00» там, де йдеться про місяць, — зайвий шум.
function formatTimestamp(parts) {
  const time = `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
  return time === '00:00:00' ? formatDate(parts) : `${formatDate(parts)} ${time}`;
}

function formatValue(value, dataTypeID) {
  if (value === null || value === undefined) return null;
  if (dataTypeID === DATE_OID) return formatDate(utcParts(value));
  if (dataTypeID === TIMESTAMPTZ_OID) return formatTimestamp(utcParts(value));
  if (dataTypeID === TIMESTAMP_OID) return formatTimestamp(localParts(value));
  return value;
}

export function toResult(pgResult) {
  return {
    columns: pgResult.fields.map((field) => field.name),
    values: pgResult.rows.map((row) =>
      row.map((value, index) => formatValue(value, pgResult.fields[index].dataTypeID))
    ),
  };
}
