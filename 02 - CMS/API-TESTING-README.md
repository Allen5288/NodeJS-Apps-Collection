# CMS API Testing Scripts

This directory contains several scripts to test all the CMS API endpoints automatically.

## Available Scripts

### 1. `test-apis.sh` (Comprehensive Testing)
A full-featured bash script that tests all API endpoints with detailed output and error handling.

**Features:**
- Tests all authentication endpoints (register, login, user profile)
- Tests all article CRUD operations
- Tests image upload functionality
- Colored output for better readability
- Automatic JWT token extraction and usage
- JSON response formatting (if `jq` is installed)
- Comprehensive error handling

**Usage:**
```bash
# Make the script executable
chmod +x test-apis.sh

# Run the tests
./test-apis.sh
```

### 2. `test-apis.bat` (Windows Batch File)
A Windows batch file version for users who prefer Windows command prompt.

**Usage:**
```cmd
# Run the batch file
test-apis.bat
```

**Note:** The batch file requires manual token handling for authenticated requests.

### 3. `quick-test.sh` (Quick & Clean Testing)
A streamlined version that focuses on core functionality with automatic cleanup.

**Features:**
- Automatic test data generation
- Complete authentication flow testing
- Article lifecycle testing (create, read, update, delete)
- Automatic cleanup of test data
- Simplified output with status indicators

**Usage:**
```bash
# Make the script executable
chmod +x quick-test.sh

# Run the quick tests
./quick-test.sh
```

## Prerequisites

### System Requirements
- **curl** - for making HTTP requests
- **jq** (optional) - for JSON formatting and parsing
- **bash** - for shell scripts (Linux/Mac/WSL)

### Server Requirements
1. CMS server must be running on `http://localhost:5000`
2. MongoDB must be running and accessible
3. All dependencies must be installed (`npm install`)

### Installing Dependencies

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install curl jq
```

**macOS:**
```bash
# Using Homebrew
brew install curl jq
```

**Windows:**
- Use Windows Subsystem for Linux (WSL) for bash scripts
- Or use the provided batch file

## API Endpoints Tested

### Authentication APIs
- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User login
- `GET /api/v1/user/me` - Get current user profile (requires auth)

### Article APIs
- `GET /api/v1/articles` - Get all articles
- `POST /api/v1/articles` - Create new article
- `GET /api/v1/articles/:id` - Get single article
- `PUT /api/v1/articles/:id` - Update article
- `DELETE /api/v1/articles/:id` - Delete article

### File Upload API
- `POST /api/v1/upload` - Upload image file

## Before Running Tests

1. **Start the CMS server:**
   ```bash
   cd "02 - CMS"
   npm install
   npm run dev
   ```

2. **Ensure MongoDB is running:**
   ```bash
   # Start MongoDB (varies by installation)
   mongod
   # or
   brew services start mongodb-community
   # or
   sudo systemctl start mongod
   ```

3. **Verify server is accessible:**
   ```bash
   curl http://localhost:5000/api/v1/articles
   ```

## Test Data

The scripts use the following test data:

**Test User:**
- Name: "Test User" (with timestamp for uniqueness)
- Email: "testuser@example.com" (with timestamp)
- Password: "password123"

**Test Article:**
- Title: "Test Article"
- Content: "Test article content"
- Author: "Test Author"
- Category: "Technology"

**Test Image:**
- A minimal 1x1 pixel PNG image for upload testing

## Interpreting Results

### Success Indicators
- ✅ Green text: Successful operations
- HTTP Status 200-299: Success responses
- JSON responses with expected data

### Warning Indicators
- ⚠️ Yellow text: Warnings or client errors
- HTTP Status 400-499: Client errors (often expected for testing)

### Error Indicators
- ❌ Red text: Server errors or connection issues
- HTTP Status 500+: Server errors (need investigation)

## Troubleshooting

### Common Issues

1. **Server not running:**
   ```
   [ERROR] Server is not running at http://localhost:5000/api/v1
   ```
   **Solution:** Start the CMS server with `npm run dev`

2. **MongoDB connection error:**
   ```
   [ERROR] Status Code: 500 (Server Error)
   ```
   **Solution:** Ensure MongoDB is running and accessible

3. **Permission denied:**
   ```
   bash: ./test-apis.sh: Permission denied
   ```
   **Solution:** Make the script executable with `chmod +x test-apis.sh`

4. **Command not found:**
   ```
   curl: command not found
   ```
   **Solution:** Install curl using your system's package manager

### Tips for Better Testing

1. **Use jq for better JSON output:**
   ```bash
   sudo apt-get install jq  # Linux
   brew install jq          # macOS
   ```

2. **Check server logs** while running tests for debugging

3. **Clear test data** between runs if needed:
   ```bash
   # Connect to MongoDB and clear test collections if needed
   mongo cms --eval "db.users.deleteMany({email: /test/})"
   ```

4. **Modify test data** in scripts if you encounter conflicts

## Customization

You can customize the scripts by modifying:

- `BASE_URL` - Change the server URL/port
- Test data (usernames, emails, article content)
- Authentication headers
- Request timeouts
- Output formatting

## Security Note

These scripts create test users and data. In production environments:
- Use separate test databases
- Don't use predictable passwords
- Clean up test data after testing
- Avoid running tests against production APIs

## Contributing

To improve these scripts:
1. Add error handling for specific scenarios
2. Include more comprehensive test cases
3. Add performance testing capabilities
4. Improve cross-platform compatibility
