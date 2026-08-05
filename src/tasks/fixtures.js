import { ANALYTICS_SQL } from './analyticsFixtures.js';

// manager_id посилається на employee_id керівника; у топменеджерів він NULL.
// Один співробітник навмисно без департаменту — для завдань на IS NULL.
export const EMPLOYEES_SQL = `
CREATE TABLE employees (
  employee_id INTEGER,
  first_name TEXT,
  last_name TEXT,
  department TEXT,
  salary NUMERIC,
  hire_date DATE,
  manager_id INTEGER
);
INSERT INTO employees (employee_id, first_name, last_name, department, salary, hire_date, manager_id) VALUES
  (1, 'Anna', 'Kovalenko', 'Sales', 5200, '2021-03-15', 8),
  (2, 'Ivan', 'Petrenko', 'Sales', 4800, '2022-06-01', 8),
  (3, 'Olena', 'Shevchenko', 'IT', 7200, '2020-01-10', NULL),
  (4, 'Petro', 'Bondar', 'IT', 6800, '2021-11-20', 3),
  (5, 'Maria', 'Tkachenko', 'HR', 5000, '2019-07-23', 6),
  (6, 'Dmytro', 'Kravets', 'HR', 5400, '2023-02-14', NULL),
  (7, 'Sofia', 'Melnyk', 'IT', 6100, '2022-09-05', 3),
  (8, 'Yuri', 'Moroz', 'Sales', 6000, '2020-12-01', NULL),
  (9, 'Halyna', 'Lysenko', 'Marketing', 5600, '2023-05-18', NULL),
  (10, 'Taras', 'Boiko', 'Marketing', 4900, '2024-01-09', 9),
  (11, 'Oksana', 'Rudenko', 'IT', 8100, '2018-04-02', NULL),
  (12, 'Bohdan', 'Savchuk', NULL, 4300, '2024-03-11', NULL);
`;

// Клієнт 8 навмисно без жодного замовлення — для LEFT JOIN та anti-join.
export const CUSTOMERS_SQL = `
CREATE TABLE customers (
  customer_id INTEGER,
  name TEXT,
  country TEXT
);
INSERT INTO customers (customer_id, name, country) VALUES
  (1, 'Nataliia Sydorenko', 'Ukraine'),
  (2, 'John Smith', 'USA'),
  (3, 'Marta Kowalska', 'Poland'),
  (4, 'Lukas Becker', 'Germany'),
  (5, 'Irene Popescu', 'Romania'),
  (6, 'Andrii Melnyk', 'Ukraine'),
  (7, 'Emily Clark', 'USA'),
  (8, 'Sofia Rossi', 'Italy');
`;

// Категорії навмисно різного розміру: Electronics (7) і Furniture (6) мають
// більше 5 позицій, Kitchen і Sports — дорогі, але нечисленні. Це дає
// нетривіальний результат у завданнях з двома умовами в HAVING.
export const PRODUCTS_SQL = `
CREATE TABLE products (
  product_id INTEGER,
  product_name TEXT,
  category TEXT,
  price NUMERIC,
  stock INTEGER
);
INSERT INTO products (product_id, product_name, category, price, stock) VALUES
  (1, 'Wireless Mouse', 'Electronics', 25.00, 120),
  (2, 'Mechanical Keyboard', 'Electronics', 89.00, 45),
  (3, 'USB-C Hub', 'Electronics', 55.00, 30),
  (4, '4K Monitor', 'Electronics', 320.00, 12),
  (5, 'Noise-Cancelling Headphones', 'Electronics', 149.00, 8),
  (6, 'Docking Station', 'Electronics', 210.00, 60),
  (7, 'HD Webcam', 'Electronics', 75.00, 25),
  (8, 'Office Chair', 'Furniture', 210.00, 18),
  (9, 'Desk Lamp', 'Furniture', 45.50, 90),
  (10, 'Standing Desk', 'Furniture', 430.00, 5),
  (11, 'Bookshelf', 'Furniture', 120.00, 22),
  (12, 'Filing Cabinet', 'Furniture', 89.00, 40),
  (13, 'Meeting Table', 'Furniture', 310.00, 3),
  (14, 'Notebook Set', 'Stationery', 12.00, 200),
  (15, 'Gel Pen Pack', 'Stationery', 6.50, 350),
  (16, 'Sticky Notes', 'Stationery', 4.20, 500),
  (17, 'Whiteboard Markers', 'Stationery', 9.80, 75),
  (18, 'Document Folder', 'Stationery', 15.00, 130),
  (19, 'Coffee Machine', 'Kitchen', 380.00, 7),
  (20, 'Electric Kettle', 'Kitchen', 65.00, 35),
  (21, 'Water Filter', 'Kitchen', 110.00, 20),
  (22, 'Mug Set', 'Kitchen', 28.00, 95),
  (23, 'Yoga Mat', 'Sports', 35.00, 60),
  (24, 'Dumbbell Set', 'Sports', 145.00, 15),
  (25, 'Fitness Tracker', 'Sports', 199.00, 28);
`;

