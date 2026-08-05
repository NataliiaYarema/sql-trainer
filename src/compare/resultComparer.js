function roundNumeric(value, precision) {
  if (typeof value !== 'number') return value;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeValue(value, precision) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return roundNumeric(value, precision);
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (value.trim() !== '' && !Number.isNaN(asNumber)) {
      return roundNumeric(asNumber, precision);
    }
    return value.trim();
  }
  return value;
}

function valuesEqual(a, b) {
  if (a === null || b === null) return a === b;
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 1e-6;
  }
  return String(a) === String(b);
}

function rowEquals(rowA, rowB) {
  return rowA.length === rowB.length && rowA.every((v, i) => valuesEqual(v, rowB[i]));
}

function rowsMatchUnordered(rowsA, rowsB) {
  if (rowsA.length !== rowsB.length) return false;
  const used = new Array(rowsB.length).fill(false);
  return rowsA.every((rowA) => {
    const idx = rowsB.findIndex((rowB, i) => !used[i] && rowEquals(rowA, rowB));
    if (idx === -1) return false;
    used[idx] = true;
    return true;
  });
}

function rowsMatchOrdered(rowsA, rowsB) {
  return rowsA.length === rowsB.length && rowsA.every((rowA, i) => rowEquals(rowA, rowsB[i]));
}

function* permutations(indices) {
  if (indices.length <= 1) {
    yield indices;
    return;
  }
  for (let i = 0; i < indices.length; i += 1) {
    const rest = [...indices.slice(0, i), ...indices.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [indices[i], ...perm];
    }
  }
}

export function compareResults(userResult, referenceResult, task) {
  const precision = task.numericPrecision ?? 2;
  const orderMatters = Boolean(task.orderMatters);
  const flexibleColumnOrder = task.flexibleColumnOrder !== false;

  if (userResult.columns.length !== referenceResult.columns.length) {
    return {
      ok: false,
      code: 'column-count',
      reason: `Очікувалась ${referenceResult.columns.length} колонка(и) у результаті, а отримано ${userResult.columns.length}.`,
    };
  }

  const normRow = (row) => row.map((v) => normalizeValue(v, precision));
  const userRows = userResult.values.map(normRow);
  const refRows = referenceResult.values.map(normRow);

  const columnCount = referenceResult.columns.length;
  const candidatePerms = flexibleColumnOrder
    ? [...permutations([...Array(columnCount).keys()])]
    : [[...Array(columnCount).keys()]];

  for (const perm of candidatePerms) {
    const permutedUserRows = userRows.map((row) => perm.map((i) => row[i]));
    const matches = orderMatters
      ? rowsMatchOrdered(permutedUserRows, refRows)
      : rowsMatchUnordered(permutedUserRows, refRows);
    if (matches) {
      return { ok: true };
    }
  }

  // Машинний код поруч із текстом: reason читає людина, code — журнал подій,
  // з якого потім рахується статистика типових помилок.
  return {
    ok: false,
    code: 'data-mismatch',
    reason: 'Дані у результаті запиту не збігаються з очікуваними.',
  };
}
