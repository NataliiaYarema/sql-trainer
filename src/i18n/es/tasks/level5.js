// Іспанський текст завдань рівня 5 (віконні функції).
//
// Назви функцій і частин вікна лишаються як у SQL: ROW_NUMBER, RANK,
// DENSE_RANK, NTILE, LAG, LEAD, FIRST_VALUE, OVER, PARTITION BY, ROWS BETWEEN.
export default {
  'L5-number-by-salary': {
    title: 'Numerar por salario',
    context: 'En personal montan una única lista de empleados ordenada por nivel salarial.',
    taskText: 'Asigna a cada empleado un número de orden según el salario descendente.',
    hints: [
      'Hay que numerar las filas sin perder ninguna.',
      'ROW_NUMBER() OVER (ORDER BY salary DESC) asigna los números en el orden indicado.',
      'Plantilla: SELECT first_name, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS position FROM employees;',
    ],
    explanation:
      'La diferencia principal entre las funciones de ventana y GROUP BY es que las funciones de ventana no comprimen las filas. La construcción OVER (...) describe una «ventana», es decir, el conjunto de filas dentro del cual actúa la función. Aquí la ventana abarca toda la tabla y ORDER BY marca el orden de numeración.',
  },
  'L5-tied-ranks': {
    title: 'Puestos con resultados iguales',
    context:
      'Para un cuadro de honor hace falta una clasificación en la que los empleados con el mismo salario compartan puesto.',
    taskText:
      'Asigna a cada empleado un puesto por salario, de forma que los salarios iguales reciban el mismo puesto.',
    hints: [
      'ROW_NUMBER daría números distintos incluso con valores iguales: hace falta otra función.',
      'RANK() asigna el mismo puesto a los valores iguales.',
      'Plantilla: SELECT first_name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;',
    ],
    explanation:
      'RANK da el mismo puesto a los valores iguales y después «se salta» números: tras dos segundos puestos viene el cuarto. Si los huecos no interesan, se usa DENSE_RANK. Tres funciones —ROW_NUMBER, RANK y DENSE_RANK— resuelven tres problemas distintos, y conviene no confundirlas.',
  },
  'L5-department-payroll': {
    title: 'La masa salarial del propio departamento',
    context: 'En finanzas quieren ver junto a cada empleado el presupuesto total de su área.',
    taskText: 'Para cada empleado, muestra su salario y la masa salarial total de su departamento.',
    hints: [
      'La suma se calcula por departamento, pero cada empleado tiene que seguir siendo una fila aparte.',
      'PARTITION BY divide la ventana en grupos: SUM(salary) OVER (PARTITION BY department).',
      'Plantilla: SELECT first_name, department, salary, SUM(salary) OVER (PARTITION BY department) AS department_total FROM employees;',
    ],
    explanation:
      'PARTITION BY es el equivalente de GROUP BY dentro de una ventana, pero sin comprimir filas. Con GROUP BY no se consigue esto: dejaría una fila por departamento y se perderían los datos de cada persona. Justo por eso «un valor junto al total de su grupo» es tarea de las funciones de ventana.',
  },
  'L5-vs-department-average': {
    title: 'Comparación con la media del área',
    context:
      'Antes de la revisión salarial, en personal quieren ver la media del departamento junto a cada sueldo.',
    taskText: 'Para cada empleado, muestra su salario y el salario medio de su departamento.',
    hints: [
      'Es la misma construcción que con la suma, solo con otra función de agregación.',
      'AVG(salary) OVER (PARTITION BY department) da la media de la ventana para cada fila.',
      'Plantilla: SELECT first_name, department, salary, AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary FROM employees;',
    ],
    explanation:
      'Cualquier función de agregación —SUM, AVG, COUNT, MIN, MAX— se convierte en función de ventana en cuanto le añades OVER. Comparar el valor de una fila con el agregado de su grupo en una misma consulta es justo aquello para lo que sirven las funciones de ventana.',
  },
  'L5-previous-order': {
    title: 'El pedido anterior del cliente',
    context:
      'Alguien de analítica estudia el comportamiento de los compradores y quiere ver junto a cada pedido la fecha del anterior.',
    taskText:
      'Para cada pedido, muestra la fecha del pedido anterior del mismo cliente. Para el primer pedido de un cliente, el valor tiene que ser NULL.',
    hints: [
      'Hay que mirar hacia atrás y por separado dentro de cada cliente.',
      'LAG(x) OVER (PARTITION BY customer_id ORDER BY order_date) toma el valor de la fila anterior de la ventana.',
      'Plantilla: SELECT customer_id, order_date, LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_date FROM orders;',
    ],
    explanation:
      'LAG da acceso a la fila anterior de la ventana. Aquí PARTITION BY es crítico: sin él, la función podría tomar la fecha del pedido de un cliente completamente distinto. La primera fila de cada ventana no tiene una fila anterior, así que LAG devuelve NULL.',
  },
  'L5-next-order': {
    title: 'El pedido siguiente del cliente',
    context: 'Para medir el tiempo hasta la recompra hace falta la fecha del pedido siguiente.',
    taskText:
      'Para cada pedido, muestra la fecha del pedido siguiente del mismo cliente. Para el último pedido, el valor tiene que ser NULL.',
    hints: [
      'Es la imagen en espejo del ejercicio anterior.',
      'LEAD(x) funciona igual que LAG, pero mira la fila siguiente.',
      'Plantilla: SELECT customer_id, order_date, LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_order_date FROM orders;',
    ],
    explanation:
      'LAG y LEAD son la pareja para trabajar con filas vecinas. A partir de ellas se pueden construir los intervalos entre eventos: el tiempo hasta la siguiente compra, el tiempo desde el último acceso, la duración entre etapas de un embudo.',
  },
  'L5-dense-vs-rank': {
    title: 'Dos maneras de repartir puestos',
    context:
      'Un responsable de categoría hace una clasificación de precios y no sabe cómo numerar los artículos que cuestan lo mismo.',
    taskText:
      'Para cada producto, muestra su puesto por precio calculado de dos maneras: RANK y DENSE_RANK.',
    hints: [
      'Hacen falta dos columnas de puestos, calculadas con la misma regla de ordenación.',
      'RANK y DENSE_RANK son funciones de ventana distintas; las dos aceptan el mismo OVER (ORDER BY ...).',
      'Plantilla: SELECT product_name, price, RANK() OVER (ORDER BY price DESC) AS price_rank, DENSE_RANK() OVER (ORDER BY price DESC) AS dense_price_rank FROM products;',
    ],
    explanation:
      'La diferencia se ve en los empates, y en los datos los hay: dos productos cuestan 210 y otros dos, 89. Tras un par de valores iguales, RANK se salta un número (1, 2, 2, 4) y DENSE_RANK no (1, 2, 2, 3). Elige una u otra según lo que quieras representar: RANK conserva los huecos que producen los empates, mientras que DENSE_RANK asigna puestos consecutivos.',
  },
  'L5-best-order-alongside': {
    title: 'La compra más grande junto a cada una',
    context:
      'Un responsable mira el historial de un cliente y quiere ver de inmediato qué distancia hay entre cada pedido y su récord.',
    taskText:
      'Para cada pedido, muestra su importe y el importe del pedido más grande de ese mismo cliente.',
    hints: [
      'El récord se calcula dentro de un cliente, pero todos los pedidos tienen que quedarse en el resultado.',
      'FIRST_VALUE toma el valor de la primera fila de la ventana, y qué fila es la primera lo decide el ORDER BY de dentro del OVER.',
      'Plantilla: SELECT customer_id, order_id, amount, FIRST_VALUE(amount) OVER (PARTITION BY customer_id ORDER BY amount DESC) AS best_amount FROM orders;',
    ],
    explanation:
      'Todo el sentido de FIRST_VALUE está en la ordenación de dentro del OVER: ella decide qué fila cuenta como primera, así que ORDER BY amount DESC convierte «la primera» en «la mayor». MAX(amount) con GROUP BY daría el mismo número, pero eliminaría los pedidos individuales: quedaría una fila por cliente. La función de ventana hace lo contrario: calcula por grupo y mantiene las filas en su sitio.',
  },
  'L5-running-revenue': {
    title: 'Ingresos acumulados',
    context:
      'Alguien de analítica construye un gráfico de ingresos acumulados para mostrar el avance hacia el objetivo anual.',
    taskText:
      'Muestra cada pedido junto con la suma acumulada de todos los pedidos desde el más antiguo hasta el actual.',
    hints: [
      'La suma tiene que acumularse fila a fila en un orden determinado, no calcularse una sola vez para toda la tabla.',
      'Una función de agregación con OVER (ORDER BY ...) se convierte en acumulativa.',
      'Plantilla: SELECT order_date, amount, SUM(amount) OVER (ORDER BY order_date, order_id) AS running_total FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'SUM() OVER (ORDER BY ...) sin PARTITION BY calcula un total acumulado: para cada fila suma todas las anteriores más la actual. La columna extra del ORDER BY resuelve los empates entre fechas iguales; sin ella, el orden, y por tanto la suma acumulada, no queda completamente determinado.',
  },
  'L5-largest-order-per-customer': {
    title: 'El pedido más grande de cada cliente',
    context: 'En atención al cliente preparan fichas de comprador con su compra más grande.',
    taskText: 'Para cada cliente que tenga pedidos, muestra su pedido más caro.',
    hints: [
      'Esto es «el primero dentro de un grupo»: numera los pedidos de cada cliente por importe y deja el primero.',
      'Una función de ventana no se puede usar en el WHERE de la misma consulta: sácala a un CTE.',
      'Plantilla: WITH ranked AS (SELECT ..., ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn FROM orders) SELECT ... FROM ranked r JOIN customers c ON ... WHERE r.rn = 1;',
    ],
    explanation:
      'Las funciones de ventana se calculan después de WHERE, así que no se pueden filtrar directamente en el WHERE del mismo nivel de consulta. El CTE permite hacer el cálculo en un paso aparte, y esta técnica sirve para toda una clase de problemas del tipo «el último, el mayor, el primero dentro de un grupo».',
  },
  'L5-monthly-manager-rank': {
    title: 'Clasificación mensual de responsables',
    context: 'La dirección de ventas determina cada mes qué responsable trajo más dinero.',
    taskText:
      'Para cada mes, clasifica a los responsables por importe de ventas (1 es el primer puesto de su mes).',
    hints: [
      'Primero agrega los pedidos en totales de «responsable × mes» y solo después clasifica.',
      'La ventana se divide por mes: PARTITION BY month ORDER BY monthly_sales DESC.',
      "Plantilla: WITH monthly AS (SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS month, e.first_name, SUM(o.amount) AS monthly_sales FROM orders o JOIN employees e ON ... GROUP BY 1, 2) SELECT ..., ROW_NUMBER() OVER (PARTITION BY month ORDER BY monthly_sales DESC) AS sales_rank FROM monthly;",
    ],
    explanation:
      'La construcción en dos etapas «primero agregar, después clasificar» aparece constantemente. El orden es esencial: la función de ventana tiene que actuar sobre los totales y no sobre los pedidos sueltos, porque, si no, el puesto se calcularía para cada ticket por separado.',
  },
  'L5-salary-quartiles': {
    title: 'Salarios por cuartos',
    context:
      'En personal preparan un panorama de retribuciones y quieren repartir a todos los empleados en cuatro grupos de tamaño aproximadamente igual según su salario.',
    taskText:
      'Divide a los empleados en cuatro grupos de tamaño aproximadamente igual según su salario, del más alto al más bajo, y muestra el número de grupo de cada uno.',
    hints: [
      'Los grupos no los marca el valor del salario, sino el lugar de la persona en la lista ordenada.',
      'NTILE(n) divide las filas de la ventana en n partes de tamaño aproximadamente igual.',
      'Plantilla: SELECT first_name, salary, NTILE(4) OVER (ORDER BY salary DESC) AS quartile FROM employees;',
    ],
    explanation:
      'NTILE divide las filas y no el rango de valores: en cada grupo habrá aproximadamente el mismo número de personas, aunque los salarios dentro de ellos sean muy distintos. Doce empleados se reparten en cuatro grupos de tres; si fueran trece, el primer grupo tendría cuatro y los demás tres, porque los tamaños de los grupos se diferencian como máximo en uno y el excedente va siempre al principio.',
  },
  'L5-moving-average': {
    title: 'Dinámica suavizada de los tickets',
    context:
      'Alguien de analítica construye un gráfico y quiere quitarle los saltos de los pedidos sueltos para dejar ver la tendencia.',
    taskText:
      'Para cada pedido en orden cronológico, muestra su importe y el importe medio del pedido actual y los dos anteriores, redondeado a dos decimales.',
    hints: [
      'La media no tiene que calcularse desde el principio del historial, sino solo sobre tres filas vecinas.',
      'Cuántas filas toma la ventana lo indica el marco ROWS BETWEEN ... AND ...',
      'Plantilla: SELECT order_date, amount, ROUND(AVG(amount) OVER (ORDER BY order_date, order_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg FROM orders ORDER BY order_date, order_id;',
    ],
    explanation:
      'El marco de la ventana es la respuesta a la pregunta «sobre qué filas exactamente calcular». Sin ROWS BETWEEN, un agregado con ORDER BY toma todas las filas desde el principio hasta la actual, es decir, da una media acumulada y no una media móvil. En las dos primeras filas el marco es más corto porque simplemente no hay filas anteriores: eso no es un error, sino el comportamiento normal en el borde de la serie. La columna extra del ORDER BY resuelve los empates entre fechas iguales y hace que el resultado sea reproducible.',
  },
  'L5-daily-customer-spend': {
    title: 'El gasto del cliente acumulado día a día',
    context:
      'La analítica de producto construye un informe de cohortes para analizar cómo crece el gasto de cada cliente de compra en compra.',
    taskText:
      'Para cada pedido, muestra el nombre del cliente, la fecha, el importe, su gasto acumulado hasta ese momento, incluido el pedido actual, y el importe de su pedido anterior.',
    hints: [
      'Las dos funciones de ventana actúan sobre una misma ventana: por separado para cada cliente y en orden de fechas.',
      'La acumulación es SUM(...) OVER (PARTITION BY ... ORDER BY ...), y el valor anterior es LAG sobre esa misma ventana.',
      'Plantilla: WITH customer_orders AS (SELECT c.name, o.customer_id, o.order_id, o.order_date, o.amount FROM orders o JOIN customers c ON ...) SELECT name, order_date, amount, SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS running_spend, LAG(amount) OVER (...) AS prev_amount FROM customer_orders;',
    ],
    explanation:
      'Aquí se combinan varias funciones de ventana sobre una misma ventana y un CTE para preparar los datos. Así se pueden calcular métricas como los ingresos acumulados o el gasto acumulado a lo largo del tiempo. Fíjate en que las dos funciones describen la misma ventana: cuando hay muchas expresiones así, se puede sacar a un bloque WINDOW aparte para evitar repetirla.',
  },
  'L5-top-two-per-manager': {
    title: 'Las dos operaciones más grandes de cada responsable',
    context:
      'La dirección del departamento prepara los reconocimientos trimestrales y quiere ver las dos mejores operaciones de cada comercial.',
    taskText:
      'Para cada responsable, muestra sus dos pedidos más grandes. Si solo hay un pedido, muestra ese.',
    hints: [
      'Esto es «los primeros N dentro de un grupo»: primero numera los pedidos de cada responsable por importe y después deja los dos primeros.',
      'Una función de ventana no se puede usar en el WHERE de la misma consulta: sácala a un CTE.',
      'Plantilla: WITH ranked AS (SELECT manager_id, order_id, amount, ROW_NUMBER() OVER (PARTITION BY manager_id ORDER BY amount DESC) AS rn FROM orders) SELECT manager_id, order_id, amount FROM ranked WHERE rn <= 2;',
    ],
    explanation:
      'Una técnica universal para toda una clase de problemas del tipo «los primeros N dentro de un grupo» consiste en numerar con una función de ventana y después filtrar por ese número sobre el resultado ya calculado. En WHERE no se puede hacer directamente, porque las funciones de ventana se calculan después de WHERE, y de ahí el uso del CTE. Fíjate en que hay siete filas y no ocho: un responsable tiene un solo pedido, y ROW_NUMBER no inventa un segundo; un «top 2» de un grupo de un elemento devuelve una sola fila. Si los importes iguales deben compartir posición y hay que incluir todos los pedidos empatados, RANK o DENSE_RANK encajan mejor que ROW_NUMBER.',
  },
};
