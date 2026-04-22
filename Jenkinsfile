pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy Infra') {
            steps {
                sh 'docker compose -f docker-compose.infra.yml up -d --remove-orphans || true'
            }
        }

        stage('Deploy App') {
            steps {
                sh 'docker compose down'
                sh 'docker compose up -d --build'
            }
        }
    }
}