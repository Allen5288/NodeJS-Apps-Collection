const express = require('express');
const router = new express.Router();
const articleController = require('../../controllers/articleController');
const authController = require('../../controllers/authController');
const imageUploadController = require('../../controllers/imageUploadController');
const authMiddleware = require('../../middleware/auth.middleware');

router.get('/articles', authMiddleware.auth, articleController.index);

// step 1
router.post('/articles', articleController.store);

router.put('/articles/:id', articleController.update);

// Get single article
router.get('/articles/:id', articleController.show);

router.delete('/articles/:id', articleController.destroy);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/user/me", authController.showMe);


// image upload route
router.post('/upload', imageUploadController.uploadImage);


module.exports = router;