# Cricket Vision API Endpoints

## Authentication

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 200
{
  "message": "Account created successfully",
  "user_id": "uuid-here"
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 200
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user_id": "uuid-here",
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Analysis

### Analyze Video
```
POST /analyze
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Request: Binary video file (mp4, mov)

Response: 200
{
  "speed": "135.5 km/h (avg: 128.2 km/h)",
  "trajectory": [[100, 200], [120, 220], ...],
  "detections": [
    {
      "frame": 0,
      "x": 100,
      "y": 200,
      "confidence": 0.95
    },
    ...
  ],
  "processing_time": 12.5,
  "analysis_id": "uuid-here"
}
```

### Get User Analyses
```
GET /analyses
Authorization: Bearer <access_token>

Response: 200
{
  "user_id": "uuid-here",
  "analyses": [
    {
      "id": "uuid-here",
      "user_id": "uuid-here",
      "speed": "135.5 km/h (avg: 128.2 km/h)",
      "trajectory": [[100, 200], [120, 220], ...],
      "detections": [...],
      "processing_time": 12.5,
      "created_at": "2026-04-21T10:30:00Z"
    },
    ...
  ]
}
```

### Get Analysis by ID
```
GET /analyses/{analysis_id}
Authorization: Bearer <access_token>

Response: 200
{
  "id": "uuid-here",
  "user_id": "uuid-here",
  "speed": "135.5 km/h (avg: 128.2 km/h)",
  "trajectory": [[100, 200], [120, 220], ...],
  "detections": [...],
  "processing_time": 12.5,
  "created_at": "2026-04-21T10:30:00Z"
}
```

## Health & Status

### Health Check
```
GET /health

Response: 200
{
  "status": "ok"
}
```

### Root
```
GET /

Response: 200
{
  "message": "Welcome to Cricket Vision API!",
  "version": "1.0.0"
}
```

## Error Responses

All errors follow this format:
```json
{
  "detail": "Error message here"
}
```

Common status codes:
- 200: Success
- 400: Bad request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (access denied)
- 404: Not found
- 500: Server error
