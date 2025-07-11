const Article = require('../model/articles');
const mongoose = require('mongoose');

exports.getAllArticles = async (req, res) => {
    const result = await Article.find({});
    return result;
}

exports.createArticle = async (data) => {
    const result = new Article(data);
    await result.save();
    return result;
}

exports.updateArticle = async (id, data) => {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid article ID format');
    }
    
    const result = await Article.findByIdAndUpdate(
        id, 
        data, 
        { 
            new: true,           // Return the updated document
            runValidators: true  // Run schema validators
        }
    );
    
    return result;
}

exports.getArticleById = async (id) => {
    const result = await Article.findById(id);
    return result;
}

exports.deleteArticle = async (id) => {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid article ID format');
    }
    
    const result = await Article.findByIdAndDelete(id);
    return result;
}