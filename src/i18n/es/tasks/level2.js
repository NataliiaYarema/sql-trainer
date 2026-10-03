// Іспанський текст завдань рівня 2 (групування й агрегація).
//
// «Порахуй» іспанською теж двома словами: Cuenta для кількості рядків і Calcula
// для суми, середнього чи вартості.
export default {
  'L2-count-by-category': {
    title: 'Cuántos productos hay en cada categoría',
    context: 'Un responsable de categoría quiere comprobar si el catálogo está bien repartido.',
    taskText: 'Cuenta el número de productos de cada categoría.',
    hints: [
      'No hay que contar toda la tabla de una vez, sino por separado para cada categoría.',
      'GROUP BY category crea un grupo por cada valor, y COUNT(*) cuenta las filas de cada grupo.',
      'Plantilla: SELECT category, COUNT(*) AS product_count FROM products GROUP BY category;',
    ],
    explanation:
      'GROUP BY divide la tabla en grupos según el valor de una columna, y una función de agregación calcula un valor para cada grupo. La regla es que todo lo que aparezca en SELECT fuera de una función de agregación tiene que aparecer en GROUP BY.',
  },
  'L2-orders-per-customer': {
    title: 'Cuántos pedidos tiene cada cliente',
    context: 'Un responsable segmenta la base de clientes según su actividad de compra.',
    taskText: 'Cuenta el número de pedidos de cada cliente.',
    hints: [
      'Hay que agrupar por aquello que identifica al cliente.',
      'GROUP BY customer_id reúne todos los pedidos de un mismo cliente en un solo grupo.',
      'Plantilla: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id;',
    ],
    explanation:
      'La misma técnica, pero agrupando por un identificador numérico. Fíjate: en el resultado solo aparecen los clientes que tienen al menos un pedido; quienes no aparecen en orders simplemente no forman parte de este resultado.',
  },
  'L2-avg-price-by-category': {
    title: 'Precio medio por categoría',
    context:
      'Una persona de analítica compara los niveles de precio de distintas áreas del catálogo.',
    taskText: 'Calcula el precio medio de los productos de cada categoría.',
    hints: [
      'En lugar de contar filas, hace falta calcular el valor medio de una columna.',
      'AVG(price) calcula la media dentro de cada grupo.',
      'Plantilla: SELECT category, AVG(price) AS avg_price FROM products GROUP BY category;',
    ],
    explanation:
      'AVG funciona dentro de un grupo igual que COUNT: cada categoría obtiene su propia media. Si quitáramos GROUP BY, saldría una sola media de todo el catálogo, que es una métrica completamente distinta.',
  },
  'L2-revenue-by-customer': {
    title: 'Ingresos por cliente',
    context: 'En ventas quieren saber cuánto dinero ha generado cada cliente en total.',
    taskText: 'Calcula el importe total de los pedidos de cada cliente.',
    hints: [
      'Hace falta sumar todos los pedidos de cada cliente.',
      'SUM(amount) con GROUP BY customer_id da el total de cada cliente.',
      'Plantilla: SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id;',
    ],
    explanation:
      'Este es un cálculo básico del LTV, el valor total de un cliente. El patrón «agrupar por una entidad y sumar una métrica» está detrás de muchos informes analíticos: ingresos por región, por canal o por periodo.',
  },
  'L2-salary-range-by-department': {
    title: 'La horquilla salarial de un departamento',
    context:
      'En personal preparan una revisión de retribuciones y quieren ver la dispersión dentro de cada área.',
    taskText: 'Para cada departamento, muestra el salario más bajo y el más alto.',
    hints: [
      'Hacen falta los dos valores extremos dentro de cada grupo, no los de toda la tabla.',
      'MIN y MAX son funciones de agregación, igual que COUNT: con GROUP BY se calculan por separado para cada grupo.',
      'Plantilla: SELECT department, MIN(salary) AS min_salary, MAX(salary) AS max_salary FROM employees GROUP BY department;',
    ],
    explanation:
      'En un mismo SELECT caben tantos agregados como quieras: todos se calculan sobre los mismos grupos. Fíjate también en el departamento vacío del resultado: GROUP BY reúne todos los NULL en un único grupo, aunque en una comparación con WHERE NULL no sea igual a ningún valor. Son mecanismos distintos, y confundirlos es un error clásico.',
  },
  'L2-country-count': {
    title: 'Cuántos países hay en la base',
    context:
      'La dirección planea entrar en mercados nuevos y comprueba en cuántos países ya hay compradores.',
    taskText: 'Cuenta cuántos países distintos están representados entre los clientes.',
    hints: [
      'Hay más clientes que países: un mismo país aparece varias veces y lo que hay que contar son los países.',
      'DISTINCT puede ir dentro de COUNT; así no se tienen en cuenta las repeticiones.',
      'Plantilla: SELECT COUNT(DISTINCT country) AS country_count FROM customers;',
    ],
    explanation:
      'COUNT(country) contaría las filas en las que country no es NULL, es decir, ocho clientes en lugar de seis países, mientras que COUNT(DISTINCT country) cuenta los valores distintos de country y además ignora los NULL. DISTINCT elimina las repeticiones antes de que COUNT cuente los valores restantes. Confundir «cuántos registros» con «cuántos valores distintos» es una fuente habitual de cifras infladas en los informes.',
  },
  'L2-second-half-revenue': {
    title: 'Gasto de los clientes a partir de abril',
    context:
      'En finanzas cuadran el segundo trimestre y calculan la aportación de cada cliente por separado.',
    taskText:
      'Calcula cuánto gastó cada cliente en pedidos hechos a partir del 1 de abril de 2024.',
    hints: [
      'Primero hay que descartar los pedidos antiguos y solo después sumar lo que queda.',
      'WHERE va antes de GROUP BY y descarta filas concretas antes de que se formen los grupos.',
      "Plantilla: SELECT customer_id, SUM(amount) AS total_spent FROM orders WHERE order_date >= DATE '2024-04-01' GROUP BY customer_id;",
    ],
    explanation:
      "El orden de ejecución lo decide todo: WHERE trabaja con filas concretas antes de agrupar, así que en la suma solo entran los pedidos del periodo que quieres. Si esa misma condición se pusiera en HAVING, afectaría a grupos ya formados y no tendría sentido: un grupo no tiene una fecha propia. Escribir DATE '2024-04-01' indica de forma explícita que se trata de una fecha y no de un texto.",
  },
  'L2-rounded-avg-salary': {
    title: 'Salario medio en números redondos',
    context:
      'Una diapositiva para la dirección necesita los salarios medios de las áreas sin céntimos: los decimales solo dificultan la lectura.',
    taskText: 'Para cada departamento, muestra el salario medio redondeado a un número entero.',
    hints: [
      'La media se calcula como siempre, pero hay que mostrarla sin la parte decimal.',
      'ROUND(expresión, número_de_decimales) redondea el resultado; cero decimales da un número entero.',
      'Plantilla: SELECT department, ROUND(AVG(salary), 0) AS avg_salary FROM employees GROUP BY department;',
    ],
    explanation:
      'ROUND envuelve la media ya calculada, no los salarios uno a uno: redondear primero y promediar después daría un resultado distinto y menos preciso. El segundo argumento de ROUND indica el número de decimales. El cero aquí no es lo mismo que omitirlo: ROUND(x) también devuelve un valor sin decimales, pero indicar explícitamente la precisión hace más claro qué se quiere conseguir.',
  },
  'L2-catalog-size': {
    title: 'El tamaño del catálogo',
    context: 'La dirección pide una sola cifra: cuántos artículos hay en el catálogo en total.',
    taskText: 'Cuenta el número total de productos.',
    hints: [
      'No hace falta la tabla en sí, sino un número: cuántas filas tiene.',
      'COUNT(*) cuenta todas las filas, y AS da al resultado un nombre claro.',
      'Plantilla: SELECT COUNT(*) AS total_products FROM products;',
    ],
    explanation:
      'Una función de agregación sin GROUP BY produce una sola fila; es decir, toda la tabla se trata como un único grupo. COUNT(*) cuenta las filas sin tener en cuenta su contenido. Si escribes COUNT(columna), las filas con NULL en esa columna quedan fuera, y esta diferencia es una fuente habitual de errores.',
  },
  'L2-total-revenue': {
    title: 'Ingresos totales',
    context: 'La dirección financiera quiere una única cifra de ventas de todo el periodo.',
    taskText: 'Calcula la suma de todos los pedidos.',
    hints: [
      'Hay que sumar los valores de una columna en todas las filas.',
      'SUM(amount) suma una columna; no olvides el alias con AS.',
      'Plantilla: SELECT SUM(amount) AS total_revenue FROM orders;',
    ],
    explanation:
      'SUM suma los valores de una columna en todas las filas que pasan el filtro de WHERE. Los NULL se ignoran; no se convierten en ceros. Por eso una suma sobre una columna con valores NULL puede ser menor de lo esperado.',
  },
  'L2-premium-categories': {
    title: 'Categorías con una gama cara',
    context:
      'La dirección busca las áreas premium: las categorías con un precio medio por encima de 100.',
    taskText: 'Muestra las categorías en las que el precio medio de los productos supera 100.',
    hints: [
      'Lo que hay que filtrar es la media ya calculada, no los precios uno a uno.',
      'WHERE actúa antes de la agregación y HAVING después. Aquí hace falta HAVING.',
      'Plantilla: SELECT category, AVG(price) AS avg_price FROM products GROUP BY category HAVING AVG(price) > 100;',
    ],
    explanation:
      'El orden de ejecución es este: WHERE descarta filas → GROUP BY forma los grupos → HAVING descarta los grupos que no cumplen la condición. Por eso una condición sobre AVG no puede ir en WHERE: cuando WHERE actúa, la media todavía no existe.',
  },
  'L2-frequent-customers': {
    title: 'Clientes que compran con regularidad',
    context: 'El programa de fidelización arranca con quienes ya tienen cuatro pedidos o más.',
    taskText: 'Muestra los clientes con cuatro pedidos o más y el número de sus pedidos.',
    hints: [
      'Primero cuenta los pedidos de cada cliente y después descarta a los que tienen pocos.',
      'La condición se aplica al resultado de COUNT(*), así que va en HAVING.',
      'Plantilla: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id HAVING COUNT(*) >= 4;',
    ],
    explanation:
      'HAVING filtra grupos por sus agregados. En PostgreSQL no se puede usar un alias de SELECT dentro de HAVING, así que la función de agregación se escribe otra vez. No es una duplicación innecesaria, sino una consecuencia de cómo se evalúa la consulta.',
  },
  'L2-top-categories-by-value': {
    title: 'Las tres categorías más valiosas del almacén',
    context:
      'Antes del inventario, en el almacén quieren saber en qué áreas hay más dinero inmovilizado.',
    taskText:
      'Calcula el valor de las existencias de cada categoría como la suma de precio × existencias y muestra las tres categorías con mayor valor.',
    hints: [
      'Primero calcula el total de cada categoría, después ordena las categorías por ese total y toma las primeras.',
      'ORDER BY puede referirse a un alias definido en SELECT, y LIMIT recorta el resultado ya ordenado.',
      'Plantilla: SELECT category, SUM(price * stock) AS stock_value FROM products GROUP BY category ORDER BY stock_value DESC LIMIT 3;',
    ],
    explanation:
      'Un alias de SELECT se puede usar en ORDER BY, porque la ordenación puede referirse a las columnas del resultado. En HAVING no se puede: allí el agregado hay que escribirlo de nuevo. Fíjate además en que la multiplicación va dentro de SUM: SUM(price) * SUM(stock) daría un resultado completamente distinto.',
  },
  'L2-big-and-pricey': {
    title: 'Categorías grandes y caras',
    context:
      'Para un catálogo premium aparte se eligen las áreas donde la gama es amplia y el precio medio es alto.',
    taskText:
      'Muestra las categorías donde el precio medio supera 100 y, a la vez, hay más de 5 productos.',
    hints: [
      'Hay dos condiciones y las dos se refieren al grupo, no a una fila concreta.',
      'En HAVING se pueden combinar varias condiciones de agregación con AND.',
      'Plantilla: SELECT category, COUNT(*) AS product_count, AVG(price) AS avg_price FROM products GROUP BY category HAVING AVG(price) > 100 AND COUNT(*) > 5;',
    ],
    explanation:
      'Ejercicio de cierre del nivel: en HAVING caben tantas condiciones como quieras y se pueden combinar agregados distintos. Los datos están elegidos para comprobar que se entiende: hay categorías con un precio medio alto pero pocos artículos, y es la segunda condición la que debe dejarlas fuera.',
  },
  'L2-loyal-and-valuable': {
    title: 'Parejas estables de cliente y responsable',
    context:
      'La dirección de ventas busca relaciones que ya funcionan: el cliente vuelve a comprar con el mismo responsable y deja importes notables.',
    taskText:
      'Encuentra las parejas «cliente — responsable» que reúnen al menos dos pedidos con un importe total superior a 300. Muestra el número de pedidos y el importe total.',
    hints: [
      'El grupo no lo forma el cliente ni el responsable por separado, sino su combinación.',
      'GROUP BY acepta varias columnas separadas por comas, y en HAVING las condiciones se unen con AND.',
      'Plantilla: SELECT customer_id, manager_id, COUNT(*) AS order_count, SUM(amount) AS total_spent FROM orders GROUP BY customer_id, manager_id HAVING COUNT(*) >= 2 AND SUM(amount) > 300;',
    ],
    explanation:
      'Ejercicio de cierre del nivel: GROUP BY por dos columnas crea un grupo por cada combinación de valores que existe en los datos, no grupos separados para cada columna. Por eso un mismo cliente puede aparecer en varias filas del resultado, una por cada responsable con quien trabajó. Y ahí se esconde el error típico al leer estos informes: la columna total_spent ya no representa los ingresos totales del cliente, porque sus pedidos están repartidos en filas distintas.',
  },
};
