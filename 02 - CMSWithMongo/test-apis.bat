@echo off
REM CMS API Testing Script for Windows
REM This batch file tests all available API endpoints in the CMS application

setlocal enabledelayedexpansion

REM Configuration
set BASE_URL=http://localhost:5000/api/v1
set CONTENT_TYPE=Content-Type: application/json

echo Starting CMS API Testing
echo Base URL: %BASE_URL%
echo.

REM Check if server is running
echo Checking if server is running...
curl -s "%BASE_URL%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Server is not running at %BASE_URL%
    echo Please start the server with: npm run dev
    pause
    exit /b 1
) else (
    echo [SUCCESS] Server is running
)

echo.
echo === Testing Authentication APIs ===

REM Test User Registration
echo.
echo --- User Registration ---
curl -X POST "%BASE_URL%/register" ^
  -H "%CONTENT_TYPE%" ^
  -d "{\"name\":\"Test User\",\"email\":\"testuser@example.com\",\"password\":\"password123\"}"

echo.
echo.

REM Test User Login and save token
echo --- User Login ---
curl -X POST "%BASE_URL%/login" ^
  -H "%CONTENT_TYPE%" ^
  -d "{\"email\":\"testuser@example.com\",\"password\":\"password123\"}" ^
  -o login_response.json

echo.
echo.

REM Test Get Current User (requires manual token input for now)
echo --- Get Current User Profile ---
echo Note: You may need to manually copy the JWT token from login response
curl -X GET "%BASE_URL%/user/me" ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

echo.
echo.
echo === Testing Article APIs ===

REM Get all articles
echo.
echo --- Get All Articles ---
curl -X GET "%BASE_URL%/articles"

echo.
echo.

REM Create a new article
echo --- Create New Article ---
curl -X POST "%BASE_URL%/articles" ^
  -H "%CONTENT_TYPE%" ^
  -d "{\"title\":\"Test Article\",\"content\":\"This is a test article content.\",\"author\":\"Test Author\",\"category\":\"Technology\"}" ^
  -o article_response.json

echo.
echo.

REM Test with a sample article ID (you'll need to replace with actual ID)
echo --- Get Single Article ---
echo Note: Replace ARTICLE_ID with actual article ID from creation response
curl -X GET "%BASE_URL%/articles/ARTICLE_ID"

echo.
echo.

echo --- Update Article ---
curl -X PUT "%BASE_URL%/articles/ARTICLE_ID" ^
  -H "%CONTENT_TYPE%" ^
  -d "{\"title\":\"Updated Test Article\",\"content\":\"Updated content\"}"

echo.
echo.

echo --- Delete Article ---
curl -X DELETE "%BASE_URL%/articles/ARTICLE_ID"

echo.
echo.
echo === Testing Image Upload API ===

REM Create a small test file for upload
echo Creating test file...
echo. > test-upload.txt

echo --- Upload Image ---
curl -X POST "%BASE_URL%/upload" ^
  -F "file=@test-upload.txt"

echo.
echo.

REM Clean up
del login_response.json 2>nul
del article_response.json 2>nul
del test-upload.txt 2>nul

echo.
echo === API Testing Complete ===
echo Check the responses above for any errors or issues
echo.
echo Notes:
echo - Some endpoints require authentication (JWT token)
echo - Make sure MongoDB is running and accessible
echo - The server should be running on port 5000
echo - You may need to manually extract and use JWT tokens for authenticated requests

pause
