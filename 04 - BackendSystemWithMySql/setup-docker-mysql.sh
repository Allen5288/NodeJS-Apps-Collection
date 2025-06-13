#!/bin/bash

# Docker MySQL Database Setup Script
# This script sets up the database for Docker MySQL container

echo "🐳 Docker MySQL Database Setup"
echo "=============================="
echo ""

# Configuration
CONTAINER_NAME="mysql_container"
DB_USER="admin"
DB_PASSWORD="1234"
DB_NAME="backend_system"

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    echo "Please install Docker and try again"
    exit 1
fi

echo "✅ Docker found"

# Check if MySQL container is running
echo "🔍 Checking MySQL container status..."
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✅ MySQL container '$CONTAINER_NAME' is running"
else
    echo "❌ MySQL container '$CONTAINER_NAME' is not running"
    echo ""
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Please start your MySQL container or check the container name"
    echo "If the container name is different, please update this script"
    exit 1
fi

# Test connection to MySQL container
echo "🔍 Testing connection to MySQL container..."
if docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "SELECT 1;" &> /dev/null; then
    echo "✅ Successfully connected to MySQL in container"
else
    echo "❌ Failed to connect to MySQL in container"
    echo "Please check if:"
    echo "  - Container name is correct: $CONTAINER_NAME"
    echo "  - MySQL credentials are correct: $DB_USER/$DB_PASSWORD"
    echo "  - MySQL is fully started in the container"
    exit 1
fi

# Create database
echo "🗄️  Creating database '$DB_NAME'..."
docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_NAME' created successfully"
else
    echo "⚠️  Database creation failed or database already exists"
fi

# Grant privileges (just to be sure)
echo "🔐 Ensuring user privileges..."
docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;" 2>/dev/null

# Run schema if available
if [ -f "database/schema.sql" ]; then
    echo "📊 Applying database schema..."
    if docker exec -i $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < database/schema.sql; then
        echo "✅ Database schema applied successfully"
    else
        echo "⚠️  Schema application failed, but database is ready"
        echo "The application will create tables automatically"
    fi
else
    echo "ℹ️  No schema file found, application will create tables automatically"
fi

# Verify setup
echo "🔍 Verifying database setup..."
TABLE_COUNT=$(docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | wc -l)

if [ $TABLE_COUNT -gt 1 ]; then
    echo "✅ Database setup verified - found $(($TABLE_COUNT - 1)) tables"
    
    # Show table info
    echo ""
    echo "📋 Current tables in database:"
    docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null
else
    echo "ℹ️  Database created but no tables yet - application will create them"
fi

echo ""
echo "🎉 Docker MySQL Database Setup Complete!"
echo ""
echo "Database Configuration:"
echo "  🐳 Container: $CONTAINER_NAME"
echo "  🗄️  Database: $DB_NAME"
echo "  👤 User: $DB_USER"
echo "  🔐 Password: $DB_PASSWORD"
echo "  🌐 Connection: localhost:3306"
echo ""
echo "✅ Your Node.js application should now be able to connect!"
echo ""
echo "Next steps:"
echo "1. Start your Node.js application: npm run dev"
echo "2. Test the connection: curl http://localhost:3000/api/health"
echo "3. Run API tests: ./quick-test.sh"
