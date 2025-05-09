Project Requirements: Movie Management System

## Basic Features: Movies

- **Get All Movies**: Support keyword search, rating-based sorting, and pagination.
- **Get a Single Movie**: Retrieve detailed information about a specific movie by its ID.
- **Add a Movie**: Add a new movie entry.
- **Update a Movie**: Modify information for an existing movie.
- **Delete a Movie**: Remove a specified movie.

## Extension Features: Reviews

- **Add a Review**: Add a review to a movie and record the rating.
- **Get Reviews**: Retrieve all reviews for a specific movie.

### Data Format

```javascript
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
```

## API Endpoints (RESTful API)

### Get All Movies

`GET /v1/movies - 200`

Retrieve all movies with support for keyword search, rating-based sorting, and pagination.

### Pagination and Filtering

| Parameter   | Description                          |
| ----------- | ------------------------------------ |
| page        | Page number                          |
| limit       | Number of items per page (page size) |
| keyword (q) | Search term                          |

### Get a Single Movie

`GET /v1/movies/:id - 200`

Retrieve detailed information about a specific movie by its ID.

### Add a New Movie

`POST /v1/movies - 201`

Add a new movie entry. Newly added movies should appear first in results.

**Request Body:**

```json
{
  "title": "Movie Title",
  "description": "Movie Description",
  "types": ["Genre1", "Genre2"]
}
```

### Update a Movie

`PUT/PATCH /v1/movies/:id - 200`

Modify information for an existing movie.

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "types": ["Updated Genre"]
}
```

### Delete a Movie

`DELETE /v1/movies/:id - 204`

Delete a specified movie.

## Reviews Extension

### Add a Review

`POST /v1/movies/:id/reviews - 201`

Add a review to a movie and record the rating.

**Request Body:**

```json
{
  "content": "Review text",
  "rating": 4.5
}
```

### Get Reviews

`GET /v1/movies/:id/reviews - 200`

Retrieve all reviews for a specific movie.

<!-- Notes: This API design follows RESTful principles -->
