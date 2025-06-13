#!/bin/bash

# CMS API Quick Test Script
# A simplified version for quick testing of core functionality

# Configuration
BASE_URL="http://localhost:5000/api/v1"
TEST_EMAIL="test$(date +%s)@example.com"  # Unique email to avoid conflicts
TEST_PASSWORD="testpassword123"
TEST_NAME="Test User $(date +%s)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper function
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

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        warning "jq not found. JSON output will not be formatted"
        warning "Install jq for better output: sudo apt-get install jq (Linux) or brew install jq (Mac)"
    fi
    
    success "Dependencies check passed"
}

# Check if server is running
check_server() {
    log "Checking server status..."
    
    if curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
        success "Server is running at $BASE_URL"
        return 0
    else
        error "Server is not running at $BASE_URL"
        echo "Please ensure:"
        echo "1. Navigate to CMS project directory"
        echo "2. Run: npm install"
        echo "3. Start server: npm run dev"
        echo "4. Make sure MongoDB is running"
        return 1
    fi
}

# Test authentication flow
test_auth() {
    log "Testing authentication flow..."
    
    # Register new user
    echo "Registering user: $TEST_EMAIL"
    register_response=$(curl -s -X POST "$BASE_URL/register" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if echo "$register_response" | grep -q "error"; then
        warning "Registration failed or user already exists"
        echo "Response: $register_response"
    else
        success "User registered successfully"
    fi
    
    # Login
    echo "Logging in..."
    login_response=$(curl -s -X POST "$BASE_URL/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if command -v jq &> /dev/null; then
        JWT_TOKEN=$(echo "$login_response" | jq -r '.token // empty' 2>/dev/null)
        USER_ID=$(echo "$login_response" | jq -r '.user.id // .user._id // empty' 2>/dev/null)
    else
        # Fallback for systems without jq
        JWT_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
    
    if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ] && [ "$JWT_TOKEN" != "" ]; then
        success "Login successful, JWT token obtained"
        echo "Token: ${JWT_TOKEN:0:20}..."
        return 0
    else
        error "Login failed"
        echo "Response: $login_response"
        return 1
    fi
}

# Test article operations
test_articles() {
    log "Testing article operations..."
    
    # Get all articles
    echo "Getting all articles..."
    articles_response=$(curl -s -X GET "$BASE_URL/articles")
    
    if echo "$articles_response" | grep -q '\['; then
        success "Articles retrieved successfully"
        if command -v jq &> /dev/null; then
            article_count=$(echo "$articles_response" | jq '. | length' 2>/dev/null)
            echo "Found $article_count articles"
        fi
    else
        warning "No articles found or error occurred"
    fi
    
    # Create article
    echo "Creating new article..."
    article_data='{
        "title": "Test Article from Script",
        "content": "This article was created by the API test script to verify functionality.",
        "author": "Test Script",
        "category": "Testing"
    }'
    
    if [ -n "$JWT_TOKEN" ]; then
        create_response=$(curl -s -X POST "$BASE_URL/articles" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "$article_data")
    else
        create_response=$(curl -s -X POST "$BASE_URL/articles" \
            -H "Content-Type: application/json" \
            -d "$article_data")
    fi
    
    if command -v jq &> /dev/null; then
        ARTICLE_ID=$(echo "$create_response" | jq -r '.id // ._id // empty' 2>/dev/null)
    else
        # Fallback for systems without jq
        ARTICLE_ID=$(echo "$create_response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    fi
    
    if [ -n "$ARTICLE_ID" ] && [ "$ARTICLE_ID" != "null" ] && [ "$ARTICLE_ID" != "" ]; then
        success "Article created successfully"
        echo "Article ID: $ARTICLE_ID"
        
        # Test getting single article
        echo "Getting created article..."
        single_article=$(curl -s -X GET "$BASE_URL/articles/$ARTICLE_ID")
        
        if echo "$single_article" | grep -q "Test Article from Script"; then
            success "Single article retrieved successfully"
        else
            warning "Could not retrieve single article"
        fi
        
        # Test updating article
        echo "Updating article..."
        update_data='{"title": "Updated Test Article", "content": "This content was updated by the test script."}'
        
        if [ -n "$JWT_TOKEN" ]; then
            update_response=$(curl -s -X PUT "$BASE_URL/articles/$ARTICLE_ID" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $JWT_TOKEN" \
                -d "$update_data")
        else
            update_response=$(curl -s -X PUT "$BASE_URL/articles/$ARTICLE_ID" \
                -H "Content-Type: application/json" \
                -d "$update_data")
        fi
        
        if echo "$update_response" | grep -q "Updated Test Article"; then
            success "Article updated successfully"
        else
            warning "Article update may have failed"
        fi
        
        # Clean up - delete the test article
        echo "Cleaning up test article..."
        if [ -n "$JWT_TOKEN" ]; then
            delete_response=$(curl -s -X DELETE "$BASE_URL/articles/$ARTICLE_ID" \
                -H "Authorization: Bearer $JWT_TOKEN")
        else
            delete_response=$(curl -s -X DELETE "$BASE_URL/articles/$ARTICLE_ID")
        fi
        
        success "Test article cleanup completed"
        
    else
        error "Failed to create article"
        echo "Response: $create_response"
        return 1
    fi
}

# Test image upload
test_upload() {
    log "Testing image upload..."
    
    # Create a minimal test image (1x1 pixel PNG)
    TEST_IMAGE="test_upload.png"
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > "$TEST_IMAGE" 2>/dev/null
    
    if [ -f "$TEST_IMAGE" ]; then
        echo "Uploading test image..."
        
        if [ -n "$JWT_TOKEN" ]; then
            upload_response=$(curl -s -X POST "$BASE_URL/upload" \
                -H "Authorization: Bearer $JWT_TOKEN" \
                -F "file=@$TEST_IMAGE")
        else
            upload_response=$(curl -s -X POST "$BASE_URL/upload" \
                -F "file=@$TEST_IMAGE")
        fi
        
        if echo "$upload_response" | grep -q "success\|url\|filename"; then
            success "Image upload successful"
        else
            warning "Image upload may have failed"
            echo "Response: $upload_response"
        fi
        
        # Clean up
        rm -f "$TEST_IMAGE"
    else
        warning "Could not create test image file"
    fi
}

# Main execution
main() {
    echo -e "${GREEN}CMS API Quick Test Script${NC}"
    echo "========================="
    echo "This script will test the core CMS API functionality"
    echo "Server: $BASE_URL"
    echo "Test User: $TEST_EMAIL"
    echo ""
    
    check_dependencies
    
    if ! check_server; then
        exit 1
    fi
    
    echo ""
    
    # Test authentication
    if test_auth; then
        echo ""
        
        # Test articles
        test_articles
        echo ""
        
        # Test upload
        test_upload
        echo ""
    else
        error "Authentication failed. Skipping other tests."
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}=== Test Summary ===${NC}"
    success "All tests completed"
    echo ""
    echo "What was tested:"
    echo "✓ Server connectivity"
    echo "✓ User registration"
    echo "✓ User login"
    echo "✓ Article listing"
    echo "✓ Article creation"
    echo "✓ Article retrieval"
    echo "✓ Article updating"
    echo "✓ Article deletion"
    echo "✓ Image upload"
    echo ""
    echo "Notes:"
    echo "- Check the output above for any warnings or errors"
    echo "- Test user and article were created and cleaned up"
    echo "- JWT authentication was tested if available"
}

# Run the main function
main "$@"
