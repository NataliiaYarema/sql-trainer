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
      'Una consulta empieza indicando las columnas que necesitas (SELECT) y la tabla que quieres consultar (FROM).',
    summaryBlocks: [
      [
        'WHERE deja solo las filas que cumplen una condición.',
        'ORDER BY ordena las filas que han quedado.',
        'LIMIT limita el resultado a las primeras filas.',
      ],
      'El orden de las partes es fijo: SELECT → FROM → WHERE → ORDER BY → LIMIT.',
      'En este nivel también necesitarás los agregados COUNT, SUM, MIN y MAX. Sin GROUP BY, agregan toda la selección en una sola fila.',
    ],
    examples: [
      {
        label: 'ORDER BY + LIMIT: los primeros de la lista',
        result:
          'Los tres productos más caros: Standing Desk a 430, Coffee Machine a 380 y 4K Monitor a 320. LIMIT recorta una lista ya ordenada, así que sin ORDER BY devolvería tres filas en un orden no especificado.',
      },
      {
        label: 'DISTINCT: quitar las repeticiones',
        result:
          'Una columna con la lista de categorías, cada una exactamente una vez, independientemente de cuántos productos haya en cada categoría.',
      },
      {
        label: 'BETWEEN: un rango en lugar de dos comparaciones',
        result:
          'Los productos con un precio de 50 a 150, ambos incluidos, del más barato al más caro. Es lo mismo que price >= 50 AND price <= 150.',
      },
      {
        label: 'LIKE: buscar por un fragmento de texto',
        result:
          'Los nombres que contienen «Set» en alguna parte. El carácter % significa «cero o más caracteres».',
      },
      {
        label: 'Agregados sin GROUP BY',
        result:
          'Exactamente una fila con tres valores calculados sobre toda la tabla: cuántos productos hay, el precio más bajo y el más alto.',
      },
    ],
    pitfalls: [
      {
        title: 'ORDER BY por sí solo no limita el número de filas',
        text: 'Ordenar solo cambia el orden de las filas: siguen siendo las mismas. Para obtener los tres productos más caros hacen falta las dos partes: ORDER BY price DESC LIMIT 3.',
      },
      {
        title: '= NULL no funcionará nunca',
        text: 'NULL significa «valor desconocido», y cualquier comparación con él da UNKNOWN, no «sí» ni «no». Por eso WHERE department = NULL no devuelve ninguna fila. Lo correcto es usar IS NULL o IS NOT NULL.',
      },
      {
        title: 'El texto va entre comillas simples',
        text: 'WHERE category = \'Kitchen\' funciona, mientras que WHERE category = "Kitchen" no. PostgreSQL interpreta las comillas dobles como identificadores, no como texto, por lo que interpreta "Kitchen" como el nombre de una columna y dará un error indicando que la columna «Kitchen» no existe.',
      },
    ],
  },

  2: {
    summary:
      'GROUP BY agrupa las filas según un valor común, y un agregado (COUNT, SUM, AVG, MIN, MAX) resume cada grupo en una fila del resultado.',
    summaryBlocks: [
      [
        'En un SELECT con GROUP BY, solo puedes seleccionar las columnas por las que se agrupa y los agregados aplicados al resto.',
        'HAVING es un filtro aplicado a los grupos: se ejecuta después de agrupar y calcular los agregados, mientras que WHERE descarta filas antes de agrupar.',
      ],
    ],
    examples: [
      {
        label: 'Una suma dentro de cada grupo',
        result:
          'Una fila por categoría: cuántas unidades de esa categoría hay en total en el almacén, de la categoría con más unidades a la que tiene menos.',
      },
      {
        label: 'Varios agregados en una sola consulta',
        result:
          'Una fila por responsable: cuántos pedidos gestionó y cuál es el importe medio de sus pedidos, redondeado a céntimos.',
      },
      {
        label: 'MIN y MAX: los límites de cada grupo',
        result:
          'Cinco categorías, cada una con el precio de su producto más barato y del más caro. Stationery tiene precios de 4.20 a 15.00 y Furniture, de 45.50 a 430.00.',
      },
      {
        label: 'HAVING: un filtro de los grupos ya formados',
        result:
          'Solo los clientes cuyo importe total de pedidos superó 1000. Los clientes con un importe menor también forman un grupo, pero no aparecen en el resultado.',
      },
      {
        label: 'COUNT(*) frente a COUNT(columna)',
        result:
          'Dos valores distintos: 12 y 11. COUNT(*) cuenta todas las filas, mientras que COUNT(department) solo cuenta las filas en las que department no es NULL.',
      },
    ],
    pitfalls: [
      {
        title: 'WHERE no puede usar los agregados',
        text: 'WHERE COUNT(*) > 4 es un error porque WHERE actúa antes de que los grupos se formen. Las condiciones sobre COUNT, SUM o AVG van en HAVING. En cambio, una condición normal sobre una fila, como price > 100, se puede aplicar en WHERE y puede ser más eficiente que aplicarla después de agrupar.',
      },
      {
        title: 'Una columna fuera de GROUP BY y fuera de un agregado',
        text: 'Si seleccionas una columna que no está ni en GROUP BY ni dentro de un agregado, PostgreSQL se niega a ejecutar la consulta: «column must appear in the GROUP BY clause». No es una limitación arbitraria: sin esta regla, no estaría claro qué valor del grupo debería mostrar esa columna.',
      },
      {
        title: 'AVG ignora los NULL en lugar de contarlos como ceros',
        text: 'AVG(salary) sobre 10 filas en las que dos salarios son NULL divide la suma entre 8, no entre 10. Si un valor NULL debe interpretarse como cero, hay que indicarlo de forma explícita: AVG(COALESCE(salary, 0)).',
      },
    ],
  },

  3: {
    summary:
      'JOIN combina las filas de dos tablas según la condición de ON, que normalmente comprueba que dos identificadores coinciden.',
    summaryBlocks: [
      [
        'INNER JOIN deja solo las parejas de filas en las que hay coincidencia en ambas tablas.',
        'LEFT JOIN conserva todas las filas de la tabla izquierda y rellena con NULL las columnas de la tabla derecha cuando no encuentra una coincidencia.',
      ],
      'Por eso, la combinación LEFT JOIN + IS NULL permite responder a la pregunta «¿quién no tiene nada?».',
    ],
    examples: [
      {
        label: 'INNER JOIN: solo las coincidencias',
        result:
          'Los pedidos de junio con el nombre del cliente junto al pedido. Un cliente sin pedidos en junio no aparecerá en el resultado. Aquí la palabra INNER es opcional: un JOIN a secas significa exactamente lo mismo. Aun así, en el título del tema usamos el nombre completo de la construcción.',
      },
      {
        label: 'LEFT JOIN + IS NULL: encontrar a quienes no tienen nada',
        result:
          'Los clientes que no hicieron ningún pedido. LEFT JOIN conserva esos clientes y establece las columnas de orders en NULL cuando no encuentra ningún pedido. WHERE conserva precisamente esas filas.',
      },
      {
        label: 'JOIN + GROUP BY: los productos más vendidos por unidades',
        result:
          'Los cinco productos que se vendieron en mayor cantidad. Primero, las líneas de pedido se combinan con el nombre del producto y después el resultado se agrupa.',
      },
      {
        label: 'USING: una cadena de tres tablas escrita de forma más concisa',
        result:
          'Las cinco líneas de pedido más antiguas, con la fecha del pedido y el nombre del producto. Esta consulta combina tres tablas. USING (order_id) es más corto que ON o.order_id = oi.order_id y, además, deja una sola columna order_id en el resultado en lugar de dos columnas con el mismo nombre.',
      },
    ],
    pitfalls: [
      {
        title: 'Un JOIN sin ON multiplica las filas',
        text: 'Si se olvida la condición de unión, cada fila de la tabla izquierda se combina con cada fila de la tabla derecha: 8 clientes y 31 pedidos dan 248 filas en lugar de 31. Un aumento repentino del número de filas es una primera señal de que falta la condición ON.',
      },
      {
        title:
          'Una condición sobre la tabla derecha en WHERE puede anular el efecto de un LEFT JOIN',
        text: 'LEFT JOIN orders o ... WHERE o.amount > 100 elimina a todos los clientes sin pedidos, porque NULL no es mayor que 100. Como consecuencia, las filas que LEFT JOIN había conservado para esos clientes quedan descartadas por WHERE. Si hay que conservar a los clientes sin pedidos, la condición puede ir en ON: ON o.customer_id = c.customer_id AND o.amount > 100.',
      },
      {
        title: 'COUNT(*) después de un LEFT JOIN cuenta 1 en lugar de 0',
        text: 'Un LEFT JOIN conserva la fila incluso cuando no encuentra ninguna coincidencia en la tabla derecha, dejando sus columnas en NULL. COUNT(*) cuenta filas, así que para un cliente sin ningún pedido devuelve 1. Hay que contar una columna de la tabla derecha: COUNT(o.order_id) devuelve 0, porque COUNT no cuenta los valores NULL.',
      },
    ],
  },

  4: {
    summary: 'Una subconsulta es una consulta dentro de otra, escrita entre paréntesis.',
    summaryBlocks: [
      [
        'Una subconsulta escalar suele calcular un único valor, por ejemplo el salario medio, que después se compara con cada fila.',
        'Un CTE es una subconsulta a la que se le da un nombre mediante WITH y que, a partir de ese momento, se puede usar como si fuera una tabla normal.',
      ],
      'El resultado puede ser el mismo, pero la consulta resulta más fácil de leer. Además, un CTE se puede usar varias veces o servir de base para otro CTE. Cuando una solución empieza a ser difícil de seguir, divídela en pasos con nombre.',
    ],
    examples: [
      {
        label: 'Una subconsulta escalar en WHERE',
        result:
          'Primero se calcula el precio medio de los productos de electrónica: un único valor. Después, cada producto, independientemente de su categoría, se compara con ese valor.',
      },
      {
        label: 'Una subconsulta en la lista de columnas',
        result:
          'Los productos de los que quedan menos de 10 unidades y, al lado, cuánto más barato es cada uno que el producto más caro de la tabla.',
      },
      {
        label: 'NOT IN: excluir con una lista ya creada',
        result:
          'Una fila: Sofia Rossi, la única clienta sin ningún pedido. La subconsulta obtiene primero la lista de clientes que han hecho algún pedido, y la consulta externa excluye a todos los clientes de esa lista.',
      },
      {
        label: 'NOT EXISTS: excluir mediante una condición',
        result:
          'La misma Sofia Rossi, pero por otro camino: aquí la subconsulta no crea una lista, sino que, para cada cliente, comprueba si existe al menos un pedido. Por eso aparece un 1 en el SELECT: el valor en sí no importa; lo importante es que exista una fila.',
      },
      {
        label: 'WITH: dar nombre a un paso intermedio',
        result:
          'Las fechas en las que se recibió más de un pedido. El primer paso cuenta los pedidos por día y el segundo filtra el resultado.',
      },
      {
        label: 'Dos CTE seguidos',
        result:
          'Los clientes cuyo importe total de compras es superior al importe medio por cliente. El segundo CTE se construye a partir del primero, de modo que el problema se divide en dos pasos sencillos.',
      },
    ],
    pitfalls: [
      {
        title: 'Una subconsulta escalar tiene que devolver un solo valor',
        text: 'La expresión price > (SELECT ...) espera exactamente una fila y una columna. Si la subconsulta devuelve varias filas, se producirá un error. Cuando necesitas comparar con varios valores, usa IN en lugar de >: WHERE customer_id IN (SELECT customer_id FROM orders).',
      },
      {
        title: 'NOT IN da problemas con NULL',
        text: 'Si entre los valores de la subconsulta aparece aunque sea un NULL, NOT IN puede no devolver ninguna fila, sin que se produzca ningún error. Para preguntas del tipo «¿quién no está en la lista?», NOT EXISTS suele ser una opción más segura, o también puedes usar LEFT JOIN ... IS NULL.',
      },
      {
        title: 'Un CTE solo vive dentro de su propia consulta',
        text: 'Después del punto y coma, el nombre declarado en WITH deja de existir: no es una tabla que hayas creado. Además, un CTE solo puede hacer referencia a los CTE declarados antes que él. El segundo CTE puede usar el primero, pero no al contrario.',
      },
    ],
  },

  5: {
    summary:
      'Una función de ventana funciona de forma parecida a un agregado, pero no agrupa ni reduce las filas: cada fila se mantiene en el resultado y recibe una columna calculada adicional. OVER define exactamente qué filas forman la ventana y cómo se calculan.',
    summaryBlocks: [
      [
        'PARTITION BY divide las filas en grupos independientes, por ejemplo, un grupo por cada departamento.',
        'ORDER BY define el orden de las filas dentro de cada grupo.',
      ],
      'Así aparecen la numeración (ROW_NUMBER, RANK), el acceso a las filas vecinas (LAG, LEAD) y los totales acumulados.',
      'Es la respuesta a la pregunta «¿cómo se compara esta fila con las demás de su grupo?».',
    ],
    examples: [
      {
        label: 'Numerar dentro de cada grupo',
        result:
          'Los 25 productos siguen ahí, cada uno con su posición según el precio dentro de su categoría. La numeración empieza de nuevo en 1 en cada categoría.',
      },
      {
        label: 'RANK y DENSE_RANK: dos formas de tratar los empates',
        result:
          'Los ocho productos más caros. Office Chair y Docking Station cuestan 210 los dos y ambos reciben el quinto puesto. A partir de ahí, las dos funciones se comportan de forma distinta: RANK salta al séptimo puesto y DENSE_RANK pasa al sexto. La diferencia aparece cuando hay empates.',
      },
      {
        label: 'Comparar una fila con su propio grupo',
        result:
          'Cada empleado y la diferencia entre su salario y el salario más bajo de su departamento. GROUP BY no serviría aquí: reduciría el resultado a una fila por departamento.',
      },
      {
        label: 'LAG y LEAD: consultar la fila anterior y la siguiente',
        result:
          'Cada pedido puede acceder a las filas vecinas según la fecha: LAG devuelve el importe del pedido anterior y LEAD, el del siguiente. En la primera fila, prev_amount es NULL porque no existe una fila anterior. A partir de ahí se puede calcular, por ejemplo, la diferencia entre el importe actual y el anterior.',
      },
      {
        label: 'NTILE: repartir en partes iguales',
        result:
          'Los productos se reparten por precio en cuatro grupos de tamaño parecido: 1 corresponde al grupo de precios más bajos y 4 al de precios más altos.',
      },
      {
        label: 'El marco de la ventana: una media móvil',
        result:
          'Para cada pedido, el importe medio del pedido actual y de los dos anteriores. ROWS BETWEEN limita la ventana a esas tres filas.',
      },
    ],
    pitfalls: [
      {
        title: 'OVER no se puede usar en WHERE',
        text: 'Las funciones de ventana se calculan después de que WHERE haya filtrado las filas, así que WHERE ROW_NUMBER() OVER (...) = 1 produce un error. La forma habitual de hacerlo es calcular el número de fila en un CTE y filtrar después, en la consulta externa, usando la columna calculada.',
      },
      {
        title: 'RANK, DENSE_RANK y ROW_NUMBER cuentan de forma distinta',
        text: 'Con valores iguales, RANK deja huecos (1, 2, 2, 4), DENSE_RANK no los deja (1, 2, 2, 3) y ROW_NUMBER asigna un número distinto a cada fila (1, 2, 3, 4). Si hay un empate, el orden entre las filas empatadas no está definido a menos que añadas un criterio adicional a ORDER BY. Por eso, la pregunta «¿quién está en segundo puesto?» puede no tener una respuesta única.',
      },
      {
        title: 'PARTITION BY no es GROUP BY',
        text: 'GROUP BY reduce el número de filas, mientras que PARTITION BY no lo hace. Si esperabas una fila por departamento y aparecen tantas filas como empleados, lo que necesitas es un agregado con GROUP BY, no una función de ventana.',
      },
    ],
  },

  6: {
    summary:
      'Las fechas en PostgreSQL son un tipo de datos propio, no texto, y por eso se pueden hacer operaciones aritméticas con ellas.',
    summaryBlocks: [
      [
        'DATE_TRUNC lleva una fecha al inicio de un periodo —un mes, un trimestre, un año—. Así, los informes mensuales pueden agrupar todas las fechas de un mismo mes bajo un único valor.',
        'EXTRACT extrae un número de una fecha: el año, el mes, el día de la semana, etc.',
        "Sumar INTERVAL '30 days' a una fecha produce una nueva fecha.",
        'AGE calcula la diferencia entre dos fechas y devuelve un intervalo expresado en años, meses y días.',
        'TO_CHAR convierte una fecha en texto según una plantilla, lo que permite crear etiquetas legibles.',
      ],
      'Las funciones de cadena resuelven otro problema: limpiar y transformar datos que llegan, por ejemplo, de un formulario.',
      [
        'TRIM quita los espacios de los extremos.',
        'INITCAP convierte un texto al formato «Nombre Apellido».',
        'SPLIT_PART divide un valor usando un separador.',
        'SUBSTRING junto con POSITION permite extraer un fragmento según su posición.',
        'El operador || permite unir cadenas de texto.',
      ],
    ],
    examples: [
      {
        label: 'DATE_TRUNC: reducir las fechas al mes',
        result:
          'Seis filas, una por mes. DATE_TRUNC lleva cada fecha al primer día de su mes, así que todos los pedidos de enero se agrupan en una sola fila: 3 pedidos, con un importe medio de 131.83.',
      },
      {
        label: 'EXTRACT: extraer una parte de la fecha',
        result:
          'Los cinco pedidos más antiguos con el número del día de la semana y el número del mes. En PostgreSQL, DOW asigna 0 al domingo, 1 al lunes, etc.; por eso 5 es viernes, 4 es jueves y 6 es sábado.',
      },
      {
        label: 'INTERVAL y AGE: aritmética de fechas',
        result:
          'El primer pedido, del 5 de enero, tiene como fecha de vencimiento el 4 de febrero. Entre ese pedido y el 1 de julio hay «5 mons 27 days». INTERVAL permite sumar un intervalo a una fecha y obtener una nueva fecha; AGE calcula la diferencia entre dos fechas y devuelve un interval.',
      },
      {
        label: 'TRIM e INITCAP: limpiar un nombre sin procesar',
        result:
          'Se muestran juntos el valor original y el limpio: « anna kovalenko » se convierte en «Anna Kovalenko». En el tercer contacto, el espacio doble del interior sigue ahí: TRIM solo elimina los espacios de los extremos.',
      },
      {
        label: 'SPLIT_PART: dividir un valor por un separador',
        result:
          'Diez contactos con el dominio en una columna aparte: example.com, mail.ua, bondar.dev. El tercer argumento indica el número del fragmento, así que 2 significa «lo que va después de la arroba»; con 1 se obtiene la parte anterior.',
      },
      {
        label: 'TO_CHAR y ||: crear una etiqueta legible',
        result:
          'Cinco etiquetas del tipo «05.01.2024 — 120.50»: TO_CHAR convierte la fecha en texto según una plantilla y || la une al importe.',
      },
    ],
    pitfalls: [
      {
        title: 'EXTRACT devuelve un número, no texto con ceros delante',
        text: "EXTRACT(YEAR FROM d) || '-' || EXTRACT(MONTH FROM d) puede producir 2024-1 en lugar de 2024-01: un número no conserva un cero inicial. Para crear la etiqueta de un informe, usa TO_CHAR(d, 'YYYY-MM'), que produce 2024-01.",
      },
      {
        title: 'TRIM quita los espacios solo de los extremos',
        text: "TRIM(' a  b ') devuelve a  b: los espacios del interior permanecen. Para reemplazarlos puedes usar REPLACE, por ejemplo REPLACE(x, '  ', ' ') para convertir un par de espacios en uno. Si puede haber tres o más espacios seguidos, una sola sustitución no necesariamente los normaliza todos.",
      },
      {
        title: 'DATE_TRUNC da el inicio del periodo, no su nombre',
        text: "DATE_TRUNC('month', DATE '2024-03-17') devuelve 2024-03-01: el inicio del periodo como valor de fecha/hora. Esto resulta útil para agrupar y ordenar, pero no es una etiqueta. Para mostrar «marzo de 2024», puedes usar TO_CHAR. Y, al contrario, no conviene ordenar por el nombre del mes en texto: un ORDER BY lo ordenaría alfabéticamente, no cronológicamente.",
      },
      {
        title: 'En SQLite esto se escribe de otra forma',
        text: "El nivel 6 es donde las diferencias entre dialectos son más visibles, y SQLite todavía aparece en algunos proyectos y entrevistas. Algunas equivalencias son: DATE_TRUNC('month', d) ↔ date(d, 'start of month'), EXTRACT(YEAR FROM d) ↔ strftime('%Y', d), d + INTERVAL '30 days' ↔ date(d, '+30 days'). En nuestro entrenador solo funciona la sintaxis de la izquierda.",
      },
    ],
  },

  7: {
    summary:
      'CASE permite devolver valores distintos según una condición. Comprueba las condiciones en orden y devuelve el resultado de la primera que se cumple. Si no se cumple ninguna, se usa ELSE. Si no se indica ELSE, el resultado será NULL. END marca el final de la expresión CASE.',
    summaryBlocks: [
      'COALESCE se usa para sustituir un NULL por otro valor. Devuelve el primer valor de la lista que no sea NULL. Resulta útil, por ejemplo, cuando en lugar de un valor ausente hay que mostrar un texto claro o utilizar un valor de reserva.',
      'NULLIF funciona en sentido contrario: devuelve NULL si los dos valores que recibe son iguales; en caso contrario, devuelve el primer valor. Se usa a menudo para convertir un cero en NULL antes de una división y evitar así dividir entre cero.',
      'UNION, UNION ALL, INTERSECT y EXCEPT permiten combinar o comparar los resultados de dos consultas.',
      'A diferencia de JOIN, que combina tablas añadiendo columnas de una a las filas de otra, las operaciones de conjuntos trabajan con filas: los resultados de dos consultas se combinan uno debajo de otro o se comparan entre sí.',
      [
        'UNION combina los resultados y elimina los duplicados.',
        'UNION ALL combina los resultados y conserva los duplicados.',
        'INTERSECT deja las filas que aparecen en ambos resultados.',
        'EXCEPT deja las filas del primer resultado que no aparecen en el segundo.',
      ],
      'En las cuatro operaciones, las dos consultas tienen que devolver el mismo número de columnas y las columnas correspondientes tienen que ser de tipos compatibles.',
    ],
    examples: [
      {
        label: 'CASE con ELSE: el nivel de retribución',
        result:
          'Doce filas, del salario más alto al más bajo. Dos quedan en high, siete en mid y tres en low. Las condiciones se comprueban de arriba abajo, así que Oksana, con 8100, coincide con la primera rama y ya no se comprueba la segunda.',
      },
      {
        label: 'SUM(CASE): las filas se convierten en columnas',
        result:
          'Cinco filas, una por departamento, y una fila aparte para el empleado sin departamento. IT da 4 y 0; HR da 0 y 2. Así se pueden construir tablas cruzadas: una categoría se convierte en una columna en lugar de aparecer como un valor dentro de una columna.',
      },
      {
        label: 'COALESCE y NULLIF: dos acciones opuestas',
        result:
          'Doce filas en las que se ven las dos acciones a la vez. A Bohdan le falta el departamento, y COALESCE muestra «No indicado». Para los empleados de IT, NULLIF hace lo contrario y devuelve NULL, porque su valor coincide con el que queremos convertir en NULL. A ese mismo Bohdan, hidden_it también le queda en NULL, pero por otra razón: NULLIF(NULL, IT) devuelve NULL.',
      },
      {
        label: 'UNION: combinar dos listas sin repeticiones',
        result:
          'Cinco filas: todas las categorías que tienen al menos un producto muy caro o uno muy barato. La misma consulta con UNION ALL da 15 filas: cada categoría aparece tantas veces como filas de productos cumplen la condición.',
      },
      {
        label: 'INTERSECT: la parte común de dos listas',
        result:
          'Tres categorías —Electronics, Furniture y Kitchen—: cada una tiene al menos un producto de 200 o más y otro de menos de 50. Es decir, son las categorías con mayor amplitud de precios dentro de este catálogo.',
      },
      {
        label: 'EXCEPT: restar una lista de otra',
        result:
          'Tres filas: HR, Marketing y el valor NULL, que son precisamente los departamentos en los que ningún empleado cobra 6000 o más. El NULL no es casualidad: las operaciones de conjuntos utilizan una comparación de igualdad que considera iguales los valores NULL a efectos de eliminar duplicados y determinar la pertenencia al conjunto, mientras que una comparación normal como NULL = NULL produce UNKNOWN.',
      },
      {
        label: 'CASE en ORDER BY: un orden propio que no está en los datos',
        result:
          'Primero aparece toda la electrónica, de lo más caro a lo más barato, y después los muebles: Standing Desk a 430. Ni el alfabeto ni los números de la categoría producen ese orden. ORDER BY acepta una expresión, y CASE convierte el nombre de la categoría en un número que la ordenación puede utilizar. Ese número no aparece en el resultado.',
      },
    ],
    pitfalls: [
      {
        title: 'Un CASE sin ELSE da NULL en silencio',
        text: 'Si ninguna rama coincide y no se ha escrito ELSE, CASE devuelve NULL: ni una cadena vacía ni un cero. En una tabla puede verse como una celda sin valor. En los cálculos, NULL se comporta de forma distinta según la operación: COUNT no cuenta ese valor, SUM lo ignora y una concatenación con || puede hacer que el resultado completo sea NULL.',
      },
      {
        title: 'El orden de las ramas del CASE determina la prioridad',
        text: "Las ramas se comprueban de arriba abajo y gana la primera que coincide. Por eso una condición más amplia no debe ir antes de una más específica: en CASE WHEN price < 200 THEN 'standard' WHEN price < 50 THEN 'budget' END, la segunda rama nunca se alcanzará, porque todo lo que sea menor que 50 ya cumple la primera condición. No habrá ningún error: el resultado será simplemente incorrecto.",
      },
      {
        title: 'UNION elimina los duplicados y UNION ALL no',
        text: 'Con nuestros datos se ve claramente: combinar las categorías de productos caros y baratos con UNION da 5 filas y con UNION ALL, 15. Eliminar duplicados requiere trabajo adicional: la base de datos tiene que identificar las filas repetidas mediante el método que determine el planificador, por ejemplo, una ordenación o un algoritmo basado en hashing. Si sabes que no hay duplicados o no necesitas eliminarlos, UNION ALL evita ese trabajo adicional.',
      },
      {
        title: 'EXCEPT es asimétrico',
        text: 'A EXCEPT B y B EXCEPT A son preguntas distintas y pueden producir resultados distintos. Las categorías menos las categorías con productos caros dan 2 filas (Sports y Stationery, donde no hay ningún producto de 200 o más), mientras que al revés dan 0. Un resultado vacío aquí no significa que «no se encontró nada» en general, sino que todos los elementos del segundo conjunto también pertenecen al primero.',
      },
    ],
  },

  8: {
    subtitle: 'cohortes, embudos, retención, LTV y RFM',
    summary:
      'Las cohortes, los embudos, la retención, el LTV y el RFM son herramientas para analizar el comportamiento de los usuarios, la conversión y el valor generado por un producto. Ninguna es una función aislada: cada análisis combina varias operaciones en una cadena de pasos lógicos.',
    summaryBlocks: [
      'En este nivel reúnes todo lo aprendido en un único sistema analítico:',
      [
        'WITH (CTE) pasa a ser la base de tu código: divide los cálculos complejos en etapas claras y con nombre.',
        'DATE_TRUNC lleva una fecha al inicio de un mes o una semana, y permite convertir un flujo de registros en cohortes que se pueden comparar.',
        'COUNT(DISTINCT ...) cuenta personas únicas y no eventos, para que una persona con muchas actividades no pese más que otra.',
        'FILTER (WHERE ...) permite calcular varios subconjuntos dentro de una misma consulta y resulta especialmente útil para construir embudos.',
        'LAG pone el periodo actual junto al anterior en una misma fila, para calcular rápidamente la evolución mensual o interanual.',
        'NTILE reparte las filas en grupos de tamaño parecido según una métrica, lo que permite construir puntuaciones por cuartiles para una segmentación RFM.',
      ],
      'La regla principal al analizar datos es sencilla: escribir el SQL es solo una parte del trabajo. Lo más importante es entender bien la pregunta de negocio y calcular exactamente la métrica que esa pregunta requiere.',
    ],
    cases: [
      {
        title: 'Análisis de retención por cohortes',
        about:
          'Seguir grupos de usuarios que se registraron en el mismo periodo y comprobar si vuelven a estar activos en los periodos siguientes.',
        whenNeeded:
          'Cuando preguntan «¿cuántos de los usuarios de enero siguen activos en marzo?» o «¿cómo cambia la retención de una cohorte a otra?».',
        question:
          '¿Cuántos usuarios que se registraron en enero siguen activos en febrero? ¿Y en marzo? ¿Cómo cambia la retención de una cohorte a otra?',
        steps: [
          'Paso 1 (cohort): asigna a cada usuario su mes de registro.',
          'Paso 2 (activity): combina la cohorte del usuario con cada mes en el que tuvo actividad.',
          'Paso 3: la consulta final cuenta cuántos usuarios de cada cohorte estuvieron activos month_no meses después del registro.',
        ],
        reading:
          'month_no indica la edad de la cohorte y no el mes del calendario: el cero corresponde al mes de registro. La cohorte de enero de 2023 tiene siete usuarios; cinco estuvieron activos en el mes 0 y tres en el mes 1. La serie no tiene por qué ser monótona: un usuario puede no estar activo durante un mes y volver a estarlo más adelante. Por eso la retención se analiza como una serie por periodo, no como un único número.',
        watchOut: [
          'La cohorte la determina la fecha de registro y permanece asociada al usuario. Si agrupas por la fecha del evento, el mismo usuario puede aparecer en varios meses y deja de pertenecer a una única cohorte.',
          'Los usuarios activos por mes no son lo mismo que la retención. Esa métrica mezcla a quienes acaban de llegar con quienes ya estaban y han vuelto, por lo que no permite medir directamente cuánto permanece cada cohorte.',
          'Hay que contar personas únicas y no eventos: dentro de una cohorte, cada usuario debe contar una sola vez por periodo, independientemente del número de actividades que haya realizado.',
          'La última cohorte suele tener una ventana de observación más corta que las anteriores. En un informe conviene excluirla de determinadas comparaciones o marcarla como incompleta.',
        ],
      },
      {
        title: 'El embudo de conversión',
        about:
          'Recorrer una secuencia de pasos hasta una acción final, como una compra, y medir cuántas sesiones llegan a cada etapa.',
        whenNeeded:
          'En análisis de compra, registro, suscripción o cualquier otro proceso con etapas definidas.',
        question:
          '¿En qué paso del embudo perdemos más sesiones? ¿Dónde se produce la mayor caída?',
        steps: [
          'Paso 1 (session_depth): determina para cada sesión el paso más avanzado al que llegó.',
          'Paso 2: la consulta final cuenta las sesiones que llegaron al menos a cada paso. Por eso las condiciones son acumulativas (>= 1, >= 2, …) y no igualdades.',
        ],
        reading:
          'De las 1187 sesiones que llegaron al primer paso, 274 llegaron a la compra. Eso supone aproximadamente un 23 % de conversión de extremo a extremo. La mayor caída en términos absolutos se produce entre la visita y la visualización de un producto: 344 sesiones no llegaron al segundo paso. Eso identifica dónde se produce la mayor pérdida de sesiones, pero no basta por sí solo para determinar qué etapa debería optimizarse: para tomar esa decisión también habría que tener en cuenta el contexto de negocio, el coste de cada intervención y la conversión relativa entre pasos.',
        watchOut: [
          'La unidad de recuento lo cambia todo. Si cuentas sesiones, mides recorridos; si cuentas usuarios únicos, mides personas. No son métricas intercambiables.',
          'Las condiciones de los pasos tienen que ser acumulativas: una sesión que llegó a la compra también cuenta en todos los pasos anteriores. Con una igualdad en lugar de «al menos», los recuentos ya no representarían un embudo acumulativo.',
          'El orden de los pasos debe estar definido explícitamente. Aquí lo determina la lista de ARRAY: visit, view_product, add_to_cart, checkout, purchase. Si cambia el orden, cambia el significado de todo el resultado.',
        ],
      },
      {
        title: 'LTV por cohorte de registro',
        about:
          'Medir cuánto dinero ha generado cada usuario a partir de sus compras y comparar ese valor entre cohortes de registro.',
        whenNeeded:
          'Cuando hay que analizar el valor generado por los usuarios captados en distintos periodos y compararlo entre cohortes.',
        question:
          '¿Cuál es el LTV de los usuarios por mes de registro? ¿Cómo cambia entre las cohortes?',
        steps: [
          'Paso 1 (user_ltv): crea una fila por usuario con el importe total de sus compras, o con cero si no realizó ninguna.',
          'Paso 2: la consulta final agrupa esos valores por cohorte y calcula la media, la mediana y el máximo.',
        ],
        reading:
          'En la cohorte de enero, el LTV medio es 238,79 y la mediana, 13,16. La gran diferencia entre ambos indica una distribución muy asimétrica: unos pocos compradores con importes elevados elevan la media, mientras que al menos la mitad de los usuarios tiene un LTV de 13,16 o menos. Informar solo de la media ocultaría buena parte de esa distribución.',
        watchOut: [
          'Primero hay que calcular el importe total por usuario y después agregar esos valores por cohorte. No se puede sustituir este proceso por un único agregado anidado.',
          'El LEFT JOIN permite conservar a los usuarios que no han comprado nada. Sin él, esos usuarios desaparecerían y la media se calcularía solo sobre compradores. COALESCE convierte su NULL en cero para que entren en el cálculo.',
          'La mediana resulta útil junto a la media cuando la distribución es asimétrica, algo frecuente en métricas monetarias. La diferencia entre ambas ayuda a detectar el efecto de unos pocos valores elevados.',
          'Las cohortes recientes suelen tener una ventana de observación más corta. Para compararlas con las antiguas, hay que utilizar una ventana de observación equivalente o indicar claramente que no lo es.',
        ],
      },
      {
        title: 'Segmentación RFM',
        about:
          'Clasificar a los compradores según tres dimensiones: cuándo compraron por última vez, con qué frecuencia compran y cuánto dinero han gastado.',
        whenNeeded:
          'Cuando se quiere describir la base de compradores según su recencia, frecuencia e importe y crear segmentos a partir de esas tres dimensiones.',
        question:
          'Divide a los compradores en segmentos: VIP, Loyal, Potential, At-Risk, Lost. ¿Cuánta gente hay en cada uno y cuánto aporta cada segmento?',
        steps: [
          'Paso 1 (metrics): calcula para cada comprador tres valores: recencia, frecuencia e importe.',
          'Paso 2 (scores): convierte cada métrica en un cuartil NTILE(4), de forma independiente.',
          'Paso 3: el CASE combina los tres cuartiles para asignar un segmento. El orden de las ramas determina la prioridad cuando un comprador cumple varias condiciones.',
        ],
        reading:
          '136 compradores se reparten en cinco grupos con distintos perfiles de recencia, frecuencia e importe. En este resultado, Loyal tiene un importe medio de 610,87, mientras que Lost tiene 96,05.',
        watchOut: [
          'Repartir a los usuarios solo por importe no es RFM. El método combina recencia, frecuencia e importe para distinguir perfiles que pueden tener comportamientos muy diferentes.',
          'La recencia se calcula desde el final del periodo analizado y no desde CURRENT_DATE. Al fijar la fecha explícitamente, el resultado es reproducible y no cambia simplemente porque pase el tiempo.',
          'El orden de las ramas del CASE determina la prioridad: la primera condición que coincide asigna el segmento y las siguientes ya no se evalúan.',
          'Los cuartiles se construyen por número de filas, no por importe acumulado. El 25 % superior de los compradores no equivale necesariamente al 25 % de los ingresos.',
        ],
      },
      {
        title: 'El cambio de un mes a otro',
        about:
          'Comparar una métrica con el periodo anterior para analizar su evolución y detectar cambios.',
        whenNeeded:
          'En informes mensuales de ingresos, usuarios activos, conversiones u otras métricas periódicas.',
        question: '¿Cuánto cambiaron los ingresos de un mes a otro? ¿Dónde hay caídas?',
        steps: [
          'Paso 1 (monthly): reduce las compras a una fila por mes.',
          'Paso 2: LAG(revenue) OVER (ORDER BY month) coloca los ingresos del mes anterior junto a los del mes actual.',
          'Paso 3: el porcentaje de cambio utiliza los ingresos del mes anterior como denominador.',
        ],
        reading:
          'En el primer mes las dos columnas de comparación son NULL: no existe un mes anterior con el que comparar. Más adelante se observa un fuerte aumento en marzo y una caída en abril. Como los primeros meses tienen un volumen pequeño, los porcentajes pueden ser muy elevados incluso cuando la diferencia absoluta no es tan grande.',
        watchOut: [
          'El denominador debe ser el periodo anterior. Así se calcula cuánto ha cambiado la métrica respecto al periodo anterior.',
          'Un NULL en la primera fila es lo normal: simplemente no existe un periodo anterior. Sustituirlo por cero convertiría la ausencia de comparación en un valor inventado.',
          'El ORDER BY dentro de la ventana es el que determina qué significa «fila anterior». El ORDER BY final de la consulta solo controla el orden en el que se muestran los resultados.',
          'El último mes de los datos puede estar incompleto. Una caída en ese mes puede deberse simplemente a que todavía no ha terminado el periodo.',
        ],
      },
    ],
    pitfalls: [
      {
        title: 'COUNT(*) cuenta filas, no necesariamente personas',
        text: 'Si cada usuario genera varios eventos, COUNT(*) contará cada evento. Para contar personas únicas hay que utilizar COUNT(DISTINCT user_id).',
      },
      {
        title: 'La cohorte la determina la fecha de registro',
        text: 'Si agrupas por la fecha del evento, el mismo usuario puede aparecer en varios meses. Para construir una cohorte de registro, la fecha de referencia debe ser la fecha de registro del usuario.',
      },
      {
        title: 'La última cohorte suele tener una ventana más corta',
        text: 'Si todavía no ha transcurrido un periodo completo después del registro, esa cohorte no se puede comparar directamente con cohortes más antiguas. En el informe conviene excluirla de determinadas comparaciones o marcarla como incompleta.',
      },
      {
        title: 'LAG sin ORDER BY no define una fila anterior',
        text: 'Sin un ORDER BY dentro de la ventana, no está definido qué fila debe considerarse anterior. Un NULL en la primera fila, en cambio, es correcto cuando no existe un periodo anterior.',
      },
      {
        title: 'NTILE divide por cantidad de filas, no por importe',
        text: 'Los cuartiles contienen aproximadamente el mismo número de participantes, no la misma cantidad de ingresos. El 25 % superior de los compradores y el 25 % de los ingresos son métricas diferentes.',
      },
      {
        title: 'La conversión paso a paso no es lo mismo que la conversión de extremo a extremo',
        text: 'Si las tasas entre pasos son 71 %, 64 %, 69 % y 74 %, la conversión de extremo a extremo es aproximadamente 0,71 × 0,64 × 0,69 × 0,74 ≈ 0,23. Es decir, aproximadamente un 23 %, siempre que cada porcentaje represente la proporción que pasa del paso anterior al siguiente.',
      },
    ],
    tips: [
      {
        text: 'Lee la pregunta dos veces y define la métrica antes de escribir SQL: retención, embudo, LTV o segmentación. Una consulta puede ser técnicamente correcta y, aun así, responder a una pregunta distinta.',
      },
      {
        text: 'Aclara la unidad de análisis desde el principio: personas o eventos; sesiones o usuarios; conversión paso a paso o de extremo a extremo; retención desde el registro o desde otra fecha de referencia.',
      },
      {
        text: 'WITH hace explícita la lógica: cada etapa recibe un nombre y la consulta se puede leer de arriba abajo como una secuencia de cálculos.',
      },
      {
        text: 'Comprueba que el resultado sea razonable antes de utilizarlo en un informe. Si una métrica contradice lo que debería medir, revisa primero la unidad de análisis, los filtros y las fechas.',
      },
      {
        text: 'Documenta los supuestos dentro de la consulta cuando sean importantes para interpretar el resultado.',
      },
      {
        text: 'El último mes de los datos puede estar incompleto y algunas métricas, como la retención, pueden quedar subestimadas. Exclúyelo de determinadas comparaciones o indícalo claramente en el informe.',
      },
    ],
  },
};
