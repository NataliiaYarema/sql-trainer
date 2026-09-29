// Іспанський текст завдань рівня 4 (підзапити й CTE).
//
// EXISTS, NOT EXISTS, NOT IN і WITH лишаються великими літерами: це конструкції.
// У L4-employees-not-managers на різниці між NOT IN і NOT EXISTS тримається все
// пояснення, тому перекладати їх там особливо не можна.
export default {
  'L4-big-order-customers': {
    title: 'Clientes con pedidos grandes',
    context:
      'El equipo de grandes cuentas busca a todos los que alguna vez han pedido por más de 300.',
    taskText:
      'Muestra el nombre y el país de los clientes que tienen al menos un pedido por encima de 300.',
    hints: [
      'Primero encuentra los identificadores de los clientes con pedidos grandes y después selecciónalos en el catálogo.',
      'El operador IN acepta no solo una lista de valores, sino también una subconsulta completa.',
      'Plantilla: SELECT name, country FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE amount > 300);',
    ],
    explanation:
      'La subconsulta dentro de IN se ejecuta primero y devuelve un conjunto de valores con el que se compara la consulta externa. A diferencia de un JOIN, el cliente no se duplica aunque tenga varios pedidos grandes, que es justo lo que necesita una lista de clientes únicos.',
  },

  'L4-bulk-products': {
    title: 'Productos que se pidieron en grandes cantidades',
    context:
      'Logística planifica el almacenamiento en palés para los artículos que se llevan de tres en tres o más.',
    taskText: 'Muestra los productos que al menos una vez se pidieron en cantidad de 3 o más.',
    hints: [
      'La subconsulta tiene que devolver la lista de product_id que cumplen la condición.',
      'La consulta externa filtra el catálogo de productos por esa lista con IN.',
      'Plantilla: SELECT product_name, category FROM products WHERE product_id IN (SELECT product_id FROM order_items WHERE quantity >= 3);',
    ],
    explanation:
      'Una subconsulta en WHERE resulta cómoda cuando de la segunda tabla solo hace falta una condición de selección y no sus columnas. Con un JOIN habría que añadir DISTINCT para quitar los duplicados que llegan de varias líneas que cumplen la condición.',
  },

  'L4-above-average-salary': {
    title: 'Quién gana por encima de la media',
    context:
      'En personal analizan la dispersión salarial y buscan a quienes cobran más que la media de la empresa.',
    taskText: 'Muestra los empleados con un salario superior a la media de la empresa.',
    hints: [
      'La media hay que calcularla con una consulta aparte y usarla como número en la condición.',
      'Una subconsulta escalar entre paréntesis devuelve un único valor apto para comparar.',
      'Plantilla: SELECT first_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    ],
    explanation:
      'Una subconsulta escalar devuelve exactamente un valor y puede ir en cualquier sitio donde se espere un número. Así se sortea la prohibición de escribir una función de agregación directamente en WHERE: la subconsulta se calcula aparte y después su resultado se compara con cada fila.',
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
      'Una subconsulta escalar en SELECT asigna el mismo valor a todas las filas, algo cómodo para comparar «un indicador frente a una referencia». Como la subconsulta no se refiere a columnas externas, la base de datos la calcula una sola vez y no para cada fila.',
  },

  'L4-customers-with-orders': {
    title: 'Clientes que han pedido algo',
    context:
      'Antes de un envío, marketing deja en la base solo a quienes tienen al menos un pedido.',
    taskText: 'Muestra los clientes que tienen al menos un pedido.',
    hints: [
      'La pregunta no es «cuántos pedidos», sino «si hay alguno»: basta con el hecho de que exista.',
      'EXISTS da verdadero en cuanto la subconsulta devuelve al menos una fila.',
      'Plantilla: SELECT name, country FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);',
    ],
    explanation:
      'EXISTS comprueba si hay filas, no qué contienen, y por eso dentro se escribe tradicionalmente SELECT 1. Se diferencia de un JOIN en que el cliente no se duplica, tenga los pedidos que tenga.',
  },

  'L4-departments-without-hires': {
    title: 'Departamentos sin incorporaciones',
    context:
      'En personal comprueban qué departamentos no contrataron a nadie en 2024: puede que allí se haya frenado el crecimiento.',
    taskText: 'Muestra los departamentos que no tienen ningún empleado contratado en 2024.',
    hints: [
      'Formula lo contrario: «el departamento tiene a alguien contratado en 2024». Después niégalo.',
      'NOT EXISTS es verdadero justo cuando la subconsulta no devolvió ninguna fila.',
      'Plantilla: SELECT DISTINCT department FROM employees e WHERE department IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees e2 WHERE e2.department = e.department AND EXTRACT(YEAR FROM e2.hire_date) = 2024);',
    ],
    explanation:
      'NOT EXISTS es la forma estándar de decir «no hay ninguna fila relacionada». A diferencia de NOT IN, se comporta bien con NULL: si la subconsulta devuelve aunque sea un NULL, NOT IN da un resultado vacío, mientras que NOT EXISTS funciona como se espera.',
  },

  'L4-first-cte': {
    title: 'El primer paso con WITH',
    context:
      'Alguien de analítica quiere partir una consulta larga en pasos legibles, empezando por seleccionar los productos caros.',
    taskText:
      'Con un CTE, selecciona los productos de más de 200 y después muestra sus nombres y precios.',
    hints: [
      'Un CTE es un resultado intermedio con nombre, declarado antes de la consulta principal.',
      'La sintaxis: WITH nombre AS (consulta) SELECT ... FROM nombre;',
      'Plantilla: WITH expensive AS (SELECT product_name, price FROM products WHERE price > 200) SELECT product_name, price FROM expensive;',
    ],
    explanation:
      'Un CTE (Common Table Expression) le da nombre a una subconsulta y la lleva al principio. Aquí todavía no simplifica nada: el sentido aparecerá cuando haya varios pasos. Lo importante ahora es acostumbrarse a la forma WITH nombre AS (...).',
  },

  'L4-cte-aggregate': {
    title: 'Un CTE con agregación',
    context:
      'Un responsable quiere ver los totales por cliente, calculados en un paso aparte y legible.',
    taskText:
      'Con un CTE, calcula el importe de los pedidos de cada cliente y después muestra solo a quienes gastaron más de 500.',
    hints: [
      'Primero la agregación dentro del CTE y después un filtro normal sobre su resultado.',
      'A una columna calculada en un CTE se puede acceder en la consulta externa con un WHERE normal.',
      'Plantilla: WITH totals AS (SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id) SELECT * FROM totals WHERE total_spent > 500;',
    ],
    explanation:
      'Aquí es donde el CTE sale rentable: el agregado se calculó en el paso anterior, así que se puede filtrar con un WHERE normal, sin HAVING. La consulta se lee de arriba abajo como una secuencia de acciones y no como paréntesis anidados.',
  },

  'L4-loyal-avg-check': {
    title: 'El ticket medio entre los clientes habituales',
    context:
      'Alguien de analítica calcula el ticket medio, pero solo de quienes tienen al menos cuatro pedidos: los compradores ocasionales distorsionan la imagen.',
    taskText: 'Muestra los nombres de los clientes con 4 pedidos o más y su ticket medio.',
    hints: [
      'Calcula los agregados en una consulta aparte y después engánchale el catálogo de clientes.',
      'Una subconsulta en FROM funciona como una tabla temporal, y conviene darle un alias.',
      'Plantilla: SELECT c.name, s.avg_order FROM (SELECT customer_id, AVG(amount) AS avg_order FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4) s JOIN customers c ON ...;',
    ],
    explanation:
      'Una subconsulta en FROM (una tabla derivada) permite agregar los datos primero y después trabajar con el resultado como con una tabla normal. De esa misma idea nacieron los CTE que acabas de ver en este nivel: hacen lo mismo pero se leen mucho mejor, y por eso en las consultas nuevas se suele usar WITH.',
  },

  'L4-department-top-salary': {
    title: 'El salario más alto de su departamento',
    context: 'La dirección destaca al empleado mejor pagado de cada departamento.',
    taskText: 'Muestra los empleados cuyo salario es el máximo dentro de su departamento.',
    hints: [
      'Hay que comparar no con el máximo global, sino con el máximo dentro del mismo departamento.',
      'Una subconsulta correlacionada puede referirse a una columna de la consulta externa: WHERE e2.department = e.department.',
      'Plantilla: SELECT ... FROM employees e WHERE e.salary = (SELECT MAX(e2.salary) FROM employees e2 WHERE e2.department = e.department);',
    ],
    explanation:
      'Una subconsulta correlacionada se ejecuta de nuevo para cada fila de la consulta externa y «ve» sus columnas. Es potente, pero cara: en tablas grandes esa construcción se convierte en un bucle oculto, y funcionan mejor las funciones de ventana del nivel siguiente.',
  },

  'L4-order-count-subquery': {
    title: 'Un contador de pedidos con subconsulta',
    context:
      'Un responsable quiere una única lista de clientes con el número de pedidos al lado de cada uno.',
    taskText:
      'Para cada cliente, muestra el número de sus pedidos calculado con una subconsulta correlacionada. Los clientes sin pedidos tienen que mostrar 0.',
    hints: [
      'Una subconsulta en SELECT puede referirse a la fila actual de la consulta externa.',
      'COUNT(*) devuelve 0 para un cliente sin pedidos, así que no hacen falta más trucos.',
      'Plantilla: SELECT c.name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id) AS order_count FROM customers c;',
    ],
    explanation:
      'Una subconsulta correlacionada en SELECT da el mismo resultado que un LEFT JOIN con GROUP BY, pero se lee más fácil. Un extra agradable: COUNT sobre una subconsulta vacía devuelve 0 de forma natural, mientras que con un LEFT JOIN habría que vigilar que no se cuente la propia fila del cliente.',
  },

  'L4-two-cte-steps': {
    title: 'Dos pasos en una misma consulta',
    context:
      'Alguien de analítica compara los ingresos por categoría con los ingresos medios de las categorías para encontrar las que destacan.',
    taskText:
      'Con dos CTE, calcula los ingresos de cada categoría, después los ingresos medios entre las categorías, y muestra las categorías con ingresos por encima de esa media.',
    hints: [
      'Varios CTE se enumeran separados por comas después de un único WITH.',
      'El segundo CTE puede referirse al primero: así es como se calcula la media de las sumas ya hechas.',
      'Plantilla: WITH category_revenue AS (...), average_revenue AS (SELECT AVG(revenue) FROM category_revenue) SELECT ... FROM category_revenue, average_revenue WHERE revenue > avg_revenue;',
    ],
    explanation:
      'Varios CTE forman una cadena de pasos en la que cada uno se apoya en el anterior, y la consulta se lee como una secuencia de acciones. Sin CTE, esa misma lógica habría que escribirla con subconsultas anidadas, duplicando la agregación dos veces.',
  },

  'L4-employees-not-managers': {
    title: 'Quién no dirige a nadie',
    context:
      'En personal planean formación para responsables y primero descartan a quienes todavía no tienen a nadie a su cargo.',
    taskText:
      'Muestra el nombre y el apellido de los empleados que no tienen a nadie a su cargo. Usa NOT EXISTS.',
    hints: [
      'Formula lo contrario: «hay alguien cuyo responsable es esta persona». Después niégalo.',
      'NOT EXISTS es verdadero justo cuando la subconsulta no devolvió ninguna fila.',
      'Plantilla: SELECT e.first_name, e.last_name FROM employees e WHERE NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.employee_id);',
    ],
    explanation:
      'Este ejercicio existe por una trampa concreta. La forma evidente WHERE employee_id NOT IN (SELECT manager_id FROM employees) devuelve cero filas, y lo hace en silencio, sin ningún error. La razón es que entre los manager_id hay NULL: la expresión x NOT IN (8, 3, NULL) se despliega en x <> 8 AND x <> 3 AND x <> NULL, y el último término da «desconocido», así que la expresión completa nunca es verdadera. NOT EXISTS comprueba la presencia de filas y no los valores, y el NULL no lo descoloca. Por eso con una subconsulta donde puede haber valores vacíos se usa NOT EXISTS.',
  },

  'L4-managers-above-average': {
    title: 'Responsables que superan la media',
    context:
      'La dirección de ventas busca qué responsables traen más que el resultado medio del departamento.',
    taskText:
      'Calcula las ventas totales de cada responsable y muestra a aquellos cuyo total supera el total medio entre los responsables.',
    hints: [
      'Primero reduce los pedidos a totales por responsable: un CTE natural.',
      'Después compara cada total con la media, calculada desde ese mismo CTE con una subconsulta escalar.',
      'Plantilla: WITH manager_sales AS (SELECT e.first_name, SUM(o.amount) AS total_sales FROM orders o JOIN employees e ON e.employee_id = o.manager_id GROUP BY ...) SELECT * FROM manager_sales WHERE total_sales > (SELECT AVG(total_sales) FROM manager_sales);',
    ],
    explanation:
      'El ejercicio de cierre del nivel junta JOIN, agregación, CTE y subconsulta escalar. La ventaja clave del CTE aquí es que se puede usar dos veces, en la consulta principal y dentro de la subconsulta, sin volver a escribir la agregación.',
  },

  'L4-three-step-report': {
    title: 'Un informe en tres pasos',
    context:
      'Alguien de analítica prepara un panorama de mercados: primero suma el gasto de los clientes, después los países, y solo entonces compara los países entre sí.',
    taskText:
      'Con tres CTE, calcula el gasto de cada cliente, agrégalo en ingresos por país, halla los ingresos medios de un país y muestra los países que los superan.',
    hints: [
      'Los pasos son exactamente tres, y cada uno trabaja con el resultado del anterior, no con las tablas originales.',
      'Varios CTE se enumeran separados por comas después de un único WITH, y el segundo puede referirse al primero.',
      'Plantilla: WITH customer_totals AS (...), country_totals AS (... FROM customer_totals ...), overall AS (SELECT AVG(country_total) FROM country_totals) SELECT ... FROM country_totals, overall WHERE country_total > avg_country;',
    ],
    explanation:
      'Una cadena de CTE despliega la consulta de arriba abajo como una secuencia de pasos y no como tres niveles de paréntesis anidados, y en eso está su valor cuando la lógica del informe tiene varias etapas. Fíjate en el agregado sobre un agregado del segundo paso: SUM(t.total) suma los totales de cliente ya calculados. Escribir allí SUM(o.amount) sería imposible, porque en ese paso los pedidos individuales ya no existen: el CTE anterior los ha comprimido en totales.',
  },
};
