const articleService = require('../services/article.service');

exports.index = async (req, res) => {
    try {
        const articles = await articleService.getAllArticles(req, res);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// step 2
exports.store = async (req, res) => {
    try {
        const article = await articleService.createArticle(req.body);
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Check if the article exists first
        const existingArticle = await articleService.getArticleById(id);
        if (!existingArticle) {
            return res.status(404).json({ error: 'Article not found' });
        }

        const article = await articleService.updateArticle(id, updatedData);
        
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.destroy = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the article exists first
        const existingArticle = await articleService.getArticleById(id);
        if (!existingArticle) {
            return res.status(404).json({ error: 'Article not found' });
        }

        await articleService.deleteArticle(id);

        res.status(204).send(); // No content
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get single article by ID
exports.show = async (req, res) => {
    try {
        const { id } = req.params;
        
        const article = await articleService.getArticleById(id);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}