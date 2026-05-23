# Issue Tracker API

A professional issue tracking system API built with Node.js, Express, and PostgreSQL.

## 🚀 Live URL
[Live API](https://devpulse-gules-two.vercel.app)

## ✨ Features
- **User Authentication**: Secure signup and login with JWT.
- **Role-Based Access**: Support for 'contributor' and 'maintainer' roles.
- **Issue Management**: Create, Read, Update, and Delete (CRUD) support for issues.
- **Validation**: Strict schema validation for titles, descriptions, and statuses.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (`pg`)
- **Language**: TypeScript
- **Auth**: `jsonwebtoken`, `bcrypt`

## ⚙️ Setup Steps
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd assignment-2
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   Create a `.env` file in the root directory and add your database connection string:
   ```env
   CONNECTION_STRING=your_postgresql_connection_string
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🌐 API Endpoints

### Base API: `/api/issues`

### Authentication
- `POST /signup`: Register a new user.
- `POST /login`: Log in to receive a JWT token.

### Issues
- `POST /`: Create a new issue (requires authentication).
- `GET /`: List all issues.
- `GET /:id`: Retrieve a specific issue by ID.
- `PATCH /:id`: Update an existing issue (requires authentication).
- `DELETE /:id`: Delete an issue (requires authentication).

## 🗄️ Database Schema Summary

### `users`
- `id` (SERIAL, PK)
- `name` (VARCHAR, 50)
- `email` (VARCHAR, 50, UNIQUE)
- `password` (VARCHAR, 255)
- `role` ('contributor' | 'maintainer')
- `created_at` / `updated_at` (TIMESTAMP)

### `issues`
- `id` (SERIAL, PK)
- `title` (TEXT, max 150 chars)
- `description` (TEXT, min 20 chars)
- `type` ('bug' | 'feature_request')
- `status` ('open' | 'in_progress' | 'resolved')
- `reporter_id` (INTEGER, FK to users)
- `created_at` / `updated_at` (TIMESTAMP)