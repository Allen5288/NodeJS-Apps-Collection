# Social Post App

A Node.js social media application built with Express.js, featuring user authentication, post management, and serverless deployment capabilities.

## Features

- 🔐 User authentication with JWT
- 📝 Create, read, update, delete posts
- 🛡️ Security middleware (Helmet, CORS, Rate Limiting)
- 📊 Request logging with Morgan and Winston
- ✅ Input validation with Joi
- 🗄️ MongoDB database with Mongoose
- ☁️ Serverless deployment ready
- 🧪 Test suite with Jest
- 🔄 Hot reload development with Nodemon

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Morgan, Winston
- **Testing**: Jest, Supertest
- **Deployment**: Serverless Framework
- **Development**: Nodemon, cross-env

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 03-SocialPostApp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/socialpostapp
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

## Scripts

### Development
```bash
# Start development server with hot reload
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

### Serverless Deployment
```bash
# Start serverless offline for local development
npm run serverless:dev

# Deploy to production
npm run serverless:deploy

# View production logs
npm run serverless:log

# Remove serverless deployment
npm run serverless:remove
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts` - Create new post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)

### Users
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/profile` - Update user profile (auth required)

## Project Structure

```
src/
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Mongoose models
├── routes/            # Express routes
├── services/          # Business logic
├── utils/             # Utility functions
├── config/            # Configuration files
└── index.js           # Application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/socialpostapp |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Rate limiting to prevent abuse
- CORS protection
- Security headers with Helmet
- Input validation and sanitization

## Testing

The application includes comprehensive test suites:

- Unit tests for models and services
- Integration tests for API endpoints
- Test database isolation with @shelf/jest-mongodb
- Coverage reporting

## Deployment

### Serverless (AWS Lambda)

The application is configured for serverless deployment using the Serverless Framework:

1. Configure AWS credentials
2. Update `serverless.yml` with your settings
3. Run `npm run serverless:deploy`

### Traditional Hosting

For traditional hosting platforms:

1. Set environment variables
2. Ensure MongoDB connection
3. Run `npm start` or use PM2 for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

ISC License - see LICENSE file for details
