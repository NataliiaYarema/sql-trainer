// Іспанський текст завдань рівня 4 (підзапити й CTE).
//
// EXISTS, NOT EXISTS, NOT IN і WITH лишаються великими літерами: це конструкції.
// У L4-employees-not-managers на різниці між NOT IN і NOT EXISTS тримається все
// пояснення, тому перекладати їх там особливо не можна.
export default {
  'L4-big-order-customers': {
    title: 'Clientes con pedidos grandes',
    context:
      'El equipo de grandes cuentas busca a todos los clientes que alguna vez hayan hecho un pedido de más de 300.',
    taskText:
      'Muestra el nombre y el país de los clientes que tienen al menos un pedido por encima de 300.',
    hints: [
      'Primero encuentra los identificadores de los clientes con pedidos grandes y después selecciónalos en el catálogo.',
      'El operador IN acepta no solo una lista de valores, sino también una subconsulta completa.',
      'Plantilla: SELECT name, country FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount > 300);',
    ],
    explanation:
      'La subconsulta dentro de IN se ejecuta para obtener un conjunto de valores con el que se compara la consulta externa. A diferencia de un JOIN, el cliente no se duplica aunque tenga varios pedidos grandes, que es justo lo que necesitamos en una lista de clientes.',
  },
  'L4-bulk-products': {
    title: 'Productos que se pidieron en grandes cantidades',
    context:
      'Logística planifica el almacenamiento en palés para los artículos que se piden en cantidades de tres o más unidades.',
    taskText: 'Muestra los productos que al menos una vez se pidieron en una cantidad de 3 o más.',
    hints: [
      'La subconsulta tiene que devolver la lista de product_id que cumplen la condición.',
      'La consulta externa filtra el catálogo de productos por esa lista con IN.',
      'Plantilla: SELECT product_name, category FROM products WHERE product_id IN (SELECT product_id FROM order_items WHERE quantity >= 3);',
    ],
    explanation:
      'Una subconsulta en WHERE resulta cómoda cuando de la segunda tabla solo necesitamos una condición de selección y no sus columnas. Con un JOIN habría que controlar los posibles duplicados si varias líneas cumplen la condición, por ejemplo con DISTINCT.',
  },
  'L4-above-average-salary': {
    title: 'Quién gana por encima de la media',
    context:
      'En personal analizan la dispersión salarial y buscan a quienes cobran más que la media de la empresa.',
    taskText: 'Muestra los empleados con un salario superior a la media de la empresa.',
    hints: [
      'La media hay que calcularla con una consulta aparte y usarla como valor en la condición.',
      'Una subconsulta escalar entre paréntesis devuelve un único valor y se puede utilizar para comparar.',
      'Plantilla: SELECT first_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    ],
    explanation:
      'Una subconsulta escalar produce un único valor y puede utilizarse allí donde se espera un valor escalar. Así podemos calcular la media por separado y después comparar el salario de cada empleado con ese resultado.',
  },
  'L4-price-vs-average': {
    title: 'El precio de un producto frente a la media',
    context:
      'Un responsable de categoría quiere ver el precio de cada producto junto a la media del catálogo.',
    taskText: 'Para cada producto, muestra su precio y el precio medio de todo el catálogo.',
    hints: [
      'Una subconsulta puede ir no solo en WHERE, sino directamente en la lista de columnas.',
      'El valor es el mismo para todas las filas, porque la subconsulta no depende de la consulta externa.',
      'Plantilla: SELECT product_name, price, (SELECT AVG(price) FROM products) AS avg_price FROM products;',
    ],
    explanation:
      'Una subconsulta escalar en SELECT permite añadir a cada fila un valor calculado por separado. Como la subconsulta no depende de columnas de la consulta externa, el resultado es el mismo para todas las filas y el optimizador puede evitar recalcularlo innecesariamente.',
  },
  'L4-customers-with-orders': {
    title: 'Clientes que han pedido algo',
    context:
      'Antes de un envío, marketing deja en la base solo a quienes tienen al menos un pedido.',
    taskText: 'Muestra los clientes que tienen al menos un pedido.',
    hints: [
      'La pregunta no es «cuántos pedidos», sino «si hay alguno»: basta con saber que existe al menos uno.',
      'EXISTS da verdadero en cuanto la subconsulta devuelve al menos una fila.',
      'Plantilla: SELECT name, country FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);',
    ],
    explanation:
      'EXISTS comprueba si existen filas, no qué contienen, y por eso dentro se escribe tradicionalmente SELECT 1. Se diferencia de un JOIN en que el cliente no se duplica, tenga los pedidos que tenga.',
  },
  'L4-departments-without-hires': {
    title: 'Departamentos sin incorporaciones',
    context:
      'En personal comprueban qué departamentos no contrataron a nadie en 2024: puede que allí se haya frenado el crecimiento.',
    taskText: 'Muestra los departamentos que no tienen ningún empleado contratado en 2024.',
    hints: [
      'Formula lo contrario: «el departamento tiene a alguien contratado en 2024». Después niégalo.',
      'NOT EXISTS es verdadero justo cuando la subconsulta no devuelve ninguna fila.',
      'Plantilla: SELECT DISTINCT department FROM employees e WHERE department IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees e2 WHERE e2.department = e.department AND EXTRACT(YEAR FROM e2.hire_date) = 2024);',
    ],
    explanation:
      'NOT EXISTS es la forma estándar de expresar «no existe ninguna fila relacionada». A diferencia de NOT IN, evita los problemas que pueden aparecer cuando la subconsulta contiene NULL: NOT IN puede producir UNKNOWN en esas situaciones, mientras que NOT EXISTS comprueba directamente si existe una fila que cumpla la condición.',
  },
  'L4-first-cte': {
    title: 'El primer paso con WITH',
    context:
      'Alguien de analítica quiere dividir una consulta larga en pasos legibles, empezando por seleccionar los productos caros.',
    taskText:
      'Con un CTE, selecciona los productos de más de 200 y después muestra sus nombres y precios.',
    hints: [
      'Un CTE es un resultado intermedio con nombre que se declara antes de la consulta principal.',
      'La sintaxis es: WITH nombre AS (consulta) SELECT ... FROM nombre;',
      'Plantilla: WITH expensive AS (SELECT product_name, price FROM products WHERE price > 200) SELECT product_name, price FROM expensive;',
    ],
    explanation:
      'Un CTE (Common Table Expression) da nombre a una subconsulta y la coloca al principio de la consulta. Aquí todavía no simplifica demasiado la lógica: su utilidad se aprecia más cuando hay varios pasos. Lo importante ahora es familiarizarse con la estructura WITH nombre AS (...).',
  },
  'L4-cte-aggregate': {
    title: 'Un CTE con agregación',
    context:
      'Un responsable quiere ver los totales por cliente, calculados en un paso aparte y fácil de leer.',
    taskText:
      'Con un CTE, calcula el importe de los pedidos de cada cliente y después muestra solo a quienes gastaron más de 500.',
    hints: [
      'Primero realiza la agregación dentro del CTE y después aplica un filtro normal sobre su resultado.',
      'A una columna calculada en un CTE se puede acceder en la consulta externa con un WHERE normal.',
      'Plantilla: WITH totals AS (SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id) SELECT * FROM totals WHERE total_spent > 500;',
    ],
    explanation:
      'Aquí es donde el CTE resulta especialmente útil: el agregado se calcula en un paso anterior, así que después se puede filtrar con un WHERE normal, sin HAVING. La consulta se lee de arriba abajo como una secuencia de pasos y no como una serie de subconsultas anidadas.',
  },
  'L4-loyal-avg-check': {
    title: 'El ticket medio entre los clientes habituales',
    context:
      'Alguien de analítica calcula el ticket medio, pero solo de quienes tienen al menos cuatro pedidos: los compradores ocasionales distorsionan la imagen.',
    taskText: 'Muestra los nombres de los clientes con 4 pedidos o más y su ticket medio.',
    hints: [
      'Calcula los agregados en una consulta aparte y después únele el catálogo de clientes.',
      'Una subconsulta en FROM funciona como una tabla derivada y conviene darle un alias.',
      'Plantilla: SELECT c.name, s.avg_order FROM (SELECT customer_id, AVG(amount) AS avg_order FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4) s JOIN customers c ON ...;',
    ],
    explanation:
      'Una subconsulta en FROM, también llamada tabla derivada, permite agregar los datos primero y después trabajar con el resultado como con una tabla normal. Los CTE (WITH) que acabas de ver siguen una idea similar, pero suelen resultar más fáciles de leer cuando la consulta tiene varios pasos.',
  },
  'L4-department-top-salary': {
    title: 'El salario más alto de su departamento',
    context: 'La dirección destaca a los empleados mejor pagados de cada departamento.',
    taskText: 'Muestra los empleados cuyo salario es el máximo dentro de su departamento.',
    hints: [
      'Hay que comparar cada salario no con el máximo global, sino con el máximo de su propio departamento.',
      'Una subconsulta correlacionada puede referirse a una columna de la consulta externa: WHERE e2.department = e.department.',
      'Plantilla: SELECT ... FROM employees e WHERE e.salary = (SELECT MAX(e2.salary) FROM employees e2 WHERE e2.department = e.department);',
    ],
    explanation:
      'Una subconsulta correlacionada puede referirse a las columnas de la consulta externa. Conceptualmente, el resultado de la subconsulta depende de la fila que se está evaluando en la consulta externa. Es una herramienta potente, aunque en algunas situaciones una función de ventana puede expresar la misma lógica de forma más eficiente o más clara.',
  },
  'L4-order-count-subquery': {
    title: 'Un contador de pedidos con subconsulta',
    context:
      'Un responsable quiere una única lista de clientes con el número de pedidos al lado de cada uno.',
    taskText:
      'Para cada cliente, muestra el número de sus pedidos calculado con una subconsulta correlacionada. Los clientes sin pedidos tienen que mostrar 0.',
    hints: [
      'Una subconsulta en SELECT puede referirse a la fila actual de la consulta externa.',
      'COUNT(*) devuelve 0 cuando la subconsulta no encuentra ninguna fila, así que no hacen falta más trucos.',
      'Plantilla: SELECT c.name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS order_count FROM customers c;',
    ],
    explanation:
      'Una subconsulta correlacionada en SELECT da el mismo resultado que un LEFT JOIN con GROUP BY, pero sin hacer un JOIN explícito. El COUNT de una consulta que no encuentra filas devuelve 0, por lo que los clientes sin pedidos aparecen directamente con ese valor, mientras que tras un LEFT JOIN, COUNT(*) contaría la fila del propio cliente y daría 1.',
  },
  'L4-two-cte-steps': {
    title: 'Dos pasos en una misma consulta',
    context:
      'Alguien de analítica compara los ingresos por categoría con los ingresos medios de las categorías para encontrar las que están por encima de esa referencia.',
    taskText:
      'Con dos CTE, calcula los ingresos de cada categoría, después los ingresos medios entre las categorías y muestra las categorías con ingresos por encima de esa media.',
    hints: [
      'Varios CTE se enumeran separados por comas después de un único WITH.',
      'El segundo CTE puede referirse al primero: así se puede calcular la media de los ingresos ya agregados.',
      'Plantilla: WITH category_revenue AS (...), average_revenue AS (SELECT AVG(revenue) FROM category_revenue) SELECT ... FROM category_revenue, average_revenue WHERE revenue > avg_revenue;',
    ],
    explanation:
      'Varios CTE forman una cadena de pasos en la que cada uno puede apoyarse en los anteriores. La consulta se lee como una secuencia de acciones y evita repetir subconsultas anidadas o agregaciones.',
  },
  'L4-employees-not-managers': {
    title: 'Quién no dirige a nadie',
    context:
      'En personal planean formación para responsables y primero descartan a quienes todavía no tienen a nadie a su cargo.',
    taskText:
      'Muestra el nombre y el apellido de los empleados que no tienen a nadie a su cargo. Usa NOT EXISTS.',
    hints: [
      'Formula lo contrario: «hay alguien cuyo responsable es esta persona». Después niégalo.',
      'NOT EXISTS es verdadero justo cuando la subconsulta no devuelve ninguna fila.',
      'Plantilla: SELECT e.first_name, e.last_name FROM employees e WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.employee_id);',
    ],
    explanation:
      'Este ejercicio muestra una diferencia importante entre NOT EXISTS y NOT IN. La forma obvia WHERE employee_id NOT IN (SELECT manager_id FROM employees) devuelve aquí cero filas, en silencio y sin ningún error, porque entre los manager_id hay NULL: x NOT IN (8, 3, NULL) equivale a x <> 8 AND x <> 3 AND x <> NULL, y la última comparación da UNKNOWN, así que la condición nunca es verdadera. NOT EXISTS comprueba directamente si existe una fila que cumpla la condición y no tiene ese problema.',
  },
  'L4-managers-above-average': {
    title: 'Responsables que superan la media',
    context:
      'La dirección de ventas busca qué responsables tienen un volumen de ventas superior a la media entre los responsables.',
    taskText:
      'Calcula las ventas totales de cada responsable y muestra a aquellos cuyo total supera el total medio entre los responsables.',
    hints: [
      'Primero reduce los pedidos a totales por responsable: un CTE es una opción natural.',
      'Después compara cada total con la media, calculada desde ese mismo CTE con una subconsulta escalar.',
      'Plantilla: WITH manager_sales AS (SELECT e.first_name, SUM(o.amount) AS total_sales FROM orders o JOIN employees e ON e.employee_id = o.manager_id GROUP BY ...) SELECT * FROM manager_sales WHERE total_sales > (SELECT AVG(total_sales) FROM manager_sales);',
    ],
    explanation:
      'El ejercicio de cierre del nivel reúne JOIN, agregación, CTE y subconsulta escalar. La ventaja clave del CTE aquí es que se puede reutilizar en la consulta principal y dentro de la subconsulta, sin volver a escribir la agregación.',
  },
  'L4-three-step-report': {
    title: 'Un informe en tres pasos',
    context:
      'Alguien de analítica prepara un panorama de mercados: primero suma el gasto de los clientes, después lo agrega por país y, por último, compara los países entre sí.',
    taskText:
      'Con tres CTE, calcula el gasto de cada cliente, agrégalo para obtener los ingresos por país, calcula los ingresos medios entre los países y muestra los países que los superan.',
    hints: [
      'Los pasos son exactamente tres, y cada uno trabaja con el resultado del anterior.',
      'Varios CTE se enumeran separados por comas después de un único WITH, y cada CTE puede referirse a los anteriores.',
      'Plantilla: WITH customer_totals AS (...), country_totals AS (... FROM customer_totals ...), overall AS (SELECT AVG(country_total) FROM country_totals) SELECT ... FROM country_totals, overall WHERE country_total > avg_country;',
    ],
    explanation:
      'Una cadena de CTE despliega la consulta de arriba abajo como una secuencia de pasos y evita construir varios niveles de subconsultas anidadas. Fíjate en el agregado sobre un agregado del segundo paso: SUM(t.total) suma los totales de cliente ya obtenidos en el CTE anterior. En ese momento ya no se trabaja directamente con los pedidos individuales, sino con el resultado del paso anterior, así que SUM(o.amount) ya no sería posible ahí.',
  },
};
