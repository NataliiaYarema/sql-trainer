// Описи схем для карток завдань. Тримаємо їх в одному місці, щоб зміна колонки
// у fixtures.js не вимагала правити текст у десятках завдань.

export const EMPLOYEES_SCHEMA =
  'employees(employee_id INT, first_name TEXT, last_name TEXT, department TEXT, salary NUMERIC, hire_date DATE, manager_id INT)';

export const CUSTOMERS_SCHEMA = 'customers(customer_id INT, name TEXT, country TEXT)';

export const ORDERS_SCHEMA =
  'orders(order_id INT, customer_id INT, order_date DATE, amount NUMERIC, manager_id INT)';

export const PRODUCTS_SCHEMA =
  'products(product_id INT, product_name TEXT, category TEXT, price NUMERIC, stock INT)';

export const ORDER_ITEMS_SCHEMA =
  'order_items(order_item_id INT, order_id INT, product_id INT, quantity INT)';

export const RAW_CONTACTS_SCHEMA =
  'raw_contacts(contact_id INT, raw_name TEXT, raw_email TEXT, source TEXT)';

export const APP_USERS_SCHEMA =
  'app_users(user_id INT, signup_date DATE, country TEXT, channel TEXT)';

export const APP_EVENTS_SCHEMA =
  'app_events(event_id INT, session_id INT, user_id INT, event_type TEXT, occurred_at TIMESTAMP)';

export const APP_PURCHASES_SCHEMA =
  'app_purchases(purchase_id INT, user_id INT, product_id INT, purchase_date DATE, amount NUMERIC)';
