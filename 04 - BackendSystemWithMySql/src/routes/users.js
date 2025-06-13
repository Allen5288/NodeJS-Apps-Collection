const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { validate, userSchemas, commonSchemas } = require('../middleware/validation');

// Get all users (with optional pagination)
router.get('/', 
  validate(commonSchemas.pagination, 'query'),
  UserController.getAllUsers
);

// Search users
router.get('/search', 
  validate(commonSchemas.search, 'query'),
  UserController.searchUsers
);

// Get user by ID
router.get('/:id', 
  validate(commonSchemas.id, 'params'),
  UserController.getUserById
);

// Create new user
router.post('/', 
  validate(userSchemas.create),
  UserController.createUser
);

// Update user
router.put('/:id', 
  validate(commonSchemas.id, 'params'),
  validate(userSchemas.update),
  UserController.updateUser
);

// Delete user
router.delete('/:id', 
  validate(commonSchemas.id, 'params'),
  UserController.deleteUser
);

module.exports = router;
