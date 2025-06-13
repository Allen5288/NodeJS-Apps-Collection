const Product = require('../models/Product');

class ProductController {
  // Get all products
  static async getAllProducts(req, res) {
    try {
      const { page, limit, category } = req.query;
      
      // Filter by category if provided
      if (category) {
        const products = await Product.getByCategory(category);
        return res.json({
          success: true,
          data: products,
          count: products.length,
          message: 'Products retrieved successfully'
        });
      }
      
      // Pagination if requested
      if (page || limit) {
        const result = await Product.getPaginated(page, limit);
        return res.json({
          success: true,
          data: result.products,
          pagination: result.pagination,
          message: 'Products retrieved successfully'
        });
      }
      
      const products = await Product.getAll();
      res.json({
        success: true,
        data: products,
        count: products.length,
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving products',
        error: error.message
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving product',
        error: error.message
      });
    }
  }

  // Create new product
  static async createProduct(req, res) {
    try {
      const productData = req.body;
      const product = await Product.create(productData);
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const productData = req.body;
      
      // Check if product exists
      const existingProduct = await Product.getById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      const updatedProduct = await Product.update(id, productData);
      res.json({
        success: true,
        data: updatedProduct,
        message: 'Product updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      
      // Check if product exists
      const existingProduct = await Product.getById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      const deleted = await Product.delete(id);
      if (deleted) {
        res.json({
          success: true,
          message: 'Product deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete product'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting product',
        error: error.message
      });
    }
  }

  // Search products
  static async searchProducts(req, res) {
    try {
      const { q } = req.query;
      const products = await Product.search(q);
      
      res.json({
        success: true,
        data: products,
        count: products.length,
        message: 'Search completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching products',
        error: error.message
      });
    }
  }

  // Get products with low stock
  static async getLowStockProducts(req, res) {
    try {
      const { threshold = 10 } = req.query;
      const products = await Product.getLowStock(threshold);
      
      res.json({
        success: true,
        data: products,
        count: products.length,
        message: 'Low stock products retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving low stock products',
        error: error.message
      });
    }
  }

  // Update product stock
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock_quantity } = req.body;
      
      // Check if product exists
      const existingProduct = await Product.getById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      const updatedProduct = await Product.updateStock(id, stock_quantity);
      res.json({
        success: true,
        data: updatedProduct,
        message: 'Product stock updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating product stock',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;
