const { pool } = require('../config/database');

class User {
  // Get all users
  static async getAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user by email
  static async getByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { name, email, age, city } = userData;
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, age, city) VALUES (?, ?, ?, ?)',
        [name, email, age, city]
      );
      
      // Return the created user
      return await this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, userData) {
    try {
      const { name, email, age, city } = userData;
      const [result] = await pool.execute(
        'UPDATE users SET name = ?, email = ?, age = ?, city = ? WHERE id = ?',
        [name, email, age, city, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get users with pagination
  static async getPaginated(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
      const total = countResult[0].total;
      
      // Get paginated results
      const [rows] = await pool.execute(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return {
        users: rows,
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

  // Search users
  static async search(searchTerm) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE name LIKE ? OR email LIKE ? OR city LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
