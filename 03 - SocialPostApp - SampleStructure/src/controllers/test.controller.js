const privateRoute = (req, res) => {
  res.json({
    message: 'hello from private route',
  });
};

module.exports = {
  privateRoute,
};
