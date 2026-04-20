#!/usr/bin/env bash
set -e

echo "Deploying ONLY app services..."

docker compose up -d --build \
  gateway \
  frontend \
  core-auth \
  upload-service \
  download-service \
  admin-service \
  ai-assistant-service \
  course-service \
  assignment-service \
  grade-service \
  notification-service \
  schedule-service

echo "Deploy done."