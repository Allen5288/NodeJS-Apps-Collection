const { pool } = require('../config/database');

class Product {
  // Get all products
  static async getAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get product by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create new product
  static async create(productData) {
    try {
      const { name, description, price, category, stock_quantity } = productData;
      const [result] = await pool.execute(
        'INSERT INTO products (name, description, price, category, stock_quantity) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, category, stock_quantity || 0]
      );
      
      // Return the created product
      return await this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Update product
  static async update(id, productData) {
    try {
      const { name, description, price, category, stock_quantity } = productData;
      const [result] = await pool.execute(
        'UPDATE products SET name = ?, description = ?, price = ?, category = ?, stock_quantity = ? WHERE id = ?',
        [name, description, price, category, stock_quantity, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete product
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get products by category
  static async getByCategory(category) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
        [category]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get products with pagination
  static async getPaginated(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM products');
      const total = countResult[0].total;
      
      // Get paginated results
      const [rows] = await pool.execute(
        'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return {
        products: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Search products
  static async search(searchTerm) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? OR category LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get products with low stock
  static async getLowStock(threshold = 10) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity ASC',
        [threshold]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Update stock quantity
  static async updateStock(id, quantity) {
    try {
      const [result] = await pool.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [quantity, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;
