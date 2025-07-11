# Quick look of MySQL sytax

## cheatSHeet

### 1. Create Database

```sql
-- CREATE
CREATE DATABASE myDB;
-- DELETE
DROP DATABASE myDB;
-- read ONLY
ALTER DATABASE myDB READ ONLY = 1
```

### 2. Create Table

```sql
-- TABLE OPERATION
CREATE TABLE employees (
  employee_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(50) UNIQUE,
  last_name VARCHAR(50),
  hourly_pay DECIMAL(5, 2) NOT NULL,
  month_pay DECIMAL(5, 2) DEFAULT 0,
  hire_date DATE,
  transaction_date DATETIME DEFAULT NOW(),
  
  customer_id INT,
  FOREIGN KEY(customer_id) REFERENCES customers(customer_id) -- connect to custom table customer_i
  ON DELETE SET NULL
  
  CONSTRAINT chk_hourly_pay CHECK (hourly_pay >= 10.00)
);

SELECT * FROM employees

RENAME TABLE workers TO employees

DROP TABLE employees

DROP COLUMN email

-- ADD FIELD
ALTER TABLE employees
ADD phone_number VARCHAR(15)
MODIFY COLUMN email VARCHAR(100)

-- CHANGE PLACE
ALTER TABLE employees
MODIFY phone_number VARCHAR(30)
AFTER last_name; -- REMEMBER ADD ; FOR SEPERATE SQL SENTENCE

SELECT * FROM employees

```

### 3. Column Value Operate

```sql
-- COLUMN VALUE OPERATION

INSERT INTO employees
values (1, "E1", "E11", 35.50, "2023-01-03"),
(1, "E2", "E21", 45.50, "2023-01-04"),
(1, "E3", "E31", 55.50, "2023-01-05"),
(1, "E4", "E41", 65.50, "2023-01-06");

SELECT * FROM employees

-- DEFINED SPEICIFIC COLUMN TO INSERT
INSERT INTO employees(employee_id, first_name, last_name)
values (1, "E1", "E11");

-- ADD TIME
INSERT INTO test
VALUES(CURRENT_DATE(), CURRENT_TIME(), NOW());
```

### 4. Query

```sql
-- FLEXBILITY QUERY

SELECT last_name, first_name -- or SELECT *
FROM employees
-- can also like: xx_field = "xxx", ><= xxx, !=xxx, IS/IS NOT NULL, 
WHERE employee_id = 1; 

-- We can add logic condition here:
WHERE hire_date < "xxxx-xx-xx" AND/OR job = "cook";
WHERE NOT job = "manager" AND NOT job = "assit";
WHERE hire_date BETWEEN "2025-01-04" AND "2025-02-05"
WHERE job IN ("cook", "cashier", "janitor")

-- Wild card characters
WHERE first_name LIKE "s%" -- find the name start with s
WHERE hire_date LIKE "____-01-__" -- in the middle, each unknown as a _

-- Order sequence
ORDER BY last_name ASC/DESC
ORDER BY amount, customer_id -- by multiple requests

-- Limit
LIMIT 3 -- limit 3 number
LIMIT 3, 1 -- first param is offset, and second is limit number. used for pagnition

-- !!! SubQuery
SELECT first_name. last_name, hourly_pay,
    (SELECT AVG(hourly_pay) FROM employees) AS avg_pay
FROM employees;

SELECT first_name, last_name
FROM customers
WHERE customer_id IN
(SELECT DISTINCT customer_id
FROM transactions
WHERE customer_id IS NOT NULL);
```

### 5. Update and Delete

```sql
-- !UPDATE and DELETE
UPDATE employees
SET hourly_pay = 10.25,
    hire_date = "2023-01-07"
WHERE employee_id = 6;
SELECT * FROM employees;

-- !Add Constraint
ALTER TABLE products
ADD CONSTRAINT
UNIQUE(product_name);
-- Other things all can add constraint here
ALTER price SET DEFAULT 0;
ADD CONSTRAINT chk_hourly_pay CHECK (hourly_pay >= 10.00);
DROP CHECK chk_hourly_pay; -- throw that check
-- ALTER ON DELETE SET NULL
ALTER TABLE transactions
ADD CONSTRAINT fk_customer_id
FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
ON DELETE SET NULL -- delete but set null
-- OR: ON DELETE CASCADE -- delete row

-- !DELETE - remember add where otherwise you delete all
DELETE FROM employees
WHERE employee_id = 6;
SELECT * FROM employees 
```

### 6. Join

```sql
-- JOIN
SELECT * -- or we defineL: transaction_id, first_name, laster_name rather than * all
-- from is left, join is right
FROM transactions INNER JOIN customers
ON transactions.customer_id = customers.customer_id;

-- example
SELECT project.name
FROM user
JOIN bid ON user.id = bid.creator_id
JOIN project ON bid.project_id = project.id
WHERE user.username = 'Bob' AND bid.is_awarded = true;

-- ! UNION to combine without duplicate
SELECT first_name, last_name FROM customers
UNION
SELECT first_name, last_name FROM employees

-- Self Join
SELECT a. customer_id, a. first_name, b. last_name,
    CONCAT(b.first_name, " ", b.last_name) AS "referred_by"
FROM customers AS a
INNER JOIN customers AS b 
-- INNER JOIN if one has no value, do not show
-- LEFT JOIN if has no value, still show here
ON a.referral_id = b.customer_id
```

### 7. Function

```sql
-- FUNCTION
SELECT COUNT(amount) AS 'today transactions'
-- here alsoL MIN(amount), MAX(), AVG(), SUM(),
FROM transactions;

-- combine name example:
SELECT CONCAT(first_name, " ", last_name) AS full_name
FROM employees;

-- GROUP BY & ROOLUP
SELECT SUM(amount), order_date
FROM transactions
GROUP BY order_date WITH ROLLUP -- ROOLUP add a total
```

### 8. View

```sql
-- ! CREATE VIEW
CREATE VIEW employee_attendance AS
SELECT first_name, last_name
FROM employees;
SELECT * FROM employee_attendance;
... 
DROP VIEW employee_attendance ;
```

### 9. Index

```sql
-- BTree data structure
-- update take more time, select take less time
-- indexes are used to find values within a  specifoc column more quickly
SHOW INDEX from customers

CREATE INDEX last_name_idx
ON customers(last_name); -- as if we want lots of search on last_name

SELECT * FROM custoemrs
WHERE last_name = "allen" -- then this select would be more faster

DROP INDEX last_name_index

-- multiple column index
CREATE INDEX last_name_first_name_idx
ON customers(last_name, first_name); -- sequence is important, which is priority
```

### 10. Stored procedur

```sql
DELIMITER $$
CREATE PROCEDURE find_customers(IN id INT)
BEGIN
 SELECT * FROM custoemrs
 WHERE customer_id = id;
END$$
DELIMITER ;

-- call procedure
CALL find_customers()
```

### 11. Triggers

```sql
-- When an event happens, do something
CREATE TRIGGER before_hourly_pay_update
BEFORE UPDATE ON employees
FOR EACH ROW
SET NEW.salary = (NEW.hourly_pay * 2080);
```

### 12. For safety

```sql
COMMIT;
ROLLBACK;
```
