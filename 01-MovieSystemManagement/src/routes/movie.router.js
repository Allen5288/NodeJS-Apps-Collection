const { Router } = require('express');
const {
  getMovie,
  getMovies,
  updateMovie,
  createMovie,
  deleteMovie,
  getMovieReviews,
  addMovieReview,
} = require('../controllers/movie.controller');

const movieRouter = Router();

movieRouter.get('/', getMovies);

movieRouter.get('/:id', getMovie);

movieRouter.post('/', createMovie);

movieRouter.put('/:id', updateMovie);

movieRouter.delete('/:id', deleteMovie);

movieRouter.get('/:id/reviews', getMovieReviews);

movieRouter.post('/:id/reviews', addMovieReview);

module.exports = movieRouter;
