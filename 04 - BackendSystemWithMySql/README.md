# Backend System with MySQL

A comprehensive Node.js backend system with MySQL database integration, featuring REST APIs for user and product management.

## 🏗️ Project Structure

```
04 - BackendSystemWithMySql/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL database configuration
│   ├── controllers/
│   │   ├── userController.js    # User CRUD operations
│   │   └── productController.js # Product CRUD operations
│   ├── models/
│   │   ├── User.js             # User data model
│   │   └── Product.js          # Product data model
│   ├── middleware/
│   │   └── validation.js       # Input validation middleware
│   ├── routes/
│   │   ├── index.js            # System routes (health, info, stats)
│   │   ├── users.js            # User API routes
│   │   └── products.js         # Product API routes
│   └── server.js               # Main server file
├── database/
│   └── schema.sql              # Database schema and sample data
├── test-all-apis.sh            # Comprehensive API testing script
├── quick-test.sh               # Quick API testing script
├── test-apis.bat               # Windows batch testing script
├── package.json                # Project dependencies
├── .env                        # Environment configuration
└── README.md                   # This file
```

## 🚀 Features

### Core Features
- **RESTful API Design** - Clean, consistent API endpoints
- **MySQL Integration** - Robust database operations with connection pooling
- **Input Validation** - Comprehensive data validation using Joi
- **Error Handling** - Graceful error handling with meaningful responses
- **Security** - Helmet.js, CORS, and rate limiting
- **Logging** - Request logging with Morgan
- **Performance** - Response compression and optimized queries

### API Features
- **User Management** - Complete CRUD operations for users
- **Product Management** - Full product lifecycle management
- **Search & Filtering** - Text search and category filtering
- **Pagination** - Efficient data pagination
- **Stock Management** - Product inventory tracking
- **Health Monitoring** - System health and database statistics

## 📋 Prerequisites

Before running this project, ensure you have:

1. **Node.js** (v14 or higher)
2. **MySQL Server** (v5.7 or higher)
3. **npm** or **yarn** package manager

### MySQL Setup

1. **Install MySQL** if not already installed
2. **Start MySQL service**
3. **Create database and user** (or use existing):
   ```sql
   CREATE DATABASE backend_system;
   CREATE USER 'admin'@'localhost' IDENTIFIED BY '1234';
   GRANT ALL PRIVILEGES ON backend_system.* TO 'admin'@'localhost';
   FLUSH PRIVILEGES;
   ```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
cd "04 - BackendSystemWithMySql"
npm install
```

### 2. Environment Configuration
The `.env` file is already configured with default values:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=1234
DB_NAME=backend_system
```

Modify these values if your MySQL setup is different.

### 3. Database Initialization

**Option A: Automatic (Recommended)**
The application will automatically create tables when you start the server.

**Option B: Manual Setup**
```bash
mysql -u admin -p1234 < database/schema.sql
```

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### System Endpoints
- `GET /api/health` - Health check
- `GET /api/info` - API documentation
- `GET /api/stats` - Database statistics

### User Endpoints
- `GET /api/users` - Get all users (supports pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/search?q=term` - Search users

### Product Endpoints
- `GET /api/products` - Get all products (supports pagination & category filter)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/stock` - Update product stock
- `GET /api/products/search?q=term` - Search products
- `GET /api/products/low-stock` - Get low stock products

## 🧪 Testing

### Automated Testing Scripts

**1. Comprehensive Testing (Recommended)**
```bash
./test-all-apis.sh
```
- Tests all endpoints with detailed output
- Includes error scenario testing
- Automatic test data cleanup
- Colored output for better readability

**2. Quick Testing**
```bash
./quick-test.sh
```
- Fast core functionality testing
- Streamlined output
- Automatic cleanup

**3. Windows Users**
```cmd
test-apis.bat
```

### Manual Testing

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Create User:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "city": "New York"
  }'
```

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Product",
    "description": "A great product",
    "price": 99.99,
    "category": "Electronics",
    "stock_quantity": 50
  }'
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INT,
    city VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(255),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DB_HOST` - MySQL host (default: localhost)
- `DB_PORT` - MySQL port (default: 3306)
- `DB_USER` - MySQL username (default: admin)
- `DB_PASSWORD` - MySQL password (default: 1234)
- `DB_NAME` - Database name (default: backend_system)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Time window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - Joi schema validation
- **SQL Injection Protection** - Parameterized queries

## 📈 Performance Features

- **Connection Pooling** - Efficient database connections
- **Response Compression** - Reduced payload sizes
- **Optimized Queries** - Indexed database queries
- **Pagination** - Efficient data retrieval

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```
❌ Database connection failed: Access denied for user 'admin'@'localhost'
```
**Solution:** Check MySQL credentials in `.env` file

**2. Server Won't Start**
```
Error: listen EADDRINUSE :::3000
```
**Solution:** Port 3000 is in use, change PORT in `.env` or stop other services

**3. MySQL Not Running**
```
❌ Database connection failed: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Start MySQL service
- Windows: `net start mysql`
- macOS: `brew services start mysql`
- Linux: `sudo systemctl start mysql`

**4. Tables Not Created**
```
❌ Database initialization failed: Table 'users' doesn't exist
```
**Solution:** Run database schema manually:
```bash
mysql -u admin -p1234 < database/schema.sql
```

### Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error messages.

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

## 🚀 Production Deployment

### 1. Environment Setup
```bash
export NODE_ENV=production
export PORT=80
export DB_HOST=your-mysql-host
export DB_USER=your-mysql-user
export DB_PASSWORD=your-secure-password
```

### 2. Start Production Server
```bash
npm start
```

### 3. Process Management (PM2)
```bash
npm install -g pm2
pm2 start src/server.js --name "mysql-backend"
pm2 startup
pm2 save
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Test with the provided scripts
4. Check MySQL connectivity and credentials
