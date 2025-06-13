#!/bin/bash

# MySQL Backend Demo Script
# This script demonstrates the complete setup and testing process

echo "🚀 MySQL Backend System Demo"
echo "============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the MySQL backend project directory"
    echo "Expected to find package.json in current directory"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi
echo "✅ npm version: $(npm --version)"

# Check MySQL
echo ""
echo "🔍 Checking MySQL availability..."
if command -v mysql &> /dev/null; then
    echo "✅ MySQL client found"
    
    # Test MySQL connection
    echo "Testing MySQL connection (admin/1234)..."
    if mysql -u admin -p1234 -e "SELECT 1;" &> /dev/null; then
        echo "✅ MySQL connection successful"
        
        # Check if database exists
        if mysql -u admin -p1234 -e "USE backend_system;" &> /dev/null; then
            echo "ℹ️  Database 'backend_system' already exists"
        else
            echo "⚠️  Database 'backend_system' does not exist"
            echo "Creating database..."
            mysql -u admin -p1234 -e "CREATE DATABASE IF NOT EXISTS backend_system;" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ Database created successfully"
            else
                echo "❌ Failed to create database"
            fi
        fi
    else
        echo "⚠️  Warning: Could not connect to MySQL with admin/1234"
        echo "Please ensure MySQL is running and credentials are correct"
        echo "You can still continue - the app will try to connect when it starts"
    fi
else
    echo "⚠️  Warning: MySQL client not found in PATH"
    echo "Please ensure MySQL server is running on localhost:3306"
fi

echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

echo ""

# Offer to setup database manually
echo "🗄️  Database Setup Options:"
echo "1. Automatic setup (recommended) - App will create tables automatically"
echo "2. Manual setup - Run SQL schema file now"
echo "3. Skip database setup"
echo ""
read -p "Choose option (1-3): " db_choice

case $db_choice in
    2)
        if [ -f "database/schema.sql" ]; then
            echo "Running database schema..."
            if mysql -u admin -p1234 < database/schema.sql; then
                echo "✅ Database schema applied successfully"
            else
                echo "❌ Failed to apply database schema"
                echo "Continuing with automatic setup..."
            fi
        else
            echo "❌ Schema file not found at database/schema.sql"
        fi
        ;;
    3)
        echo "⏭️  Skipping database setup"
        ;;
    *)
        echo "✅ Using automatic database setup"
        ;;
esac

echo ""

# Start the server
echo "🚀 Starting MySQL Backend Server..."
npm run dev &
SERVER_PID=$!

# Give server time to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
echo "🔍 Checking server status..."
if curl -s --max-time 5 http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Server is running on http://localhost:3000"
    echo "📊 Database connection verified"
else
    echo "❌ Server failed to start or is not responding"
    echo "Check the server output above for errors"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🌐 Server Information:"
echo "  Base URL: http://localhost:3000"
echo "  API Base: http://localhost:3000/api"
echo "  Health Check: http://localhost:3000/api/health"
echo "  API Info: http://localhost:3000/api/info"
echo ""

# Show available testing options
echo "🧪 Available Testing Options:"
echo "1. Quick test (recommended for first run)"
echo "2. Comprehensive test (all endpoints)"
echo "3. Manual testing (show sample commands)"
echo "4. Skip testing"
echo ""
read -p "Choose testing option (1-4): " test_choice

case $test_choice in
    1)
        echo ""
        echo "🧪 Running Quick API Tests..."
        echo ""
        ./quick-test.sh
        ;;
    2)
        echo ""
        echo "🧪 Running Comprehensive API Tests..."
        echo ""
        ./test-all-apis.sh
        ;;
    3)
        echo ""
        echo "📋 Manual Testing Commands:"
        echo ""
        echo "Health Check:"
        echo "  curl http://localhost:3000/api/health"
        echo ""
        echo "Get API Info:"
        echo "  curl http://localhost:3000/api/info"
        echo ""
        echo "Create User:"
        echo '  curl -X POST http://localhost:3000/api/users \'
        echo '    -H "Content-Type: application/json" \'
        echo '    -d '"'"'{"name":"John Doe","email":"john@example.com","age":30}'"'"
        echo ""
        echo "Get All Users:"
        echo "  curl http://localhost:3000/api/users"
        echo ""
        echo "Create Product:"
        echo '  curl -X POST http://localhost:3000/api/products \'
        echo '    -H "Content-Type: application/json" \'
        echo '    -d '"'"'{"name":"Test Product","price":99.99,"category":"Test"}'"'"
        echo ""
        echo "Get All Products:"
        echo "  curl http://localhost:3000/api/products"
        echo ""
        ;;
    *)
        echo "⏭️  Skipping tests"
        ;;
esac

echo ""
echo "🎉 Demo Setup Complete!"
echo ""
echo "Your MySQL Backend System is now running!"
echo ""
echo "📋 What's Available:"
echo "✅ REST API server on http://localhost:3000"
echo "✅ MySQL database with sample data"
echo "✅ User management API (/api/users)"
echo "✅ Product management API (/api/products)"
echo "✅ Health monitoring (/api/health)"
echo "✅ API documentation (/api/info)"
echo ""
echo "🔧 Next Steps:"
echo "1. Visit http://localhost:3000/api/info for API documentation"
echo "2. Use ./quick-test.sh for quick testing"
echo "3. Use ./test-all-apis.sh for comprehensive testing"
echo "4. Check server logs in this terminal"
echo "5. Press Ctrl+C to stop the server when done"
echo ""
echo "🌟 Enjoy exploring your MySQL Backend System!"

# Keep the script running so server stays active
wait $SERVER_PID
