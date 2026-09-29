// Іспанський текст завдань рівня 8 (аналітичні кейси).
//
// Числа в поясненнях виміряні прогоном, тому переписані точно. Десятковий
// роздільник іспанською — кома, як і українською (58,8 %), на відміну від
// англійської.
//
// Чотири завдання кейса «Análisis de la conversión de usuarios» несуть
// caseStudyTitle.
export default {
  'L8-signup-cohorts': {
    title: 'Tamaño de las cohortes por mes de registro',
    context:
      'Alguien de analítica de producto quiere entender si la llegada de usuarios nuevos crece mes a mes.',
    taskText:
      'Cuenta cuántos usuarios se registraron cada mes, mostrando el mes como la primera fecha del periodo.',
    hints: [
      'Hay que contar cuánta gente nueva se sumó a la aplicación en cada mes natural y mostrar ese mes como una fecha.',
      "DATE_TRUNC('month', ...) recorta una fecha hasta el primer día de su mes, y esa fecha es la que sirve de etiqueta para GROUP BY.",
      "Plantilla: SELECT DATE_TRUNC('month', signup_date)::date AS cohort_month, COUNT(*) AS users FROM app_users GROUP BY DATE_TRUNC('month', signup_date) ORDER BY cohort_month;",
    ],
    explanation:
      "DATE_TRUNC('month', …) devuelve la primera fecha del mes y no su nombre, y esa fecha se convierte en la etiqueta de la cohorte. La cohorte la determina la fecha de registro del usuario y queda asociada a él para siempre, sin importar cuándo haga algo en la aplicación. Resultado medido: 18 meses, de 6 a 16 usuarios en cada uno.",
  },

  'L8-funnel-steps': {
    title: 'Los pasos del embudo',
    context: 'El equipo quiere ver cuánta gente llega a cada paso de la compra.',
    taskText: 'Cuenta el número de eventos de cada tipo, de los más frecuentes a los más raros.',
    hints: [
      'Hay que contar cuántas veces ocurrió cada acción de los usuarios en la aplicación y colocar el resultado de la acción más común a la más rara.',
      'GROUP BY junta los eventos en montones por tipo y COUNT(*) mide el tamaño de cada montón; un ORDER BY descendente los coloca del mayor al menor.',
      'Plantilla: SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type ORDER BY events DESC;',
    ],
    explanation:
      'La ordenación descendente muestra aquí justamente el orden del embudo: cada paso siguiente es un subconjunto del anterior (para formalizar una compra hay que poner antes algo en el carrito), así que las cantidades bajan por construcción y no por casualidad. COUNT(*) cuenta aquí eventos y no personas: el mismo usuario pudo hacer varias visitas o ver varios productos. Resultado medido: 1187, 843, 541, 373, 274.',
  },

  'L8-active-users-by-month': {
    title: 'Usuarios activos por mes',
    context:
      'Alguien de analítica de producto vigila si crece el número de personas que usan de verdad la aplicación cada mes.',
    taskText: 'Cuenta cuántos usuarios distintos realizaron acciones en la aplicación cada mes.',
    hints: [
      'Hay que contar cuántas personas distintas entraron en la aplicación cada mes, no cuántas acciones hicieron en total.',
      "DATE_TRUNC('month', ...) recorta una fecha hasta el primer día de su mes, y COUNT(DISTINCT user_id) cuenta a cada usuario una vez, aunque tenga muchos eventos.",
      "Plantilla: SELECT DATE_TRUNC('month', occurred_at)::date AS month, COUNT(DISTINCT user_id) AS active_users FROM app_events GROUP BY DATE_TRUNC('month', occurred_at) ORDER BY month;",
    ],
    explanation:
      'Hay 3218 eventos y 190 personas, así que COUNT(*) respondería aquí a otra pregunta; el mismo usuario con diez sesiones en un mes tiene que contarse una vez. Medido: 18 meses, de 5 activos en enero de 2023 a 69 en abril de 2024; la serie crece de forma casi monótona.',
  },

  'L8-sessions-per-user': {
    title: 'Los usuarios más activos por sesiones',
    context:
      'Alguien de producto quiere encontrar a los diez usuarios más implicados por número de sesiones.',
    taskText: 'Encuentra los diez usuarios con más sesiones, del más activo al menos activo.',
    hints: [
      'Hay que encontrar a las diez personas que entraron en la aplicación con más frecuencia y mostrarlas del más activo al menos activo.',
      'COUNT(DISTINCT session_id) cuenta el número de sesiones únicas por usuario; GROUP BY agrupa los eventos por user_id y LIMIT recorta el resultado a diez filas.',
      'Plantilla: SELECT user_id, COUNT(DISTINCT session_id) AS sessions FROM app_events GROUP BY user_id ORDER BY sessions DESC, user_id LIMIT 10;',
    ],
    explanation:
      'Por qué COUNT(DISTINCT session_id) y no COUNT(*): una sesión contiene entre uno y cinco eventos, así que contar eventos daría una clasificación completamente distinta; y por qué en ORDER BY hay una segunda clave user_id: sin ella el orden entre valores iguales queda indefinido, y un ejercicio con LIMIT tiene que tener una respuesta única. Medido: 10 filas, de 14 a 12 sesiones.',
  },

  'L8-revenue-by-month': {
    title: 'Ingresos de la aplicación por mes',
    context:
      'Alguien de análisis financiero quiere ver el número de compras y los ingresos de cada mes.',
    taskText: 'Calcula el número de compras y el importe de los ingresos de cada mes.',
    hints: [
      'Hay que contar cuántas compras hubo y por qué importe, para cada mes natural.',
      "DATE_TRUNC('month', ...) recorta la fecha de compra hasta el primer día del mes; COUNT(*) cuenta las compras y SUM(amount) con ROUND da el importe redondeado a céntimos.",
      "Plantilla: SELECT DATE_TRUNC('month', purchase_date)::date AS month, COUNT(*) AS purchases, ROUND(SUM(amount), 2) AS revenue FROM app_purchases GROUP BY DATE_TRUNC('month', purchase_date) ORDER BY month;",
    ],
    explanation:
      'Para qué sirve ROUND(SUM(amount), 2): NUMERIC suma de forma exacta, pero una suma de céntimos deja una cola larga, y un informe de dinero se redondea a céntimos de forma explícita. Medido: 18 meses, desde 72,12 en enero de 2023.',
  },

  'L8-avg-check-by-country': {
    title: 'El ticket medio por país',
    context:
      'Alguien de ventas compara los países no por los ingresos totales, sino por lo grande que es el ticket que deja un comprador en una compra.',
    taskText:
      'Calcula el número de compras y el ticket medio de cada país del usuario, redondeando la media a céntimos.',
    hints: [
      'Hay que contar cuántas compras se hicieron en cada país y a qué importe medio sale una compra, redondeándolo a céntimos.',
      'JOIN añade a la compra el país del usuario, GROUP BY junta las compras en montones por país, y AVG con ROUND calcula el importe medio del montón.',
      'Plantilla: SELECT u.country, COUNT(*) AS purchases, ROUND(AVG(p.amount), 2) AS avg_check FROM app_purchases AS p JOIN app_users AS u ON u.user_id = p.user_id GROUP BY u.country ORDER BY avg_check DESC;',
    ],
    explanation:
      'El ticket medio y los ingresos totales responden a preguntas distintas: Ucrania da el mayor número de compras (73) pero a la vez el ticket medio más bajo (137,95), y Estados Unidos es lo contrario: solo 37 compras con la media más alta (210,29). Aquí el país con más compras y el país con el ticket medio más alto son países distintos, y no se pueden confundir las dos clasificaciones. Medido: 6 filas, una por país.',
  },

  'L8-buyers-by-channel': {
    title: 'Cuántos usuarios de un canal llegan a comprar',
    context:
      'Alguien de marketing valora los canales de captación no por el número de personas, sino por qué parte de ellas compra algo.',
    taskText:
      'Para cada canal de captación, cuenta cuántos usuarios llegaron y cuántos de ellos hicieron al menos una compra.',
    hints: [
      'Cada canal de captación necesita dos números a la vez: cuánta gente llegó por él y cuántos de ellos compraron algo al menos una vez.',
      'LEFT JOIN conserva en el resultado también a los usuarios que no tienen ninguna compra; COUNT(DISTINCT ...) cuenta a cada usuario una vez, aunque tenga varias compras.',
      'Plantilla: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, COUNT(DISTINCT p.user_id) AS buyers FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY users DESC;',
    ],
    explanation:
      'Por qué un LEFT JOIN y no un JOIN normal: con un JOIN normal, un usuario sin ninguna compra desaparecería de la respuesta junto con su fila en el denominador, y el canal parecería más pequeño de lo que es. Por qué los dos COUNT llevan DISTINCT: tras la unión, un usuario con tres compras da tres filas, y sin DISTINCT se contaría tres veces. Medido: organic 86 usuarios y 61 compradores, ads 59/40, email 30/17, referral 25/18.',
  },

  'L8-ltv-by-channel': {
    title: 'LTV por canal de captación',
    context:
      'Alguien de producto quiere comparar los canales de captación por el dinero que aporta un usuario captado, y no solo por el número de compradores.',
    taskText:
      'Calcula el LTV de cada canal de captación: el importe medio de compras por usuario registrado, incluidos los que no compraron nada.',
    hints: [
      'Hay que calcular cuánto dinero aporta de media al canal un usuario captado, tanto el que compró como el que no.',
      'SUM(p.amount) tras un LEFT JOIN da el importe total de compras del canal, COALESCE pone un cero donde no hubo compras, y dividir por COUNT(DISTINCT u.user_id) —todos los registrados— da la media por persona.',
      'Plantilla: SELECT u.channel, COUNT(DISTINCT u.user_id) AS users, ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT u.user_id), 2) AS ltv FROM app_users AS u LEFT JOIN app_purchases AS p ON p.user_id = u.user_id GROUP BY u.channel ORDER BY ltv DESC;',
    ],
    explanation:
      'El denominador aquí son todos los usuarios registrados del canal y no solo los compradores: de otro modo saldría el ticket medio de un comprador y no el rendimiento del canal por cada persona captada. COALESCE salva de un NULL en el numerador al canal sin ninguna compra. Medido: organic 247,27, referral 240,16, email 210,40, ads 192,19; y el canal más grande (organic, 86 usuarios) resulta ser a la vez el mejor por rendimiento, algo que no siempre pasa.',
  },

  'L8-step-conversion': {
    title: 'Conversión paso a paso',
    context:
      'Alguien de analítica de producto quiere encontrar en qué transición exacta del embudo la aplicación pierde más gente, y no solo ver las cifras generales por paso.',
    taskText:
      'Cuenta el número de eventos de cada tipo y, para cada paso menos el primero, qué parte del paso anterior representa, en porcentaje redondeado a un decimal.',
    hints: [
      'Primero cuenta cuántas veces ocurrió cada acción y coloca los pasos del más común al más raro. Después, para cada paso menos el primero, calcula qué parte del paso anterior representa en porcentaje.',
      'Un CTE cuenta los eventos por paso aparte, y la función de ventana LAG(events) OVER (ORDER BY events DESC) mira la cantidad de la fila anterior de la ventana: con ella se compara el paso actual.',
      'Plantilla: WITH funnel AS (SELECT event_type, COUNT(*) AS events FROM app_events GROUP BY event_type) SELECT event_type, events, ROUND(100.0 * events / LAG(events) OVER (ORDER BY events DESC), 1) AS step_conversion FROM funnel ORDER BY events DESC;',
    ],
    explanation:
      'En la primera fila (visit) step_conversion es NULL: no hay paso anterior, y ese es el resultado correcto y no una avería. La ordenación descendente por cantidad coincide aquí con el orden del embudo solo porque cada paso siguiente es un subconjunto del anterior (a checkout solo se llega pasando por add_to_cart); si la cantidad de un paso pudiera crecer, habría que sustituir ORDER BY events DESC por un orden de pasos explícito. Multiplicar esos cuatro porcentajes y decir «la conversión de extremo a extremo es del 71 %» es un error: 71,0 % × 64,2 % × 68,9 % × 73,5 % dan alrededor del 23 % y no del 71 %, y esa es la parte de los primeros visitantes que llega de verdad a comprar. Medido: 71,0 / 64,2 / 68,9 / 73,5.',
  },

  'L8-first-month-retention': {
    title: 'Retención del primer mes por cohortes',
    context:
      'Alguien de producto quiere saber si los usuarios nuevos vuelven en el primer mes siguiente al registro, y no solo cuántos llegaron.',
    taskText:
      'Para cada cohorte de registro (un mes), cuenta el tamaño de la cohorte, cuántos de sus usuarios hicieron al menos una acción exactamente en el mes natural siguiente y qué parte representa eso en porcentaje.',
    hints: [
      'Divide a los usuarios en grupos por mes de registro. Para cada grupo, comprueba si la persona hizo algo en la aplicación justo en el mes natural siguiente al registro, y calcula esa parte del grupo completo.',
      "El primer CTE determina la cohorte de cada usuario con DATE_TRUNC('month', signup_date), y el segundo selecciona con DISTINCT a quienes tienen un evento exactamente en cohort_month + INTERVAL '1 month'; un LEFT JOIN de esos dos CTE no pierde la cohorte que no tuvo retornos.",
      "Plantilla: WITH cohort AS (SELECT user_id, DATE_TRUNC('month', signup_date) AS cohort_month FROM app_users), retained AS (SELECT DISTINCT c.user_id, c.cohort_month FROM cohort AS c JOIN app_events AS e ON e.user_id = c.user_id WHERE DATE_TRUNC('month', e.occurred_at) = c.cohort_month + INTERVAL '1 month') SELECT c.cohort_month::date AS cohort_month, COUNT(*) AS cohort_size, COUNT(r.user_id) AS retained, ROUND(100.0 * COUNT(r.user_id) / COUNT(*), 1) AS retention_rate FROM cohort AS c LEFT JOIN retained AS r ON r.user_id = c.user_id GROUP BY c.cohort_month ORDER BY cohort_month;",
    ],
    explanation:
      'Aquí el LEFT JOIN es obligatorio: con un JOIN normal, una cohorte en la que no volvió ningún usuario desaparecería de la respuesta junto con su fila, aunque tiene que mostrar 0 %. El DISTINCT de retained evita que un usuario con varios eventos en el mes siguiente se cuente varias veces; sin él, una cohorte podría mostrar una retención de más del 100 %. La última cohorte, 2024-06, muestra 0 % no por un fracaso del producto: simplemente no tiene mes natural siguiente en los datos (los datos acaban el 2024-06-30), así que comprobar sus retornos es imposible por principio. Medido: 18 filas, desde el 42,9 % en enero de 2023.',
  },

  'L8-rfm-quartiles': {
    title: 'Cuartiles RFM de los compradores',
    context:
      'Alguien de marketing quiere repartir a los compradores en grupos según tres rasgos distintos a la vez para combinar después los segmentos.',
    taskText:
      'Para cada comprador, calcula la fecha de su última compra, el número de compras y el importe, y después reparte a los compradores en cuatro grupos iguales por separado según cada uno de esos tres rasgos.',
    hints: [
      'Primero halla para cada comprador la fecha de su última compra, el número de compras y el importe total. Después divide a todos los compradores en cuatro grupos iguales: por separado según lo reciente de la última compra, por separado según el número de compras y por separado según el importe.',
      'NTILE(4) OVER (ORDER BY ...) divide a los compradores ordenados en cuatro grupos de forma que cada uno tenga aproximadamente la misma gente; tres NTILE separados en un mismo SELECT se calculan de forma independiente, cada uno con su propio ORDER BY.',
      'Plantilla: WITH base AS (SELECT user_id, MAX(purchase_date) AS last_purchase, COUNT(*) AS frequency, SUM(amount) AS monetary FROM app_purchases GROUP BY user_id) SELECT user_id, NTILE(4) OVER (ORDER BY last_purchase) AS recency_quartile, NTILE(4) OVER (ORDER BY frequency) AS frequency_quartile, NTILE(4) OVER (ORDER BY monetary) AS monetary_quartile FROM base ORDER BY user_id;',
    ],
    explanation:
      'NTILE(4) divide a los compradores en cuartiles por el número de personas de cada grupo y no por el tamaño del valor: los límites de los grupos se ajustan a los datos para que en cada cuartil haya aproximadamente los mismos compradores, no para que el rango de valores sea igual. Tres NTILE en un mismo SELECT son tres ventanas independientes, cada una con su propio ORDER BY, así que el mismo comprador puede perfectamente caer en el primer cuartil por frecuencia y en el cuarto por importe a la vez. Medido: 136 filas, una por comprador.',
  },

  'L8-repeat-buyer-share': {
    title: 'Cuántos compradores vuelven por una segunda compra',
    caseStudyTitle: 'Análisis de la conversión de usuarios',
    context:
      'El equipo quiere entender qué pasa con un usuario después de su primera compra y empieza la investigación por el número más sencillo: qué parte de los compradores vuelve por una segunda.',
    taskText:
      'Cuenta el número total de compradores, cuántos de ellos hicieron dos compras o más y qué parte representa eso en porcentaje, redondeado a un decimal.',
    hints: [
      'Primero cuenta cuántas compras hizo cada comprador. Después cuenta a todos los compradores, aparte a los que tienen dos compras o más, y qué parte representan estos últimos del total.',
      'FILTER (WHERE …) permite que COUNT(*) cuente solo el subconjunto de filas que cumple una condición, y lo hace en la misma pasada que el recuento general.',
      'Plantilla: WITH buyer_purchases AS (SELECT user_id, COUNT(*) AS purchases FROM app_purchases GROUP BY user_id) SELECT COUNT(*) AS buyers, COUNT(*) FILTER (WHERE purchases >= 2) AS repeat_buyers, ROUND(100.0 * COUNT(*) FILTER (WHERE purchases >= 2) / COUNT(*), 1) AS repeat_rate FROM buyer_purchases;',
    ],
    explanation:
      'El denominador aquí son los compradores y no todos los usuarios registrados: la pregunta del retorno solo tiene sentido para quienes ya compraron al menos una vez. FILTER (WHERE …) cuenta el subconjunto en la misma pasada que el COUNT(*) general, así que los dos números salen de una sola consulta y no pueden descuadrarse entre sí. Medido: 136 compradores, 80 repetidores, 58,8 %.',
  },

  'L8-days-to-second-purchase': {
    title: 'Cuánto tiempo pasa hasta la segunda compra',
    caseStudyTitle: 'Análisis de la conversión de usuarios',
    context:
      'El primer paso mostró que más de la mitad de los compradores vuelve. Queda entender cuándo ocurre exactamente, para que el equipo sepa cuándo recordar la segunda compra.',
    taskText:
      'Para los compradores con dos compras o más, cuenta cuántos son y el número medio de días entre la primera y la segunda compra, redondeado a un decimal.',
    hints: [
      'Para cada comprador, numera sus compras por fecha de la primera a la última. Después junta en una misma fila la compra número uno y la compra número dos del mismo comprador y calcula la diferencia de fechas.',
      'ROW_NUMBER() con PARTITION BY user_id numera las compras dentro de cada comprador por separado; la segunda clave purchase_id del ORDER BY hace falta porque dos compras pueden caer el mismo día, y sin ella «la primera» sería arbitraria.',
      'Plantilla: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT COUNT(*) AS repeat_buyers, ROUND(AVG(later.purchase_date - first_buy.purchase_date), 1) AS avg_days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1;',
    ],
    explanation:
      'ROW_NUMBER() con PARTITION BY user_id numera las compras dentro de cada comprador por separado y no de corrido por toda la tabla, así que el número 1 y el número 2 siempre significan la primera y la segunda compra de esa persona concreta. La segunda clave purchase_id del ORDER BY no es cosmética: dos compras de un mismo usuario pueden caer el mismo día, y sin esa clave cuál de ellas cuenta como primera sería cuestión de azar, y de eso depende toda la respuesta. Unir la tabla ranked consigo misma por los números 1 y 2 es la forma estándar de poner dos eventos de un usuario en una misma fila para calcular la diferencia entre ellos. Restar dos DATE en PostgreSQL da un número entero de días. Medido: 80 usuarios, 67,9 días.',
  },

  'L8-repeat-purchase-products': {
    title: 'Qué compran cuando vuelven',
    caseStudyTitle: 'Análisis de la conversión de usuarios',
    context:
      'El equipo ya sabe que vuelve el 58,8 % de los compradores y que lo hace de media en 67,9 días. Queda una pregunta: ¿con qué producto vuelve la gente?',
    taskText:
      'Para cada producto, cuenta cuántas veces se compró sin ser la primera compra del usuario, y muestra el resultado del producto de retorno más popular al menos popular.',
    hints: [
      'Para cada producto, cuenta cuántas veces se compró en un momento en que la persona ya tenía alguna compra anterior, es decir en un retorno y no por primera vez.',
      'ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) numera las compras de cada usuario por separado desde 1; WHERE purchase_number >= 2 deja solo las compras que no son la primera de su comprador.',
      'Plantilla: WITH ranked AS (SELECT product_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases) SELECT pr.product_name, COUNT(*) AS repeat_purchases FROM ranked AS r JOIN products AS pr ON pr.product_id = r.product_id WHERE r.purchase_number >= 2 GROUP BY pr.product_name ORDER BY repeat_purchases DESC, pr.product_name;',
    ],
    explanation:
      'No se cuentan todas las compras de un producto, sino solo las que no son la primera de su usuario: ROW_NUMBER() numera las compras dentro de cada usuario y WHERE purchase_number >= 2 deja solo los retornos. Conviene reconocer con honestidad que esta es una de las formas de leer la pregunta: responde a «con qué producto vuelve la gente» y no a «qué producto se compra dos veces seguidas»; el mismo producto comprado tras una compra completamente distinta medio año antes cuenta aquí igualmente como retorno. Medido: 25 productos, de 9 compras repetidas a 2.',
  },

  'L8-conversion-report-by-channel': {
    title: 'Informe final de retornos por canal',
    caseStudyTitle: 'Análisis de la conversión de usuarios',
    context:
      'Los tres pasos anteriores calcularon la parte de retornos, el tiempo hasta la segunda compra y el producto de retorno para todo el producto junto. El final del caso es lo mismo desglosado por canal de captación, para ver qué canal trae a la gente que vuelve de verdad.',
    taskText:
      'Para cada canal de captación, cuenta el número de compradores, cuántos de ellos hicieron una segunda compra, qué parte representan en porcentaje (redondeado a un decimal) y cuántos días pasan de media hasta la segunda compra (redondeado a un decimal).',
    hints: [
      'Para cada canal de captación, cuenta cuánta gente compró en general, cuántos de ellos compraron una segunda vez, qué parte representa eso en porcentaje y cuántos días pasan de media entre la primera y la segunda compra.',
      'Los tres CTE de aquí son en esencia los tres pasos anteriores del caso: ranked numera las compras del usuario, buyers enumera a los compradores únicos y second_gap junta la primera y la segunda compra en una fila; un LEFT JOIN engancha second_gap de forma que los compradores sin segunda compra no desaparezcan del resultado.',
      'Plantilla: WITH ranked AS (SELECT user_id, purchase_date, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY purchase_date, purchase_id) AS purchase_number FROM app_purchases), buyers AS (SELECT DISTINCT user_id FROM app_purchases), second_gap AS (SELECT first_buy.user_id, later.purchase_date - first_buy.purchase_date AS days_to_second FROM ranked AS first_buy JOIN ranked AS later ON later.user_id = first_buy.user_id AND later.purchase_number = 2 WHERE first_buy.purchase_number = 1) SELECT u.channel, COUNT(*) AS buyers, COUNT(g.user_id) AS repeat_buyers, ROUND(100.0 * COUNT(g.user_id) / COUNT(*), 1) AS repeat_rate, ROUND(AVG(g.days_to_second), 1) AS avg_days_to_second FROM buyers AS b JOIN app_users AS u ON u.user_id = b.user_id LEFT JOIN second_gap AS g ON g.user_id = b.user_id GROUP BY u.channel ORDER BY u.channel;',
    ],
    explanation:
      'Cada CTE de aquí es la solución de uno de los pasos anteriores del caso, reunida en un solo informe: ranked y second_gap calculan cuándo llega la segunda compra y buyers enumera a quienes compraron en general. El LEFT JOIN con second_gap es obligatorio: los compradores sin segunda compra tienen que quedarse en el denominador, porque si no la reputación del canal mejora de forma artificial. COUNT(g.user_id) cuenta solo los valores no vacíos y por eso da exactamente el número de compradores repetidores y no de todos. La conclusión por la que se montó el caso: organic da a la vez el mayor número de compradores (61) y la mayor parte de retornos (65,6 %), mientras que ads, con 40 compradores, retiene dos veces peor (50,0 %); el canal que trae más gente no trae necesariamente a la más fiel. Medido: ads 40/20/50,0/73,9, email 17/9/52,9/56,3, organic 61/40/65,6/70,4, referral 18/11/61,1/57,5.',
  },
};
