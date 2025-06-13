#!/bin/bash

# CMS API Testing Script
# This script tests all available API endpoints in the CMS application

# Configuration
BASE_URL="http://localhost:5000/api/v1"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
    esac
}

# Function to make API request and display results
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local description=$5
    
    echo -e "\n${YELLOW}=== Testing: $description ===${NC}"
    echo "Method: $method"
    echo "Endpoint: $BASE_URL$endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
    fi
    
    echo -e "\n${BLUE}Response:${NC}"
    
    if [ -n "$data" ] && [ -n "$headers" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "$CONTENT_TYPE" \
            -H "$headers" \
            -d "$data")
    elif [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "$CONTENT_TYPE" \
            -d "$data")
    elif [ -n "$headers" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "$headers")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP status code
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    # Pretty print JSON response if possible
    if command -v jq &> /dev/null; then
        echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    else
        echo "$response_body"
    fi
    
    # Display status
    if [[ $http_status -ge 200 && $http_status -lt 300 ]]; then
        print_status "SUCCESS" "Status Code: $http_status"
    elif [[ $http_status -ge 400 && $http_status -lt 500 ]]; then
        print_status "WARNING" "Status Code: $http_status (Client Error)"
    elif [[ $http_status -ge 500 ]]; then
        print_status "ERROR" "Status Code: $http_status (Server Error)"
    else
        print_status "INFO" "Status Code: $http_status"
    fi
    
    echo -e "\n${'='*60}"
}

# Check if server is running
check_server() {
    print_status "INFO" "Checking if server is running..."
    if curl -s "$BASE_URL" > /dev/null 2>&1; then
        print_status "SUCCESS" "Server is running at $BASE_URL"
    else
        print_status "ERROR" "Server is not running at $BASE_URL"
        print_status "INFO" "Please start the server with: npm run dev"
        exit 1
    fi
}

# Global variables to store authentication data
JWT_TOKEN=""
USER_ID=""
ARTICLE_ID=""

# Start testing
echo -e "${GREEN}Starting CMS API Testing${NC}"
echo -e "Base URL: $BASE_URL\n"

# Check server status
check_server

# 1. Test User Registration
print_status "INFO" "Testing Authentication APIs..."
register_data='{
    "username": "Test User",
    "email": "testuser@example.com",
    "password": "password123"
}'

make_request "POST" "/register" "$register_data" "" "User Registration"

# 2. Test User Login
login_data='{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "password123"
}'

echo -e "\n${BLUE}Attempting to login and extract JWT token...${NC}"
login_response=$(curl -s -X POST "$BASE_URL/login" \
    -H "$CONTENT_TYPE" \
    -d "$login_data")

if command -v jq &> /dev/null; then
    JWT_TOKEN=$(echo "$login_response" | jq -r '.token // empty' 2>/dev/null)
    USER_ID=$(echo "$login_response" | jq -r '.user.id // .user._id // empty' 2>/dev/null)
fi

make_request "POST" "/login" "$login_data" "" "User Login"

if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
    print_status "SUCCESS" "JWT Token extracted successfully"
    AUTH_HEADER="Authorization: Bearer $JWT_TOKEN"
else
    print_status "WARNING" "Could not extract JWT token. Some tests may fail."
    AUTH_HEADER=""
fi

# 3. Test Get Current User (requires authentication)
if [ -n "$AUTH_HEADER" ]; then
    make_request "GET" "/user/me" "" "$AUTH_HEADER" "Get Current User Profile"
else
    print_status "WARNING" "Skipping authenticated user profile test (no token)"
fi

# 4. Test Article APIs
print_status "INFO" "Testing Article APIs..."

# Get all articles (should work without authentication)
make_request "GET" "/articles" "" "" "Get All Articles"

# Create a new article
article_data='{
    "title": "Test Article",
    "content": "This is a test article content for API testing.",
    "author": "Test Author",
    "category": "Technology",
    "tags": ["test", "api", "cms"]
}'

echo -e "\n${BLUE}Creating article and extracting article ID...${NC}"
if [ -n "$AUTH_HEADER" ]; then
    article_response=$(curl -s -X POST "$BASE_URL/articles" \
        -H "$CONTENT_TYPE" \
        -H "$AUTH_HEADER" \
        -d "$article_data")
