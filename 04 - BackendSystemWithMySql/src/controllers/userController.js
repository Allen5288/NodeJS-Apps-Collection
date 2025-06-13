const User = require('../models/User');

class UserController {
  // Get all users
  static async getAllUsers(req, res) {
    try {
      const { page, limit } = req.query;
      
      if (page || limit) {
        const result = await User.getPaginated(page, limit);
        return res.json({
          success: true,
          data: result.users,
          pagination: result.pagination,
          message: 'Users retrieved successfully'
        });
      }
      
      const users = await User.getAll();
      res.json({
        success: true,
        data: users,
        count: users.length,
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving users',
        error: error.message
      });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.getById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: user,
        message: 'User retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving user',
        error: error.message
      });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Check if email already exists
      const existingUser = await User.getByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
      
      const user = await User.create(userData);
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      // Check if user exists
      const existingUser = await User.getById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if email is being updated and already exists
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await User.getByEmail(userData.email);
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }
      
      const updatedUser = await User.update(id, userData);
      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const existingUser = await User.getById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const deleted = await User.delete(id);
      if (deleted) {
        res.json({
          success: true,
          message: 'User deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete user'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  }

  // Search users
  static async searchUsers(req, res) {
    try {
      const { q } = req.query;
      const users = await User.search(q);
      
      res.json({
        success: true,
        data: users,
        count: users.length,
        message: 'Search completed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching users',
        error: error.message
      });
    }
  }
}

module.exports = UserController;
