# Quick look of PostgreSQL syntax

## CheatSheet

### 1. Create Database

```sql
-- CREATE
CREATE DATABASE mydb;
-- DELETE
DROP DATABASE mydb;
-- CONNECT TO DATABASE
\c mydb;
-- LIST DATABASES
\l
```

### 2. Create Table

```sql
-- TABLE OPERATION
CREATE TABLE employees (
  employee_id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) UNIQUE,
  last_name VARCHAR(50),
  hourly_pay DECIMAL(5, 2) NOT NULL,
  month_pay DECIMAL(5, 2) DEFAULT 0,
  hire_date DATE,
  transaction_date TIMESTAMP DEFAULT NOW(),
  
  customer_id INT,
  FOREIGN KEY(customer_id) REFERENCES customers(customer_id) -- connect to custom table customer_id
  ON DELETE SET NULL,
  
  CONSTRAINT chk_hourly_pay CHECK (hourly_pay >= 10.00)
);

SELECT * FROM employees;

-- RENAME TABLE
ALTER TABLE workers RENAME TO employees;

-- DROP TABLE
DROP TABLE employees;

-- DROP COLUMN
ALTER TABLE employees DROP COLUMN email;

-- ADD FIELD
ALTER TABLE employees 
ADD COLUMN phone_number VARCHAR(15);

-- MODIFY COLUMN
ALTER TABLE employees 
ALTER COLUMN email TYPE VARCHAR(100);

-- ADD COLUMN AT SPECIFIC POSITION (PostgreSQL doesn't support AFTER, need to recreate table)
SELECT * FROM employees;
```

### 3. Column Value Operations

```sql
-- COLUMN VALUE OPERATION

INSERT INTO employees
VALUES (1, 'E1', 'E11', 35.50, 0, '2023-01-03'),
       (2, 'E2', 'E21', 45.50, 0, '2023-01-04'),
       (3, 'E3', 'E31', 55.50, 0, '2023-01-05'),
       (4, 'E4', 'E41', 65.50, 0, '2023-01-06');

SELECT * FROM employees;

-- DEFINED SPECIFIC COLUMN TO INSERT
INSERT INTO employees(first_name, last_name)
VALUES ('E1', 'E11');

-- ADD TIME
INSERT INTO test
VALUES(CURRENT_DATE, CURRENT_TIME, NOW());

-- UPSERT (INSERT OR UPDATE)
INSERT INTO employees(employee_id, first_name, last_name, hourly_pay)
VALUES (1, 'John', 'Doe', 25.00)
ON CONFLICT (employee_id) 
DO UPDATE SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  hourly_pay = EXCLUDED.hourly_pay;
```

### 4. Query

```sql
-- FLEXIBILITY QUERY

SELECT last_name, first_name -- or SELECT *
FROM employees
-- can also like: xx_field = 'xxx', ><= xxx, !=xxx, IS/IS NOT NULL, 
WHERE employee_id = 1; 

-- We can add logic conditions here:
WHERE hire_date < '2024-01-01' AND job = 'cook';
WHERE NOT job = 'manager' AND NOT job = 'assistant';
WHERE hire_date BETWEEN '2025-01-04' AND '2025-02-05';
WHERE job IN ('cook', 'cashier', 'janitor');

-- Wild card characters
WHERE first_name LIKE 's%'; -- find names starting with 's'
WHERE first_name ILIKE 's%'; -- case-insensitive LIKE
WHERE hire_date::text LIKE '____-01-__'; -- in the middle, each unknown as a _

-- Regular expressions
WHERE first_name ~ '^[A-Z].*'; -- starts with uppercase letter
WHERE first_name ~* '^john'; -- case-insensitive regex

-- Order sequence
ORDER BY last_name ASC; -- or DESC
ORDER BY amount, customer_id; -- by multiple fields

-- Limit and Offset
LIMIT 3; -- limit 3 records
OFFSET 3; -- skip first 3 records
LIMIT 3 OFFSET 3; -- pagination: skip 3, take 3

-- !!! SubQuery
SELECT first_name, last_name, hourly_pay,
    (SELECT AVG(hourly_pay) FROM employees) AS avg_pay
FROM employees;

SELECT first_name, last_name
FROM customers
WHERE customer_id IN
(SELECT DISTINCT customer_id
FROM transactions
WHERE customer_id IS NOT NULL);

-- Common Table Expressions (CTE)
WITH avg_salary AS (
  SELECT AVG(hourly_pay) as avg_pay FROM employees
)
SELECT e.first_name, e.last_name, e.hourly_pay
FROM employees e, avg_salary a
WHERE e.hourly_pay > a.avg_pay;
```

