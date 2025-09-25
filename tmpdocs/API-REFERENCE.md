# vibes-pro API Reference

## Base URL

```
https://api.vibes-pro.com/v1
```

## Authentication

All API endpoints require authentication:

```
Authorization: Bearer <your-token>
```

## Core Domain API

### Endpoints

- **GET** /api/core - List all Core entities
- **POST** /api/core - Create new Core entity
- **GET** /api/core/:id - Get specific Core entity
- **PUT** /api/core/:id - Update Core entity
- **DELETE** /api/core/:id - Delete Core entity

### Data Models

See [Type Definitions](../libs/shared/database-types/) for complete data models.


## Error Handling

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```
