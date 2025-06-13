#!/bin/bash

# Quick MySQL Backend API Test Script
# A streamlined version for quick testing of core functionality

# Configuration
BASE_URL="http://localhost:3000/api"
TEST_EMAIL="quicktest$(date +%s)@example.com"
TEST_PRODUCT_NAME="QuickTest Product $(date +%s)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check dependencies and server
check_setup() {
    log "Checking setup..."
    
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed"
        exit 1
    fi
    
    if ! curl -s --max-time 5 "$BASE_URL/health" > /dev/null 2>&1; then
        error "Server is not running at $BASE_URL"
        echo "Please ensure:"
        echo "1. Navigate to: cd '04 - BackendSystemWithMySql'"
        echo "2. Install dependencies: npm install"
        echo "3. Start server: npm run dev"
        echo "4. Make sure MySQL is running with admin/1234 credentials"
        exit 1
    fi
    
    success "Server is running and accessible"
}

# Test user operations
test_users() {
    log "Testing User operations..."
    
    # Create user
    user_data='{
        "name": "Quick Test User",
        "email": "'$TEST_EMAIL'",
        "age": 25,
        "city": "Test City"
    }'
    
    create_response=$(curl -s -X POST "$BASE_URL/users" \
        -H "Content-Type: application/json" \
        -d "$user_data")
    
    if echo "$create_response" | grep -q '"success":true'; then
        success "User created successfully"
        
        # Extract user ID
        if command -v jq &> /dev/null; then
            USER_ID=$(echo "$create_response" | jq -r '.data.id // empty' 2>/dev/null)
        else
            USER_ID=$(echo "$create_response" | grep -o '"id":[0-9]*' | cut -d: -f2)
        fi
        
        if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
            # Test get user
            get_response=$(curl -s "$BASE_URL/users/$USER_ID")
            if echo "$get_response" | grep -q '"success":true'; then
                success "User retrieved successfully"
            else
                warning "Failed to retrieve user"
            fi
            
            # Test update user
            update_data='{"city": "Updated City"}'
            update_response=$(curl -s -X PUT "$BASE_URL/users/$USER_ID" \
                -H "Content-Type: application/json" \
                -d "$update_data")
            
            if echo "$update_response" | grep -q '"success":true'; then
                success "User updated successfully"
            else
                warning "Failed to update user"
            fi
            
            return 0
        else
            error "Could not extract user ID"
            return 1
        fi
    else
        error "Failed to create user"
        echo "Response: $create_response"
        return 1
    fi
}

# Test product operations
test_products() {
    log "Testing Product operations..."
    
    # Create product
    product_data='{
        "name": "'$TEST_PRODUCT_NAME'",
        "description": "Quick test product for API testing",
        "price": 29.99,
        "category": "Test",
        "stock_quantity": 50
    }'
    
    create_response=$(curl -s -X POST "$BASE_URL/products" \
        -H "Content-Type: application/json" \
        -d "$product_data")
    
    if echo "$create_response" | grep -q '"success":true'; then
        success "Product created successfully"
        
        # Extract product ID
        if command -v jq &> /dev/null; then
            PRODUCT_ID=$(echo "$create_response" | jq -r '.data.id // empty' 2>/dev/null)
        else
            PRODUCT_ID=$(echo "$create_response" | grep -o '"id":[0-9]*' | cut -d: -f2)
        fi
        
        if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
            # Test get product
            get_response=$(curl -s "$BASE_URL/products/$PRODUCT_ID")
            if echo "$get_response" | grep -q '"success":true'; then
                success "Product retrieved successfully"
            else
                warning "Failed to retrieve product"
            fi
            
            # Test update stock
            stock_data='{"stock_quantity": 25}'
            stock_response=$(curl -s -X PATCH "$BASE_URL/products/$PRODUCT_ID/stock" \
                -H "Content-Type: application/json" \
                -d "$stock_data")
            
            if echo "$stock_response" | grep -q '"success":true'; then
                success "Product stock updated successfully"
            else
                warning "Failed to update product stock"
            fi
            
            return 0
        else
            error "Could not extract product ID"
            return 1
        fi
    else
        error "Failed to create product"
        echo "Response: $create_response"
        return 1
    fi
}

# Test system endpoints
test_system() {
    log "Testing System endpoints..."
    
    # Health check
    health_response=$(curl -s "$BASE_URL/health")
    if echo "$health_response" | grep -q '"success":true'; then
        success "Health check passed"
    else
        warning "Health check failed"
    fi
    
    # Get stats
    stats_response=$(curl -s "$BASE_URL/stats")
    if echo "$stats_response" | grep -q '"success":true'; then
        success "Statistics retrieved successfully"
        
        if command -v jq &> /dev/null; then
            user_count=$(echo "$stats_response" | jq -r '.statistics.users.total // 0' 2>/dev/null)
            product_count=$(echo "$stats_response" | jq -r '.statistics.products.total // 0' 2>/dev/null)
            echo "  Users in database: $user_count"
            echo "  Products in database: $product_count"
        fi
    else
        warning "Failed to retrieve statistics"
    fi
}

# Clean up test data
cleanup() {
    log "Cleaning up test data..."
    
    if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
        delete_response=$(curl -s -X DELETE "$BASE_URL/users/$USER_ID")
        if echo "$delete_response" | grep -q '"success":true'; then
            success "Test user deleted"
        else
            warning "Failed to delete test user"
        fi
    fi
    
    if [ -n "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
        delete_response=$(curl -s -X DELETE "$BASE_URL/products/$PRODUCT_ID")
        if echo "$delete_response" | grep -q '"success":true'; then
            success "Test product deleted"
        else
            warning "Failed to delete test product"
        fi
    fi
}

# Main execution
main() {
    echo -e "${GREEN}MySQL Backend API Quick Test${NC}"
    echo "============================"
    echo "Testing core functionality of the MySQL backend system"
    echo "Server: $BASE_URL"
    echo ""
    
    check_setup
    
    echo ""
    test_system
    
    echo ""
    if test_users; then
        USER_TESTS_PASSED=true
    else
        USER_TESTS_PASSED=false
    fi
    
    echo ""
    if test_products; then
        PRODUCT_TESTS_PASSED=true
    else
        PRODUCT_TESTS_PASSED=false
    fi
    
    echo ""
    cleanup
    
    echo ""
    echo -e "${GREEN}=== Quick Test Summary ===${NC}"
    
    if [ "$USER_TESTS_PASSED" = true ] && [ "$PRODUCT_TESTS_PASSED" = true ]; then
        success "All core functionality tests passed!"
    else
        warning "Some tests failed. Check the output above for details."
    fi
    
    echo ""
    echo "What was tested:"
    echo "✓ Server connectivity and health"
    echo "✓ Database statistics"
    echo "✓ User creation, retrieval, and updates"
    echo "✓ Product creation, retrieval, and stock updates"
    echo "✓ Automatic cleanup of test data"
    
    echo ""
    echo "Next steps:"
    echo "- Run './test-all-apis.sh' for comprehensive testing"
    echo "- Check individual API endpoints manually"
    echo "- Monitor server logs for any issues"
}

# Global variables
USER_ID=""
PRODUCT_ID=""

# Run the main function
main "$@"
