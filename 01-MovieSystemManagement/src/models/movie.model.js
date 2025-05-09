const movies = [];

let nextMovieId = 1;
let nextReviewId = 1;

const searchMovie = ({ keyword, limit = 10, page = 1, sort }) => {
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

  return returnedMovies;
};

const getMovieById = (id) => {
  return movies.find((movie) => movie.id === id);
};

const create = ({ title, description, types }) => {
  const newMovie = {
    id: nextMovieId++,
    title,
    description,
    types,
    averageRating: 0,
    reviews: [],
  };
  movies.unshift(newMovie);
  return newMovie;
};

const update = (id, { title, description, types }) => {
  const movie = getMovieById(id);
  if (title) {
    movie.title = title;
  }
  if (description) {
    movie.description = description;
  }
  if (types) {
    movie.types = types;
  }
  return movie;
};

const remove = (id) => {
  const movieIndex = movies.findIndex((movie) => movie.id === id);
  if (movieIndex === -1) {
    return false;
  }
  movies.splice(movieIndex, 1);
  return true;
};

const getReviews = (movieId) => {
  const movie = getMovieById(movieId);
  return movie.reviews;
};

const addReview = (movieId, { content, rating }) => {
  const movie = getMovieById(movieId);
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
  return newReview;
};

module.exports = {
  getMovieById,
  searchMovie,
  remove,
  update,
  create,
  getReviews,
  addReview,
};
