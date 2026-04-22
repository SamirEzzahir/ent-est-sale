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
    minio_path  TEXT,
    file_size   BIGINT
);

CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY,
    course_code TEXT,
    course_name TEXT,
    description TEXT,
    teacher_id TEXT,
    teacher_name TEXT,
    semester INT,
    academic_year TEXT,
    credits INT,
    created_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    course_id UUID,
    student_id TEXT,
    enrolled_date TIMESTAMP,
    PRIMARY KEY (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_courses (
    student_id TEXT,
    course_id UUID,
    enrolled_date TIMESTAMP,
    PRIMARY KEY (student_id, course_id)
);
