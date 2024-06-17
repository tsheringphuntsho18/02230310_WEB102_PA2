To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

# Pokemon API

## Overview

This API allows users to register, log in, catch Pokemon, and release them.

## Endpoints

### Authentication

- `POST /register`: Register a new user
- `POST /login`: Log in and receive a JWT

### Pokemon

- `GET /pokemon/:name`: Fetch Pokemon data from PokeAPI

### Protected Endpoints

- `POST /protected/catch`: Catch a Pokemon (requires JWT)
- `DELETE /protected/release/:id`: Release a Pokemon (requires JWT)
- `GET /protected/caught`: List caught Pokemon (requires JWT)

## Authentication

The API uses JWT for authentication. Include the token in the `Authorization` header.

## Rate Limiting

(Describe your rate-limiting strategy here)

## Pagination

Use `page` and `limit` query parameters to paginate results.

## Error Handling

The API returns appropriate HTTP status codes and error messages.
