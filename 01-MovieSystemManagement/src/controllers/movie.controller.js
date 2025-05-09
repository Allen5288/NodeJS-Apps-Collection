const {
  searchMovie,
  getMovieById,
  update,
  create,
  remove,
  getReviews,
  addReview,
} = require('../models/movie.model');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Movie:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - types
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the movie
 *         title:
 *           type: string
 *           description: The title of the movie
 *         description:
 *           type: string
 *           description: The description of the movie
 *         types:
 *           type: array
 *           items:
 *             type: string
 *           description: The genres of the movie
 *     Review:
 *       type: object
 *       required:
 *         - rating
 *         - content
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: The rating given to the movie (1-5)
 *         content:
 *           type: string
 *           description: The review content
 */

/**
 * @swagger
 * /v1/movies:
 *   get:
 *     summary: Returns a list of movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search term for movies
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: page number
 *     responses:
 *       200:
 *         description: List of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 */
const getMovies = (req, res) => {
  logger.info('Getting all movies', { query: req.query });
  const movies = searchMovie(req.query);
  logger.debug('Successfully get all movies', { count: movies.length });
  res.json(movies);
};

const getMovie = (req, res) => {
  const { id } = req.params;
  logger.info('Getting movie by id', id);
  // validate id is a number
  const movie = getMovieById(+id);
  if (!movie) {
    logger.warn('Movie not found', id);
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  res.json(movie);
};

const createMovie = (req, res) => {
  const { title, description, types } = req.body;
  if (!title || !description || !Array.isArray(types) || types.length === 0) {
    res.status(400).json({
      message: 'Some fields are invalid',
    });
    return;
  }
  const movie = create({ title, description, types });
  res.status(201).json(movie);
};

const updateMovie = (req, res) => {
  const { id } = req.params;
  const movie = getMovieById(+id);
  if (!movie) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  const { title, description, types } = req.body;
  if (types) {
    if (!Array.isArray(types) || types.length === 0) {
      res.status(400).json({
        message: 'types must be an array',
      });
      return;
    }
  }
  const updatedMovie = update(+id, { title, description, types });

  res.json(updatedMovie);
};

const deleteMovie = (req, res) => {
  const { id } = req.params;
  const isDeleted = remove(+id);
  if (!isDeleted) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  res.sendStatus(204);
};

const getMovieReviews = (req, res) => {
  const { id } = req.params;
  const movie = getMovieById(+id);
  if (!movie) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  const reviews = getReviews(movie.id);
  res.json(reviews);
};

const addMovieReview = (req, res) => {
  const { id } = req.params;
  const movie = getMovieById(+id);
  if (!movie) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  const { content, rating } = req.body;
  if (!content || !rating || rating < 1 || rating > 5) {
    res.status(400).json({
      message: 'content is required and rating must be between 1 and 5',
    });
    return;
  }

  const newReview = addReview(movie.id, { content, rating });
  res.status(201).json(newReview);
};

module.exports = {
  getMovie,
  getMovies,
  updateMovie,
  deleteMovie,
  createMovie,
  addMovieReview,
  getMovieReviews,
};
