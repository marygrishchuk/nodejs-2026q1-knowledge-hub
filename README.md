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

Only the variables above are read by the application. If `.env.example` contains other keys, they are unused in the current codebase.

## Running the application

```bash
npm start
```

The server will be available at `http://localhost:4000`.

## API Documentation

Swagger UI is available at `http://localhost:4000/doc` while the server is running.

## JSON requests and `Accept` header

Per the assignment, request and response bodies use **`application/json`**. A global access guard rejects API calls whose `Accept` header does not allow JSON (for example, send `Accept: application/json`, or `Accept: */*`). Swagger UI and OpenAPI document routes (`/doc`, `/doc-json`, `/doc-yaml`) are exempt. For `POST` and `PUT`, send `Content-Type: application/json` with a JSON body.

## API Endpoints

### List query: pagination and sorting

These optional query parameters apply to `GET /user`, `GET /category`, `GET /article`, and `GET /comment` (with required `articleId`). They use `page`, `limit`, `sortBy`, and `order`.

| Parameter | Behavior |
|---|---|
| `page`, `limit` | Pagination: **both must be sent together** or neither. With both, the response is `{ total, page, limit, data }` instead of a plain array. `page` ≥ 1; `limit` is 1–100. |
| `sortBy` | Sort by a single field name. **Only the values below are allowed** for each route; anything else returns **400** (`Invalid sortBy: …`). |
| `order` | Sort direction when `sortBy` is set: `asc`, `desc`, `ASC`, or `DESC`. If `sortBy` is set and `order` is omitted, order defaults to **asc**. |

Allowed `sortBy` values per list endpoint:

| Endpoint | `sortBy` |
|---|---|
| `GET /user` | `id`, `login`, `role`, `createdAt`, `updatedAt` |
| `GET /category` | `id`, `name`, `description` |
| `GET /article` | `id`, `title`, `content`, `status`, `authorId`, `categoryId`, `createdAt`, `updatedAt` |
| `GET /comment?articleId=…` | `id`, `content`, `articleId`, `authorId`, `createdAt` |

### Users (`/user`)

- `GET /user` — list all users (passwords are never returned). Optional list query: see [List query: pagination and sorting](#list-query-pagination-and-sorting)
- `GET /user/:id` — get user by id
- `POST /user` — create user (`role` optional, defaults to `viewer`)
- `PUT /user/:id` — update password (`oldPassword`, `newPassword`)
- `DELETE /user/:id` — delete user

### Categories (`/category`)

- `GET /category` — list all categories (optional list query: see [List query: pagination and sorting](#list-query-pagination-and-sorting))
- `GET /category/:id` — get category by id
- `POST /category` — create category
- `PUT /category/:id` — update category
- `DELETE /category/:id` — delete category

### Articles (`/article`)

- `GET /article` — list articles; optional filters `status`, `categoryId`, `tag`; optional list query: see [List query: pagination and sorting](#list-query-pagination-and-sorting)
- `GET /article/:id` — get article by id
- `POST /article` — create article
- `PUT /article/:id` — update article
- `DELETE /article/:id` — delete article

### Comments (`/comment`)

- `GET /comment?articleId=<uuid>` — list comments for an article; **`articleId` is required** (UUID v4), as in the assignment. Optional list query: see [List query: pagination and sorting](#list-query-pagination-and-sorting)
- `GET /comment/:id` — get comment by id
- `POST /comment` — create comment
- `DELETE /comment/:id` — delete comment

## Testing

**After starting the server**, open another terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

To run all test with authorization (It will be implemented later)

```
npm run test:auth
```

To run only specific test suite with authorization (It will be implemented later)

```
npm run test:auth -- <path to suite>
```

To run refresh token tests (It will be implemented later)

```
npm run test:refresh
```

To run RBAC (role-based access control) tests (It will be implemented later)

```
npm run test:rbac
```

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
