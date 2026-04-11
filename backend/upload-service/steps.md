### Step 1 — شغّل Containers المطلوبة
# MinIO
docker run -d --name minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Cassandra
docker run -d --name cassandra -p 9042:9042 cassandra:4.1

# انتظر 30 ثانية لـ Cassandra، ثم:
docker exec -it cassandra cqlsh

### Step 2 — إنشاء الـ Schema في Cassandra
CREATE KEYSPACE ent
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE ent;

CREATE TABLE course_files (
  id UUID PRIMARY KEY,
  filename TEXT,
  course_name TEXT,
  uploaded_by TEXT,
  upload_date TIMESTAMP,
  minio_path TEXT
);

### Step 3 — إنشاء المجلدات
mkdir upload-service && cd upload-service
mkdir app
touch main.py requirements.txt generate_token.py
touch app/__init__.py app/routes.py app/minio_client.py app/cassandra_client.py app/auth.py

### Step 4 — تثبيت المكتبات
pip install fastapi uvicorn python-minio cassandra-driver python-jose passlib python-multipart

# أو في requirements.txt:
fastapi
uvicorn
minio
cassandra-driver
python-jose
python-multipart

### Step 5 — اكتب الملفات
app/minio_client.py
app/cassandra_client.py