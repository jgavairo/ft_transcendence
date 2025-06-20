# Fastify Guide - Functions and Requests

## Table of Contents
1. [Request Types](#request-types)
2. [User Management Functions](#user-management-functions)
3. [Authentication Middleware](#authentication-middleware)
4. [Error Handling](#error-handling)

## Request Types

### FastifyRequest
```typescript
interface FastifyRequest {
    // Base properties
    id: string;              // Unique request ID
    params: any;             // URL parameters
    query: any;              // Query parameters
    body: any;               // Request body
    headers: any;            // HTTP headers
    cookies: any;            // Cookies
    raw: any;                // Raw HTTP request

    // Useful methods
    log: any;                // Logger
    server: any;             // Server instance
}
```

### AuthenticatedRequest
```typescript
interface AuthenticatedRequest extends FastifyRequest 
{
    user: 
    {
        id: number;          // Authenticated user ID
    };
}
```

## User Management Functions

### getInfosHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Retrieves user information
    // Request: GET /api/user/infos
    // Returns: { success: boolean, user: UserInfo }
}
```

### getUserLibraryHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Retrieves the user's game library
    // Request: GET /api/user/library
    // Returns: { success: boolean, library: Game[] }
}
```

### addGameHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Adds a game to the user's library
    // Request: POST /api/user/addGame
    // Body: { gameId: number }
    // Returns: { success: boolean, message: string }
}
```

### changePictureHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Changes the user's profile picture
    // Request: POST /api/profile/changePicture
    // Body: FormData with the image
    // Returns: { success: boolean, message: string }
}
```

### updateBioHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Updates the user's bio
    // Request: POST /api/profile/updateBio
    // Body: { bio: string }
    // Returns: { success: boolean, message: string }
}
```

### getAllUsersHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Retrieves all users
    // Request: GET /api/users
    // Returns: { success: boolean, users: User[] }
}
```

## Authentication Middleware

### authMiddleware
```typescript
async (request: AuthenticatedRequest, reply: FastifyReply) => {
    // Checks the JWT token in cookies
    // Adds the user ID to the request
    // Returns a 401 error if not authenticated
}
```

## Error Handling

### Common HTTP Codes
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

### Error Response Format
```typescript
{
    success: false,
    message: "Detailed error message"
}
```

## Best Practices

1. **Typing**
   - Use interfaces for request types
   - Clearly define return types
   - Use type assertion (`as`) with caution

2. **Security**
   - Always check authentication with `authMiddleware`
   - Validate user input
   - Use HTTPS in production

3. **Error Handling**
   - Always use try/catch
   - Log detailed errors
   - Return clear error messages

4. **Performance**
   - Use `async/await` for async operations
   - Avoid unnecessary database queries
   - Cache when possible