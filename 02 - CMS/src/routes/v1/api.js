const express = require('express');
const router = new express.Router();
const articleController = require('../../controllers/articleController');

router.get('/articles', articleController.index);

// step 1
router.post('/articles', articleController.store);

router.put('/articles/:id', articleController.update);

// Get single article
router.get('/articles/:id', articleController.show);

router.delete('/articles/:id', articleController.destroy);

module.exports = router;