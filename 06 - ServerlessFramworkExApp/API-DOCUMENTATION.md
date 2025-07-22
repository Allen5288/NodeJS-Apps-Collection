# API Documentation

## Overview

This enterprise serverless application provides RESTful APIs for managing users, products, and orders. All APIs follow REST conventions and return JSON responses with proper HTTP status codes.

## Base URL

```
https://api.yourdomain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Common Headers

- `Content-Type: application/json`
- `X-Correlation-ID: <unique-id>` (optional, auto-generated if not provided)
- `Authorization: Bearer <jwt_token>` (required for protected endpoints)

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "correlationId": "unique-correlation-id",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "correlationId": "unique-correlation-id",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Users API

### List Users
Get a paginated list of users.

**Endpoint:** `GET /users`

**Query Parameters:**
- `limit` (optional): Number of users per page (default: 20, max: 100)
- `lastKey` (optional): Pagination token for next page
- `status` (optional): Filter by user status (`ACTIVE`, `INACTIVE`, `PENDING`, `SUSPENDED`)

**Example Request:**
```bash
curl -X GET "https://api.yourdomain.com/api/users?limit=10&status=ACTIVE" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "john.doe@example.com",
        "name": "John Doe",
        "status": "ACTIVE",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "phoneNumber": "+1234567890",
          "preferences": {
            "emailNotifications": true,
            "smsNotifications": false,
            "marketingEmails": false,
            "language": "en",
            "timezone": "UTC"
          }
        },
        "createdAt": "2023-12-01T10:00:00.000Z",
        "updatedAt": "2023-12-07T10:00:00.000Z",
        "version": 1
      }
    ],
    "nextToken": "next_page_token",
    "totalCount": 150
  },
  "correlationId": "req_123456",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Get User by ID
Retrieve a specific user by their ID.

**Endpoint:** `GET /users/{id}`

**Path Parameters:**
- `id`: User ID

**Example Request:**
```bash
curl -X GET "https://api.yourdomain.com/api/users/user_123" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

### Create User
Create a new user.

**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "email": "jane.doe@example.com",
  "name": "Jane Doe",
  "profile": {
    "firstName": "Jane",
    "lastName": "Doe",
    "phoneNumber": "+1234567891",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "country": "US"
    },
    "preferences": {
      "emailNotifications": true,
      "smsNotifications": true,
      "marketingEmails": false,
      "language": "en",
      "timezone": "America/Los_Angeles"
    }
  }
}
```

**Example Request:**
```bash
curl -X POST "https://api.yourdomain.com/api/users" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d @user_data.json
```

### Update User
Update an existing user.

**Endpoint:** `PUT /users/{id}`

**Path Parameters:**
- `id`: User ID

**Request Body:** (all fields optional)
```json
{
  "name": "Jane Smith",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "preferences": {
      "emailNotifications": false
    }
  }
}
```

### Delete User
Soft delete a user (marks as inactive).

**Endpoint:** `DELETE /users/{id}`

**Path Parameters:**
- `id`: User ID

---

## Products API

### List Products
Get a paginated list of products with search and filtering.

**Endpoint:** `GET /products`

**Query Parameters:**
- `limit` (optional): Number of products per page (default: 20, max: 100)
- `lastKey` (optional): Pagination token for next page
- `category` (optional): Filter by product category
- `search` (optional): Search in product name and description
- `inStock` (optional): Filter by stock availability (true/false)

