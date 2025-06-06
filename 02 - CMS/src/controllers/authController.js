const authService = require('../services/authService');

exports.register = async (req, res) => {
    const result = await authService.register(req);
    res.status(result.status).json(result.body);
}
exports.login = async (req, res) => {
    const result = await authService.login(req);
    res.status(result.status).json(result.body);
}
exports.showMe = async (req, res) => {
    const result = await authService.showMe(req);
    res.status(result.status).json(result.body);
}