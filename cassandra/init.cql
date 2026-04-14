-- ENT EST Salé — Cassandra init script
-- Run once after Cassandra is ready

CREATE KEYSPACE IF NOT EXISTS ent
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE ent;

CREATE TABLE IF NOT EXISTS course_files (
    id          UUID PRIMARY KEY,
    filename    TEXT,
    course_name TEXT,
    uploaded_by TEXT,
    upload_date TIMESTAMP,
    minio_path  TEXT
);
