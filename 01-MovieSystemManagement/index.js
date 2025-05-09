const express = require('express');

const app = express();
app.use(express.json());
app.use(cors);

const movies = [];

let nextMovieId = 1;
let nextReviewId = 1;

// router

const movieRouter = express.Router();
app.use('/v1/movies', movieRouter);

movieRouter.get('/', (req, res) => {
  const { keyword, limit = 10, page = 1, sort } = req.query;
  // 浅拷贝，深拷贝
  let moviesCopy = [...movies];

  if (keyword) {
    moviesCopy = moviesCopy.filter(
      (movie) =>
        movie.title.toLowerCase().includes(keyword.toLowerCase()) ||
        movie.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  if (sort === 'rating') {
    moviesCopy.sort((a, b) => a.averageRating - b.averageRating);
  } else if (sort === '-rating') {
    moviesCopy.sort((a, b) => b.averageRating - a.averageRating);
  }

  // const currentPage = parseInt(page) || 1
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const returnedMovies = moviesCopy.slice(startIndex, endIndex);

  res.json(returnedMovies);
});

movieRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === +id);
  if (!movie) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  res.json(movie);
});

movieRouter.post('/', (req, res) => {
  const { title, description, types } = req.body;
  if (!title || !description || !Array.isArray(types) || types.length === 0) {
    res.status(400).json({
      message: 'Some fields are invalid',
    });
    return;
  }
  const newMovie = {
    id: nextMovieId++,
    title,
    description,
    types,
    averageRating: 0,
    reviews: [],
  };
  movies.unshift(newMovie);
  res.status(201).json(newMovie);
});

movieRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === +id);
  if (!movie) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  const { title, description, types } = req.body;
  if (title) {
    movie.title = title;
  }
  if (description) {
    movie.description = description;
  }
  if (types) {
    if (!Array.isArray(types) || types.length === 0) {
      res.status(400).json({
        message: 'types must be an array',
      });
      return;
    }
    movie.types = types;
  }
  res.json(movie);
});

movieRouter.delete('/:id', (req, res) => {
  const movieIndex = movies.findIndex((movie) => movie.id === +req.params.id);
  if (movieIndex === -1) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  movies.splice(movieIndex, 1);
  res.sendStatus(204);
});

movieRouter.get('/:id/reviews', (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === +id);
  if (!movie) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  res.json(movie.reviews);
});

movieRouter.post('/:id/reviews', (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === +id);
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
  const newReview = {
    id: nextReviewId++,
    content,
    rating,
  };

  movie.reviews.push(newReview);
  movie.averageRating = +(
    movie.reviews.reduce((sum, review) => sum + review.rating, 0) /
    movie.reviews.length
  ).toFixed(2);

  res.status(201).json(newReview);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  next();
}
