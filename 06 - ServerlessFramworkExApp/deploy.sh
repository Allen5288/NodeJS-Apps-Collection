#!/bin/bash

# Enterprise Serverless Application Deployment Script
# This script deploys the application to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="serverless-enterprise-app"
AWS_REGION="us-east-1"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI and configure credentials."
        exit 1
    fi
    
    # Check if Serverless is installed
    if ! command -v sls &> /dev/null; then
        print_error "Serverless Framework is not installed. Installing globally..."
        npm install -g serverless
    fi
    
    print_success "All prerequisites satisfied!"
}

# Function to install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm ci
    print_success "Dependencies installed!"
}

# Function to run tests
run_tests() {
    print_info "Running tests..."
    npm run test
    print_success "All tests passed!"
}

# Function to run linting
run_linting() {
    print_info "Running linting..."
    npm run lint
    if [ $? -ne 0 ]; then
        print_warning "Linting found issues. Attempting to fix..."
        npm run lint:fix
    fi
    print_success "Linting completed!"
}

# Function to build the project
build_project() {
    print_info "Building TypeScript project..."
    npm run type-check
    print_success "Build completed!"
}

# Function to deploy to specified environment
deploy_to_environment() {
    local STAGE=$1
    
    print_info "Deploying to $STAGE environment..."
    
    # Set environment-specific variables
    case $STAGE in
        "dev")
            export AWS_PROFILE="default"
            ;;
        "staging")
            export AWS_PROFILE="staging"
            ;;
        "prod")
            export AWS_PROFILE="production"
            ;;
        *)
            print_error "Unknown stage: $STAGE"
            exit 1
            ;;
    esac
    
    # Deploy using Serverless Framework
    sls deploy --stage $STAGE --region $AWS_REGION --verbose
    
    if [ $? -eq 0 ]; then
        print_success "Successfully deployed to $STAGE!"
        
        # Print deployment information
        print_info "Getting deployment information..."
        sls info --stage $STAGE --region $AWS_REGION
        
        # Print API endpoints
        print_info "API Endpoints:"
        sls info --stage $STAGE --region $AWS_REGION | grep -A 20 "endpoints:"
        
    else
        print_error "Deployment to $STAGE failed!"
        exit 1
    fi
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    local STAGE=$1
    
    print_info "Running post-deployment tests for $STAGE..."
    
    # Set the API endpoint for testing
    API_ENDPOINT=$(sls info --stage $STAGE --region $AWS_REGION | grep "ServiceEndpoint" | cut -d' ' -f2)
    export API_ENDPOINT
    
    # Run integration tests
    npm run test:e2e
    
    print_success "Post-deployment tests completed!"
}

# Function to create environment
create_environment() {
    local STAGE=$1
    
    print_info "Creating $STAGE environment infrastructure..."
    
    # Create SSM parameters for the environment
    aws ssm put-parameter \
        --name "/$SERVICE_NAME/$STAGE/jwt-secret" \
        --value "$(openssl rand -hex 32)" \
        --type "SecureString" \
        --overwrite \
        --region $AWS_REGION
    
    print_success "Environment $STAGE created!"
}

# Function to remove environment
remove_environment() {
    local STAGE=$1
    
    print_warning "This will remove ALL resources for $STAGE environment!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing $STAGE environment..."
        sls remove --stage $STAGE --region $AWS_REGION
        print_success "Environment $STAGE removed!"
    else
        print_info "Operation cancelled."
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy <stage>    Deploy to specified environment (dev|staging|prod)"
    echo "  test             Run tests only"
    echo "  create <stage>   Create environment infrastructure"
    echo "  remove <stage>   Remove environment (destructive!)"
    echo "  logs <stage>     Show logs for the environment"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy dev"
    echo "  $0 test"
    echo "  $0 create staging"
    echo "  $0 remove dev"
    echo "  $0 logs prod"
}

# Function to show logs
show_logs() {
    local STAGE=$1
    local FUNCTION=${2:-"usersApi"}
    
    print_info "Showing logs for $FUNCTION in $STAGE environment..."
    sls logs -f $FUNCTION --stage $STAGE --region $AWS_REGION -t
}

# Main execution
main() {
    local COMMAND=$1
    local STAGE=$2
    
    case $COMMAND in
        "deploy")
            if [ -z "$STAGE" ]; then
                print_error "Stage is required for deployment"
                show_help
                exit 1
            fi
            
            check_prerequisites
            install_dependencies
            run_linting
            build_project
            run_tests
            deploy_to_environment $STAGE
            run_post_deployment_tests $STAGE
            ;;
        "test")
            check_prerequisites
            install_dependencies
            run_tests
            ;;
        "create")
            if [ -z "$STAGE" ]; then
                print_error "Stage is required for environment creation"
                show_help
                exit 1
            fi
            
            check_prerequisites
            create_environment $STAGE
            ;;
        "remove")
            if [ -z "$STAGE" ]; then
                print_error "Stage is required for environment removal"
                show_help
                exit 1
            fi
            
            check_prerequisites
            remove_environment $STAGE
            ;;
        "logs")
            if [ -z "$STAGE" ]; then
                print_error "Stage is required for logs"
                show_help
                exit 1
            fi
            
            show_logs $STAGE $3
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