else
    article_response=$(curl -s -X POST "$BASE_URL/articles" \
        -H "$CONTENT_TYPE" \
        -d "$article_data")
fi

if command -v jq &> /dev/null; then
    ARTICLE_ID=$(echo "$article_response" | jq -r '.id // ._id // empty' 2>/dev/null)
fi

if [ -n "$AUTH_HEADER" ]; then
    make_request "POST" "/articles" "$article_data" "$AUTH_HEADER" "Create New Article (Authenticated)"
else
    make_request "POST" "/articles" "$article_data" "" "Create New Article"
fi

if [ -n "$ARTICLE_ID" ] && [ "$ARTICLE_ID" != "null" ]; then
    print_status "SUCCESS" "Article ID extracted: $ARTICLE_ID"
    
    # Get single article
    make_request "GET" "/articles/$ARTICLE_ID" "" "" "Get Single Article"
    
    # Update article
    update_data='{
        "title": "Updated Test Article",
        "content": "This is updated content for the test article.",
        "category": "Updated Technology"
    }'
    
    if [ -n "$AUTH_HEADER" ]; then
        make_request "PUT" "/articles/$ARTICLE_ID" "$update_data" "$AUTH_HEADER" "Update Article (Authenticated)"
    else
        make_request "PUT" "/articles/$ARTICLE_ID" "$update_data" "" "Update Article"
    fi
    
    # Delete article
    if [ -n "$AUTH_HEADER" ]; then
        make_request "DELETE" "/articles/$ARTICLE_ID" "" "$AUTH_HEADER" "Delete Article (Authenticated)"
    else
        make_request "DELETE" "/articles/$ARTICLE_ID" "" "" "Delete Article"
    fi
else
    print_status "WARNING" "Could not extract Article ID. Skipping single article tests."
fi

# 5. Test Image Upload API
print_status "INFO" "Testing Image Upload API..."

# Create a test image file if it doesn't exist
TEST_IMAGE="test-image.png"
if [ ! -f "$TEST_IMAGE" ]; then
    print_status "INFO" "Creating test image file..."
    # Create a simple 1x1 PNG image using base64
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > "$TEST_IMAGE"
fi

if [ -f "$TEST_IMAGE" ]; then
    echo -e "\n${YELLOW}=== Testing: Image Upload ===${NC}"
    echo "Method: POST"
    echo "Endpoint: $BASE_URL/upload"
    echo "File: $TEST_IMAGE"
    
    echo -e "\n${BLUE}Response:${NC}"
    
    if [ -n "$AUTH_HEADER" ]; then
        upload_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/upload" \
            -H "$AUTH_HEADER" \
            -F "file=@$TEST_IMAGE")
    else
        upload_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/upload" \
            -F "file=@$TEST_IMAGE")
    fi
    
    # Extract HTTP status code
    http_status=$(echo "$upload_response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$upload_response" | sed '/HTTP_STATUS/d')
    
    # Pretty print JSON response if possible
    if command -v jq &> /dev/null; then
        echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    else
        echo "$response_body"
    fi
    
    # Display status
    if [[ $http_status -ge 200 && $http_status -lt 300 ]]; then
        print_status "SUCCESS" "Status Code: $http_status"
    elif [[ $http_status -ge 400 && $http_status -lt 500 ]]; then
        print_status "WARNING" "Status Code: $http_status (Client Error)"
    elif [[ $http_status -ge 500 ]]; then
        print_status "ERROR" "Status Code: $http_status (Server Error)"
    else
        print_status "INFO" "Status Code: $http_status"
    fi
    
    echo -e "\n${'='*60}"
    
    # Clean up test image
    rm -f "$TEST_IMAGE"
else
    print_status "ERROR" "Could not create test image file"
fi

# Summary
echo -e "\n${GREEN}=== API Testing Complete ===${NC}"
print_status "INFO" "All available CMS API endpoints have been tested"
print_status "INFO" "Check the responses above for any errors or issues"

# Additional notes
echo -e "\n${YELLOW}Notes:${NC}"
echo "- Some endpoints may require authentication (JWT token)"
echo "- Make sure MongoDB is running and accessible"
echo "- The server should be running on port 5000"
echo "- Install 'jq' for better JSON formatting: sudo apt-get install jq (Linux) or brew install jq (Mac)"

exit 0
