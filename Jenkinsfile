pipeline {
    agent any
    
    options {
        timestamps()
    }
    
    environment {
        DOCKERHUB_REPO = 'sarthakiparad2230/three-tier-app'
        EKS_CLUSTER_NAME = 'CD-Cluster'
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
                    docker rm -f test-app || true
                    docker run -d \
                    --name test-app \
                    --env-file "$APP_ENV_FILE_var" \
                    -p 8080:3000 \
                    "$DOCKERHUB_REPO:$BUILD_NUMBER"
                    sleep 10
                    docker ps -a --filter "name=test-app"
                    docker logs test-app
                    curl --fail --retry 5 --retry-delay 2 \
                    --retry-connrefused http://localhost:8080/
                    '''
                }
            }
            post {
                always {
                    sh 'docker rm -f test-app || true'
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
        stage('Deploy to EKS') {
            steps {
                withCredentials([aws(accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws_access_key', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                sh '''
                aws sts get-caller-identity
                aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME"
                kubectl get nodes
                kubectl delete deployment --all
                kubectl apply -f kubernetes/secrets.yaml
                kubectl apply -f kubernetes/deployment.yaml
                kubectl apply -f kubernetes/service.yaml
                '''
                }
            }
        }
        stage('Verify Kubernetes Deployment') {
            steps {
                withCredentials([aws(accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws_access_key', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                sh '''
                aws sts get-caller-identity
                aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME"
                kubectl get nodes
                kubectl get deployment 
                    kubectl get pods
                    kubectl get services
                '''
                }
            }
        }
    }
}