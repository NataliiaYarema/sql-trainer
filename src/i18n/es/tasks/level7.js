// Іспанський текст завдань рівня 7 (умови й множини).
//
// CASE, WHEN, THEN, ELSE, END, UNION, UNION ALL, INTERSECT, EXCEPT, COALESCE,
// NULLIF лишаються великими літерами: це конструкції, а не слова.
export default {
  'L7-stock-alert': {
    title: 'Aviso de existencias',
    context:
      'Alguien del almacén revisa las existencias y quiere ver de inmediato qué artículos necesitan un pedido urgente.',
    taskText:
      "Etiqueta los productos según sus existencias: menos de 10 es 'critical' y menos de 30 es 'low'. El resto se queda sin etiqueta.",
    hints: [
      'Hay que etiquetar los productos según lo poco que quede en el almacén, y los productos con muchas existencias no deben llevar etiqueta.',
      'CASE comprueba las ramas WHEN una tras otra, de arriba abajo, y devuelve el valor de la primera que resulta verdadera.',
      "Plantilla: SELECT product_name, stock, CASE WHEN stock < 10 THEN 'critical' WHEN stock < 30 THEN 'low' END AS stock_alert FROM products ORDER BY stock;",
    ],
    explanation:
      'CASE comprueba las condiciones por orden y se detiene en la primera que coincide, ignorando las ramas restantes. Si ninguna condición se cumple y no se ha escrito ELSE, el resultado es NULL, no una cadena vacía ni un cero. Ese NULL es precisamente lo que se obtiene en los productos con muchas existencias.',
  },
  'L7-price-tier': {
    title: 'Franjas de precio de los productos',
    context:
      'Un responsable de compras prepara una lista de precios y quiere ver de inmediato a qué segmento de precio pertenece cada producto.',
    taskText:
      "Reparte los productos por precio: hasta 50 es 'budget', hasta 200 es 'standard' y el resto es 'premium'.",
    hints: [
      'Cada producto tiene que recibir una de tres etiquetas de texto según el precio, y ningún producto puede quedarse sin etiqueta.',
      'Un CASE con varias ramas WHEN comprueba los límites por turnos, y ELSE se queda con todo lo que no ha encajado en ninguna condición anterior.',
      "Plantilla: SELECT product_name, price, CASE WHEN price < 50 THEN 'budget' WHEN price < 200 THEN 'standard' ELSE 'premium' END AS price_tier FROM products ORDER BY price;",
    ],
    explanation:
      'ELSE significa «todo lo demás», y es precisamente lo que evita el NULL que aparecía en el ejercicio anterior al no tener esa rama. Aquí el orden de las condiciones es importante: si WHEN price < 200 fuera la primera, la rama WHEN price < 50 no se alcanzaría nunca, porque los productos baratos también cumplen la condición price < 200.',
  },
  'L7-department-or-none': {
    title: 'Un departamento o una etiqueta',
    context:
      'En personal preparan un directorio general de empleados y quieren que la falta de departamento se vea de forma explícita y no como un campo vacío.',
    taskText:
      "Muestra los empleados de forma que, si el departamento es NULL, aparezca 'Not assigned'.",
    hints: [
      'Donde un empleado no tiene departamento indicado hay que poner un texto de relleno en lugar del NULL.',
      'COALESCE comprueba sus argumentos de izquierda a derecha y devuelve el primero que no sea NULL.',
      "Plantilla: SELECT first_name, last_name, COALESCE(department, 'Not assigned') AS department FROM employees ORDER BY employee_id;",
    ],
    explanation:
      'COALESCE devuelve el primer argumento de la lista que no es NULL. Sustituir esta lógica por una condición WHERE department = NULL no funciona: una comparación con NULL no da TRUE, por lo que esa fila no pasa el filtro. Para comprobar si algo es NULL existe el operador IS NULL.',
  },
  'L7-large-orders-per-manager': {
    title: 'Los pedidos grandes de los responsables',
    context:
      'La dirección de ventas compara la carga de los responsables y quiere saber cuántos pedidos de cada uno son grandes y cuántos hay en total.',
    taskText:
      'Para cada responsable, muestra el número total de pedidos y cuántos de ellos son de 200 o más.',
    hints: [
      'Cada responsable necesita dos números a la vez: cuántos pedidos tiene en total y cuántos de ellos son grandes.',
      'COUNT no cuenta los NULL, así que un CASE sin ELSE dentro de COUNT funciona como un recuento condicional: solo se cuentan las filas en las que se cumple la condición.',
      'Plantilla: SELECT manager_id, COUNT(*) AS orders_count, COUNT(CASE WHEN amount >= 200 THEN 1 END) AS large_orders FROM orders GROUP BY manager_id ORDER BY manager_id;',
    ],
    explanation:
      'COUNT no cuenta los NULL, así que un CASE sin ELSE dentro de él funciona como un filtro: las filas que no cumplen la condición se convierten en NULL y no entran en el recuento. Añadir aquí ELSE 0 sería un error: COUNT contaría también los ceros y large_orders sería igual a orders_count para todos los responsables.',
  },
  'L7-loyal-customers': {
    title: 'Clientes de los dos trimestres',
    context:
      'En marketing planean un programa de fidelización y quieren encontrar a los clientes que siguen activos un segundo trimestre seguido.',
    taskText:
      'Encuentra los clientes que hicieron pedidos tanto en el primer trimestre de 2024 como en el segundo.',
    hints: [
      'Solo hacen falta los clientes que hicieron al menos un pedido en cada uno de los dos periodos: en el primero y en el segundo.',
      'INTERSECT deja únicamente las filas que están presentes a la vez en los resultados de las dos consultas.',
      "Plantilla: SELECT customer_id FROM orders WHERE order_date < DATE '2024-04-01' INTERSECT SELECT customer_id FROM orders WHERE order_date >= DATE '2024-04-01';",
    ],
    explanation:
      'INTERSECT deja solo las filas presentes en los dos resultados y elimina los duplicados por sí mismo, así que aquí DISTINCT sobra. No se puede sustituir por una sola condición WHERE: order_date < ... AND order_date >= ... nunca será verdadera para una misma fila, porque se está comprobando una única fecha y no la actividad de un cliente en dos periodos distintos.',
  },
  'L7-never-ordered': {
    title: 'Productos sin una sola venta',
    context:
      'Un responsable de categoría revisa el catálogo y quiere encontrar los productos que no se vendieron nunca para decidir qué hacer con ellos.',
    taskText: 'Encuentra los productos que no entraron en ningún pedido.',
    hints: [
      'Hacen falta los productos del catálogo que no están entre los productos que alguna vez formaron parte de un pedido.',
      'EXCEPT resta del primer resultado todas las filas que aparecen en el segundo y deja exactamente la diferencia.',
      'Plantilla: SELECT product_id FROM products EXCEPT SELECT product_id FROM order_items;',
    ],
    explanation:
      'EXCEPT resta el segundo resultado del primero, y aquí los operandos no se pueden cambiar de sitio: order_items EXCEPT products respondería a una pregunta completamente distinta —qué identificadores aparecen en los pedidos pero no en el catálogo— y no a qué productos del catálogo no se han vendido. Con estos datos, además, daría un resultado vacío.',
  },
  'L7-contact-directory': {
    title: 'Un directorio único de contactos',
    context:
      'Para un envío hace falta una sola lista de nombres, de empleados y de clientes, con una marca de quién es quién.',
    taskText:
      "Combina en una lista los nombres de los empleados y de los clientes. En la columna source, los empleados tienen que llevar 'employee' y los clientes 'customer'.",
    hints: [
      'Aquí no hay que unir tablas por columnas: hay que poner las filas una debajo de otra.',
      "UNION ALL suma los resultados de dos SELECT. La marca se puede fijar con una constante: 'employee' AS source.",
      "Plantilla: SELECT first_name AS person_name, 'employee' AS source FROM employees UNION ALL SELECT name, 'customer' FROM customers;",
    ],
    explanation:
      'JOIN añade columnas y UNION añade filas. Las dos consultas tienen que tener el mismo número de columnas y tipos compatibles. UNION elimina los duplicados, mientras que UNION ALL conserva todas las filas. Si no necesitas eliminar duplicados, UNION ALL evita ese trabajo adicional.',
  },
  'L7-price-extremes': {
    title: 'Los extremos de la lista de precios',
    context:
      'Para revisar el rango de precios hace falta una lista corta: los productos más baratos y los más caros en una misma tabla.',
    taskText:
      "Combina dos listas: los dos productos más baratos con la marca 'cheapest' y los dos más caros con la marca 'priciest'.",
    hints: [
      'Hacen falta dos conjuntos de filas distintos, puestos uno debajo de otro.',
      'ORDER BY y LIMIT deben aplicarse a cada mitad por separado, así que conviene envolver cada una en una subconsulta.',
      "Plantilla: SELECT ..., 'cheapest' AS label FROM (SELECT ... ORDER BY price ASC LIMIT 2) AS cheap UNION ALL SELECT ..., 'priciest' FROM (SELECT ... ORDER BY price DESC LIMIT 2) AS pricey;",
    ],
    explanation:
      'Un detalle importante: ORDER BY y LIMIT aplicados al UNION afectan al resultado combinado, no a cada parte por separado. Para limitar exactamente una mitad hay que aislarla en una subconsulta.',
  },
  'L7-department-priority': {
    title: 'Departamentos por orden de prioridad',
    context:
      'La dirección de personal prepara una lista de empleados para el consejo y quiere que empiece por los departamentos clave de la empresa, no por el alfabeto ni por el identificador.',
    taskText:
      'Muestra los empleados que tienen departamento, ordenándolos primero por la prioridad del departamento —IT, después Sales, después Marketing y después el resto— y dentro de cada uno por salario descendente.',
    hints: [
      'Los departamentos hay que colocarlos ni por orden alfabético ni por código, sino en un orden propio ya fijado: primero IT, después Sales, después Marketing y el resto detrás; dentro de cada grupo, del salario mayor al menor.',
      'ORDER BY puede ordenar por cualquier expresión y no solo por el nombre de una columna: aquí encaja un CASE que convierte el nombre del departamento en un número de prioridad, y cuanto menor es el número, más arriba aparece la fila.',
      "Plantilla: SELECT first_name, department, salary FROM employees WHERE department IS NOT NULL ORDER BY CASE department WHEN 'IT' THEN 1 ... END, salary DESC;",
    ],
    explanation:
      'ORDER BY acepta cualquier expresión y no solo una columna, y es la forma adecuada de fijar un orden que no existe ni en el alfabeto ni en los números. Aquí se usa la forma corta CASE department WHEN valor, que compara por igualdad; para comprobar rangos no sirve, y en ese caso hace falta la forma larga CASE WHEN condición.',
  },
  'L7-salary-grade': {
    title: 'El nivel del empleado',
    context:
      'Alguien de personal prepara un informe de niveles y quiere que el umbral de «salario alto» de IT se diferencie del de los demás departamentos.',
    taskText:
      "Asigna un nivel: para IT es 'IT senior' desde 7000 e 'IT regular' por debajo, y para el resto 'senior' desde 5500 y 'regular' por debajo.",
    hints: [
      'Hay que asignar un nivel al empleado, y el límite entre un salario alto y uno no tan alto es distinto para IT y para los demás departamentos.',
      'En la rama THEN de un CASE se puede anidar otro CASE: así se define una regla que depende de la categoría, comprobando primero el departamento y, dentro de él, el salario.',
      "Plantilla: SELECT ..., CASE WHEN department = 'IT' THEN CASE WHEN salary >= 7000 THEN 'IT senior' ELSE 'IT regular' END ELSE CASE WHEN salary >= 5500 THEN 'senior' ELSE 'regular' END END AS grade FROM employees;",
    ],
    explanation:
      'En una rama THEN se puede poner otro CASE, y así se hace cuando el umbral depende de la categoría. Cada END cierra su propio CASE, y olvidar un END es uno de los errores más habituales al anidar: la base de datos puede señalar un error de sintaxis en una línea distinta de aquella donde falta realmente.',
  },
  'L7-quarter-pivot': {
    title: 'Trimestres uno al lado del otro',
    context:
      'Alguien de análisis financiero compara los ingresos por trimestre y quiere ver los importes del primer y del segundo trimestre juntos en la fila de cada cliente, y no en dos informes separados.',
    taskText:
      'Para cada cliente, muestra el importe de los pedidos del primer trimestre de 2024 y el del segundo, en dos columnas contiguas.',
    hints: [
      'Cada cliente necesita dos importes a la vez —el del primer trimestre y el del segundo— repartidos en dos columnas contiguas y no en filas separadas.',
      'SUM(CASE ...) dentro de la agregación suma solo las filas que cumplen la condición del CASE: así una columna de sumas se convierte en varias.',
      "Plantilla: SELECT customer_id, SUM(CASE WHEN order_date < DATE '2024-04-01' THEN amount ELSE 0 END) AS q1, SUM(CASE ...) AS q2 FROM orders GROUP BY customer_id;",
    ],
    explanation:
      'SUM(CASE ...) convierte filas en columnas: así se construyen tablas cruzadas cuando no se utiliza un operador pivot específico. El ELSE 0 es intencionado: sin él, un cliente que no hizo pedidos en el primer trimestre tendría NULL en q1 en lugar de cero.',
  },
  'L7-small-per-large': {
    title: 'Cuántos pequeños por cada grande',
    context:
      'La dirección de ventas valora la estructura de pedidos de los responsables y quiere ver la proporción de pedidos pequeños frente a los grandes en un solo número.',
    taskText:
      'Para cada responsable, calcula cuántos pedidos de menos de 200 hay por cada pedido de 200 o más, redondeado a dos decimales.',
    hints: [
      'Cada responsable necesita un número —cuántos pedidos pequeños hay por cada grande— y tiene que calcularse correctamente incluso si el responsable no tiene ningún pedido grande.',
      'NULLIF(x, 0) convierte el cero en NULL, así que dividir por él no produce un error, sino NULL. La conversión ::NUMERIC evita que la división entre enteros descarte la parte decimal.',
      'Plantilla: SELECT manager_id, ROUND(COUNT(...)::NUMERIC / NULLIF(COUNT(...), 0), 2) AS small_per_large FROM orders GROUP BY manager_id;',
    ],
    explanation:
      'NULLIF(x, 0) convierte el cero en NULL, y dividir por NULL da NULL en lugar de producir un error: eso permite manejar al responsable que no tiene ningún pedido grande. Medido: sin NULLIF esta consulta falla con el error division by zero. La conversión ::NUMERIC también es necesaria aquí: en PostgreSQL, la división entre enteros da como resultado una división entera, mientras que al convertir uno de los operandos a NUMERIC se conserva la parte decimal.',
  },
  'L7-recent-events': {
    title: 'Un muro de eventos recientes',
    context:
      'La dirección de operaciones quiere repasar de un vistazo los eventos importantes recientes de la empresa: tanto los pedidos nuevos como las incorporaciones.',
    taskText:
      "Reúne en un solo muro los pedidos a partir del 1 de junio de 2024 con la marca 'order' y las contrataciones a partir del 1 de enero de 2024 con la marca 'hire'. La escala del evento es: para un pedido, 'large' desde 200 y, si no, 'small'; para una contratación, 'senior' desde un salario de 6000 y, si no, 'junior'.",
    hints: [
      'Hace falta un único muro de eventos a partir de dos tablas distintas —los pedidos recientes y las contrataciones recientes— y cada fila lleva una marca del tipo de evento y de su escala.',
      'UNION ALL pone los resultados de dos SELECT uno debajo de otro; la escala de cada evento la decide su propio CASE, con un juego de etiquetas para los pedidos y otro para las contrataciones.',
      "Plantilla: SELECT order_date, 'order', CASE WHEN amount >= 200 THEN 'large' ELSE 'small' END FROM orders WHERE ... UNION ALL SELECT hire_date, 'hire', CASE ... END FROM employees WHERE ...;",
    ],
    explanation:
      'Los nombres de las columnas del resultado completo los toma el primer SELECT. En el segundo se pueden omitir los alias porque no cambiarían los nombres finales. A la segunda mitad solo se le exige el mismo número de columnas y tipos compatibles; confundir el orden de las columnas puede ser un error lógico que la base de datos no detecte si los tipos siguen siendo compatibles.',
  },
  'L7-customer-segments': {
    title: 'Segmentos de clientes',
    context:
      'La dirección de ventas quiere repartir a los clientes en segmentos según su actividad y sus ingresos para centrar la atención en los más importantes.',
    taskText:
      "Reparte los clientes en segmentos: sin pedidos es 'inactive', con ingresos desde 1000 es 'key', desde cuatro pedidos es 'regular' y el resto es 'occasional'. Los clientes sin pedidos tienen que mostrar ingresos cero.",
    hints: [
      'Hay que repartir a los clientes en cuatro grupos a la vez: sin ningún pedido, con ingresos altos, con pedidos frecuentes y todos los demás; y en los clientes sin pedidos los ingresos tienen que verse como un cero y no como un hueco.',
      'LEFT JOIN conserva en el resultado a los clientes sin pedidos, COUNT y SUM calculan después por cada cliente, y un CASE aplica la regla del segmento; COALESCE pone un cero donde SUM devolvería NULL.',
      "Plantilla: SELECT c.name, COUNT(o.order_id), COALESCE(SUM(o.amount), 0), CASE WHEN COUNT(o.order_id) = 0 THEN 'inactive' ... END FROM customers AS c LEFT JOIN orders AS o ON ... GROUP BY c.customer_id, c.name;",
    ],
    explanation:
      "Las ramas del CASE se comprueban por prioridad, así que la comprobación de cero pedidos va primero: de lo contrario, un cliente sin ningún pedido caería en ELSE y quedaría como 'occasional'. COUNT(o.order_id) también es una elección deliberada: COUNT(*) después de un LEFT JOIN devolvería 1 para ese cliente, porque la fila del resultado existe aunque las columnas del lado de orders sean NULL.",
  },
  'L7-assortment-shift': {
    title: 'El cambio de surtido entre trimestres',
    context:
      'Un responsable de categoría analiza cómo cambió el surtido de ventas entre el primer y el segundo trimestre para ver qué desapareció y qué apareció.',
    taskText:
      "Muestra qué cambió en las ventas entre los trimestres de 2024: los productos que se vendieron solo en el primero, con la marca 'only Q1', y los que aparecieron solo en el segundo, con la marca 'only Q2'.",
    hints: [
      'Hay que encontrar dos grupos de productos: los que se vendieron solo en el primer trimestre y no en el segundo, y los que se vendieron solo en el segundo y no en el primero; después, hay que reunir los dos grupos en una lista con una marca que indique a cuál pertenecen.',
      'EXCEPT encuentra las filas de una consulta que no están en otra, y así se buscan los productos «solo aquí»; dos consultas de ese tipo, una para cada dirección, se unen en una lista con UNION ALL.',
      "Plantilla: WITH q1_products AS (...), q2_products AS (...) SELECT p.product_name, 'only Q1' FROM products AS p JOIN (SELECT product_id FROM q1_products EXCEPT SELECT product_id FROM q2_products) AS gone ON ...;",
    ],
    explanation:
      'EXCEPT es asimétrico, así que la pregunta «qué cambió» requiere siempre dos consultas: A EXCEPT B y B EXCEPT A responden a preguntas distintas. Después se unen en una sola respuesta con UNION ALL. No hace falta UNION para eliminar duplicados entre las dos mitades, porque un producto no puede pertenecer a la vez a «only Q1» y «only Q2».',
  },
};
