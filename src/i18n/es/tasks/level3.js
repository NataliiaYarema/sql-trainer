// Іспанський текст завдань рівня 3 (об'єднання таблиць).
//
// Назви видів з'єднання лишаються англійськими й великими літерами: INNER JOIN,
// LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN. Перекладати їх не можна —
// це конструкції SQL, а не слова.
export default {
  'L3-orders-with-names': {
    title: 'Pedidos con el nombre del cliente',
    context: 'En soporte quieren ver el nombre del cliente junto al número de pedido.',
    taskText: 'Muestra el número de pedido, el nombre del cliente y el importe.',
    hints: [
      'Hacen falta datos de dos tablas, así que hay que unirlas mediante una columna común.',
      'La columna común es customer_id. La sintaxis es: JOIN otra_tabla ON condición.',
      'Plantilla: SELECT o.order_id, c.name, o.amount FROM orders o JOIN customers c ON c.customer_id = o.customer_id;',
    ],
    explanation:
      'INNER JOIN empareja las filas de dos tablas según la condición de ON y deja solo las parejas en las que hay coincidencia. Los alias o y c acortan la consulta y evitan ambigüedades cuando las dos tablas tienen columnas con el mismo nombre.',
  },
  'L3-items-with-products': {
    title: 'Líneas de pedido con el nombre del producto',
    context:
      'Alguien del almacén prepara un pedido y en el sistema solo ve product_id en lugar del nombre del producto.',
    taskText: 'Muestra el número de pedido, el nombre del producto y la cantidad.',
    hints: [
      'El nombre del producto está en products y la cantidad, en order_items.',
      'Une las tablas por product_id.',
      'Plantilla: SELECT oi.order_id, p.product_name, oi.quantity FROM order_items oi JOIN products p ON p.product_id = oi.product_id;',
    ],
    explanation:
      'Esta es la pareja clásica de «hechos y catálogo»: order_items guarda los eventos de venta y products, las descripciones. JOIN acerca los nombres legibles a los identificadores técnicos. Así se estructuran muchos esquemas de datos, con los hechos separados de los datos descriptivos.',
  },
  'L3-all-customers-orders': {
    title: 'Todos los clientes y sus pedidos',
    context:
      'Una persona de analítica prepara una vista completa de la base: en la lista tienen que aparecer incluso los clientes que todavía no han comprado nada.',
    taskText:
      'Muestra todos los clientes junto con los números de sus pedidos. Los clientes sin pedidos también tienen que aparecer en el resultado.',
    hints: [
      'INNER JOIN dejaría fuera a los clientes sin pedidos: hace falta otro tipo de unión.',
      'LEFT JOIN conserva todas las filas de la tabla izquierda; cuando no hay pareja, las columnas de la tabla derecha toman el valor NULL.',
      'Plantilla: SELECT c.name, o.order_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;',
    ],
    explanation:
      'LEFT JOIN conserva todas las filas de la tabla izquierda, haya coincidencia a la derecha o no. Aquí el orden de las tablas es decisivo: customers tiene que ir a la izquierda, porque queremos conservar todos sus registros.',
  },
  'L3-never-sold': {
    title: 'Productos que nunca se compraron',
    context: 'En compras revisan la gama y buscan artículos que no hayan tenido ni una sola venta.',
    taskText: 'Muestra los productos que no aparecen en ningún pedido.',
    hints: [
      'Primero conserva todos los productos y después deja solo aquellos para los que no se encontró ninguna pareja.',
      'Tras un LEFT JOIN, las filas sin pareja tienen NULL en las columnas de la tabla derecha; por eso filtramos.',
      'Plantilla: SELECT p.product_name, p.category FROM products p LEFT JOIN order_items oi ON ... WHERE oi.order_item_id IS NULL;',
    ],
    explanation:
      'Este es el patrón anti-join: LEFT JOIN más WHERE ... IS NULL. Reconócelo por expresiones como «nunca», «ni una vez» o «no aparecen en». La comprobación tiene que hacerse con IS NULL: una comparación con = NULL no funciona.',
  },
  'L3-join-using': {
    title: 'Una forma más corta de escribir la unión',
    context:
      'Alguien de analítica reescribe una consulta larga y quiere quitarle ruido innecesario.',
    taskText:
      'Muestra el número de pedido, el nombre del cliente y el importe uniendo las tablas con USING.',
    hints: [
      'La columna de enlace se llama igual en las dos tablas, así que no hace falta escribir la igualdad entre los dos nombres.',
      'USING (columna) sustituye a ON cuando la columna tiene el mismo nombre en ambas tablas.',
      'Plantilla: SELECT order_id, name, amount FROM orders JOIN customers USING (customer_id);',
    ],
    explanation:
      'USING solo funciona cuando la columna se llama igual en los dos lados. A diferencia de ON, la columna común aparece una sola vez en el resultado y deja de estar asociada a una tabla concreta. Por eso, después de USING, ya no se puede escribir o.customer_id. Es una comodidad y una limitación a la vez: cuando las claves se llaman de forma distinta, hay que volver a ON.',
  },
  'L3-orders-from-customer-side': {
    title: 'La misma unión desde el otro lado',
    context:
      'Alguien de analítica hereda una consulta donde orders va primero, pero el informe tiene que conservar a todos los clientes.',
    taskText:
      'Muestra todos los clientes y los números de sus pedidos poniendo orders como primera tabla del FROM. Los clientes sin pedidos tienen que quedarse en el resultado.',
    hints: [
      'Las filas que hay que conservar están en la tabla que va segunda, no en la primera.',
      'RIGHT JOIN conserva todas las filas de la tabla derecha, como espejo de LEFT JOIN.',
      'Plantilla: SELECT c.name, o.order_id FROM orders o RIGHT JOIN customers c ON c.customer_id = o.customer_id;',
    ],
    explanation:
      'El resultado aquí es exactamente el mismo que en el ejercicio «Todos los clientes y sus pedidos»: RIGHT JOIN equivale a un LEFT JOIN con las tablas cambiadas de sitio. Por eso, en la práctica, RIGHT JOIN se utiliza menos: cuando una consulta tiene tres o cuatro uniones, resulta más fácil mantener una sola dirección y controlar qué lado se conserva en cada línea.',
  },
  'L3-manager-subordinate': {
    title: 'Quién es responsable de quién',
    context:
      'En personal construyen el organigrama y quieren ver parejas de «empleado y su responsable».',
    taskText:
      'Muestra el nombre de cada empleado junto al nombre de su responsable. No hace falta mostrar a quienes no tienen responsable.',
    hints: [
      'Tanto el subordinado como el responsable están en la misma tabla, pero en filas distintas.',
      'Una tabla se puede unir consigo misma dándole dos alias diferentes.',
      'Plantilla: SELECT e.first_name AS employee, m.first_name AS manager FROM employees e JOIN employees m ON m.employee_id = e.manager_id;',
    ],
    explanation:
      'En un self-join, los alias dejan de ser una comodidad y se vuelven imprescindibles: sin ellos, employees.employee_id no permitiría saber de cuál de las dos copias de la tabla se habla. Fíjate en que INNER JOIN descarta por sí solo a quienes no tienen responsable: su manager_id es NULL y no se encuentra ninguna pareja. Si hubiera que conservarlos, haría falta un LEFT JOIN.',
  },
  'L3-orders-per-customer-join': {
    title: 'Cuántos pedidos tiene cada uno, incluido el cero',
    context:
      'Marketing segmenta la base y le interesan especialmente quienes todavía no han comprado nada.',
    taskText:
      'Para cada cliente, muestra el número de sus pedidos. Los clientes sin pedidos tienen que mostrar 0.',
    hints: [
      'Primero conservamos a todos los clientes y después contamos, pero hay que contar pedidos, no filas.',
      'Tras un LEFT JOIN, un cliente sin pedidos sigue teniendo su fila, solo que las columnas de la derecha contienen NULL.',
      'Plantilla: SELECT c.name, COUNT(o.order_id) AS order_count FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.name;',
    ],
    explanation:
      'Aquí se esconde uno de los errores más habituales al combinar LEFT JOIN y COUNT: COUNT(*) daría uno al cliente sin pedidos, porque la fila resultante de la unión existe, aunque las columnas de la derecha sean NULL. COUNT(o.order_id) cuenta únicamente los valores que no son NULL y por eso devuelve cero. Agrupamos por customer_id junto con el nombre porque dos clientes podrían, en teoría, tener el mismo nombre.',
  },
  'L3-order-contents': {
    title: 'Qué hay dentro de cada pedido',
    context:
      'En el almacén imprimen hojas de preparación: el sistema solo tiene códigos y allí hacen falta nombres.',
    taskText:
      'Muestra el número y la fecha del pedido junto con el nombre del producto y la cantidad.',
    hints: [
      'Un pedido no sabe qué productos contiene directamente: entre ambos hay una tercera tabla.',
      'Las uniones se ponen en cadena: primero del pedido a sus líneas y después de la línea al catálogo de productos.',
      'Plantilla: SELECT o.order_id, o.order_date, p.product_name, oi.quantity FROM orders o JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'order_items es una tabla de enlace: existe precisamente porque un pedido puede contener muchos productos y un producto puede aparecer en muchos pedidos. Entre orders y products no hay un enlace directo, así que hacen falta dos uniones seguidas. En el resultado puede haber más filas que pedidos, y eso no es un error, sino una consecuencia de una relación de uno a muchos.',
  },
  'L3-country-category-grid': {
    title: 'La rejilla «país × categoría»',
    context:
      'Alguien de analítica prepara el esqueleto de un informe de cobertura de mercados: la tabla tiene que contener todas las celdas, incluso las vacías.',
    taskText:
      'Construye todas las parejas posibles de «país del cliente y categoría del producto», aunque esas combinaciones nunca hayan existido en una venta. Cada pareja tiene que aparecer una vez.',
    hints: [
      'Aquí no hay nada que emparejar: simplemente hacen falta todas las combinaciones de una lista con la otra.',
      'CROSS JOIN une cada fila con cada fila y no tiene condición ON.',
      'Plantilla: SELECT DISTINCT c.country, p.category FROM customers c CROSS JOIN products p;',
    ],
    explanation:
      'CROSS JOIN construye a propósito un producto cartesiano: cada país se combina con cada categoría, y seis países y cinco categorías dan 30 parejas. DISTINCT hace falta aquí porque los países y las categorías se repiten dentro de sus respectivas tablas. Un esqueleto así sirve para informes en los que también deben aparecer las combinaciones sin datos. Pero el mismo producto cartesiano puede aparecer por accidente cuando en un JOIN se olvida el ON y el número de filas aumenta de forma inesperada; conviene aprender a reconocerlo aquí, en su forma intencionada.',
  },
  'L3-revenue-by-country': {
    title: 'Ingresos por país',
    context:
      'La dirección decide en qué mercados invertir y mira los ingresos desglosados por país.',
    taskText: 'Calcula los ingresos totales de cada país.',
    hints: [
      'El país está en una tabla y los importes, en otra, así que primero hace falta un JOIN.',
      'Después de la unión, agrupa por la columna de customers y suma la columna de orders.',
      'Plantilla: SELECT c.country, SUM(o.amount) AS total_revenue FROM orders o JOIN customers c ON ... GROUP BY c.country;',
    ],
    explanation:
      'JOIN y GROUP BY se combinan de maravilla: primero se construye el conjunto de filas unidas y después se agrupa. Como se usa INNER JOIN, los países cuyos clientes no tienen pedidos no entran en el informe. Es coherente con lo que se pide aquí: calcular los ingresos de los países que tienen pedidos.',
  },
  'L3-revenue-by-category': {
    title: 'Ingresos por categoría',
    context:
      'Un responsable de categoría quiere ver el dinero, y no el número de ventas, desglosado por áreas.',
    taskText: 'Calcula los ingresos de cada categoría como la suma de cantidad × precio.',
    hints: [
      'La cantidad está en order_items y el precio, en products, así que primero hace falta un JOIN.',
      'La multiplicación tiene que ir dentro de SUM: SUM(oi.quantity * p.price).',
      'Plantilla: SELECT p.category, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... GROUP BY p.category;',
    ],
    explanation:
      'Una expresión dentro de una función de agregación se calcula para cada fila por separado y solo después se suman los resultados. SUM(quantity) * price no representaría correctamente los ingresos: primero hay que calcular cantidad × precio para cada línea y después sumar esos importes. De hecho, PostgreSQL ni siquiera ejecutaría esa consulta: price tendría que aparecer en GROUP BY o dentro de una agregación.',
  },
  'L3-customer-purchases': {
    title: 'Qué compró exactamente el cliente',
    context:
      'En soporte resuelven una incidencia y quieren ver la cadena completa: cliente, pedido y producto.',
    taskText: 'Muestra qué cliente compró qué producto, en qué pedido y en qué cantidad.',
    hints: [
      'Los datos están repartidos en cuatro tablas y cada pareja se une mediante su propia clave.',
      'Las uniones se ponen en cadena: orders → customers, orders → order_items y order_items → products.',
      'Plantilla: SELECT ... FROM orders o JOIN customers c ON ... JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'Las uniones se aplican una tras otra: el resultado de una unión se combina con la siguiente tabla. Recorrer así un esquema normalizado es habitual en el análisis de datos, porque en las bases de datos los datos suelen estar repartidos entre entidades separadas.',
  },
  'L3-managers-and-orders': {
    title: 'Nadie se ha perdido',
    context:
      'Antes de la auditoría hace falta una vista que muestre tanto los empleados sin ventas como los pedidos para los que ya no existe el empleado responsable.',
    taskText:
      'Junta empleados y pedidos de forma que en el resultado queden tanto los empleados que no llevaron ningún pedido como los pedidos que no tienen asignado ningún empleado existente.',
    hints: [
      'Hay que conservar las filas sin pareja de los dos lados a la vez, no de uno solo.',
      'FULL JOIN conserva todo: tanto lo que conservaría un LEFT JOIN como lo que conservaría un RIGHT JOIN.',
      'Plantilla: SELECT e.first_name, o.order_id, o.amount FROM employees e FULL JOIN orders o ON e.employee_id = o.manager_id;',
    ],
    explanation:
      'FULL OUTER JOIN permite conservar las filas sin pareja de ambos lados. Aquí hay de los dos tipos: nueve empleados no llevan pedidos y un pedido está registrado a nombre de un responsable que ya no existe en employees. Todos ellos permanecen en el resultado, con NULL en las columnas del lado que no tiene coincidencia. Es precisamente este comportamiento el que permite detectar referencias sin correspondencia entre las dos tablas.',
  },
  'L3-department-pairs': {
    title: 'Parejas de colegas del mismo departamento',
    context:
      'Para un programa de aprendizaje entre compañeros forman parejas de personas que trabajan en la misma área.',
    taskText:
      'Forma la lista de parejas de empleados que trabajan en el mismo departamento. Cada pareja tiene que aparecer una sola vez y nadie puede emparejarse consigo mismo.',
    hints: [
      'La tabla vuelve a unirse consigo misma, pero esta vez la condición tiene que descartar además las parejas duplicadas.',
      'Comparar los identificadores con «mayor que» deja solo una variante de cada pareja.',
      'Plantilla: SELECT a.first_name AS employee_a, b.first_name AS employee_b, a.department FROM employees a JOIN employees b ON b.department = a.department AND b.employee_id > a.employee_id;',
    ],
    explanation:
      'La condición b.employee_id > a.employee_id hace dos cosas a la vez: evita que una persona se empareje consigo misma y descarta el duplicado en espejo. Si allí hubiera <>, cada pareja aparecería dos veces, una en cada orden. Además, un empleado sin departamento no entra en el resultado, porque NULL = NULL no da verdadero, sino UNKNOWN.',
  },
  'L3-big-orders-kept-customers': {
    title: 'Pedidos grandes, pero todos los clientes',
    context:
      'Un responsable quiere ver la lista completa de clientes y, al lado, solo sus compras grandes, para que destaquen quienes no tienen ninguna.',
    taskText:
      'Muestra todos los clientes junto con sus pedidos de más de 200. Un cliente que no tenga esos pedidos tiene que quedarse igualmente en el resultado.',
    hints: [
      'La condición sobre el importe tiene que limitar lo que se engancha, no lo que queda en el resultado.',
      'Al ON se le puede añadir otra condición con AND: actúa durante la unión.',
      'Plantilla: SELECT c.name, o.order_id, o.amount FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.amount > 200;',
    ],
    explanation:
      'Esta diferencia es una de las más importantes del tema de las uniones. Una condición en ON se aplica durante la unión: las filas sin pareja de la tabla izquierda se conservan igualmente, solo con las columnas de la derecha en NULL. La misma condición en WHERE actuaría después de la unión y eliminaría esas filas, porque NULL > 200 no es TRUE; en la práctica, el LEFT JOIN se comportaría como un INNER JOIN para esa condición. Si después de un LEFT JOIN desaparecen filas de golpe, lo primero que conviene revisar es si hay una condición sobre la tabla derecha en WHERE.',
  },
  'L3-affordable-for-order': {
    title: 'Qué se podía haber añadido al ticket',
    context:
      'En ventas buscan ideas para vender más: para cada pedido quieren ver productos de un valor parecido.',
    taskText:
      'Para cada pedido, selecciona los productos cuyo precio esté entre el 80 y el 100 por ciento de su importe.',
    hints: [
      'Pedidos y productos no comparten ninguna clave: los empareja la propia condición sobre el precio.',
      'En ON se puede escribir cualquier condición que dé «sí» o «no», incluido un rango con BETWEEN.',
      'Plantilla: SELECT o.order_id, o.amount, p.product_name, p.price FROM orders o JOIN products p ON p.price BETWEEN o.amount * 0.8 AND o.amount;',
    ],
    explanation:
      'En ON no tiene que haber necesariamente una igualdad de claves: puede utilizarse cualquier condición que determine si dos filas deben emparejarse. En este caso se trata de una unión por rango. Los pedidos sin ningún producto que cumpla la condición no entran en el resultado porque se utiliza INNER JOIN.',
  },
  'L3-diverse-buyers': {
    title: 'Clientes de gustos amplios',
    context:
      'Marketing prepara ventas cruzadas y busca compradores que ya se hayan llevado productos de al menos tres categorías distintas.',
    taskText:
      'Muestra los clientes que compraron productos de tres o más categorías distintas y el número de esas categorías.',
    hints: [
      'Para llegar del cliente a la categoría del producto hay que recorrer cuatro tablas.',
      'No hay que contar filas, sino categorías distintas: COUNT(DISTINCT p.category).',
      'Plantilla: SELECT c.name, COUNT(DISTINCT p.category) AS category_count FROM customers c JOIN orders o ON ... JOIN order_items oi ON ... JOIN products p ON ... GROUP BY c.customer_id, c.name HAVING COUNT(DISTINCT p.category) >= 3;',
    ],
    explanation:
      'El ejercicio de cierre del nivel reúne varios conceptos: una unión de varias tablas, agrupación, DISTINCT dentro de una agregación y un filtro sobre el resultado de una agregación. El detalle clave es precisamente DISTINCT: un COUNT normal contaría líneas de pedido, y un cliente que comprara cinco veces productos de la misma categoría podría alcanzar el umbral por error.',
  },
  'L3-active-countries': {
    title: 'Mercados donde ya hay demanda',
    context:
      'Antes de repartir el presupuesto, la dirección quiere identificar los países en los que las ventas ya no son casos aislados.',
    taskText:
      'Muestra los países de los que llegaron al menos cuatro pedidos, junto con el número de pedidos y los ingresos totales.',
    hints: [
      'El país está en una tabla y los pedidos, en otra, y lo que hay que filtrar son los totales por país, no las filas individuales.',
      'Primero JOIN, luego GROUP BY por país y solo después HAVING sobre el contador que calculaste.',
      'Plantilla: SELECT c.country, COUNT(o.order_id) AS order_count, SUM(o.amount) AS revenue FROM customers c JOIN orders o ON ... GROUP BY c.country HAVING COUNT(o.order_id) >= 4;',
    ],
    explanation:
      'Sigue la cadena completa: JOIN construye el conjunto de filas unidas, GROUP BY lo agrupa por país y HAVING filtra los grupos ya formados. Italia no está en el resultado, y la razón no es HAVING: el único cliente italiano no tiene ningún pedido, así que INNER JOIN lo descarta antes de la agrupación. Si el ejercicio pidiera mostrar también los países con cero pedidos, haría falta un LEFT JOIN y habría que tener en cuenta cómo afecta ese cambio al COUNT y al HAVING.',
  },
  'L3-category-reach': {
    title: 'Alcance y dinero por categoría',
    context:
      'Un responsable de categoría compara dos indicadores: cuántos clientes compran en un área y cuánto dinero genera.',
    taskText:
      'Para cada categoría, cuenta cuántos clientes distintos compraron productos de ella y cuánto dinero generó.',
    hints: [
      'Para llegar de la línea de pedido al cliente hay que recorrer cuatro tablas, y en el resultado hay dos indicadores.',
      'Un agregado tiene que contar cada cliente distinto y el otro tiene que sumar los importes de cada línea.',
      'Plantilla: SELECT p.category, COUNT(DISTINCT c.customer_id) AS buyer_count, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... JOIN orders o ON ... JOIN customers c ON ... GROUP BY p.category;',
    ],
    explanation:
      'Ejercicio de cierre del nivel: los dos agregados se calculan sobre el mismo conjunto de filas, pero resuelven problemas distintos. SUM tiene que procesar cada línea por separado, porque los ingresos dependen de la cantidad de cada línea; COUNT(DISTINCT …), en cambio, tiene que eliminar las repeticiones, porque queremos contar clientes y no líneas de pedido. Por eso DISTINCT va dentro de este agregado concreto y no junto a SELECT: allí afectaría a la fila completa del resultado.',
  },
};
