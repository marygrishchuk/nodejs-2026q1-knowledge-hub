# Knowledge Hub API

A REST API for a Knowledge Hub platform built with NestJS. Manages users, articles, categories, and comments as described in the course assignment.

## Requirements

- Node.js >= 24.10.0
- npm

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and adjust the values if needed:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | HTTP port the server listens on (default `4000`) |
| `CRYPT_SALT` | bcrypt salt rounds |

## Running the application

```bash
npm start
```

The server will be available at `http://localhost:4000`.

## API Documentation

Swagger UI is available at `http://localhost:4000/doc` while the server is running.

## API Endpoints

### Users (`/user`)

- `GET /user` — list all users (passwords are never returned). Optional list query: `page`, `limit` (both required together for pagination; response is `{ total, page, limit, data }`), `sortBy`, `order` (`asc` or `desc`)
- `GET /user/:id` — get user by id
- `POST /user` — create user (`role` optional, defaults to `viewer`)
- `PUT /user/:id` — update password (`oldPassword`, `newPassword`)
- `DELETE /user/:id` — delete user

### Categories (`/category`)

- `GET /category` — list all categories (same optional `page`, `limit`, `sortBy`, `order` as users)
- `GET /category/:id` — get category by id
- `POST /category` — create category
- `PUT /category/:id` — update category
- `DELETE /category/:id` — delete category

### Articles (`/article`)

- `GET /article` — list articles (optional `?status=`, `?categoryId=`, `?tag=`, plus `page`, `limit`, `sortBy`, `order`)
- `GET /article/:id` — get article by id
- `POST /article` — create article
- `PUT /article/:id` — update article
- `DELETE /article/:id` — delete article

### Comments (`/comment`)

- `GET /comment?articleId=<id>` — list comments for an article (optional `page`, `limit`, `sortBy`, `order`)
- `GET /comment/:id` — get comment by id
- `POST /comment` — create comment
- `DELETE /comment/:id` — delete comment

## Testing

With the application running, open a new terminal and run:

```
npm run test
```

To run a single suite:

```
npm run test -- <path to suite>
```

`npm run test` also runs in-process tests under `src/additional-tests/` (pagination and sorting).

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging
