// Іспанський текст тем теорії, ключований рівнем теми.
//
// Поля title тут немає навмисно: назву теми topicsFor бере з levelName(level).
// Так само немає SQL і записаних результатів кейсів — вони мовно незалежні.
//
// Порядок елементів у масивах мусить відповідати джерелу: накладання йде за
// індексом. Форма summaryBlocks теж: рядок малюється абзацом, вкладений масив —
// маркованим списком.
export default {
  1: {
    summary:
      'Una consulta empieza con que nombras las columnas que necesitas (SELECT) y la tabla (FROM).',
    summaryBlocks: [
      [
        'WHERE deja solo las filas que cumplen una condición.',
        'ORDER BY ordena las filas que han quedado.',
        'LIMIT recorta el resultado a las primeras.',
      ],
      'El orden de las partes es fijo: SELECT → FROM → WHERE → ORDER BY → LIMIT.',
      'En este nivel harán falta además los agregados COUNT, SUM, MIN, MAX: sin GROUP BY comprimen toda la selección en una sola fila.',
    ],
    examples: [
      {
        label: 'ORDER BY + LIMIT: la cima de la lista',
        result:
          'Los tres productos más caros: Standing Desk a 430, Coffee Machine a 380 y 4K Monitor a 320. LIMIT recorta una lista ya ordenada, así que sin ORDER BY daría simplemente tres filas cualesquiera.',
      },
      {
        label: 'DISTINCT: quitar las repeticiones',
        result:
          'Una columna con la lista de categorías, cada una exactamente una vez, sin tener en cuenta cuántos productos hay en ella.',
      },
      {
        label: 'BETWEEN: un rango en lugar de dos comparaciones',
        result:
          'Los productos con un precio de 50 a 150, ambos incluidos, del más barato al más caro. Lo mismo que price >= 50 AND price <= 150.',
      },
      {
        label: 'LIKE: buscar por un fragmento de texto',
        result:
          'Los nombres que llevan «Set» en alguna parte. El carácter % significa «cualquier cantidad de caracteres».',
      },
      {
        label: 'Agregados sin GROUP BY',
        result:
          'Exactamente una fila con tres números de toda la tabla: cuántos productos hay, el precio más bajo y el más alto.',
      },
    ],
    pitfalls: [
      {
        title: 'ORDER BY por sí solo no limita nada',
        text: 'Ordenar solo cambia el orden de las filas: siguen siendo las mismas. Para tomar los tres productos más caros hacen falta las dos partes: ORDER BY price DESC LIMIT 3.',
      },
      {
        title: '= NULL no funcionará nunca',
        text: 'NULL significa «valor desconocido», y cualquier comparación con él no da «sí» ni «no», sino «desconocido». Por eso WHERE department = NULL devuelve siempre vacío; lo correcto es escribir IS NULL o IS NOT NULL.',
      },
      {
        title: 'El texto va entre comillas simples',
        text: 'WHERE category = \'Kitchen\' funciona y WHERE category = "Kitchen" no: PostgreSQL toma las comillas dobles por el nombre de una columna y no por texto, y se quejará de que la columna «Kitchen» no existe.',
      },
    ],
  },

  2: {
    summary:
      'GROUP BY junta las filas en montones por un valor común, y un agregado (COUNT, SUM, AVG, MIN, MAX) convierte cada montón en una fila de la respuesta.',
    summaryBlocks: [
      [
        'En un SELECT con GROUP BY solo se pueden tomar las columnas por las que se agrupó, más agregados del resto.',
        'HAVING es un filtro de los propios grupos: actúa después del recuento, mientras que WHERE descarta filas sueltas antes de agrupar.',
      ],
    ],
    examples: [
      {
        label: 'Una suma dentro de cada grupo',
        result:
          'Una fila por categoría: cuántas unidades de esa categoría hay en total en el almacén, del montón más grande al más pequeño.',
      },
      {
        label: 'Varios agregados en una sola pasada',
        result:
          'Una fila por responsable: cuántos pedidos llevó y cuál es su ticket medio, redondeado a céntimos.',
      },
      {
        label: 'MIN y MAX: los límites de cada grupo',
        result:
          'Cinco categorías, cada una con el precio de su producto más barato y del más caro. Stationery va de 4.20 a 15.00 y Furniture de 45.50 a 430.00.',
      },
      {
        label: 'HAVING: un filtro de los grupos ya formados',
        result:
          'Solo los clientes cuyo importe total de pedidos superó 1000. Los clientes con un importe menor se agrupan igualmente, pero no entran en la respuesta.',
      },
      {
        label: 'COUNT(*) frente a COUNT(columna)',
        result:
          'Dos números distintos: 12 y 11. COUNT(*) cuenta todas las filas y COUNT(department) solo aquellas en las que department no es NULL.',
      },
    ],
    pitfalls: [
      {
        title: 'WHERE no ve los agregados',
        text: 'WHERE COUNT(*) > 4 es un error, porque WHERE actúa antes de que los grupos existan siquiera. Las condiciones sobre COUNT, SUM o AVG van en HAVING. Y al revés: una condición normal sobre una fila (por ejemplo price > 100) sale más barata en WHERE que en HAVING.',
      },
      {
        title: 'Una columna fuera de GROUP BY y fuera de un agregado',
        text: 'Si eliges una columna que no está ni en GROUP BY ni dentro de un agregado, PostgreSQL se niega a ejecutar la consulta: «column must appear in the GROUP BY clause». No es tiquismiquis: sin esa regla no quedaría claro qué valor del grupo tendría que mostrar esa columna.',
      },
      {
        title: 'AVG se salta los NULL en lugar de contarlos como ceros',
        text: 'AVG(salary) sobre 10 filas en las que dos salarios están vacíos divide la suma por 8 y no por 10. Si un valor vacío tiene que significar cero, hay que decirlo de forma explícita: AVG(COALESCE(salary, 0)).',
      },
    ],
  },

  3: {
    summary:
      'JOIN cose las filas de dos tablas según la condición del ON, que normalmente es una coincidencia de identificadores.',
    summaryBlocks: [
      [
        'INNER JOIN deja solo las parejas en las que se encontraron las dos mitades.',
        'LEFT JOIN conserva todas las filas de la tabla izquierda y pone NULL donde no se encontró pareja.',
      ],
      'Justo por eso la pareja LEFT JOIN + IS NULL responde a la pregunta «y quién no tiene nada».',
    ],
    examples: [
      {
        label: 'INNER JOIN: solo las coincidencias',
        result:
          'Los pedidos de junio con el nombre del cliente al lado. Un cliente sin pedidos en junio no aparecerá ni una vez. Aquí la palabra INNER es opcional: un JOIN a secas significa exactamente lo mismo, pero en el título del tema la construcción lleva su nombre completo.',
      },
      {
        label: 'LEFT JOIN + IS NULL: encontrar a quienes no tienen nada',
        result:
          'Los clientes que no hicieron ningún pedido. LEFT JOIN los dejó en la selección con las columnas del pedido vacías, y WHERE conservó justamente esas filas.',
      },
      {
        label: 'JOIN + GROUP BY: los productos más vendidos por unidades',
        result:
          'Los cinco productos que se compraron en mayor cantidad. Primero las líneas de pedido reciben el nombre del producto y después el resultado se agrupa.',
      },
      {
        label: 'USING: una cadena de tres tablas escrita más corta',
        result:
          'Las cinco líneas más antiguas con la fecha del pedido y el nombre del producto: ahora la cadena tiene de verdad tres tablas. USING (order_id) es más corto que ON o.order_id = oi.order_id y además deja en el resultado una sola columna order_id en lugar de dos con el mismo nombre.',
      },
    ],
    pitfalls: [
      {
        title: 'Un JOIN sin ON multiplica las filas',
        text: 'Si se olvida la condición de unión, cada fila de la tabla izquierda se pega con cada fila de la derecha: 8 clientes y 31 pedidos dan 248 filas en lugar de 31. Un crecimiento repentino del número de filas es la primera señal de un ON perdido.',
      },
      {
        title: 'Una condición sobre la tabla derecha en WHERE mata un LEFT JOIN',
        text: 'LEFT JOIN orders o ... WHERE o.amount > 100 tira a todos los clientes sin pedidos, porque NULL no es mayor que 100, y el LEFT JOIN se convierte en silencio en un INNER. Si hay que conservar a los clientes sin pedidos, la condición va en el ON: ON o.customer_id = c.customer_id AND o.amount > 100.',
      },
      {
        title: 'COUNT(*) después de un LEFT JOIN cuenta 1 en lugar de 0',
        text: 'Un LEFT JOIN deja la fila incluso cuando a la derecha no se encontró nada, simplemente con las columnas vacías. COUNT(*) cuenta filas, así que para un cliente sin ningún pedido devuelve 1. Hay que contar una columna de la tabla derecha: COUNT(o.order_id) da un 0 honesto, porque COUNT no cuenta los NULL.',
      },
    ],
  },

  4: {
    summary: 'Una subconsulta es una consulta dentro de otra, puesta entre paréntesis.',
    summaryBlocks: [
      [
        'Una subconsulta escalar calcula lo más a menudo un solo número (por ejemplo el salario medio) con el que después se compara cada fila.',
        'Un CTE es la misma subconsulta, pero llevada arriba con WITH y con nombre: a partir de ahí se usa como si fuera una tabla normal.',
      ],
      'El resultado es el mismo, se lee mejor, y un CTE se puede usar varias veces o servir de base para el siguiente. Cuando una solución ya no cabe en la cabeza, repártela en pasos con nombre.',
    ],
    examples: [
      {
        label: 'Una subconsulta escalar en WHERE',
        result:
          'Primero se calcula el precio medio de la electrónica: un solo número. Después cada producto de cualquier categoría se compara justamente con él.',
      },
      {
        label: 'Una subconsulta en la lista de columnas',
        result:
          'Los productos de los que quedan menos de 10 unidades y, al lado, cuánto más barato es cada uno que el producto más caro de la lista de precios.',
      },
      {
        label: 'NOT IN: excluir con una lista ya hecha',
        result:
          'Una fila: Sofia Rossi, la única clienta sin ningún pedido. La subconsulta reúne primero la lista de quienes pidieron, y la consulta externa descarta a todos los de esa lista.',
      },
      {
        label: 'NOT EXISTS: excluir con una condición',
        result:
          'La misma Sofia Rossi, pero por otro camino: aquí la subconsulta no reúne una lista, sino que para cada cliente pregunta «¿existe al menos un pedido?». Justo por eso en el SELECT hay un 1: el valor no hace falta, lo que importa es que la fila exista.',
      },
      {
        label: 'WITH: darle nombre a un paso intermedio',
        result:
          'Las fechas en las que llegó más de un pedido. El primer paso cuenta los pedidos por día y el segundo filtra el resultado ya hecho.',
      },
      {
        label: 'Dos CTE seguidos',
        result:
          'Los clientes cuyo importe de compras es superior al importe medio por cliente. El segundo CTE se construye sobre el primero, y así el problema se parte en dos pasos sencillos.',
      },
    ],
    pitfalls: [
      {
        title: 'Una subconsulta escalar tiene que devolver un solo valor',
        text: 'La forma price > (SELECT ...) espera exactamente una fila y una columna. Si la subconsulta devuelve varias filas, habrá un error. Cuando lo que hace falta son varios valores, se usa IN en lugar de >: WHERE customer_id IN (SELECT customer_id FROM orders).',
      },
      {
        title: 'NOT IN se rompe con NULL',
        text: 'Si entre los valores de la subconsulta aparece aunque sea un NULL, NOT IN no devuelve ninguna fila, y además no habrá ningún error. Para preguntas del tipo «quién no está en la lista» es más seguro escribir NOT EXISTS o LEFT JOIN ... IS NULL.',
      },
      {
        title: 'Un CTE vive solo dentro de su propia consulta',
        text: 'Tras el punto y coma, el nombre declarado en WITH desaparece: no es una tabla que hayas creado. Y a un CTE solo se le puede hacer referencia por debajo del lugar donde se declaró: el segundo CTE ve al primero, pero no al contrario.',
      },
    ],
  },
};