**Example Request:**
```bash
curl -X GET "https://api.yourdomain.com/api/products?category=electronics&inStock=true&limit=10" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "Wireless Headphones",
        "description": "High-quality wireless headphones with noise cancellation",
        "category": "electronics",
        "price": 199.99,
        "currency": "USD",
        "sku": "WH-001",
        "inventory": {
          "quantity": 50,
          "reserved": 5,
          "lowStockThreshold": 10,
          "trackInventory": true
        },
        "attributes": {
          "weight": 250,
          "color": "black",
          "brand": "AudioTech",
          "tags": ["wireless", "bluetooth", "noise-cancelling"]
        },
        "images": [
          {
            "url": "https://cdn.example.com/images/wh-001-main.jpg",
            "alt": "Wireless Headphones - Main View",
            "isPrimary": true
          }
        ],
        "isActive": true,
        "createdAt": "2023-12-01T10:00:00.000Z",
        "updatedAt": "2023-12-07T10:00:00.000Z",
        "version": 1
      }
    ],
    "nextToken": "next_page_token",
    "totalCount": 500
  },
  "correlationId": "req_123456",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Get Product by ID
Retrieve a specific product by its ID.

**Endpoint:** `GET /products/{id}`

### Create Product
Create a new product.

**Endpoint:** `POST /products`

**Request Body:**
```json
{
  "name": "Smart Watch",
  "description": "Feature-rich smartwatch with health monitoring",
  "category": "electronics",
  "price": 299.99,
  "currency": "USD",
  "sku": "SW-001",
  "inventory": {
    "quantity": 100,
    "lowStockThreshold": 20,
    "trackInventory": true
  },
  "attributes": {
    "weight": 45,
    "color": "silver",
    "brand": "TechCorp",
    "tags": ["smartwatch", "fitness", "bluetooth"]
  },
  "images": [
    {
      "url": "https://cdn.example.com/images/sw-001-main.jpg",
      "alt": "Smart Watch - Main View",
      "isPrimary": true
    }
  ]
}
```

### Update Product
Update an existing product.

**Endpoint:** `PUT /products/{id}`

### Delete Product
Soft delete a product (marks as inactive).

**Endpoint:** `DELETE /products/{id}`

---

## Orders API

### List Orders
Get a paginated list of orders with filtering.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `limit` (optional): Number of orders per page (default: 20, max: 100)
- `lastKey` (optional): Pagination token for next page
- `status` (optional): Filter by order status
- `userId` (optional): Filter by user ID
- `startDate` (optional): Filter orders from this date (ISO format)
- `endDate` (optional): Filter orders until this date (ISO format)

**Order Statuses:**
- `PENDING` - Order created, awaiting payment
- `CONFIRMED` - Payment confirmed, order being processed
- `PROCESSING` - Order being prepared for shipment
- `SHIPPED` - Order shipped to customer
- `DELIVERED` - Order delivered to customer
- `CANCELLED` - Order cancelled
- `REFUNDED` - Order refunded

**Example Request:**
```bash
curl -X GET "https://api.yourdomain.com/api/orders?status=SHIPPED&userId=user_123" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "userId": "user_123",
        "status": "SHIPPED",
        "items": [
          {
            "productId": "prod_123",
            "quantity": 2,
            "price": 199.99,
            "currency": "USD"
          }
        ],
        "totals": {
          "subtotal": 399.98,
          "tax": 32.00,
          "shipping": 9.99,
          "total": 441.97,
          "currency": "USD"
        },
        "shippingAddress": {
          "name": "John Doe",
          "street": "123 Main St",
          "city": "Anytown",
          "state": "CA",
          "zipCode": "12345",
          "country": "US",
          "phone": "+1234567890"
        },
        "payment": {
          "method": "CARD",
          "status": "COMPLETED",
          "transactionId": "txn_abc123",
          "processedAt": "2023-12-07T10:15:00.000Z"
        },
        "tracking": {
          "carrier": "UPS",
          "trackingNumber": "1Z999AA1234567890",
          "estimatedDelivery": "2023-12-10T18:00:00.000Z"
        },
        "createdAt": "2023-12-07T10:00:00.000Z",
        "updatedAt": "2023-12-07T10:30:00.000Z",
        "version": 2
      }
    ],
    "nextToken": "next_page_token",
    "totalCount": 25
  },
  "correlationId": "req_123456",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Get Order by ID
Retrieve a specific order by its ID.

**Endpoint:** `GET /orders/{id}`

### Create Order
Create a new order.

**Endpoint:** `POST /orders`

**Request Body:**
```json
{
  "userId": "user_123",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 1,
      "price": 199.99,
      "currency": "USD"
    },
    {
      "productId": "prod_456",
      "quantity": 2,
      "price": 49.99,
      "currency": "USD"
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "US",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "US"
  },
  "payment": {
    "method": "CARD",
    "currency": "USD"
  },
  "notes": "Please deliver to front door"
}
```

### Update Order
Update an existing order (limited fields based on current status).

**Endpoint:** `PUT /orders/{id}`

**Request Body:**
```json
{
  "status": "SHIPPED",
  "tracking": {
    "carrier": "UPS",
    "trackingNumber": "1Z999AA1234567890",
    "estimatedDelivery": "2023-12-10T18:00:00.000Z"
  }
}
```

### Cancel Order
Cancel an order.

**Endpoint:** `DELETE /orders/{id}`

---

## Error Handling

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Validation failed: email is required, name must be at least 2 characters long",
  "correlationId": "req_123456",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "correlationId": "req_123456",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": "User not found",
  "correlationId": "req_123456",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Conflict Errors (409)
```json
{
  "success": false,
  "error": "User with this email already exists",
  "correlationId": "req_123456",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

## Rate Limiting

API Gateway automatically throttles requests:
- **Burst Limit**: 5,000 requests per second
- **Rate Limit**: 2,000 requests per second (sustained)

When rate limited, you'll receive a `429 Too Many Requests` response.

## Pagination

List endpoints support pagination using the `limit` and `lastKey` parameters:

1. Make initial request with `limit` parameter
2. If more results exist, response includes `nextToken`
3. Use `nextToken` as `lastKey` in subsequent request
4. Continue until `nextToken` is not present in response

## CORS

All API endpoints support Cross-Origin Resource Sharing (CORS) with the following configuration:
- **Allowed Origins**: `*` (configurable per environment)
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers**: `Content-Type, Authorization, X-Correlation-ID`

## SDKs and Examples

### JavaScript/Node.js
```javascript
const response = await fetch('https://api.yourdomain.com/api/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'X-Correlation-ID': 'unique-id'
  }
});

const data = await response.json();
```

### cURL
```bash
curl -X GET "https://api.yourdomain.com/api/users" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: unique-id"
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json',
    'X-Correlation-ID': 'unique-id'
}

response = requests.get('https://api.yourdomain.com/api/users', headers=headers)
data = response.json()
```

## Support

For API support and questions:
- Check the status page for known issues
- Review CloudWatch logs for detailed error information
- Contact the development team with your correlation ID for specific request issues
