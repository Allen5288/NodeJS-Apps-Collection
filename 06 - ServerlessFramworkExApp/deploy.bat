@echo off
:: Enterprise Serverless Application Deployment Script for Windows
:: This script deploys the application to different environments

setlocal enabledelayedexpansion

:: Configuration
set SERVICE_NAME=serverless-enterprise-app
set AWS_REGION=us-east-1

:: Function to print colored output (simulated with echo)
:print_info
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:: Function to check prerequisites
:check_prerequisites
call :print_info "Checking prerequisites..."

:: Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    call :print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    call :print_error "npm is not installed. Please install npm and try again."
    exit /b 1
)

:: Check if AWS CLI is installed
where aws >nul 2>nul
if errorlevel 1 (
    call :print_error "AWS CLI is not installed. Please install AWS CLI and configure credentials."
    exit /b 1
)

:: Check if Serverless is installed
where sls >nul 2>nul
if errorlevel 1 (
    call :print_error "Serverless Framework is not installed. Installing globally..."
    npm install -g serverless
)

call :print_success "All prerequisites satisfied!"
goto :eof

:: Function to install dependencies
:install_dependencies
call :print_info "Installing dependencies..."
npm ci
if errorlevel 1 (
    call :print_error "Failed to install dependencies!"
    exit /b 1
)
call :print_success "Dependencies installed!"
goto :eof

:: Function to run tests
:run_tests
call :print_info "Running tests..."
npm run test
if errorlevel 1 (
    call :print_error "Tests failed!"
    exit /b 1
)
call :print_success "All tests passed!"
goto :eof

:: Function to run linting
:run_linting
call :print_info "Running linting..."
npm run lint
if errorlevel 1 (
    call :print_warning "Linting found issues. Attempting to fix..."
    npm run lint:fix
)
call :print_success "Linting completed!"
goto :eof

:: Function to build the project
:build_project
call :print_info "Building TypeScript project..."
npm run type-check
if errorlevel 1 (
    call :print_error "Build failed!"
    exit /b 1
)
call :print_success "Build completed!"
goto :eof

:: Function to deploy to specified environment
:deploy_to_environment
set STAGE=%~1

call :print_info "Deploying to %STAGE% environment..."

:: Set environment-specific variables
if "%STAGE%"=="dev" (
    set AWS_PROFILE=default
) else if "%STAGE%"=="staging" (
    set AWS_PROFILE=staging
) else if "%STAGE%"=="prod" (
    set AWS_PROFILE=production
) else (
    call :print_error "Unknown stage: %STAGE%"
    exit /b 1
)

:: Deploy using Serverless Framework
sls deploy --stage %STAGE% --region %AWS_REGION% --verbose

if errorlevel 1 (
    call :print_error "Deployment to %STAGE% failed!"
    exit /b 1
)

call :print_success "Successfully deployed to %STAGE%!"

:: Print deployment information
call :print_info "Getting deployment information..."
sls info --stage %STAGE% --region %AWS_REGION%

goto :eof

:: Function to create environment
:create_environment
set STAGE=%~1

call :print_info "Creating %STAGE% environment infrastructure..."

:: Generate random JWT secret
for /f "delims=" %%i in ('powershell -command "[System.Web.Security.Membership]::GeneratePassword(32,$false)"') do set JWT_SECRET=%%i

:: Create SSM parameters for the environment
aws ssm put-parameter ^
    --name "/%SERVICE_NAME%/%STAGE%/jwt-secret" ^
    --value "%JWT_SECRET%" ^
    --type "SecureString" ^
    --overwrite ^
    --region %AWS_REGION%

if errorlevel 1 (
    call :print_error "Failed to create environment parameters!"
    exit /b 1
)

call :print_success "Environment %STAGE% created!"
goto :eof

:: Function to remove environment
:remove_environment
set STAGE=%~1

call :print_warning "This will remove ALL resources for %STAGE% environment!"
set /p CONFIRM="Are you sure? (y/N): "

if /i "%CONFIRM%"=="y" (
    call :print_info "Removing %STAGE% environment..."
    sls remove --stage %STAGE% --region %AWS_REGION%
    if errorlevel 1 (
        call :print_error "Failed to remove environment!"
        exit /b 1
    )
    call :print_success "Environment %STAGE% removed!"
) else (
    call :print_info "Operation cancelled."
)
goto :eof

:: Function to show help
:show_help
echo Usage: %~nx0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   deploy ^<stage^>    Deploy to specified environment (dev^|staging^|prod)
echo   test             Run tests only
echo   create ^<stage^>   Create environment infrastructure
echo   remove ^<stage^>   Remove environment (destructive!)
echo   logs ^<stage^>     Show logs for the environment
echo   help             Show this help message
echo.
echo Examples:
echo   %~nx0 deploy dev
echo   %~nx0 test
echo   %~nx0 create staging
echo   %~nx0 remove dev
echo   %~nx0 logs prod
goto :eof

:: Function to show logs
:show_logs
set STAGE=%~1
set FUNCTION=%~2
if "%FUNCTION%"=="" set FUNCTION=usersApi

call :print_info "Showing logs for %FUNCTION% in %STAGE% environment..."
sls logs -f %FUNCTION% --stage %STAGE% --region %AWS_REGION% -t
goto :eof

:: Main execution
set COMMAND=%~1
set STAGE=%~2

if "%COMMAND%"=="deploy" (
    if "%STAGE%"=="" (
        call :print_error "Stage is required for deployment"
        call :show_help
        exit /b 1
    )
    
    call :check_prerequisites
    if errorlevel 1 exit /b 1
    
    call :install_dependencies
    if errorlevel 1 exit /b 1
    
    call :run_linting
    if errorlevel 1 exit /b 1
    
    call :build_project
    if errorlevel 1 exit /b 1
    
    call :run_tests
    if errorlevel 1 exit /b 1
    
    call :deploy_to_environment %STAGE%
    if errorlevel 1 exit /b 1
    
) else if "%COMMAND%"=="test" (
    call :check_prerequisites
    if errorlevel 1 exit /b 1
    
    call :install_dependencies
    if errorlevel 1 exit /b 1
    
    call :run_tests
    if errorlevel 1 exit /b 1
    
) else if "%COMMAND%"=="create" (
    if "%STAGE%"=="" (
        call :print_error "Stage is required for environment creation"
        call :show_help
        exit /b 1
    )
    
    call :check_prerequisites
    if errorlevel 1 exit /b 1
    
    call :create_environment %STAGE%
    if errorlevel 1 exit /b 1
    
) else if "%COMMAND%"=="remove" (
    if "%STAGE%"=="" (
        call :print_error "Stage is required for environment removal"
        call :show_help
        exit /b 1
    )
    
    call :check_prerequisites
    if errorlevel 1 exit /b 1
    
    call :remove_environment %STAGE%
    if errorlevel 1 exit /b 1
    
) else if "%COMMAND%"=="logs" (
    if "%STAGE%"=="" (
        call :print_error "Stage is required for logs"
        call :show_help
        exit /b 1
    )
    
    call :show_logs %STAGE% %~3
    
) else if "%COMMAND%"=="help" (
    call :show_help
) else if "%COMMAND%"=="--help" (
    call :show_help
) else if "%COMMAND%"=="-h" (
    call :show_help
) else (
    if not "%COMMAND%"=="" (
        call :print_error "Unknown command: %COMMAND%"
    )
    call :show_help
    exit /b 1
)
