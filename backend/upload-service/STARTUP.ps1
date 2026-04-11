# PowerShell Startup Script for Upload Service

Write-Host "`n==================================`n  UPLOAD SERVICE STARTUP GUIDE`n==================================" -ForegroundColor Cyan

Write-Host "`nStep 1: Start MinIO (Object Storage)`n-----------------------------------------" -ForegroundColor Yellow
Write-Host "Run in a new PowerShell terminal:`n"
Write-Host 'docker run -d --name minio -p 9000:9000 -p 9001:9001 `' -ForegroundColor Green
Write-Host '  -e MINIO_ROOT_USER=minioadmin `' -ForegroundColor Green
Write-Host '  -e MINIO_ROOT_PASSWORD=minioadmin `' -ForegroundColor Green
Write-Host '  minio/minio server /data --console-address ":9001"' -ForegroundColor Green
Write-Host "`nMinIO Console: http://localhost:9001`n"

Write-Host "Step 2: Start Cassandra (Database)`n-----------------------------------------" -ForegroundColor Yellow
Write-Host "Run in another new PowerShell terminal:`n"
Write-Host "docker run -d --name cassandra -p 9042:9042 cassandra:4.1" -ForegroundColor Green
Write-Host "`nWait 30-40 seconds for Cassandra to fully initialize!`n"

Write-Host "Step 3: Create Cassandra Schema`n-----------------------------------------" -ForegroundColor Yellow
Write-Host "Run in a new terminal (after Cassandra starts):`n"
Write-Host "docker exec -it cassandra cqlsh" -ForegroundColor Green
Write-Host "`nThen run these commands in cqlsh:`n"
Write-Host "CREATE KEYSPACE IF NOT EXISTS ent
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};" -ForegroundColor Green
Write-Host "`nUSE ent;`n" -ForegroundColor Green
Write-Host "CREATE TABLE IF NOT EXISTS course_files (
  id UUID PRIMARY KEY,
  filename TEXT,
  course_name TEXT,
  uploaded_by TEXT,
  upload_date TIMESTAMP,
  minio_path TEXT
);" -ForegroundColor Green
Write-Host "`nType EXIT to quit cqlsh`n"

Write-Host "Step 4: Verify All Services are Running`n-----------------------------------------" -ForegroundColor Yellow
Write-Host "Run in the project directory:`n"
Write-Host "python verify_setup.py`n" -ForegroundColor Green

Write-Host "Step 5: Start the Upload Service`n-----------------------------------------" -ForegroundColor Yellow
Write-Host "Navigate to project and run:`n"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "cd '$scriptPath'" -ForegroundColor Green
Write-Host "uvicorn main:app --reload --port 8002`n" -ForegroundColor Green

Write-Host "Service will be available at:`n  - API: http://localhost:8002`n  - Docs: http://localhost:8002/docs`n  - MinIO: http://localhost:9001`n" -ForegroundColor Cyan
