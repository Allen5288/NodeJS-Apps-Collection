const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    connection.release();
    
    res.json({
      success: true,
      message: 'Server and database are healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Disconnected',
      error: error.message
    });
  }
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Backend System with MySQL API',
    version: '1.0.0',
    endpoints: {
      users: {
        'GET /api/users': 'Get all users (supports pagination)',
        'GET /api/users/:id': 'Get user by ID',
        'POST /api/users': 'Create new user',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user',
        'GET /api/users/search?q=term': 'Search users'
      },
      products: {
        'GET /api/products': 'Get all products (supports pagination and category filter)',
        'GET /api/products/:id': 'Get product by ID',
        'POST /api/products': 'Create new product',
        'PUT /api/products/:id': 'Update product',
        'DELETE /api/products/:id': 'Delete product',
        'PATCH /api/products/:id/stock': 'Update product stock',
        'GET /api/products/search?q=term': 'Search products',
        'GET /api/products/low-stock': 'Get low stock products'
      },
      system: {
        'GET /api/health': 'Health check',
        'GET /api/info': 'API information'
      }
    },
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    }
  });
});

// Database statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    // Get user count
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    // Get product count
    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    
    // Get low stock products count
    const [lowStockCount] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 10');
    
    res.json({
      success: true,
      message: 'Database statistics retrieved successfully',
      statistics: {
        users: {
          total: userCount[0].count
        },
        products: {
          total: productCount[0].count,
          lowStock: lowStockCount[0].count
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving statistics',
      error: error.message
    });
  }
});

module.exports = router;
