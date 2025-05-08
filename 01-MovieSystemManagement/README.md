# Movie System Management

A comprehensive backend API for managing a movie catalog system.

## Features

- Movie CRUD operations
- Genre/category management
- User rating and review system
- Search and filtering capabilities
- Authentication and authorization

## Technology Stack

- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Jest for testing

## API Endpoints

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Create new movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Users
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Reviews
- `GET /api/movies/:id/reviews` - Get all reviews for a movie
- `POST /api/movies/:id/reviews` - Add review to a movie

## Getting Started

1. Clone the repository
2. Navigate to the project directory:
```bash
cd 01-MovieSystemManagement
```
3. Install dependencies:
```bash
npm install
```
4. Set up environment variables:
   - Create a `.env` file with the following:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/movie_system
JWT_SECRET=your_jwt_secret
```
5. Start the server:
```bash
npm start
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Project Structure

```
src/
  ├── config/       # Configuration files
  ├── controllers/  # Request handlers
  ├── middleware/   # Express middleware
  ├── models/       # Database models
  ├── routes/       # Route definitions
  ├── services/     # Business logic
  ├── utils/        # Utility functions
  └── app.js        # Application entry point
tests/              # Test files
```
