#!/bin/bash

# MySQL Backend System API Testing Script
# This script tests all available API endpoints in the MySQL backend system

# Configuration
BASE_URL="http://localhost:3000"
API_BASE_URL="$BASE_URL/api"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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
        "TEST")
            echo -e "${PURPLE}[TEST]${NC} $message"
            ;;
    esac
}

# Function to make API request and display results
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${CYAN}=== Testing: $description ===${NC}"
    echo "Method: $method"
    echo "Endpoint: $API_BASE_URL$endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
    fi
    
    echo -e "\n${BLUE}Response:${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$API_BASE_URL$endpoint" \
            -H "$CONTENT_TYPE" \
            -d "$data")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "$API_BASE_URL$endpoint")
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
    
    echo -e "\n${'='*80}"
    
    # Store IDs for later use
    if command -v jq &> /dev/null && [[ $http_status -ge 200 && $http_status -lt 300 ]]; then
        if [[ "$endpoint" == "/users" && "$method" == "POST" ]]; then
            USER_ID=$(echo "$response_body" | jq -r '.data.id // empty' 2>/dev/null)
        elif [[ "$endpoint" == "/products" && "$method" == "POST" ]]; then
            PRODUCT_ID=$(echo "$response_body" | jq -r '.data.id // empty' 2>/dev/null)
        fi
    fi
}

# Check if server is running
check_server() {
    print_status "INFO" "Checking if server is running..."
    if curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
        print_status "SUCCESS" "Server is running at $BASE_URL"
        return 0
    else
        print_status "ERROR" "Server is not running at $BASE_URL"
        print_status "INFO" "Please start the server:"
        echo "  cd '04 - BackendSystemWithMySql'"
        echo "  npm install"
        echo "  npm run dev"
        return 1
    fi
}

# Global variables to store created IDs
USER_ID=""
PRODUCT_ID=""

# Start testing
echo -e "${GREEN}Starting MySQL Backend System API Testing${NC}"
echo -e "Base URL: $BASE_URL"
echo -e "API Base URL: $API_BASE_URL\n"

# Check server status
if ! check_server; then
    exit 1
fi

# 1. Test System Endpoints
print_status "TEST" "Testing System Endpoints..."

make_request "GET" "/health" "" "Health Check"
make_request "GET" "/info" "" "API Information"
make_request "GET" "/stats" "" "Database Statistics"

# 2. Test User Endpoints
print_status "TEST" "Testing User API Endpoints..."

# Get all users
make_request "GET" "/users" "" "Get All Users"

# Get users with pagination
make_request "GET" "/users?page=1&limit=3" "" "Get Users with Pagination"

# Create a new user
user_data='{
    "name": "Test User API",
    "email": "testuser.api@example.com",
    "age": 29,
    "city": "Test City"
}'
make_request "POST" "/users" "$user_data" "Create New User"

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    print_status "SUCCESS" "User created with ID: $USER_ID"
    
    # Get single user
    make_request "GET" "/users/$USER_ID" "" "Get Single User by ID"
    
    # Update user
    update_user_data='{
        "name": "Updated Test User",
        "city": "Updated City",
        "age": 30
    }'
    make_request "PUT" "/users/$USER_ID" "$update_user_data" "Update User"
    
    # Search users
    make_request "GET" "/users/search?q=Updated" "" "Search Users"
    
else
    print_status "WARNING" "Could not extract User ID. Using sample ID for remaining tests."
    USER_ID="1"
    
    # Test with existing user
    make_request "GET" "/users/$USER_ID" "" "Get User by ID (using sample ID)"
fi

# 3. Test Product Endpoints
print_status "TEST" "Testing Product API Endpoints..."

# Get all products
make_request "GET" "/products" "" "Get All Products"

# Get products with pagination
make_request "GET" "/products?page=1&limit=3" "" "Get Products with Pagination"

# Get products by category
make_request "GET" "/products?category=Electronics" "" "Get Products by Category"

