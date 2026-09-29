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
      'Hacen falta datos de dos tablas, así que hay que unirlas por una columna común.',
      'La columna común es customer_id. La sintaxis: JOIN otra_tabla ON condición.',
      'Plantilla: SELECT o.order_id, c.name, o.amount FROM orders o JOIN customers c ON c.customer_id = o.customer_id;',
    ],
    explanation:
      'INNER JOIN empareja las filas de dos tablas según la condición del ON y deja solo las parejas en las que hay coincidencia. Los alias o y c acortan la consulta y quitan la ambigüedad cuando las dos tablas tienen columnas con el mismo nombre.',
  },

  'L3-items-with-products': {
    title: 'Líneas de pedido con el nombre del producto',
    context:
      'Alguien del almacén prepara un pedido y en el sistema solo ve product_id en lugar de nombres.',
    taskText: 'Muestra el número de pedido, el nombre del producto y la cantidad.',
    hints: [
      'El nombre del producto está en products y la cantidad en order_items.',
      'Une las tablas por product_id.',
      'Plantilla: SELECT oi.order_id, p.product_name, oi.quantity FROM order_items oi JOIN products p ON p.product_id = oi.product_id;',
    ],
    explanation:
      'La pareja clásica de «hechos y catálogo»: order_items guarda los eventos de venta y products las descripciones. JOIN acerca los nombres legibles a los identificadores técnicos. Así está montada la mayoría de los esquemas en los almacenes de datos.',
  },

  'L3-all-customers-orders': {
    title: 'Todos los clientes y sus pedidos',
    context:
      'Una persona de analítica prepara una vista completa de la base: en la lista tienen que quedar incluso los clientes que todavía no han comprado nada.',
    taskText:
      'Muestra todos los clientes junto con los números de sus pedidos. Los clientes sin pedidos también tienen que estar en el resultado.',
    hints: [
      'INNER JOIN dejaría fuera a los clientes sin pedidos: hace falta otra unión.',
      'LEFT JOIN conserva todas las filas de la tabla izquierda; donde no hay pareja habrá NULL.',
      'Plantilla: SELECT c.name, o.order_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;',
    ],
    explanation:
      'LEFT JOIN conserva todas las filas de la tabla izquierda, haya coincidencia a la derecha o no. Aquí el orden de las tablas es decisivo: customers tiene que ir a la izquierda, porque si no «conservar a todos» se aplica a los datos equivocados.',
  },

  'L3-never-sold': {
    title: 'Productos que nunca se compraron',
    context: 'En compras revisan la gama y buscan artículos sin una sola venta.',
    taskText: 'Muestra los productos que no están en ningún pedido.',
    hints: [
      'Primero conserva todos los productos y después deja solo aquellos para los que no se encontró pareja.',
      'Tras un LEFT JOIN, las filas sin pareja tienen NULL en las columnas de la tabla derecha: por eso filtramos.',
      'Plantilla: SELECT p.product_name, p.category FROM products p LEFT JOIN order_items oi ON ... WHERE oi.order_item_id IS NULL;',
    ],
    explanation:
      'El patrón anti-join: LEFT JOIN más WHERE ... IS NULL. Reconócelo por las palabras «nunca», «ni una vez», «no aparecen en». La comprobación tiene que hacerse con IS NULL: una comparación = NULL no funciona nunca.',
  },

  'L3-join-using': {
    title: 'Una forma más corta de escribir la unión',
    context: 'Alguien de analítica reescribe una consulta larga y quiere quitarle el ruido de más.',
    taskText:
      'Muestra el número de pedido, el nombre del cliente y el importe uniendo las tablas con USING.',
    hints: [
      'La columna de enlace se llama igual en las dos tablas, así que no hace falta escribir la igualdad de dos nombres idénticos.',
      'USING (columna) sustituye a ON cuando el nombre de la columna coincide en ambas tablas.',
      'Plantilla: SELECT order_id, name, amount FROM orders JOIN customers USING (customer_id);',
    ],
    explanation:
      'USING solo funciona cuando la columna se llama igual en los dos lados. A diferencia de ON, la columna común aparece una sola vez en el resultado y deja de pertenecer a una tabla concreta, y por eso después de USING ya no se puede escribir o.customer_id. Es una comodidad y una limitación a la vez: en cuanto las claves se llamen de forma distinta, habrá que volver a ON.',
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
      'El resultado aquí es exactamente el mismo que en el ejercicio «Todos los clientes y sus pedidos»: RIGHT JOIN es un LEFT JOIN con las tablas cambiadas de sitio. Justo por eso en la práctica RIGHT JOIN se escribe poco: cuando una consulta tiene tres o cuatro uniones, mantener una sola dirección en la cabeza es mucho más fácil que seguir qué lado se conserva en cada línea.',
  },

  'L3-manager-subordinate': {
    title: 'Quién es responsable de quién',
    context:
      'En personal construyen el organigrama y quieren ver parejas de «empleado y su responsable».',
    taskText:
      'Muestra el nombre de cada empleado junto al nombre de su responsable. A quienes no tienen responsable no hace falta mostrarlos.',
    hints: [
      'Tanto el subordinado como el responsable están en la misma tabla, solo en filas distintas.',
      'Una tabla se puede unir consigo misma dándole dos alias diferentes.',
      'Plantilla: SELECT e.first_name AS employee, m.first_name AS manager FROM employees e JOIN employees m ON m.employee_id = e.manager_id;',
    ],
    explanation:
      'En un self-join los alias dejan de ser una comodidad y se vuelven imprescindibles: sin ellos employees.employee_id no diría de cuál de las dos copias de la tabla se habla. Fíjate en que INNER JOIN descartó por sí solo a la dirección: su manager_id está vacío y no se encontró pareja para ellos. Si hubiera que conservarlos, haría falta un LEFT JOIN.',
  },

  'L3-orders-per-customer-join': {
    title: 'Cuántos pedidos tiene cada uno, incluido el cero',
    context:
      'Marketing segmenta la base y le interesan en especial quienes todavía no han comprado nada.',
    taskText:
      'Para cada cliente, muestra el número de sus pedidos. Los clientes sin pedidos tienen que mostrar 0.',
    hints: [
      'Primero conservamos a todos los clientes y después contamos, pero hay que contar pedidos, no filas.',
      'Tras un LEFT JOIN, un cliente sin pedidos sigue teniendo su fila, solo con las columnas de la derecha vacías.',
      'Plantilla: SELECT c.name, COUNT(o.order_id) AS order_count FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.name;',
    ],
    explanation:
      'Aquí se esconde el error más habitual de la pareja LEFT JOIN y COUNT: COUNT(*) daría un uno al cliente sin pedidos, porque la fila tras la unión existe, solo que vacía. COUNT(o.order_id) cuenta únicamente los valores no vacíos y por eso devuelve cero honestamente. Agrupamos por customer_id junto con el nombre porque dos clientes podrían, en teoría, llamarse igual.',
  },

  'L3-order-contents': {
    title: 'Qué hay dentro de cada pedido',
    context:
      'En el almacén imprimen hojas de preparación: el sistema solo tiene códigos y allí hacen falta nombres.',
    taskText:
      'Muestra el número y la fecha del pedido junto con el nombre del producto y la cantidad.',
    hints: [
      'Un pedido no sabe qué productos contiene: entre ellos hay una tercera tabla.',
      'Las uniones se ponen en cadena: primero del pedido a sus líneas, después de la línea al catálogo de productos.',
      'Plantilla: SELECT o.order_id, o.order_date, p.product_name, oi.quantity FROM orders o JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'order_items es una tabla de enlace: existe justamente porque un pedido contiene muchos productos y un producto aparece en muchos pedidos. Entre orders y products no hay enlace directo, así que hacen falta dos uniones seguidas. En el resultado hay más filas que pedidos, y eso no es un error, sino la naturaleza de una unión de uno a muchos.',
  },

  'L3-country-category-grid': {
    title: 'La rejilla «país × categoría»',
    context:
      'Alguien de analítica prepara el esqueleto de un informe de cobertura de mercados: la tabla tiene que contener todas las celdas, incluso las vacías.',
    taskText:
      'Construye todas las parejas posibles de «país del cliente y categoría del producto», aunque esas ventas nunca hayan existido. Cada pareja tiene que aparecer una vez.',
    hints: [
      'Aquí no hay nada que emparejar: hacen falta simplemente todas las combinaciones de una lista con la otra.',
      'CROSS JOIN une cada fila con cada fila y no tiene condición ON.',
      'Plantilla: SELECT DISTINCT c.country, p.category FROM customers c CROSS JOIN products p;',
    ],
    explanation:
      'CROSS JOIN construye a propósito un producto cartesiano: seis países y cinco categorías dan 30 parejas. DISTINCT hace falta aquí porque los países y las categorías se repiten dentro de las propias tablas. Un esqueleto así sirve para informes en los que también deben verse los ceros. Pero ese mismo producto aparece además por accidente, cuando en un JOIN se olvida el ON y el número de filas estalla de golpe; conviene aprender a reconocer esa imagen justo aquí, en su forma segura.',
  },

  'L3-revenue-by-country': {
    title: 'Ingresos por país',
    context:
      'La dirección decide en qué mercados invertir y mira los ingresos desglosados por país.',
    taskText: 'Calcula los ingresos totales de cada país.',
    hints: [
      'El país está en una tabla y los importes en otra, así que primero hace falta un JOIN.',
      'Después de la unión, agrupa por la columna de customers y suma la columna de orders.',
      'Plantilla: SELECT c.country, SUM(o.amount) AS total_revenue FROM orders o JOIN customers c ON ... GROUP BY c.country;',
    ],
    explanation:
      'JOIN y GROUP BY se combinan de maravilla: primero se construye el conjunto de filas unidas y después se agrupa. Como se usa INNER JOIN, los países sin pedidos no entran en el informe, que es justo lo que se quería aquí.',
  },

  'L3-revenue-by-category': {
    title: 'Ingresos por categoría',
    context:
      'Un responsable de categoría quiere ver el dinero y no el número de ventas, desglosado por áreas.',
    taskText: 'Calcula los ingresos de cada categoría como la suma de cantidad × precio.',
    hints: [
      'La cantidad está en order_items y el precio en products, así que primero hace falta un JOIN.',
      'La multiplicación tiene que ir dentro de SUM: SUM(oi.quantity * p.price).',
      'Plantilla: SELECT p.category, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... GROUP BY p.category;',
    ],
    explanation:
      'Una expresión dentro de una función de agregación se calcula para cada fila por separado, y solo después se suman los resultados. SUM(quantity) * price daría un error grave: la cantidad total se multiplicaría por el precio de un producto cualquiera.',
  },

  'L3-customer-purchases': {
    title: 'Qué compró exactamente el cliente',
    context:
      'En soporte resuelven una incidencia y quieren ver la cadena completa: cliente, pedido, producto.',
    taskText: 'Muestra qué cliente compró qué producto en qué pedido y en qué cantidad.',
    hints: [
      'Los datos están repartidos en cuatro tablas y cada pareja se une por su propia clave.',
      'Las uniones se ponen en cadena: orders → customers, orders → order_items, order_items → products.',
      'Plantilla: SELECT ... FROM orders o JOIN customers c ON ... JOIN order_items oi ON ... JOIN products p ON ...;',
    ],
    explanation:
      'Las uniones se ejecutan una tras otra: el resultado de la unión anterior se engancha a la siguiente tabla. Recorrer así un esquema normalizado es el trabajo diario de quien analiza datos, porque en las bases reales los datos están repartidos a propósito en entidades separadas.',
  },

  'L3-managers-and-orders': {
    title: 'Nadie se ha perdido',
    context:
      'Antes de la auditoría hace falta una vista que muestre tanto los empleados sin ventas como los pedidos de los que ya no responde nadie.',
    taskText:
      'Junta empleados y pedidos de forma que en el resultado queden tanto los empleados que no llevaron ningún pedido como los pedidos que no tienen asignado ningún empleado existente.',
    hints: [
      'Hay que conservar las filas sin pareja de los dos lados a la vez, no de uno solo.',
      'FULL JOIN conserva todo: lo que conservaría un LEFT JOIN y lo que conservaría un RIGHT JOIN.',
      'Plantilla: SELECT e.first_name, o.order_id, o.amount FROM employees e FULL JOIN orders o ON e.employee_id = o.manager_id;',
    ],
    explanation:
      'Un FULL OUTER JOIN merece su nombre solo cuando hay filas sin pareja en los dos lados; si no, no se diferencia de un LEFT JOIN. Aquí las hay: nueve empleados no llevan pedidos y un pedido está registrado a nombre de un responsable que ya no está en la tabla. Un nombre vacío en una fila no es un fallo de los datos, sino justo el huérfano por el que se escribió la consulta: así se encuentran las referencias rotas en las bases reales.',
  },

  'L3-department-pairs': {
    title: 'Parejas de colegas del mismo departamento',
    context:
      'Para un programa de aprendizaje entre compañeros forman parejas de personas que trabajan en la misma área.',
    taskText:
      'Forma la lista de parejas de empleados que trabajan en el mismo departamento. Cada pareja tiene que aparecer una sola vez y nadie puede emparejarse consigo mismo.',
    hints: [
      'La tabla vuelve a unirse consigo misma, pero esta vez la condición tiene que descartar además las repeticiones de más.',
      'Comparar los identificadores con «mayor que» deja solo una variante de cada pareja.',
      'Plantilla: SELECT a.first_name AS employee_a, b.first_name AS employee_b, a.department FROM employees a JOIN employees b ON b.department = a.department AND b.employee_id > a.employee_id;',
    ],
    explanation:
      'La condición b.employee_id > a.employee_id hace dos cosas a la vez: quita la pareja de una persona consigo misma y descarta el duplicado en espejo. Si allí hubiera <>, cada pareja aparecería dos veces, una en orden directo y otra en orden inverso. El segundo detalle: el empleado sin departamento no entra en el resultado, porque NULL = NULL no da verdadero, sino desconocido.',
  },

  'L3-big-orders-kept-customers': {
    title: 'Pedidos grandes, pero todos los clientes',
    context:
      'Un responsable quiere ver la lista completa de clientes y, al lado, solo sus compras grandes, para que salten a la vista quienes no tienen ninguna.',
    taskText:
      'Muestra todos los clientes junto con sus pedidos de más de 200. Un cliente que no tenga esos pedidos tiene que quedarse igualmente en el resultado.',
    hints: [
      'La condición sobre el importe tiene que limitar lo que se engancha, no lo que queda en el resultado.',
      'Al ON se le puede añadir otra condición con AND: actúa durante la unión.',
      'Plantilla: SELECT c.name, o.order_id, o.amount FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.amount > 200;',
    ],
    explanation:
      'Esta diferencia es una de las más importantes del tema de las uniones. Una condición en ON se aplica durante la unión: las filas sin pareja de la tabla izquierda se conservan igualmente, solo con las columnas de la derecha vacías. La misma condición en WHERE actuaría después de la unión y las tiraría, porque NULL > 200 no es verdadero, y el LEFT JOIN se convertiría en silencio en un INNER. Si después de un LEFT JOIN desaparecen filas de golpe, lo primero que hay que buscar es una condición sobre la tabla derecha en WHERE.',
  },

  'L3-affordable-for-order': {
    title: 'Qué se podía haber añadido al ticket',
    context:
      'En ventas buscan ideas para vender más: para cada ticket quieren ver productos de un valor parecido.',
    taskText:
      'Para cada pedido, selecciona los productos cuyo precio esté entre el 80 y el 100 por ciento de su importe.',
    hints: [
      'Pedidos y productos no comparten ninguna clave: los empareja la propia condición sobre el precio.',
      'En ON se puede escribir cualquier condición que dé «sí» o «no», incluido un rango con BETWEEN.',
      'Plantilla: SELECT o.order_id, o.amount, p.product_name, p.price FROM orders o JOIN products p ON p.price BETWEEN o.amount * 0.8 AND o.amount;',
    ],
    explanation:
      'En ON no tiene que haber forzosamente una igualdad de claves: sirve cualquier condición que devuelva verdadero o falso. El precio de esa flexibilidad es práctico: sin igualdad la base de datos no puede aprovechar un índice y recorre las parejas una a una, así que las uniones por rango son caras en tablas grandes. Fíjate además en que los pedidos sin ningún producto adecuado no entran en el resultado: es un INNER JOIN.',
  },

  'L3-diverse-buyers': {
    title: 'Clientes de gustos amplios',
    context:
      'Marketing prepara ventas cruzadas y busca compradores que ya se hayan llevado productos de al menos tres categorías distintas.',
    taskText:
      'Muestra los clientes que compraron productos de tres o más categorías distintas, y el número de esas categorías.',
    hints: [
      'Para llegar del cliente a la categoría del producto hay que recorrer cuatro tablas.',
      'No hay que contar filas, sino categorías distintas: COUNT(DISTINCT p.category).',
      'Plantilla: SELECT c.name, COUNT(DISTINCT p.category) AS category_count FROM customers c JOIN orders o ON ... JOIN order_items oi ON ... JOIN products p ON ... GROUP BY c.customer_id, c.name HAVING COUNT(DISTINCT p.category) >= 3;',
    ],
    explanation:
      'El ejercicio de cierre del nivel lo reúne todo: una unión de varias tablas, agrupación, DISTINCT dentro de la agregación y un filtro sobre ella. El detalle clave es justamente DISTINCT: un COUNT normal contaría líneas de pedido, y un cliente que compró cinco veces de la misma categoría entraría en el informe por error.',
  },

  'L3-active-countries': {
    title: 'Mercados donde ya hay demanda',
    context:
      'Antes de repartir el presupuesto, la dirección elige los países en los que las ventas ya no son casos aislados.',
    taskText:
      'Muestra los países de los que llegaron al menos cuatro pedidos, junto con el número de pedidos y los ingresos totales.',
    hints: [
      'El país está en una tabla y los pedidos en otra, y lo que hay que descartar son los totales, no las filas sueltas.',
      'Primero JOIN, luego GROUP BY por país y solo después HAVING sobre el contador que calculaste.',
      'Plantilla: SELECT c.country, COUNT(o.order_id) AS order_count, SUM(o.amount) AS revenue FROM customers c JOIN orders o ON ... GROUP BY c.country HAVING COUNT(o.order_id) >= 4;',
    ],
    explanation:
      'Sigue la cadena completa: JOIN construye el conjunto ampliado de filas, GROUP BY lo comprime en países y HAVING descarta grupos ya formados. Italia no está en el resultado, y la razón no es HAVING: el único cliente italiano no tiene ningún pedido, así que INNER JOIN lo descartó antes de agrupar. Si el ejercicio pidiera mostrar también los países con cero, haría falta un LEFT JOIN, y entonces habría que reescribir el HAVING, porque el cero no pasa la condición «al menos cuatro».',
  },

  'L3-category-reach': {
    title: 'Alcance y dinero por categoría',
    context:
      'Un responsable de categoría compara dos indicadores: si mucha gente compra un área y cuánto dinero deja.',
    taskText:
      'Para cada categoría, cuenta cuántos clientes distintos compraron productos de ella y cuánto dinero dejó.',
    hints: [
      'Para llegar de la línea de pedido al cliente hay que recorrer cuatro tablas, y en el resultado hay dos indicadores.',
      'Un agregado tiene que ver cada fila por separado y el otro, al contrario, tiene que comprimir las repeticiones.',
      'Plantilla: SELECT p.category, COUNT(DISTINCT c.customer_id) AS buyer_count, SUM(oi.quantity * p.price) AS revenue FROM order_items oi JOIN products p ON ... JOIN orders o ON ... JOIN customers c ON ... GROUP BY p.category;',
    ],
    explanation:
      'Ejercicio de cierre del nivel: los dos agregados se calculan sobre el mismo conjunto de filas y se comportan al revés. SUM tiene que ver cada línea por separado, porque si no los ingresos saldrán incompletos; COUNT(DISTINCT …), en cambio, tiene que comprimir las repeticiones, porque si no «el número de clientes» se convierte en «el número de líneas de pedido». Justo por eso DISTINCT va dentro de un agregado concreto y no junto a SELECT: allí cambiaría la fila entera del resultado.',
  },
};
