// Іспанський текст завдань рівня 6 (дати та рядки).
//
// Тут найгустіше SQL у прозі: EXTRACT, DATE_TRUNC, TO_CHAR, AGE, INTERVAL,
// SPLIT_PART, TRIM, LOWER, UPPER, INITCAP, REPLACE, LENGTH, POSITION,
// SUBSTRING. Усе це лишається великими літерами — тест звіряє набір.
export default {
  'L6-hires-per-year': {
    title: 'Contrataciones por año',
    context:
      'En personal preparan un informe del ritmo de contratación por año para planificar el presupuesto de selección del año que viene.',
    taskText: 'Cuenta cuántos empleados se contrataron cada año.',
    hints: [
      'Hay que agrupar a los empleados no por la fecha exacta de contratación, sino por el año que aparece en ella.',
      'EXTRACT(YEAR FROM ...) extrae de una fecha solo el año como número, y por él sí se puede agrupar.',
      'Plantilla: SELECT EXTRACT(YEAR FROM hire_date) AS hire_year, COUNT(*) AS hired FROM employees GROUP BY hire_year ORDER BY hire_year;',
    ],
    explanation:
      'EXTRACT(YEAR FROM ...) convierte una fecha en un número: el año. Agrupar directamente por hire_date no tiene sentido para este objetivo: en estos datos cada fecha de contratación es única, así que GROUP BY hire_date daría tantos grupos como filas y no obtendríamos un total por año.',
  },
  'L6-orders-by-weekday': {
    title: 'Días de la semana de los pedidos',
    context:
      'Un responsable de almacén quiere saber en qué días de la semana caen más pedidos para planificar los turnos del personal.',
    taskText: 'Cuenta el número de pedidos de cada día de la semana.',
    hints: [
      'Hay que contar los pedidos no por una fecha concreta, sino por el día de la semana al que corresponde.',
      'EXTRACT(DOW FROM ...) devuelve el número del día de la semana de una fecha.',
      'Plantilla: SELECT EXTRACT(DOW FROM order_date) AS weekday, COUNT(*) AS orders_count FROM orders GROUP BY weekday ORDER BY weekday;',
    ],
    explanation:
      'EXTRACT(DOW FROM ...) numera los días de la semana de cero a seis. La particularidad es que el cero significa domingo y no lunes, como se podría esperar intuitivamente, por lo que hay que tenerlo en cuenta al interpretar esta columna en un informe.',
  },
  'L6-revenue-by-month': {
    title: 'Ingresos por mes',
    context:
      'En finanzas quieren ver la evolución de los ingresos por mes para comparar las temporadas.',
    taskText: 'Calcula el importe de los pedidos de cada mes.',
    hints: [
      'El importe de los pedidos hay que calcularlo no para cada día por separado, sino reduciendo las fechas a su mes.',
      "DATE_TRUNC('month', ...) recorta una fecha hasta el primer día de su mes.",
      "Plantilla: SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount) AS revenue FROM orders GROUP BY month ORDER BY month;",
    ],
    explanation:
      "DATE_TRUNC('month', ...) recorta la fecha al comienzo del mes, así que el 3 y el 17 de enero se convierten en el mismo 2024-01-01 y caen en un solo grupo. Agrupar directamente por order_date no permite obtener un total mensual, porque las fechas de distintos días formarían grupos distintos, y aquí las fechas de los pedidos son casi todas diferentes.",
  },
  'L6-trim-names': {
    title: 'Quitar los espacios de más',
    context:
      'Alguien del centro de contacto ha importado una lista de contactos de un CRM donde los campos se rellenaban a mano y con espacios de todo tipo.',
    taskText: 'Muestra el número de contacto y el nombre sin espacios en los extremos.',
    hints: [
      'Hay que mostrar los nombres quitando los espacios que están antes o después del nombre.',
      'TRIM(...) quita los espacios de los dos extremos de una cadena.',
      'Plantilla: SELECT contact_id, TRIM(raw_name) AS clean_name FROM raw_contacts ORDER BY contact_id;',
    ],
    explanation:
      'TRIM quita espacios solo del principio y del final de la cadena y no modifica lo que hay dentro. El contacto con id 3 tiene un espacio doble entre las palabras, así que en el resultado «Olena  Shevchenko» conserva los dos espacios del medio.',
  },
  'L6-lower-emails': {
    title: 'El correo en un solo tipo de letra',
    context:
      'Alguien de marketing prepara un envío y quiere encontrar direcciones duplicadas que solo se diferencian en mayúsculas y minúsculas.',
    taskText: 'Muestra el número de contacto y la dirección de correo en minúsculas.',
    hints: [
      'Hay que llevar todas las direcciones de correo a un mismo caso para que las direcciones iguales escritas de forma distinta se vean igual.',
      'LOWER(...) pasa todas las letras de una cadena a minúsculas.',
      'Plantilla: SELECT contact_id, LOWER(raw_email) AS email FROM raw_contacts ORDER BY contact_id;',
    ],
    explanation:
      "En PostgreSQL la comparación de textos distingue mayúsculas y minúsculas: 'ANNA.K@Example.COM' = 'anna.k@example.com' devuelve falso, aunque para una persona sea la misma dirección. Para comparar direcciones ignorando esas diferencias, se pueden llevar primero todas a un mismo caso. LOWER es una forma habitual de normalizar el texto antes de comparar o buscar duplicados.",
  },
  'L6-contact-code': {
    title: 'Un código de contacto de ancho fijo',
    context:
      'En soporte quieren códigos de contacto cortos y de la misma longitud para las referencias internas en los tiques.',
    taskText:
      'Muestra un código de contacto de cuatro dígitos con ceros delante y la longitud de su nombre ya limpio.',
    hints: [
      'Hay que convertir el número de contacto en una cadena de longitud fija con ceros delante y, por separado, contar los caracteres del nombre ya limpio.',
      "LPAD(..., 4, '0') rellena una cadena por la izquierda hasta la longitud necesaria, y LENGTH(...) cuenta los caracteres de una cadena.",
      "Plantilla: SELECT LPAD(contact_id::TEXT, 4, '0') AS contact_code, LENGTH(TRIM(raw_name)) AS name_length FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'LPAD trabaja con texto, así que el número contact_id se convierte primero a texto con ::TEXT. LENGTH cuenta los caracteres de la cadena y, si los espacios no se eliminan antes con TRIM, también forman parte de la longitud.',
  },
  'L6-contact-signature': {
    title: 'La firma para el envío',
    context:
      'El equipo de envíos construye una firma «Nombre <correo>» para la plantilla de carta de cada contacto.',
    taskText: 'Construye para cada contacto una firma de la forma «Nombre <correo>».',
    hints: [
      'Hay que armar un único campo de texto con el nombre ya limpio y la dirección de correo entre corchetes angulares.',
      'El operador || concatena cadenas en una sola.',
      "Plantilla: SELECT contact_id, TRIM(raw_name) || ' <' || LOWER(raw_email) || '>' AS signature FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'El operador || va concatenando todos sus operandos en una sola cadena. Si alguno de ellos es NULL, el resultado completo también será NULL. Cuando los datos pueden contener valores NULL y se quiere evitar ese comportamiento, se puede recurrir a COALESCE.',
  },
  'L6-month-label': {
    title: 'El mes como etiqueta de texto',
    context:
      'La dirección necesita un informe de ingresos con los meses en palabras y no en números, en orden cronológico natural.',
    taskText:
      'Muestra los ingresos de cada mes etiquetando el mes con su nombre y el año, en orden cronológico.',
    hints: [
      'El mes hay que etiquetarlo no con un número, sino con una palabra del estilo «January 2024», y las filas tienen que salir en orden de tiempo y no por orden alfabético del nombre.',
      "TO_CHAR(..., 'FMMonth YYYY') formatea una fecha como etiqueta de texto con el nombre del mes; el prefijo FM evita los espacios de relleno.",
      "Plantilla: SELECT TO_CHAR(order_date, 'FMMonth YYYY') AS month_label, SUM(amount) AS revenue FROM orders GROUP BY month_label ORDER BY MIN(order_date);",
    ],
    explanation:
      'Sin el prefijo FM, TO_CHAR puede rellenar el nombre del mes con espacios hasta una longitud fija, y FM evita ese relleno. Ordenar por la propia etiqueta daría un orden alfabético —April, February, January—, así que las filas se ordenan por la fecha real con MIN(order_date).',
  },
  'L6-quarter-summary': {
    title: 'Totales trimestrales',
    context:
      'La dirección cuadra el plan de ventas cada trimestre y quiere el número y el importe de los pedidos por trimestre.',
    taskText: 'Para cada trimestre, muestra el número de pedidos y su importe total.',
    hints: [
      'Los pedidos hay que reducirlos al trimestre y no al mes, y calcular para cada uno tanto el número como la suma.',
      "DATE_TRUNC('quarter', ...) recorta una fecha hasta el inicio del trimestre, igual que 'month' la recorta hasta el inicio del mes.",
      "Plantilla: SELECT DATE_TRUNC('quarter', order_date) AS quarter, COUNT(*) AS orders_count, SUM(amount) AS revenue FROM orders GROUP BY quarter ORDER BY quarter;",
    ],
    explanation:
      "DATE_TRUNC acepta distintas unidades de redondeo —'month', 'quarter', 'year', 'week'— y funciona con el mismo principio. El resultado para un trimestre no es un número del 1 al 4, sino una fecha: el primer día del primer mes del trimestre. Por ejemplo, el segundo trimestre de 2024 se representa como 2024-04-01.",
  },
  'L6-return-deadline': {
    title: 'La fecha límite de devolución de un producto',
    context:
      'En soporte comprueban si sigue vigente el derecho de devolución de los pedidos hechos desde principios de junio.',
    taskText:
      'Para los pedidos a partir del 1 de junio de 2024 incluido, muestra el número, la fecha y la fecha en la que vence el plazo de devolución de 30 días.',
    hints: [
      'Para los pedidos no demasiado antiguos hay que mostrar su fecha y la fecha que llega 30 días después.',
      "A una fecha se le puede sumar INTERVAL '30 days' y se obtiene una fecha 30 días más tarde.",
      "Plantilla: SELECT order_id, order_date, order_date + INTERVAL '30 days' AS return_deadline FROM orders WHERE order_date >= DATE '2024-06-01' ORDER BY order_id;",
    ],
    explanation:
      "A un DATE se le puede sumar un INTERVAL directamente. La expresión resultante es de tipo timestamp, aunque la hora sea cero. La palabra DATE delante de un literal fija explícitamente su tipo y evita tratarlo como texto, y eso importa donde el tipo no puede salir de ningún otro sitio: '2024-6-1' > '2024-12-01' da verdadero, porque se comparan dos textos, mientras que DATE '2024-06-01' > '2024-12-01' da falso, porque se comparan fechas.",
  },
  'L6-experience-at-date': {
    title: 'La antigüedad a cierre de año',
    context:
      'En personal preparan el informe anual de antigüedad de los empleados a cierre de año y no a día de hoy.',
    taskText: 'Calcula la antigüedad de cada empleado a fecha de 31 de diciembre de 2024.',
    hints: [
      'Hay que calcular cuánto tiempo pasó desde la fecha de contratación hasta una fecha fija concreta: el 31 de diciembre de 2024.',
      'AGE(fecha1, fecha2) devuelve la diferencia entre dos fechas en años, meses y días.',
      "Plantilla: SELECT first_name, hire_date, AGE(DATE '2024-12-31', hire_date) AS experience FROM employees ORDER BY hire_date;",
    ],
    explanation:
      "AGE con dos argumentos calcula la diferencia entre esas dos fechas, mientras que con un solo argumento calcula la diferencia entre la fecha indicada y la fecha actual. La segunda forma no sirve para un informe con una fecha de referencia fija: el resultado cambiaría con el paso del tiempo. Por eso aquí la fecha de referencia se indica explícitamente como DATE '2024-12-31'.",
  },
  'L6-source-parts': {
    title: 'El canal y el subcanal de la visita',
    context:
      'Alguien de marketing separa las fuentes de tráfico en canal y subcanal para valorar cada una por separado.',
    taskText: 'Separa la fuente de la visita en canal y subcanal.',
    hints: [
      'La fuente está escrita en una sola cadena con una barra dentro: hay que partirla en dos partes, la de antes de la barra y la de después.',
      'SPLIT_PART(cadena, separador, número) devuelve la parte de la cadena indicada por el número.',
      "Plantilla: SELECT contact_id, SPLIT_PART(source, '/', 1) AS channel, SPLIT_PART(source, '/', 2) AS subchannel FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      "SPLIT_PART numera las partes de una cadena desde uno y no desde cero. Si no existe una parte con ese número, la función devuelve una cadena vacía '' y no NULL. Por eso una comprobación IS NULL no detectaría una parte inexistente: habría que compararla con ''.",
  },
  'L6-email-domain': {
    title: 'El dominio de una dirección de correo',
    context:
      'Alguien de analítica quiere ver qué dominios de correo aparecen más a menudo entre los contactos.',
    taskText:
      'Extrae de cada dirección el dominio, todo lo que va después de la arroba, en minúsculas.',
    hints: [
      'Hay que extraer de la dirección de correo la parte posterior al carácter @ y pasarla a minúsculas.',
      'POSITION(subcadena IN cadena) encuentra la posición en la que empieza la subcadena, y SUBSTRING(cadena FROM número) toma todo desde ese número hasta el final.',
      "Plantilla: SELECT contact_id, LOWER(SUBSTRING(raw_email FROM POSITION('@' IN raw_email) + 1)) AS domain FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      "POSITION devuelve la posición del carácter empezando por uno y no por cero, así que al resultado se le suma 1 para que SUBSTRING empiece justo después de la arroba. Si la cadena no contiene '@', POSITION devuelve 0 y SUBSTRING FROM 1 devuelve la cadena original completa. Por tanto, en ese caso no se obtiene NULL ni se produce un error.",
  },
  'L6-clean-contacts': {
    title: 'Limpieza completa de un contacto',
    context:
      'Antes de la carga en el CRM nuevo hay que llevar los contactos a un formato único y ordenado.',
    taskText:
      'Ordena los contactos: el nombre sin espacios de más y con cada palabra en mayúscula inicial, y el correo en minúsculas.',
    hints: [
      'Al nombre hay que quitarle los espacios de más y poner cada palabra en mayúscula inicial, y el correo hay que pasarlo a minúsculas.',
      'REPLACE puede sustituir los espacios repetidos, TRIM recorta los extremos e INITCAP pone cada palabra en mayúscula inicial; se pueden anidar unas funciones dentro de otras.',
      "Plantilla: SELECT contact_id, INITCAP(TRIM(REPLACE(raw_name, '  ', ' '))) AS clean_name, LOWER(TRIM(raw_email)) AS clean_email FROM raw_contacts ORDER BY contact_id;",
    ],
    explanation:
      'Las funciones anidadas se ejecutan de dentro hacia fuera, y aquí el orden importa: primero se corrigen los espacios, después se recortan los extremos y finalmente INITCAP da formato a las palabras. REPLACE busca exactamente la cadena indicada; por eso, si se sustituyen pares de espacios por uno, una secuencia de tres espacios todavía puede dejar un espacio doble, y justo por eso en los datos de ejemplo hay dos espacios seguidos y no tres. Para eliminar cualquier cantidad de espacios consecutivos haría falta una estrategia distinta.',
  },
  'L6-monthly-customer-report': {
    title: 'Informe mensual por cliente',
    context:
      'En finanzas agregan las ventas por mes y cliente para el informe mensual, en el formato de negocio «APELLIDO, Nombre».',
    taskText:
      'Agrega los importes de los pedidos por mes y cliente: el mes como 2024-01 y el cliente como «APELLIDO, Nombre».',
    hints: [
      'Hay que calcular el importe de los pedidos por separado para cada pareja de «mes más cliente» y mostrar el nombre del cliente en el formato «APELLIDO, Nombre».',
      "TO_CHAR(..., 'YYYY-MM') da la etiqueta del mes, SPLIT_PART parte el nombre completo en apellido y nombre por el espacio, y UPPER e INITCAP fijan el formato de cada mitad.",
      "Plantilla: SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS month, UPPER(SPLIT_PART(c.name, ' ', 2)) || ', ' || INITCAP(SPLIT_PART(c.name, ' ', 1)) AS customer, SUM(o.amount) AS total FROM orders o JOIN customers c ON c.customer_id = o.customer_id GROUP BY month, customer ORDER BY month, customer;",
    ],
    explanation:
      "PostgreSQL permite agrupar por los alias de las columnas calculadas (GROUP BY month, customer), así que las expresiones del SELECT no tienen que repetirse en GROUP BY. TO_CHAR(..., 'YYYY-MM') convierte una fecha en una etiqueta de texto con formato año-mes, por ejemplo 2026-08. Ese formato resulta cómodo para ordenar, porque mantiene el orden cronológico correcto, al contrario que los nombres de los meses en palabras. UPPER e INITCAP fijan por separado el formato de las dos mitades del nombre: el apellido sale en mayúsculas y el nombre con mayúscula inicial.",
  },
};
