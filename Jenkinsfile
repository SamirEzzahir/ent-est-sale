pipeline {
    agent any

    environment {
        REGISTRY = "docker.io"
        NAMESPACE = "yourdockerhubuser"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'git fetch --all || true'
            }
        }

        stage('Prepare') {
            steps {
                sh 'chmod +x scripts/ci/*.sh scripts/cd/*.sh'
            }
        }

        stage('Detect Changes') {
            steps {
                sh './scripts/ci/detect-changes.sh'

                script {
                    env.FRONT = sh(script: "cat .ci_changed_frontend", returnStdout: true).trim()
                    env.BACK = sh(script: "cat .ci_changed_backends", returnStdout: true).trim()
                }
            }
        }

        stage('Frontend Check') {
            when {
                expression { env.FRONT == "true" }
            }
            steps {
                sh './scripts/ci/run-frontend-checks.sh'
            }
        }

        stage('Backend Check') {
            when {
                expression { env.BACK != "" }
            }
            steps {
                sh './scripts/ci/run-backend-checks.sh "$BACK"'
            }
        }

        stage('Build Images') {
            steps {
                sh './scripts/ci/build-images.sh "$FRONT" "$BACK"'
            }
        }

        stage('Smoke Tests') {
            steps {
                sh './scripts/ci/smoke-tests.sh'
            }
        }

        stage('Docker Login') {
            when {
    expression { env.BRANCH_NAME == 'develop' }
}
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                }
            }
        }

        stage('Push Images') {
            when {
    expression { env.BRANCH_NAME == 'develop' }
}
            steps {
                sh './scripts/ci/build-images.sh "$FRONT" "$BACK" push'
            }
        }

        stage('Deploy') {
            when {
    expression { env.BRANCH_NAME == 'develop' }
}
            steps {
                sh './scripts/cd/deploy.sh'
            }
        }
    }
}