pipeline {
    agent any

    environment {
        DOTNET_CLI_TELEMETRY_OPTOUT = '1'
        ASPNETCORE_ENVIRONMENT = 'Production'
        APP_NAME = 'superapp'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '📥 Checking out latest source code...'
                checkout scm
            }
        }

        stage('Install & Verify Frontend') {
            steps {
                echo '📦 Installing Node dependencies & Running TypeScript checks...'
                sh '''
                    node -v
                    npm ci
                    npx tsc --noEmit
                '''
            }
        }

        stage('Build & Test Backend') {
            steps {
                echo '🔨 Restoring & Building .NET 10 Web API...'
                sh '''
                    dotnet --version
                    dotnet restore backend/SuperApp.sln
                    dotnet build backend/SuperApp.sln -c Release --no-restore
                '''
            }
        }

        stage('Containerize Image') {
            steps {
                echo '🐳 Building production Docker container...'
                sh '''
                    docker build -t ${APP_NAME}-api:${BUILD_NUMBER} -f Dockerfile .
                    docker tag ${APP_NAME}-api:${BUILD_NUMBER} ${APP_NAME}-api:latest
                '''
            }
        }

        stage('Zero-Downtime Deploy') {
            steps {
                echo '🚀 Deploying application to production...'
                sh '''
                    # Execute production release manager script
                    chmod +x scripts/manage.sh
                    ./scripts/manage.sh deploy v-${BUILD_NUMBER}
                '''
            }
        }

        stage('Health Check & Smoke Probe') {
            steps {
                echo '🩺 Probing live endpoint health...'
                sh '''
                    curl --fail --retry 10 --retry-delay 3 -I http://127.0.0.1:5000/health || exit 1
                '''
            }
        }
    }

    post {
        success {
            echo '✅ SuperApp V2 pipeline completed and deployed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Triggering automatic rollback...'
            sh '''
                chmod +x scripts/manage.sh
                ./scripts/manage.sh rollback || true
            '''
        }
        always {
            cleanWs()
        }
    }
}
