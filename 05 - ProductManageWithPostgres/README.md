# Product Management API (Node.js + Express + Postgres)

A simple RESTful API for managing products, built with Node.js, Express, and PostgreSQL.  
Supports CRUD operations and is ready for deployment on modern cloud platforms.

## Features

- Create, read, update, and delete products
- PostgreSQL database integration
- Modern ES module syntax
- Secure HTTP headers with Helmet
- Request logging with Morgan
- CORS enabled for API access
- Auto-creates the `products` table if it does not exist

## Project Structure

```
.
├── config/
│   └── db.js              # Database connection setup
├── controllers/
│   └── productController.js # Product CRUD logic
├── routes/
│   └── productRoutes.js   # Product API routes
├── server.js              # Main server entry point
├── .env                   # Environment variables (not committed)
└── README.md
```

## Environment Variables

Create a `.env` file in the root with:

```env
PORT=5000

PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGHOST=your_postgres_host
PGDATABASE=your_postgres_db

ARCJET_KEY=your arcjet key
ARCJET_ENV=development
```

## Database Table

The server will auto-create this table if it does not exist:

```sql
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

| Method | Endpoint              | Description                |
|--------|-----------------------|----------------------------|
| GET    | /api/products         | Get all products           |
| GET    | /api/products/:id     | Get a product by ID        |
| POST   | /api/products         | Create a new product       |
| PUT    | /api/products/:id     | Update a product by ID     |
| DELETE | /api/products/:id     | Delete a product by ID     |

### Example Product JSON

```json
{
  "name": "Sample Product",
  "price": 19.99,
  "image": "https://example.com/image.jpg"
}
```

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up your `.env` file** (see above).

3. **Start the server:**

   ```bash
   npm start
   ```

   or for development with auto-reload:

   ```bash
   npm run dev
   ```

4. **Test with Postman or curl:**
   - POST `/api/products` with a JSON body to create a product.
   - GET `/api/products` to list all products.

## Notes

- Make sure your PostgreSQL database is running and accessible.
- The API returns JSON responses.
- Error handling is included for missing fields and database errors.
