const jwt = require('jsonwebtoken');

const secret = 'secret';

const payload = {
  id: 123,
};

const token = jwt.sign(payload, secret, {
  expiresIn: 10,
});
// console.log(token);

const token1 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE3MzcxOTg4OTR9.MVeqxdvktb4RaczAhOjG6e1TtrpaEyxQdsxRbJv_5hg';
const token2 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJpYXQiOjE3MzcxOTkwMDMsImV4cCI6MTczNzE5OTAxM30.RXWjX5t9J-5GYYkzuYJlL4qEZ7pUcdAtI6XIAJT90Rk';

const valid1 = jwt.verify(token1, secret);
try {
  const valid2 = jwt.verify(token2, secret);
} catch (e) {
  console.log(e);
}

console.log(valid1);
