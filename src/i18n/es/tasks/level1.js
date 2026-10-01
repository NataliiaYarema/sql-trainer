// Іспанський текст завдань рівня 1, ключований id завдання.
//
// Звертання на «tú», але без прикметників, що вимагають роду. Дійові особи в
// бізнес-контексті названі безособово («En compras preparan…»), бо статі
// вигаданого менеджера ми так само не знаємо.
export default {
  'L1-all-customers': {
    title: 'La lista completa de clientes',
    context:
      'Un nuevo responsable está conociendo la base de datos y quiere ver las fichas de clientes completas.',
    taskText: 'Muestra todas las columnas y todas las filas de la tabla customers.',
    hints: [
      'Necesitas todas las columnas: no hace falta enumerarlas una por una.',
      'El asterisco * en SELECT significa «todas las columnas de la tabla».',
      'Plantilla: SELECT * FROM customers;',
    ],
    explanation:
      'SELECT * viene bien para echar un vistazo rápido a una tabla. En las consultas de trabajo se evita: arrastra datos que no necesitas y se rompe en cuanto aparece una columna nueva. Para explorar, sí; para un panel, no.',
  },

  'L1-product-prices': {
    title: 'Solo nombres y precios de los productos',
    context:
      'Para una lista de precios impresa solo hacen falta los nombres de los productos y los precios; el resto de los campos sobra en el papel.',
    taskText: 'Muestra el nombre y el precio de cada producto.',
    hints: [
      'En lugar de todas las columnas hacen falta solo dos concretas.',
      'Enumera las columnas que necesitas separadas por comas, justo después de SELECT.',
      'Plantilla: SELECT product_name, price FROM products;',
    ],
    explanation:
      'Enumerar las columnas de forma explícita es lo normal en las consultas de trabajo: obtienes exactamente los datos que pediste y el resultado no cambia si se añaden campos nuevos a la tabla. El orden de las columnas en SELECT marca el orden en el resultado.',
  },

  'L1-departments': {
    title: 'Qué departamentos hay en la empresa',
    context:
      'En el área de personal están armando la estructura de la empresa y empiezan por la lista de departamentos.',
    taskText: 'Muestra la lista de departamentos sin repeticiones.',
    hints: [
      'El departamento se repite en cada empleado, y la lista que hace falta va sin repeticiones.',
      'DISTINCT descarta las filas idénticas del resultado y deja una de cada grupo.',
      'Plantilla: SELECT DISTINCT department FROM employees;',
    ],
    explanation:
      'Fíjate en la fila vacía del resultado: un empleado no tiene departamento, y DISTINCT trata NULL como un valor propio, al contrario que las condiciones en WHERE, donde NULL no es igual a nada. Lo segundo: DISTINCT actúa sobre la fila completa del resultado y no sobre una sola columna, así que SELECT DISTINCT department, salary devolvería cada par de valores.',
  },

  'L1-top-managers': {
    title: 'Quién no depende de nadie',
    context:
      'En personal preparan la lista de responsables de primer nivel para invitarlos a la sesión de estrategia.',
    taskText: 'Muestra el nombre y el apellido de los empleados que no tienen responsable.',
    hints: [
      'La ausencia de responsable no se guarda en la tabla como un cero ni como una cadena vacía, sino como un valor especial que significa «desconocido».',
      'Un valor vacío se comprueba con IS NULL, no con el signo de igual.',
      'Plantilla: SELECT first_name, last_name FROM employees WHERE manager_id IS NULL;',
    ],
    explanation:
      'NULL no es un valor, sino la ausencia de uno, así que cualquier comparación con él no da «verdadero» ni «falso», sino «desconocido». Por eso manager_id = NULL no devuelve ninguna fila y tampoco da error: la consulta entrega un resultado vacío sin más. IS NULL existe justo para estas comprobaciones.',
  },

  'L1-category-filter': {
    title: 'Productos de una sola categoría',
    context:
      'Un responsable de categoría revisa la gama de electrónica antes de una promoción de temporada.',
    taskText: "Muestra los productos de la categoría 'Electronics'.",
    hints: [
      'No hacen falta todas las filas, solo las que cumplen una condición.',
      "WHERE filtra filas. Los valores de texto van entre comillas simples: category = 'Electronics'.",
      "Plantilla: SELECT product_name, price FROM products WHERE category = '...';",
    ],
    explanation:
      'WHERE descarta filas antes de formar el resultado. La igualdad es el filtro más sencillo; ten en cuenta que en SQL la comparación de textos distingue mayúsculas, así que Electronics y electronics son valores distintos.',
  },

  'L1-low-stock': {
    title: 'Productos con pocas existencias',
    context: 'En compras revisan cada semana qué artículos hay que volver a pedir.',
    taskText: 'Muestra los productos cuyas existencias son menores que 20.',
    hints: [
      'La condición compara un número con un número.',
      'El operador < comprueba «menor que». Los números no se ponen entre comillas.',
      'Plantilla: SELECT product_name, stock FROM products WHERE stock < 20;',
    ],
    explanation:
      "Los operadores de comparación >, <, >=, <=, = y <> funcionan en WHERE igual que en matemáticas. Los números se escriben sin comillas. Con stock < '20' PostgreSQL no protesta y convierte '20' en número por su cuenta, pero solo porque ese literal no tiene tipo propio: un texto de verdad, como '20'::text, falla con «operator does not exist: integer < text».",
  },

  'L1-price-desc': {
    title: 'Lista de precios de mayor a menor',
    context: 'En ventas preparan una presentación y quieren mostrar primero los artículos premium.',
    taskText:
      'Muestra los nombres y los precios de todos los productos, ordenados del más caro al más barato.',
    hints: [
      'El resultado hay que ordenarlo por precio.',
      'ORDER BY define la ordenación, y DESC la invierte a descendente.',
      'Plantilla: SELECT product_name, price FROM products ORDER BY price DESC;',
    ],
    explanation:
      'Sin ORDER BY el orden de las filas no está garantizado: la base de datos puede devolverlas como quiera. Por defecto la ordenación es ascendente (ASC) y DESC la hace descendente. Es la única forma de controlar el orden del resultado.',
  },

  'L1-latest-orders': {
    title: 'Los tres pedidos más nuevos',
    context: 'En soporte miran qué se ha pedido últimamente.',
    taskText:
      'Muestra los tres pedidos más recientes por fecha. Si la fecha coincide, arriba va el pedido con el número mayor.',
    hints: [
      'Primero ordena las filas y después recorta las que sobran.',
      'LIMIT n deja solo las primeras n filas de un resultado ya ordenado.',
      'Plantilla: SELECT order_id, order_date, amount FROM orders ORDER BY order_date DESC, order_id DESC LIMIT 3;',
    ],
    explanation:
      'LIMIT se aplica después de la ordenación, así que el orden de las operaciones importa: primero ORDER BY coloca las filas y solo después LIMIT corta la cola. La segunda columna del ORDER BY no está de adorno: hay dos fechas iguales y sin ella la base de datos puede devolver esas filas en cualquier orden, con lo que un informe «top N» se volvería impredecible.',
  },

  'L1-top-furniture': {
    title: 'Los muebles más caros',
    context:
      'Para un expositor de muebles premium hacen falta los dos artículos más caros de esa categoría.',
    taskText: "Muestra los dos artículos más caros de la categoría 'Furniture'.",
    hints: [
      'Aquí se juntan tres acciones: filtrar, ordenar y recortar.',
      'El orden de las partes de la consulta es fijo: WHERE, luego ORDER BY, luego LIMIT.',
      "Plantilla: SELECT product_name, price FROM products WHERE category = '...' ORDER BY price DESC LIMIT 2;",
    ],
    explanation:
      'El orden en que se escriben las partes de la consulta es rígido: SELECT → FROM → WHERE → ORDER BY → LIMIT. El orden de ejecución es otro: primero WHERE descarta filas, después se ordenan y solo al final LIMIT recorta lo que sobra. Por eso el filtro no puede «ver» el resultado de la ordenación.',
  },

  'L1-price-range': {
    title: 'Productos dentro de una franja de precio',
    context:
      'Marketing prepara una promoción de gama media y selecciona los artículos que encajan por precio.',
    taskText:
      'Muestra los nombres y los precios de los productos cuyo precio va de 50 a 150, ambos incluidos.',
    hints: [
      'La condición limita el precio por los dos lados a la vez: por abajo y por arriba.',
      'BETWEEN a AND b escribe un rango de forma más corta que dos condiciones unidas con AND.',
      'Plantilla: SELECT product_name, price FROM products WHERE price BETWEEN 50 AND 150;',
    ],
    explanation:
      'BETWEEN incluye los dos límites: equivale a price >= 50 AND price <= 150. Aquí se esconde el error típico: en el habla corriente «de 50 a 150» suele dejar fuera el límite de arriba, y entonces BETWEEN devuelve unas filas más de las esperadas. El orden de los límites también importa: BETWEEN 150 AND 50 no devuelve nada.',
  },

  'L1-two-categories': {
    title: 'Dos categorías en un solo filtro',
    context:
      'Para un expositor de temporada de «hogar y deporte» hacen falta artículos de dos áreas a la vez.',
    taskText: "Muestra los productos de las categorías 'Kitchen' y 'Sports' junto con sus precios.",
    hints: [
      'No encaja un valor concreto de categoría, sino cualquiera de dos.',
      "El operador IN comprueba la pertenencia a una lista: category IN ('A', 'B').",
      "Plantilla: SELECT product_name, category, price FROM products WHERE category IN ('Kitchen', 'Sports');",
    ],
    explanation:
      "IN es una forma corta de escribir una cadena de OR: category = 'Kitchen' OR category = 'Sports'. La ganancia no es solo de longitud: con OR es fácil olvidar los paréntesis y mezclar las condiciones, mientras que IN se mantiene como una única expresión. Cuidado con NOT IN si en la lista puede haber NULL: esa condición no devuelve ninguna fila.",
  },

  'L1-name-search': {
    title: 'Búsqueda por parte del nombre',
    context: 'En soporte buscan un producto y el cliente solo recuerda parte del nombre.',
    taskText:
      "Muestra los nombres y las categorías de los productos cuyo nombre contiene la palabra 'Desk'.",
    hints: [
      'El nombre no debe ser igual al fragmento, sino contenerlo en cualquier parte.',
      'LIKE compara con un patrón en el que % significa «cualquier cantidad de caracteres».',
      "Plantilla: SELECT product_name, category FROM products WHERE product_name LIKE '%Desk%';",
    ],
    explanation:
      "En un patrón de LIKE, % sustituye cualquier secuencia de caracteres y _ exactamente uno. Sin % el patrón funciona como una igualdad normal: LIKE 'Desk' encontraría solo un producto llamado exactamente «Desk», y no hay ninguno. En PostgreSQL LIKE distingue mayúsculas, así que '%desk%' no encuentra estos productos; para buscar sin tener en cuenta las mayúsculas existe ILIKE.",
  },

  'L1-sorted-catalog': {
    title: 'Catálogo por categoría y precio',
    context:
      'En el almacén preparan un catálogo en papel para el inventario: primero todo por áreas y, dentro, empezando por lo más caro.',
    taskText:
      'Muestra el nombre, la categoría y el valor de las existencias (precio × existencias) de cada producto. Ordena por categoría y, dentro de cada categoría, del producto más caro al más barato.',
    hints: [
      'La ordenación tiene dos niveles: primero los grupos y, dentro de cada uno, su propio orden.',
      'ORDER BY acepta varias columnas separadas por comas, y DESC afecta solo a la que va justo antes.',
      'Plantilla: SELECT product_name, category, price * stock AS stock_value FROM products ORDER BY category, price DESC;',
    ],
    explanation:
      'La segunda columna del ORDER BY entra en juego solo donde la primera dio valores iguales, y es la que ordena los productos dentro de cada categoría. Fíjate también en que ordenamos por price aunque en el resultado mostramos stock_value: ORDER BY puede referirse a columnas de la tabla que no aparecen en la salida.',
  },

  'L1-expensive-low-stock': {
    title: 'Productos caros que se están agotando',
    context:
      'En compras preparan la lista de pedidos urgentes: los artículos caros de los que queda poco hay que reponerlos primero.',
    taskText: 'Muestra los cinco productos más caros cuyas existencias son menores que 50.',
    hints: [
      'Descompón el enunciado en partes: primero «existencias menores que 50», luego «los más caros», luego «cinco».',
      'El filtro va en WHERE, «los más caros» es ORDER BY price DESC y «cinco» es LIMIT 5.',
      'Plantilla: SELECT product_name, price, stock FROM products WHERE stock < 50 ORDER BY price DESC LIMIT 5;',
    ],
    explanation:
      'Ejercicio de cierre del nivel: un enunciado de negocio se descompone en tres pasos técnicos. Lo importante es que LIMIT se aplica después del filtro: si primero tomaras los cinco productos más caros en general y luego filtraras por existencias, en la lista quedarían menos de cinco.',
  },

  'L1-restock-shortlist': {
    title: 'La lista corta de pedidos urgentes',
    context:
      'En compras preparan el pedido de la semana: la electrónica la lleva otro departamento y el resto hay que reponerlo según dos señales distintas de urgencia.',
    taskText:
      "Muestra los productos de los que quedan menos de 50 en existencias, que no pertenecen a la categoría 'Electronics' y que además cuestan más de 100 o bien quedan menos de 10 unidades.",
    hints: [
      'Hay tres condiciones, pero la última se compone de dos opciones y basta con una de ellas.',
      'AND exige que se cumplan las dos condiciones, OR al menos una, y NOT invierte una condición. Los paréntesis indican qué se agrupa con qué.',
      "Plantilla: SELECT product_name, category, price, stock FROM products WHERE stock < 50 AND NOT category = 'Electronics' AND (price > 100 OR stock < 10);",
    ],
    explanation:
      'Los paréntesis alrededor del OR no son un adorno. AND se enlaza con más fuerza que OR, así que sin ellos la condición se leería como «(quedan pocas existencias y no es electrónica y cuesta más de 100) o quedan menos de 10», y en el resultado entraría la electrónica que acabábamos de excluir. Cuando AND y OR se juntan en una misma condición conviene poner siempre los paréntesis, incluso donde coinciden con el comportamiento por defecto: una consulta la lee una persona, no solo la base de datos.',
  },
};
