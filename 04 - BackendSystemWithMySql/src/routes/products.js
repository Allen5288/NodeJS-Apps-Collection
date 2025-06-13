const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { validate, productSchemas, commonSchemas } = require('../middleware/validation');

// Get all products (with optional pagination and category filter)
router.get('/', 
  validate(commonSchemas.pagination, 'query'),
  ProductController.getAllProducts
);

// Search products
router.get('/search', 
  validate(commonSchemas.search, 'query'),
  ProductController.searchProducts
);

// Get low stock products
router.get('/low-stock', 
  ProductController.getLowStockProducts
);

// Get product by ID
router.get('/:id', 
  validate(commonSchemas.id, 'params'),
  ProductController.getProductById
);

// Create new product
router.post('/', 
  validate(productSchemas.create),
  ProductController.createProduct
);

// Update product
router.put('/:id', 
  validate(commonSchemas.id, 'params'),
  validate(productSchemas.update),
  ProductController.updateProduct
);

// Update product stock
router.patch('/:id/stock', 
  validate(commonSchemas.id, 'params'),
  validate(productSchemas.updateStock),
  ProductController.updateStock
);

// Delete product
router.delete('/:id', 
  validate(commonSchemas.id, 'params'),
  ProductController.deleteProduct
);

module.exports = router;
