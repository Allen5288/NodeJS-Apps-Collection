-- Backend System with MySQL - Database Schema
-- Run this script to manually create the database and tables

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS backend_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE backend_system;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INT,
    city VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_users_email (email),
    INDEX idx_users_name (name),
    INDEX idx_users_city (city),
    INDEX idx_users_created_at (created_at)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(255),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_products_name (name),
    INDEX idx_products_category (category),
    INDEX idx_products_price (price),
    INDEX idx_products_stock (stock_quantity),
    INDEX idx_products_created_at (created_at)
);

-- Insert sample data for testing

-- Sample users
INSERT INTO users (name, email, age, city) VALUES
('John Doe', 'john.doe@example.com', 30, 'New York'),
('Jane Smith', 'jane.smith@example.com', 25, 'Los Angeles'),
('Mike Johnson', 'mike.johnson@example.com', 35, 'Chicago'),
('Sarah Wilson', 'sarah.wilson@example.com', 28, 'Houston'),
('David Brown', 'david.brown@example.com', 32, 'Phoenix');

-- Sample products
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('iPhone 14', 'Latest Apple smartphone with advanced features', 999.99, 'Electronics', 50),
('MacBook Pro', 'Powerful laptop for professionals', 2399.99, 'Electronics', 25),
('Nike Air Max', 'Comfortable running shoes', 129.99, 'Sports', 100),
('Samsung TV 55"', '4K Ultra HD Smart TV', 799.99, 'Electronics', 30),
('Coffee Maker', 'Automatic drip coffee maker', 89.99, 'Home', 75),
('Wireless Headphones', 'Noise-canceling Bluetooth headphones', 299.99, 'Electronics', 40),
('Yoga Mat', 'Premium non-slip yoga mat', 39.99, 'Sports', 200),
('Office Chair', 'Ergonomic office chair with lumbar support', 199.99, 'Office', 15),
('Smartphone Case', 'Protective case for iPhone', 19.99, 'Accessories', 500),
('Bluetooth Speaker', 'Portable wireless speaker', 79.99, 'Electronics', 60);

-- Show table structures
DESCRIBE users;
DESCRIBE products;

-- Show sample data count
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as record_count FROM products;
