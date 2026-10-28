
pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        DOCKERHUB_REPO = 'sarthakiparad2230/three-tier-app'
        EKS_CLUSTER_NAME = 'CD-Cluster'
        AWS_DEFAULT_REGION = 'eu-north-1'
    }

    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Sarthaki15/three-tier-app.git'
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
                withCredentials([
                    file(
                        credentialsId: 'app-env-file',
                        variable: 'APP_ENV_FILE'
                    )
                ]) {
                    sh '''
                        set -eu

                        docker rm -f test-app || true

                        docker run -d \
                          --name test-app \
                          --env-file "$APP_ENV_FILE" \
                          -p 8080:3000 \
                          "$DOCKERHUB_REPO:$BUILD_NUMBER"

                        sleep 10

                        docker ps -a --filter "name=test-app"
                        docker logs test-app

                        curl --fail \
                          --retry 5 \
                          --retry-delay 2 \
                          --retry-connrefused \
                          http://localhost:8080/
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
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-login',
                        usernameVariable: 'docker_username',
                        passwordVariable: 'docker_password'
                    )
                ]) {
                    sh '''
                        set +x
                        printf '%s' "$docker_password" |
                          docker login \
                            -u "$docker_username" \
                            --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh '''
                    docker push "$DOCKERHUB_REPO:$BUILD_NUMBER"
                    docker push "$DOCKERHUB_REPO:latest"
                '''
            }
        }

        stage('Deploy to EKS') {
            steps {
                withCredentials([
                    aws(
                        credentialsId: 'aws_access_key',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ),
                    file(
                        credentialsId: 'db-env-secrets-yaml',
                        variable: 'DB_ENV_FILE'
                    )
                ]) {
                    sh '''
                        set -eu
                        set +x

                        aws sts get-caller-identity

                        aws eks update-kubeconfig \
                          --name "$EKS_CLUSTER_NAME" \
                          --region "$AWS_DEFAULT_REGION"

                        kubectl get nodes

                        echo "Creating/updating Kubernetes Secret..."

                        kubectl create secret generic three-tier-app-db-secrets \
                          --from-env-file="$DB_ENV_FILE" \
                          --dry-run=client \
                          -o yaml |
                          kubectl apply -f -

                        echo "Applying Kubernetes Deployment..."

                        kubectl apply -f kubernetes/deployment.yaml

                        echo "Updating application image..."

                        kubectl set image \
                          deployment/three-tier-app-deployment \
                          three-tier-app="$DOCKERHUB_REPO:$BUILD_NUMBER"

                        echo "Applying Kubernetes Service..."

                        kubectl apply -f kubernetes/service.yaml

                        echo "Waiting for rollout..."

                        kubectl rollout status \
                          deployment/three-tier-app-deployment \
                          --timeout=180s
                    '''
                }
            }
        }

        stage('Verify Kubernetes Deployment') {
            steps {
                withCredentials([
                    aws(
                        credentialsId: 'aws_access_key',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    sh '''
                        set -eu

                        aws eks update-kubeconfig \
                          --name "$EKS_CLUSTER_NAME" \
                          --region "$AWS_DEFAULT_REGION"

                        echo "Deployment status:"
                        kubectl get deployment three-tier-app-deployment

                        echo "Pod status:"
                        kubectl get pods -o wide

                        echo "Service status:"
                        kubectl get services

                        echo "Rollout status:"
                        kubectl rollout status \
                          deployment/three-tier-app-deployment \
                          --timeout=180s
                    '''
                }
            }
        }
    }
}
