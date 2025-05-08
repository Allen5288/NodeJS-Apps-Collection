const express = require("express");

const app = express();
app.use(express.json());

const movies = [
  {
    id: 1,
    title: "Inception",
    description: "A skilled thief steals secrets from dreams.",
    types: ["Sci-Fi"],
    averageRating: 4.5,
    reviews: [
      { id: 1, content: "Amazing movie!", rating: 5 },
      { id: 2, content: "Great visuals.", rating: 4 },
    ],
  },
];

let nextMovieId = movies.length + 1;

app.get("/v1/movies", (req, res) => {
  const { keyword, limit = 10, page = 1, sort } = req.query;

  let moviesCopy = [...movies];

  if (keyword) {
    const keywordLower = keyword.toLowerCase();
    moviesCopy = moviesCopy.filter((movie) =>
      movie.title.toLowerCase().includes(keywordLower)
    );
  }

  if (sort === "rating") {
    moviesCopy.sort((a, b) => b.averageRating - a.averageRating);
  } else if (sort === "-rating") {
    moviesCopy.sort((a, b) => a.averageRating - b.averageRating);
  }

  const currentPage = parseInt(page, 10) || 1;
  const currentLimit = parseInt(limit, 10) || 10;

  const startIndex = (currentPage - 1) * currentLimit;
  const endIndex = startIndex + currentLimit;
  const paginatedMovies = moviesCopy.slice(startIndex, endIndex);

  res.json(paginatedMovies);
});

app.get("/v1/movies/:id", (req, res) => {
  const movieId = parseInt(req.params.id, 10);
  const movie = movies.find((m) => m.id === movieId);
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ message: "Movie not found" });
  }
});

app.post("/v1/movies", (req, res) => {
  const { title, description, types, averageRating } = req.body;
  if (
    !title ||
    !description ||
    !Array.isArray(types) ||
    !types.length ||
    !averageRating
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (
    typeof averageRating !== "number" ||
    averageRating < 0 ||
    averageRating > 5
  ) {
    return res
      .status(400)
      .json({ message: "Average rating must be a number between 0 and 5" });
  }
  const newMovie = {
    id: nextMovieId++,
    title,
    description,
    types,
    averageRating,
    reviews: [],
  };
  movies.unshift(newMovie);
  res.status(201).json(newMovie);
});

app.put("/v1/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = movies.find((m) => m.id === +id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }
  const { title, description, types, averageRating } = req.body;

  if (
    !title ||
    !description ||
    !Array.isArray(types) ||
    !types.length ||
    !averageRating
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (
    typeof averageRating !== "number" ||
    averageRating < 0 ||
    averageRating > 5
  ) {
    return res
      .status(400)
      .json({ message: "Average rating must be a number between 0 and 5" });
  }
  movie.title = title;
  movie.description = description;
  movie.types = types;
  movie.averageRating = averageRating;

  res.json(movie);
});

app.delete("/v1/movies/:id", (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex((m) => m.id === +id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }
  movies.splice(movieIndex, 1);
  res.status(204).send();
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

function cors(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
}