### 5. Update and Delete

```sql
-- !UPDATE and DELETE
UPDATE employees
SET hourly_pay = 10.25,
    hire_date = '2023-01-07'
WHERE employee_id = 6;

SELECT * FROM employees;

-- !Add Constraints
ALTER TABLE products
ADD CONSTRAINT unique_product_name UNIQUE(product_name);

-- Other constraints
ALTER TABLE employees 
ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE employees
ADD CONSTRAINT chk_hourly_pay CHECK (hourly_pay >= 10.00);

ALTER TABLE employees
DROP CONSTRAINT chk_hourly_pay;

-- FOREIGN KEY with CASCADE
ALTER TABLE transactions
ADD CONSTRAINT fk_customer_id
FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
ON DELETE SET NULL; -- or ON DELETE CASCADE

-- !DELETE - remember add WHERE otherwise you delete all
DELETE FROM employees
WHERE employee_id = 6;

SELECT * FROM employees;
```

### 6. Join

```sql
-- JOIN
SELECT * -- or specific columns: transaction_id, first_name, last_name
FROM transactions 
INNER JOIN customers ON transactions.customer_id = customers.customer_id;

-- example with multiple joins
SELECT project.name
FROM users
JOIN bids ON users.id = bids.creator_id
JOIN projects ON bids.project_id = projects.id
WHERE users.username = 'Bob' AND bids.is_awarded = true;

-- ! UNION to combine without duplicates
SELECT first_name, last_name FROM customers
UNION
SELECT first_name, last_name FROM employees;

-- UNION ALL (includes duplicates)
SELECT first_name, last_name FROM customers
UNION ALL
SELECT first_name, last_name FROM employees;

-- Self Join
SELECT a.customer_id, a.first_name, a.last_name,
    CONCAT(b.first_name, ' ', b.last_name) AS "referred_by"
FROM customers AS a
LEFT JOIN customers AS b  -- LEFT JOIN shows all records from left table
ON a.referral_id = b.customer_id;

-- FULL OUTER JOIN (PostgreSQL specific)
SELECT *
FROM table1 t1
FULL OUTER JOIN table2 t2 ON t1.id = t2.id;
```

### 7. Functions

```sql
-- AGGREGATE FUNCTIONS
SELECT COUNT(amount) AS 'today_transactions'
-- also: MIN(amount), MAX(), AVG(), SUM(), STDDEV(), VARIANCE()
FROM transactions;

-- STRING FUNCTIONS
SELECT CONCAT(first_name, ' ', last_name) AS full_name
FROM employees;

-- PostgreSQL specific string functions
SELECT 
  UPPER(first_name) AS upper_name,
  LOWER(last_name) AS lower_name,
  LENGTH(first_name) AS name_length,
  SUBSTRING(first_name, 1, 3) AS first_three_chars
FROM employees;

-- DATE FUNCTIONS
SELECT 
  EXTRACT(YEAR FROM hire_date) AS hire_year,
  AGE(NOW(), hire_date) AS employment_duration,
  DATE_TRUNC('month', hire_date) AS hire_month
FROM employees;

-- GROUP BY & ROLLUP
SELECT SUM(amount), order_date
FROM transactions
GROUP BY order_date;

-- ROLLUP (PostgreSQL syntax)
SELECT SUM(amount), order_date
FROM transactions
GROUP BY ROLLUP(order_date);

-- WINDOW FUNCTIONS (PostgreSQL advanced feature)
SELECT 
  first_name, 
  last_name, 
  hourly_pay,
  ROW_NUMBER() OVER (ORDER BY hourly_pay DESC) AS pay_rank,
  LAG(hourly_pay) OVER (ORDER BY hourly_pay) AS previous_pay
FROM employees;
```

### 8. Views

```sql
-- ! CREATE VIEW
CREATE VIEW employee_attendance AS
SELECT first_name, last_name, hire_date
FROM employees;

SELECT * FROM employee_attendance;

-- MATERIALIZED VIEW (PostgreSQL specific - stores result physically)
CREATE MATERIALIZED VIEW mv_employee_stats AS
SELECT 
  department,
  AVG(hourly_pay) as avg_pay,
  COUNT(*) as employee_count
FROM employees
GROUP BY department;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_employee_stats;

-- DROP VIEW
DROP VIEW employee_attendance;
DROP MATERIALIZED VIEW mv_employee_stats;
```

