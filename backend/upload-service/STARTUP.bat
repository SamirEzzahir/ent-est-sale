@echo off
REM Startup guide for upload-service

echo.
echo ====================================
echo  UPLOAD SERVICE STARTUP GUIDE
echo ====================================
echo.
echo This script will show you the required steps to start the service.
echo.

echo Step 1: Start MinIO (Object Storage)
echo -----------------------------------------
echo Run in a terminal:
echo.
echo docker run -d --name minio -p 9000:9000 -p 9001:9001 ^
echo   -e MINIO_ROOT_USER=minioadmin ^
echo   -e MINIO_ROOT_PASSWORD=minioadmin ^
echo   minio/minio server /data --console-address ":9001"
echo.
echo MinIO Console: http://localhost:9001
echo.

echo Step 2: Start Cassandra (Database)
echo -----------------------------------------
echo Run in another terminal:
echo.
echo docker run -d --name cassandra -p 9042:9042 cassandra:4.1
echo.
echo Wait 30-40 seconds for Cassandra to fully start!
echo.

echo Step 3: Create Cassandra Schema (After Cassandra is ready)
echo -----------------------------------------
echo Run in a new terminal:
echo.
echo docker exec -it cassandra cqlsh
echo.
echo Then paste these commands:
echo.
echo CREATE KEYSPACE IF NOT EXISTS ent
echo   WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
echo.
echo USE ent;
echo.
echo CREATE TABLE IF NOT EXISTS course_files (
echo   id UUID PRIMARY KEY,
echo   filename TEXT,
echo   course_name TEXT,
echo   uploaded_by TEXT,
echo   upload_date TIMESTAMP,
echo   minio_path TEXT
echo );
echo.
echo (Type EXIT to quit cqlsh)
echo.

echo Step 4: Verify Services
echo -----------------------------------------
echo Run in the project directory:
echo.
echo python verify_setup.py
echo.

echo Step 5: Start Upload Service
echo -----------------------------------------
echo Run in the project directory:
echo.
cd /d "%~dp0"
echo uvicorn main:app --reload --port 8002
echo.
echo Service will be available at: http://localhost:8002
echo API Docs at: http://localhost:8002/docs
echo.

pause
