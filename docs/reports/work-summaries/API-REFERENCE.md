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

-   **GET** /api/core - List all core entities
-   **POST** /api/core - Create new core entity
-   **GET** /api/core/:id - Get specific core entity
-   **PUT** /api/core/:id - Update core entity
-   **DELETE** /api/core/:id - Delete core entity

### Data Models

See [Type Definitions](../libs/shared/database-types/) for complete data models.

## User Domain API

### Endpoints

-   **GET** /api/user - List all user entities
-   **POST** /api/user - Create new user entity
-   **GET** /api/user/:id - Get specific user entity
-   **PUT** /api/user/:id - Update user entity
-   **DELETE** /api/user/:id - Delete user entity

### Data Models

See [Type Definitions](../libs/shared/database-types/) for complete data models.

## Billing Domain API

### Endpoints

-   **GET** /api/billing - List all billing entities
-   **POST** /api/billing - Create new billing entity
-   **GET** /api/billing/:id - Get specific billing entity
-   **PUT** /api/billing/:id - Update billing entity
-   **DELETE** /api/billing/:id - Delete billing entity

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
