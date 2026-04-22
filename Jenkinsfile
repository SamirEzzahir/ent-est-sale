pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy Infra (if not running)') {
            steps {
                sh 'docker compose -f docker-compose.infra.yml up -d --remove-orphans || true'
            }
        }

        stage('Deploy App') {
            steps {
                sh 'docker compose down -v'
                sh 'docker compose up -d '
                sh 'docker compose up -d gateway'
            }
        }
        
    }
}