// manager_id — продавець, що вів замовлення (employee_id зі Sales: 1, 2, 8).
// Замовлення 31 навмисно посилається на неіснуючого співробітника 99: це
// «менеджер, який уже звільнився». Без такого рядка FULL OUTER JOIN не мав би
// сиріт із правого боку й нічим не відрізнявся б від LEFT JOIN.
export const ORDERS_SQL = `
CREATE TABLE orders (
  order_id INTEGER,
  customer_id INTEGER,
  order_date DATE,
  amount NUMERIC,
  manager_id INTEGER
);
INSERT INTO orders (order_id, customer_id, order_date, amount, manager_id) VALUES
  (1, 1, '2024-01-05', 120.50, 1),
  (2, 2, '2024-01-18', 75.00, 2),
  (3, 1, '2024-01-26', 200.00, 1),
  (4, 3, '2024-02-02', 50.25, 8),
  (5, 2, '2024-02-10', 310.00, 2),
  (6, 4, '2024-02-15', 99.99, 1),
  (7, 1, '2024-02-22', 150.00, 8),
  (8, 3, '2024-03-01', 60.00, 2),
  (9, 6, '2024-03-08', 410.00, 1),
  (10, 2, '2024-03-14', 45.50, 2),
  (11, 7, '2024-03-21', 180.00, 8),
  (12, 6, '2024-03-29', 95.00, 1),
  (13, 1, '2024-04-03', 260.75, 8),
  (14, 4, '2024-04-11', 130.00, 2),
  (15, 5, '2024-04-17', 88.00, 1),
  (16, 3, '2024-04-24', 340.00, 8),
  (17, 2, '2024-05-02', 72.40, 2),
  (18, 6, '2024-05-09', 515.00, 1),
  (19, 7, '2024-05-16', 210.00, 8),
  (20, 1, '2024-05-23', 64.00, 1),
  (21, 4, '2024-05-30', 155.00, 2),
  (22, 5, '2024-06-04', 122.00, 8),
  (23, 2, '2024-06-11', 480.00, 2),
  (24, 6, '2024-06-18', 37.50, 1),
  (25, 3, '2024-06-25', 290.00, 8),
  (26, 7, '2024-06-27', 143.00, 2),
  (27, 1, '2024-06-28', 205.00, 1),
  (28, 4, '2024-06-29', 91.00, 8),
  (29, 5, '2024-06-30', 168.00, 1),
  (30, 2, '2024-06-30', 56.00, 2),
  (31, 5, '2024-05-20', 145.00, 99);
`;

export const ORDER_ITEMS_SQL = `
CREATE TABLE order_items (
  order_item_id INTEGER,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER
);
INSERT INTO order_items (order_item_id, order_id, product_id, quantity) VALUES
  (1, 1, 1, 2),
  (2, 1, 14, 3),
  (3, 2, 9, 1),
  (4, 3, 8, 1),
  (5, 3, 2, 1),
  (6, 4, 15, 4),
  (7, 5, 4, 1),
  (8, 6, 22, 2),
  (9, 7, 11, 1),
  (10, 7, 16, 5),
  (11, 8, 16, 3),
  (12, 9, 10, 1),
  (13, 9, 6, 2),
  (14, 10, 18, 2),
  (15, 11, 25, 1),
  (16, 12, 20, 1),
  (17, 13, 13, 1),
  (18, 13, 3, 2),
  (19, 14, 22, 1),
  (20, 15, 23, 2),
  (21, 16, 19, 1),
  (22, 17, 5, 1),
  (23, 18, 10, 1),
  (24, 18, 24, 1),
  (25, 19, 7, 2),
  (26, 20, 15, 6),
  (27, 21, 12, 1),
  (28, 22, 22, 3),
  (29, 23, 4, 1),
  (30, 23, 6, 1),
  (31, 24, 16, 4),
  (32, 25, 8, 1),
  (33, 26, 25, 1),
  (34, 27, 2, 2),
  (35, 27, 23, 1),
  (36, 28, 20, 1),
  (37, 29, 24, 1),
  (38, 30, 14, 2);
`;

// Єдина таблиця з навмисно неохайними даними: сирий імпорт із форми, який ще
// не почистили. Без такої таблиці рядкові завдання були б порожніми вправами —
// TRIM над охайним іменем повертає його ж, і завдання пройшло б тести, нічого
// не навчивши.
//
// Пробіли всередині імен — рівно подвійні. Це не випадковість: REPLACE(x, '  ', ' ')
// шукає пари й на трьох пробілах поспіль лишив би два, тому потрійні зіпсували б
// завдання про повне очищення.
export const RAW_CONTACTS_SQL = `
CREATE TABLE raw_contacts (
  contact_id INTEGER,
  raw_name TEXT,
  raw_email TEXT,
  source TEXT
);
INSERT INTO raw_contacts (contact_id, raw_name, raw_email, source) VALUES
  (1, '  anna kovalenko  ', 'ANNA.K@Example.COM', 'web/organic'),
  (2, 'IVAN PETRENKO', 'ivan.petrenko@Mail.UA', 'web/ads'),
  (3, 'Olena  Shevchenko', 'olena_s@Example.com', 'partner/referral'),
  (4, ' petro bondar', 'PETRO@Bondar.dev', 'web/organic'),
  (5, 'maria  tkachenko ', 'Maria.T@Example.COM', 'event/conference'),
  (6, 'DMYTRO kravets', 'd.kravets@mail.ua', 'partner/agency'),
  (7, 'sofia  melnyk  ', 'SOFIA@Melnyk.io', 'web/ads'),
  (8, '  halyna lysenko', 'halyna.l@Example.com', 'event/webinar'),
  (9, 'TARAS  BOIKO ', 'taras@Boiko.com.ua', 'partner/referral'),
  (10, 'oksana rudenko  ', 'Oksana.R@Example.COM', 'web/organic');
`;

// Застосунок тримає одну базу з усіма таблицями (див. src/db/sqlEngine.js),
// тому йому потрібен весь набір одним рядком. Тести натомість створюють базу
// з setupSql конкретного завдання — так перевіряється, що завдання
// обходиться саме тими таблицями, які показані користувачу.
export const ALL_FIXTURES_SQL = [
  EMPLOYEES_SQL,
  CUSTOMERS_SQL,
  PRODUCTS_SQL,
  ORDERS_SQL,
  ORDER_ITEMS_SQL,
  RAW_CONTACTS_SQL,
  ANALYTICS_SQL,
].join('\n');
