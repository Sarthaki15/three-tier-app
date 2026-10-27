pipeline {
    agent any
    
    options {
        timestamps()
    }
    
    environment {
        DOCKERHUB_REPO = 'sarthakiparad2230/three-tier-app'
    }
    
    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Sarthaki15/three-tier-app.git'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh '''
                docker build \
                -t "$DOCKERHUB_REPO:$BUILD_NUMBER" \
                -t "$DOCKERHUB_REPO:latest" .
                '''
            }
        }
        stage('Test Docker Image') {
            steps {
                withCredentials([file(credentialsId: 'app-env-file', variable: 'APP_ENV_FILE_var')]) {
                    sh '''
                           docker run -d \\
                           --name test-app \\
                           --env-file "$APP_ENV_FILE_var" \\
                           -p 18080:3000 \\
                           "$DOCKERHUB_REPO:$BUILD_NUMBER"
                           sleep 10
                           curl --fail http://localhost:18080/
                           docker rm -f test-app
                    '''
                }
            }
        }
        stage('Docker Hub Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-login', passwordVariable: 'docker_password', usernameVariable: 'docker_username')]) {
                    sh "echo $docker_password | docker login -u $docker_username --password-stdin"
                }
            }
        }
        stage('Push Docker Image') {
            steps {
                sh '''docker push "$DOCKERHUB_REPO:$BUILD_NUMBER"
                      docker push "$DOCKERHUB_REPO:latest"
                      '''
            }
        }
        stage('Pull Image from Docker Hub') {
            steps {
                withCredentials([file(credentialsId: 'app-env-file', variable: 'APP_ENV_FILE_var')]) {
                sh '''
                docker pull "$DOCKERHUB_REPO:$BUILD_NUMBER"
                docker rm -f three-tier-app || true
                docker run -d -p 8080:3000 --name three-tier-app --restart unless-stopped --env-file "$APP_ENV_FILE_var" "$DOCKERHUB_REPO:$BUILD_NUMBER"
                '''
                }
            }
        }
        stage('Verify Deployment') {
            steps {
                sh '''
                    docker ps --filter "name=three-tier-app"
                    curl --fail http://localhost:8080/
                '''
            }
        }
    }
}