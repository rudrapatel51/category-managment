# Multi-Level Category Management API

This is a RESTful API for managing hierarchical categories with user authentication. Built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- CRUD operations for categories
- Hierarchical category structure
- Automatic status propagation to subcategories
- Reassignment of subcategories when a parent is deleted
- Comprehensive testing with Jest

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/category-management-api.git
cd category-management-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following content:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/category-management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d
NODE_ENV=development
```

4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- **POST /api/auth/register** - Register a new user
  ```json
  // Request
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }

  // Response
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

- **POST /api/auth/login** - Login and get token
  ```json
  // Request
  {
    "email": "john@example.com",
    "password": "password123"
  }

  // Response
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

- **GET /api/auth/me** - Get current user
  ```json
  // Response
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2023-06-01T10:59:16.473Z",
      "updatedAt": "2023-06-01T10:59:16.473Z"
    }
  }
  ```

### Categories

- **POST /api/category** - Create a new category
  ```json
  // Request
  {
    "name": "Electronics",
    "parent": "60d21b4667d0d8992e610c85", // Optional
    "status": "active" // Default is "active"
  }

  // Response
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "Electronics",
      "parent": "60d21b4667d0d8992e610c85",
      "status": "active",
      "path": "60d21b4667d0d8992e610c85",
      "level": 2,
      "createdAt": "2023-06-01T11:15:22.312Z",
      "updatedAt": "2023-06-01T11:15:22.312Z"
    }
  }
  ```

- **GET /api/category** - Get all categories as a tree
  ```json
  // Response
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "_id": "60d21b4667d0d8992e610c87",
        "name": "Clothing",
        "parent": null,
        "status": "active",
        "path": "",
        "level": 1,
        "createdAt": "2023-06-01T11:16:22.312Z",
        "updatedAt": "2023-06-01T11:16:22.312Z",
        "children": [
          {
            "_id": "60d21b4667d0d8992e610c89",
            "name": "T-Shirts",
            "parent": "60d21b4667d0d8992e610c87",
            "status": "active",
            "path": "60d21b4667d0d8992e610c87",
            "level": 2,
            "createdAt": "2023-06-01T11:18:22.312Z",
            "updatedAt": "2023-06-01T11:18:22.312Z",
            "children": []
          }
        ]
      },
      {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "Electronics",
        "parent": null,
        "status": "active",
        "path": "",
        "level": 1,
        "createdAt": "2023-06-01T11:17:22.312Z",
        "updatedAt": "2023-06-01T11:17:22.312Z",
        "children": [
          {
            "_id": "60d21b4667d0d8992e610c8a",
            "name": "Phones",
            "parent": "60d21b4667d0d8992e610c88",
            "status": "active",
            "path": "60d21b4667d0d8992e610c88",
            "level": 2,
            "createdAt": "2023-06-01T11:19:22.312Z",
            "updatedAt": "2023-06-01T11:19:22.312Z",
            "children": []
          }
        ]
      }
    ]
  }
  ```

- **PUT /api/category/:id** - Update a category
  ```json
  // Request
  {
    "name": "Updated Electronics", // Optional
    "status": "inactive" // Optional
  }

  // Response
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "Updated Electronics",
      "parent": null,
      "status": "inactive",
      "path": "",
      "level": 1,
      "createdAt": "2023-06-01T11:17:22.312Z",
      "updatedAt": "2023-06-01T11:20:22.312Z"
    }
  }
  ```

- **DELETE /api/category/:id** - Delete a category and reassign children
  ```json
  // Response
  {
    "success": true,
    "data": {}
  }
  ```

## Testing

Run tests with:

```bash
npm test
```

This will run both unit and integration tests using Jest and MongoMemoryServer.

## Project Structure

```
category-management-api/
├── src/
│   ├── config/
│   │   └── db.js             # Database configuration
│   │   └── config.js         # Application configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication controller
│   │   └── categoryController.js # Category controller
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── models/
│   │   ├── User.js           # User model
│   │   └── Category.js       # Category model
│   ├── routes/
│   │   ├── authRoutes.js     # Auth routes
│   │   └── categoryRoutes.js # Category routes
│   ├── utils/
│   │   └── errorHandler.js   # Error handling utility
│   └── index.js              # Entry point
├── tests/
│   ├── auth.test.js          # Auth tests
│   ├── category.test.js      # Category tests
│   └── testSetup.js          # Test setup utilities
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Docker

To run the application with Docker:

1. Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

2. Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://127.0.0.1:27017/category-management
      - JWT_SECRET=your_secret_key
      - JWT_EXPIRES_IN=30d
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

3. Build and run:

```bash
docker-compose up -d
```

## License

MIT