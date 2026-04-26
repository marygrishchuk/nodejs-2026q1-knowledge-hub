# Knowledge Hub API

A REST API for a Knowledge Hub platform built with NestJS. Manages users, articles, categories, and comments as described in the course assignment.

## Code Reviewer: Quick Start

### Install dependencies

```bash
npm install
```

### Run the app

Copy `.env.example` to `.env`, then:

```bash
npm run start:dev
```

The API is available at `http://localhost:4000`. Swagger UI is at `http://localhost:4000/doc`.

### Run unit tests

```bash
# All unit tests
npm run test

# Unit tests only (same as test)
npm run test:unit

# Unit tests with coverage report (must meet ≥90% lines, ≥85% branches)
npm run test:coverage
```

### Check lint errors

```bash
npm run lint
```

---

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

Keep a **single** `DATABASE_URL` entry in `.env`. If you run `prisma init` again, remove any duplicate placeholder `DATABASE_URL` lines so Prisma connects with the credentials you intend.

| Variable | Description |
|---|---|
| `PORT` | HTTP port the server listens on (default `4000`) |
| `POSTGRES_USER` | PostgreSQL user (used by Docker Compose `db` service) |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_HOST` | Database hostname (`db` when the app runs in Compose; use `localhost` when the app runs on the host and only Postgres is in Docker) |
| `POSTGRES_PORT` | PostgreSQL port (default `5432`) |
| `DATABASE_URL` | Prisma connection string; use host `localhost` when the app runs on your machine with Postgres in Docker, and host `db` when the app runs inside Compose (Compose overrides this for the `app` service). |
| `CRYPT_SALT` | bcrypt salt rounds |
| `JWT_SECRET_KEY` | Secret for access tokens |
| `JWT_SECRET_REFRESH_KEY` | Secret for refresh tokens |
| `TOKEN_EXPIRE_TIME` | Access token lifetime |
| `TOKEN_REFRESH_EXPIRE_TIME` | Refresh token lifetime |

## Running the application

### Local (without Docker)

```bash
npm start
```

The server will be available at `http://localhost:4000`.

### Docker Compose (API + PostgreSQL)

1. Copy `.env.example` to `.env` and adjust values if needed (keep `POSTGRES_HOST=db` when running the API inside Compose).
2. Start the stack:

```bash
docker compose up --build
```

The API is exposed at `http://localhost:4000`. PostgreSQL listens on `localhost:5432` with credentials from `.env`.

Optional **Adminer** (database UI) for local debugging:

```bash
docker compose --profile debug up --build
```

Then open Adminer at `http://localhost:8080` and use host `db`, user, password, and database from `.env`.

### Docker Hub image

Published application image (tag **`with-prisma`**):

- **Pull:** `docker pull marygrishchuk/nodejs-2026q1-knowledge-hub:with-prisma`
- **Docker Hub link:** https://hub.docker.com/repository/docker/marygrishchuk/nodejs-2026q1-knowledge-hub/tags/with-prisma/
- **Size:** 262 MB

### Container image security scan

The application image was scanned with **Docker Scout**:

```bash
docker pull marygrishchuk/nodejs-2026q1-knowledge-hub:with-prisma
docker scout cves marygrishchuk/nodejs-2026q1-knowledge-hub:with-prisma
```
8 vulnerabilities found in 5 packages:
|  CRITICAL | 0 |
|  HIGH     | 5 |
|  MEDIUM   | 3 |
|  LOW      | 0 |
No **critical** vulnerabilities.

### Database migrations and seed

With PostgreSQL running and `DATABASE_URL` set in `.env`:

```bash
npx prisma migrate deploy
npx prisma db seed
```

For local development against a disposable database, you can use `npx prisma migrate dev` instead of `deploy`.

**Connection pooling:** `DATABASE_URL` in `.env.example` includes Prisma’s `connection_limit` and `pool_timeout` query parameters so the client-side pool is bounded. The `app` service in `docker-compose.yml` uses the same parameters when building its URL.

### Running the full Jest suite (`npm test`)

1. **`DATABASE_URL`** must point at a database where migrations have been applied (Docker Compose `db` on `localhost:5432`, or another Postgres / Prisma URL you use). If something else already listens on port **5432**, either stop it or remap the `db` service port in Compose and match the port in `DATABASE_URL`.
2. **`src/additional-tests`** bootstraps Nest in-process against that URL.
3. **`test/*.e2e.spec.ts`** sends HTTP requests to **`http://localhost:${PORT}`**, so start the API first, for example: `npm run build` then `npm run start:prod` (or `nest start` in dev).

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

The Jest **additional** suite (`src/additional-tests`) boots the Nest `AppModule` in-process and therefore needs a **reachable PostgreSQL** instance and a valid `DATABASE_URL` in `.env` (run `npx prisma migrate deploy` first). The `test/*.e2e.spec.ts` suites call a server you start yourself on `PORT` (default `4000`).

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