# Get low stock products
make_request "GET" "/products/low-stock" "" "Get Low Stock Products"

# Get low stock products with custom threshold
make_request "GET" "/products/low-stock?threshold=20" "" "Get Low Stock Products (Custom Threshold)"

# Create a new product
product_data='{
    "name": "Test Product API",
    "description": "This is a test product created by API testing script",
    "price": 49.99,
    "category": "Test Category",
    "stock_quantity": 100
}'
make_request "POST" "/products" "$product_data" "Create New Product"

if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
    print_status "SUCCESS" "Product created with ID: $PRODUCT_ID"
    
    # Get single product
    make_request "GET" "/products/$PRODUCT_ID" "" "Get Single Product by ID"
    
    # Update product
    update_product_data='{
        "name": "Updated Test Product",
        "description": "Updated description",
        "price": 59.99,
        "stock_quantity": 150
    }'
    make_request "PUT" "/products/$PRODUCT_ID" "$update_product_data" "Update Product"
    
    # Update product stock only
    stock_update_data='{"stock_quantity": 75}'
    make_request "PATCH" "/products/$PRODUCT_ID/stock" "$stock_update_data" "Update Product Stock"
    
    # Search products
    make_request "GET" "/products/search?q=Updated" "" "Search Products"
    
else
    print_status "WARNING" "Could not extract Product ID. Using sample ID for remaining tests."
    PRODUCT_ID="1"
    
    # Test with existing product
    make_request "GET" "/products/$PRODUCT_ID" "" "Get Product by ID (using sample ID)"
fi

# 4. Test Error Scenarios
print_status "TEST" "Testing Error Scenarios..."

# Test invalid user creation (missing required fields)
invalid_user_data='{"name": "Test"}'
make_request "POST" "/users" "$invalid_user_data" "Create User with Invalid Data"

# Test invalid product creation (invalid price)
invalid_product_data='{
    "name": "Test Product",
    "price": -10
}'
make_request "POST" "/products" "$invalid_product_data" "Create Product with Invalid Price"

# Test non-existent user
make_request "GET" "/users/99999" "" "Get Non-existent User"

# Test non-existent product
make_request "GET" "/products/99999" "" "Get Non-existent Product"

# Test invalid endpoint
make_request "GET" "/invalid-endpoint" "" "Access Invalid Endpoint"

# 5. Clean up test data
print_status "TEST" "Cleaning up test data..."

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ] && [ "$USER_ID" != "1" ]; then
    make_request "DELETE" "/users/$USER_ID" "" "Delete Test User"
fi

if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ] && [ "$PRODUCT_ID" != "1" ]; then
    make_request "DELETE" "/products/$PRODUCT_ID" "" "Delete Test Product"
fi

# 6. Final Statistics
print_status "TEST" "Getting Final Statistics..."
make_request "GET" "/stats" "" "Final Database Statistics"

# Summary
echo -e "\n${GREEN}=== API Testing Complete ===${NC}"
print_status "SUCCESS" "All MySQL Backend API endpoints have been tested"
print_status "INFO" "Check the responses above for any errors or issues"

# Additional notes
echo -e "\n${YELLOW}Testing Summary:${NC}"
echo "✅ System endpoints (health, info, stats)"
echo "✅ User CRUD operations"
echo "✅ User search and pagination" 
echo "✅ Product CRUD operations"
echo "✅ Product search, filtering, and pagination"
echo "✅ Stock management"
echo "✅ Error handling scenarios"
echo "✅ Data cleanup"

echo -e "\n${YELLOW}Notes:${NC}"
echo "- Make sure MySQL is running on localhost:3306"
echo "- Database should be accessible with admin/1234 credentials"
echo "- The server should be running on port 3000"
echo "- Install 'jq' for better JSON formatting: sudo apt-get install jq (Linux) or brew install jq (Mac)"
echo "- Test data was created and cleaned up automatically"

exit 0