### 9. Index

```sql
-- BTree data structure (default in PostgreSQL)
-- updates take more time, selects take less time
-- indexes are used to find values within a specific column more quickly

-- Show indexes
\d+ customers  -- or
SELECT * FROM pg_indexes WHERE tablename = 'customers';

-- Create index
CREATE INDEX idx_last_name ON customers(last_name);

SELECT * FROM customers
WHERE last_name = 'allen'; -- this select would be faster

-- Drop index
DROP INDEX idx_last_name;

-- Multiple column index
CREATE INDEX idx_last_first_name ON customers(last_name, first_name);

-- Partial index (PostgreSQL specific)
CREATE INDEX idx_active_customers ON customers(last_name) 
WHERE active = true;

-- GIN index for full-text search
CREATE INDEX idx_fulltext ON articles 
USING GIN(to_tsvector('english', content));

-- Hash index (for equality comparisons only)
CREATE INDEX idx_hash_email ON customers USING HASH(email);
```

### 10. Stored Procedures & Functions

```sql
-- FUNCTION (PostgreSQL uses functions instead of stored procedures)
CREATE OR REPLACE FUNCTION find_customers(id_param INT)
RETURNS TABLE(customer_id INT, first_name VARCHAR, last_name VARCHAR)
LANGUAGE SQL
AS $$
  SELECT c.customer_id, c.first_name, c.last_name 
  FROM customers c
  WHERE c.customer_id = id_param;
$$;

-- Call function
SELECT * FROM find_customers(1);

-- PL/pgSQL function with logic
CREATE OR REPLACE FUNCTION calculate_bonus(emp_id INT)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  bonus DECIMAL;
  years_worked INT;
BEGIN
  SELECT EXTRACT(YEAR FROM AGE(NOW(), hire_date)) 
  INTO years_worked
  FROM employees 
  WHERE employee_id = emp_id;
  
  IF years_worked > 5 THEN
    bonus := 1000;
  ELSE
    bonus := 500;
  END IF;
  
  RETURN bonus;
END;
$$;

-- Call the function
SELECT calculate_bonus(1);

-- Drop function
DROP FUNCTION find_customers(INT);
```

### 11. Triggers

```sql
-- When an event happens, do something
CREATE OR REPLACE FUNCTION update_salary_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.salary := NEW.hourly_pay * 2080;
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_hourly_pay_update
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_trigger();

-- Drop trigger
DROP TRIGGER before_hourly_pay_update ON employees;
```

### 12. Transactions & Safety

```sql
-- Start transaction
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Commit if everything is OK
COMMIT;

-- Or rollback if there's an error
ROLLBACK;

-- Savepoints
BEGIN;
INSERT INTO test VALUES (1);
SAVEPOINT sp1;
INSERT INTO test VALUES (2);
ROLLBACK TO sp1;  -- Only rollback to savepoint
COMMIT;
```

### 13. PostgreSQL Specific Features

```sql
-- ARRAYS
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  tags TEXT[]
);

INSERT INTO products (name, tags) 
VALUES ('Laptop', ARRAY['electronics', 'computers', 'portable']);

SELECT * FROM products WHERE 'electronics' = ANY(tags);

-- JSON/JSONB
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  data JSONB
);

INSERT INTO users (data) 
VALUES ('{"name": "John", "age": 30, "city": "NYC"}');

SELECT data->>'name' as name, data->>'age' as age FROM users;

-- ENUM Types
CREATE TYPE mood AS ENUM ('sad', 'ok', 'happy');
CREATE TABLE person (
  id SERIAL PRIMARY KEY,
  current_mood mood
);

-- UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INT
);

-- Full-text search
SELECT * FROM articles 
WHERE to_tsvector('english', content) @@ to_tsquery('database & postgresql');
```

### 14. PostgreSQL Command Line (psql)

```bash
# Connect to database
psql -h localhost -U username -d database_name

# Common psql commands:
\l          # List databases
\c dbname   # Connect to database
\dt         # List tables
\d+ table   # Describe table
\df         # List functions
\q          # Quit
\h          # Help
\?          # List all commands

# Execute SQL file
\i /path/to/file.sql

# Export query result
\copy (SELECT * FROM users) TO '/path/to/file.csv' CSV HEADER;
```