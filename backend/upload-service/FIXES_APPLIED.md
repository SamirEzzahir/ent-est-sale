# Upload Service - Bug Fixes & Improvements

## Issues Fixed

### 1. **Database Schema Mismatch** ❌
- **Problem**: INSERT statement in `routes.py` didn't match Cassandra schema definition
  - Schema has: `id`, `filename`, `course_name`, `uploaded_by`, `upload_date`, `minio_path`
  - Code was inserting: `id`, `filename`, `minio_path`, `upload_date` (missing `course_name` and `uploaded_by`)
- **Fix**: Updated INSERT to include all required fields

### 2. **MinIO Upload Issue** ❌
- **Problem**: Using `length=-1` in `put_object()` causes issues with large files
- **Fix**: Read file content first, then use actual file size with `io.BytesIO()`

### 3. **Missing Error Handling** ❌
- **Problem**: No try-except blocks for database/storage operations
- **Fix**: Added comprehensive error handling in all routes and client initializations

### 4. **No File Validation** ❌
- **Problem**: Any file type/size accepted, no restrictions
- **Fix**: 
  - Added `MAX_FILE_SIZE = 100MB` limit
  - Added `ALLOWED_EXTENSIONS` whitelist (.pdf, .txt, .docx, .pptx, .xlsx, .jpg, .jpeg, .png)
  - Returns HTTP 400 for invalid types, HTTP 413 for oversized files

### 5. **Hardcoded Secrets** ❌
- **Problem**: JWT secret, MinIO credentials, Cassandra host all hardcoded
- **Fix**: 
  - Use environment variables via `os.getenv()`
  - Keep sensible defaults for development
  - Created `.env.example` template for configuration

### 6. **Missing Logging** ❌
- **Problem**: Difficult to debug issues, no visibility into operations
- **Fix**: Added comprehensive logging to all modules with proper formatting

### 7. **Weak Return Values** ❌
- **Problem**: Response doesn't include upload timestamp or username
- **Fix**: Enhanced response to include `uploaded_by` and `upload_date`

### 8. **Poor Authentication** ❌
- **Problem**: `require_teacher()` only checked role, not returning username
- **Fix**: 
  - Added `get_current_user()` to extract username from token
  - `require_teacher()` now returns username for use in routes
  - Added `get_current_role()` function for role extraction logic

### 9. **Missing Startup Validation** ❌
- **Problem**: Connection failures at startup aren't caught
- **Fix**: Added error handling in client initialization with logging

### 10. **Production Issues** ❌
- **Problem**: No version tracking, no startup/shutdown handlers
- **Fix**: 
  - Added FastAPI lifecycle events (startup/shutdown)
  - Added version tracking in `__init__.py`
  - Added app metadata (title, version)

## Configuration

### Environment Variables (see `.env.example`)

```bash
# Copy and configure
cp .env.example .env
nano .env  # or edit with your editor
```

### Required Environment Variables:
- `JWT_SECRET` - Secret key for JWT tokens (default: "dev-secret-key")
- `MINIO_HOST` - MinIO server address (default: "localhost:9000")
- `MINIO_ACCESS_KEY` - MinIO access key (default: "minioadmin")
- `MINIO_SECRET_KEY` - MinIO secret key (default: "minioadmin")
- `CASSANDRA_HOST` - Cassandra server address (default: "localhost")
- `CASSANDRA_PORT` - Cassandra port (default: "9042")
- `CASSANDRA_KEYSPACE` - Cassandra keyspace (default: "ent")

## Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Create Cassandra Schema
```bash
docker exec -it cassandra cqlsh
```

```sql
CREATE KEYSPACE IF NOT EXISTS ent
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE ent;

CREATE TABLE IF NOT EXISTS course_files (
  id UUID PRIMARY KEY,
  filename TEXT,
  course_name TEXT,
  uploaded_by TEXT,
  upload_date TIMESTAMP,
  minio_path TEXT
);
```

### 4. Run the Service
```bash
uvicorn main:app --reload --port 8002
```

### 5. Generate Test Tokens
```bash
python generate_token.py teacher_name student_name
```

## API Endpoints

### Upload File
- **URL**: `POST /api/upload/upload`
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Body**: Form data with `file` field
- **Response**:
```json
{
  "id": "uuid-here",
  "filename": "document.pdf",
  "uploaded_by": "teacher_name",
  "upload_date": "2024-04-11T12:34:56.789123"
}
```

## Validation Rules

- **File Size**: Max 100MB
- **Allowed Types**: .pdf, .txt, .docx, .pptx, .xlsx, .jpg, .jpeg, .png
- **Authorization**: Requires "teacher" role
- **Authentication**: Valid JWT token required

## Error Codes

- `400` - Invalid file type or malformed request
- `401` - Missing or invalid authentication token
- `403` - User role not authorized (requires teacher)
- `413` - File size exceeds limit
- `500` - Server error (database/storage failure)

## Files Modified

- ✅ `main.py` - Added logging, lifecycle events, metadata
- ✅ `app/routes.py` - Added validation, error handling, schema fix
- ✅ `app/auth.py` - Added environment variables, improved error handling, user extraction
- ✅ `app/cassandra_client.py` - Added environment variables, error handling, logging
- ✅ `app/minio_client.py` - Added environment variables, error handling, logging
- ✅ `app/__init__.py` - Added package metadata
- ✅ `generate_token.py` - Added environment variable support, CLI arguments
- ✅ `requirements.txt` - Added version constraints, added missing dependencies
- ✅ `.env.example` - New file for configuration template

## Testing

```bash
# Generate tokens
TOKEN=$(python generate_token.py teacher1 student1 | grep TEACHER | awk '{print $2}')

# Test upload
curl -X POST http://localhost:8002/api/upload/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
```
