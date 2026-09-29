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

  5: {
    summary:
      'Una función de ventana calcula igual que un agregado, pero no pega las filas: cada fila se queda en su sitio y recibe una columna más. Qué hay que calcular exactamente lo decide OVER.',
    summaryBlocks: [
      [
        'PARTITION BY divide la tabla en partes independientes, por ejemplo cada departamento por separado.',
        'ORDER BY marca el orden de las filas dentro de esa parte.',
      ],
      'Así aparecen la numeración (ROW_NUMBER, RANK), el acceso a las filas vecinas (LAG, LEAD) y los totales acumulados.',
      'Es la respuesta a la pregunta «y cómo se ve esta fila frente a su propio grupo».',
    ],
    examples: [
      {
        label: 'Numerar dentro de cada grupo',
        result:
          'Los 25 productos siguen ahí, cada uno con su puesto por precio dentro de su categoría. La numeración empieza otra vez desde 1 en cada categoría.',
      },
      {
        label: 'RANK y DENSE_RANK: dos formas de tratar los empates',
        result:
          'Los ocho productos más caros. Office Chair y Docking Station cuestan 210 los dos y los dos reciben el quinto puesto; a partir de ahí los caminos se separan: RANK salta al séptimo y DENSE_RANK va al sexto. La diferencia solo se ve donde hay empate, así que mirarlas por separado no sirve de nada.',
      },
      {
        label: 'Comparar una fila con su propio grupo',
        result:
          'Cada empleado y la diferencia entre su salario y el salario más bajo de su departamento. GROUP BY no serviría aquí: dejaría una fila por departamento.',
      },
      {
        label: 'LAG y LEAD: asomarse a la fila vecina',
        result:
          'Cada pedido ve a sus vecinos por fecha: LAG da el importe del anterior y LEAD el del siguiente. En la primera fila prev_amount está vacío porque simplemente no hay anterior, y sobre eso se construye la diferencia «actual menos anterior».',
      },
      {
        label: 'NTILE: repartir en partes iguales',
        result:
          'Los productos repartidos por precio en cuatro grupos de tamaño parecido: 1 es el cuarto más barato de la lista de precios y 4 el más caro.',
      },
      {
        label: 'El marco de la ventana: una media móvil',
        result:
          'Para cada pedido, el importe medio de él y de los dos anteriores. ROWS BETWEEN estrecha la ventana de «toda la parte» a tres filas vecinas.',
      },
    ],
    pitfalls: [
      {
        title: 'OVER no se puede escribir en WHERE',
        text: 'Las ventanas se calculan cuando WHERE ya ha descartado filas, así que WHERE ROW_NUMBER() OVER (...) = 1 es un error. La forma que funciona: calcular el número en un CTE y filtrar con la consulta externa por la columna ya hecha.',
      },
      {
        title: 'RANK, DENSE_RANK y ROW_NUMBER cuentan de forma distinta',
        text: 'Con valores iguales, RANK deja huecos (1, 2, 2, 4), DENSE_RANK no los deja (1, 2, 2, 3) y ROW_NUMBER simplemente numera de corrido (1, 2, 3, 4) y elige el orden entre iguales de forma arbitraria. Sin esa diferencia, la pregunta «quién está en segundo puesto» no tiene una respuesta única.',
      },
      {
        title: 'PARTITION BY no es GROUP BY',
        text: 'GROUP BY reduce el número de filas y PARTITION BY nunca lo hace. Si esperabas una fila por departamento en la respuesta y salieron tantas filas como empleados, lo que hacía falta era un agregado normal y no una función de ventana.',
      },
    ],
  },

  6: {
    summary:
      'Las fechas en PostgreSQL son un tipo propio y no texto, y por eso la aritmética funciona con ellas.',
    summaryBlocks: [
      [
        'DATE_TRUNC recorta una fecha hasta el inicio de un periodo —un mes, un trimestre, un año— y así es como los informes mensuales obtienen un solo valor para todo el mes.',
        'EXTRACT saca un número de una fecha: el año, el mes, el día de la semana.',
        "Sumar INTERVAL '30 days' da una fecha nueva.",
        'AGE calcula la diferencia entre dos fechas con las palabras «tantos años, meses y días».',
        'TO_CHAR convierte una fecha en texto según una plantilla, y con eso se hacen las etiquetas legibles.',
      ],
      'Las funciones de cadena resuelven otro problema: ordenar lo que llegó de un formulario.',
      [
        'TRIM quita los espacios de los extremos.',
        'INITCAP hace «Nombre Apellido» a partir de cualquier combinación de mayúsculas.',
        'SPLIT_PART corta un valor por un separador.',
        'SUBSTRING junto con POSITION saca un trozo por posición.',
        'Lo que lo pega todo es el operador ||.',
      ],
    ],
    examples: [
      {
        label: 'DATE_TRUNC: reducir las fechas al mes',
        result:
          'Seis filas, una por mes. DATE_TRUNC recortó cada fecha hasta el primer día de su mes, así que todos los pedidos de enero se fundieron en una fila: 3 pedidos, ticket medio 131.83.',
      },
      {
        label: 'EXTRACT: sacar una parte de la fecha',
        result:
          'Los cinco pedidos más antiguos con el número del día de la semana y el del mes. La numeración de los días empieza en cero-domingo, así que 5 es viernes, 4 es jueves y 6 es sábado.',
      },
      {
        label: 'INTERVAL y AGE: aritmética de fechas',
        result:
          'El primer pedido, del 5 de enero, tiene fecha de pago el 4 de febrero, y del 1 de julio lo separan «5 mons 27 days». INTERVAL suma un intervalo a una fecha y devuelve una fecha; AGE resta una fecha de otra y devuelve un intervalo en palabras.',
      },
      {
        label: 'TRIM e INITCAP: limpiar un nombre sin procesar',
        result:
          'Se ven al lado el valor sin procesar y el limpio: « anna kovalenko » se convierte en «Anna Kovalenko». En el tercer contacto el espacio doble de dentro sigue ahí: TRIM no lo ve.',
      },
      {
        label: 'SPLIT_PART: cortar un valor por un separador',
        result:
          'Diez contactos con el dominio en una columna aparte: example.com, mail.ua, bondar.dev. El tercer argumento es el número del trozo, así que 2 significa «lo que va después de la arroba»; con 1 saldría el nombre del buzón.',
      },
      {
        label: 'TO_CHAR y ||: montar una etiqueta legible',
        result:
          'Cinco etiquetas del tipo «05.01.2024 — 120.50»: TO_CHAR convirtió la fecha en texto según una plantilla y || la pegó con el importe.',
      },
    ],
    pitfalls: [
      {
        title: 'EXTRACT da un número, no un texto con cero delante',
        text: "EXTRACT(YEAR FROM d) || '-' || EXTRACT(MONTH FROM d) da 2024-1 y no 2024-01: un número no lleva cero delante. Comparar con una cadena (= '2024') sí se puede, por cierto: PostgreSQL la reduce a número por su cuenta. La etiqueta de un informe, en cambio, se hace con TO_CHAR(d, 'YYYY-MM'), que da 2024-01.",
      },
      {
        title: 'TRIM quita los espacios solo de los extremos',
        text: "TRIM('  a  b  ') devuelve 'a  b': el espacio doble de dentro se queda. Quitarlo es trabajo de REPLACE(x, '  ', ' '). Y REPLACE busca justamente parejas, así que con tres espacios seguidos uno sobrevive a una sola pasada.",
      },
      {
        title: 'DATE_TRUNC da la primera fecha del periodo, no su nombre',
        text: "DATE_TRUNC('month', DATE '2024-03-17') devuelve 2024-03-01: el inicio del periodo, una marca de tiempo. Eso viene bien para agrupar y ordenar, pero no es un rótulo: «marzo de 2024» lo hace TO_CHAR. Y al revés, no se puede ordenar por el nombre del mes en texto: un ORDER BY sobre él da April, February, January, porque el orden es alfabético.",
      },
      {
        title: 'En SQLite esto se escribe de otra forma',
        text: "El nivel 6 es donde los dialectos se separan más, y SQLite todavía aparece en proyectos antiguos y en entrevistas. Las equivalencias: DATE_TRUNC('month', d) ↔ date(d, 'start of month'), EXTRACT(YEAR FROM d) ↔ strftime('%Y', d), d + INTERVAL '30 days' ↔ date(d, '+30 days'). En nuestro entrenador solo funciona la columna de la izquierda.",
      },
    ],
  },

  7: {
    summary:
      'CASE permite devolver valores distintos según una condición. Comprueba las condiciones por turnos y devuelve el resultado de la primera que se cumple. Si no se cumple ninguna, se usa ELSE. Si no se indica ELSE, el resultado será NULL. END marca el final de la construcción CASE.',
    summaryBlocks: [
      'COALESCE se usa cuando hay que sustituir un NULL por otro valor. Devuelve el primer valor de la lista que no sea NULL. Viene bien, por ejemplo, cuando en lugar de un valor ausente hay que mostrar un texto claro o usar un valor de reserva.',
      'NULLIF funciona en sentido contrario: convierte un valor concreto en NULL si coincide con el indicado. Se usa a menudo para convertir un cero en NULL antes de una división y evitar así dividir por cero.',
      'UNION, UNION ALL, INTERSECT y EXCEPT permiten comparar o combinar los resultados de dos consultas.',
      'A diferencia de JOIN, que añade columnas de otra tabla, las operaciones con conjuntos trabajan con filas: los resultados de dos consultas se combinan uno debajo de otro.',
      [
        'UNION combina los resultados y quita los duplicados.',
        'UNION ALL combina los resultados y conserva los duplicados.',
        'INTERSECT deja las filas que están en los dos resultados.',
        'EXCEPT deja las filas del primer resultado que no están en el segundo.',
      ],
      'En las cuatro operaciones, las dos consultas tienen que devolver el mismo número de columnas, y las columnas correspondientes tienen que ser de tipos compatibles.',
    ],
    examples: [
      {
        label: 'CASE con ELSE: el nivel de retribución',
        result:
          'Doce filas del salario más alto al más bajo. Dos cayeron en high, siete en mid y tres en low. Las condiciones se comprueban de arriba abajo, así que Oksana, con 8100, se detiene en la primera rama y ya no ve la segunda.',
      },
      {
        label: 'SUM(CASE): las filas se vuelven columnas',
        result:
          'Cinco filas, una por departamento, y una fila aparte para el empleado sin departamento. IT da 4 y 0; HR da 0 y 2. Así se construyen las tablas cruzadas: una categoría pasa a ser una columna en lugar de un valor dentro de una columna.',
      },
      {
        label: 'COALESCE y NULLIF: dos acciones opuestas',
        result:
          "Doce filas en las que se ven las dos acciones a la vez. A Bohdan le falta el departamento, y COALESCE puso ahí «No indicado». A todos los de IT, NULLIF les hizo lo contrario y lo dejó vacío, porque su valor coincidía con el que pedimos ocultar. A ese mismo Bohdan hidden_it también le queda vacío, pero por otra razón: NULLIF(NULL, 'IT') da NULL por sí solo.",
      },
      {
        label: 'UNION: combinar dos listas sin repeticiones',
        result:
          'Cinco filas: todas las categorías que tienen o un producto muy caro o uno muy barato. La misma consulta con UNION ALL da 15 filas: la categoría se repite tantas veces como productos suyos cumplen la condición.',
      },
      {
        label: 'INTERSECT: la parte común de dos listas',
        result:
          'Tres categorías —Electronics, Furniture y Kitchen—: cada una tiene un producto desde 200 y otro más barato que 50. Es la mayor dispersión de precios del catálogo.',
      },
      {
        label: 'EXCEPT: restar una lista de otra',
        result:
          'Tres filas: HR, Marketing y el departamento vacío, que son justamente los sitios donde nadie cobra 6000 o más. La fila vacía no es casualidad: las operaciones con conjuntos tratan NULL como un valor normal y lo emparejan con NULL, mientras que una comparación corriente NULL = NULL nunca es verdadera.',
      },
      {
        label: 'CASE en ORDER BY: un orden propio que no está en los datos',
        result:
          'Primero toda la electrónica de lo más caro a lo más barato y después los muebles: Standing Desk a 430. Ni el alfabeto ni los números dan ese orden: ORDER BY acepta una expresión, y CASE convierte el nombre de la categoría en un número que la ordenación sigue. Ese número no se ve en el resultado.',
      },
    ],
    pitfalls: [
      {
        title: 'Un CASE sin ELSE da NULL en silencio',
        text: 'Si ninguna rama coincidió y no se escribió ELSE, CASE devuelve NULL: ni una cadena vacía ni un cero. En una tabla eso parece un hueco, y en los cálculos se comporta de formas distintas: COUNT no contará esa fila, SUM la ignorará y una concatenación con || convertirá en NULL el resultado completo.',
      },
      {
        title: 'El orden de las ramas del CASE es la prioridad',
        text: "Las ramas se comprueban de arriba abajo y gana la primera que coincide. Por eso una condición más amplia no puede ir antes de una más estrecha: en CASE WHEN price < 200 THEN 'standard' WHEN price < 50 THEN 'budget' END la segunda rama no se cumplirá nunca, porque todo lo más barato que 50 ya encajó en la primera. No habrá error, habrá un resultado silenciosamente incorrecto.",
      },
      {
        title: 'UNION quita los duplicados y UNION ALL no',
        text: 'Con nuestros datos se ve literalmente: combinar las categorías de productos caros y baratos con UNION da 5 filas y con UNION ALL da 15. La eliminación de duplicados no es gratis: para encontrar las repeticiones la base tiene que hacer trabajo extra —hashing u ordenación, según lo que elija el planificador—. Si a conciencia no hay repeticiones, o no molestan, usa UNION ALL.',
      },
      {
        title: 'EXCEPT es asimétrico',
        text: 'A EXCEPT B y B EXCEPT A son preguntas distintas con respuestas distintas. Las categorías menos las categorías con productos caros dan 2 filas (Sports y Stationery, donde no hay nada desde 200), y al revés dan 0, porque cada categoría con un producto caro está también entre todas las categorías. Un resultado vacío aquí no es «no se encontró nada», sino la señal de que los operandos están al revés.',
      },
    ],
  },
};
