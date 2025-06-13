#!/bin/bash

# Quick Docker MySQL Connection Test
# This script quickly tests connection to Docker MySQL and shows useful info

echo "🐳 Docker MySQL Connection Test"
echo "==============================="
echo ""

CONTAINER_NAME="mysql_container"
DB_USER="admin"
DB_PASSWORD="1234"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found"
    exit 1
fi
echo "✅ Docker is available"

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ Container '$CONTAINER_NAME' exists"
    
    # Check if container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Container is running"
        
        # Show container info
        echo ""
        echo "📋 Container Information:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|$CONTAINER_NAME)"
        
        # Test MySQL connection
        echo ""
        echo "🔍 Testing MySQL connection..."
        if docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "SELECT 'Connection successful!' as status;" 2>/dev/null; then
            echo "✅ MySQL connection successful!"
            
            # Show databases
            echo ""
            echo "📊 Available databases:"
            docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "SHOW DATABASES;" 2>/dev/null
            
            # Check if backend_system database exists
            if docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "USE backend_system; SELECT 'Database exists' as status;" 2>/dev/null; then
                echo ""
                echo "✅ Database 'backend_system' exists"
                
                # Show tables if any
                TABLE_INFO=$(docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD -e "USE backend_system; SHOW TABLES;" 2>/dev/null)
                if [ -n "$TABLE_INFO" ]; then
                    echo ""
                    echo "📋 Tables in backend_system:"
                    echo "$TABLE_INFO"
                else
                    echo "ℹ️  No tables in backend_system database yet"
                fi
            else
                echo ""
                echo "⚠️  Database 'backend_system' does not exist"
                echo "Run './setup-docker-mysql.sh' to create it"
            fi
            
        else
            echo "❌ MySQL connection failed"
            echo "Please check:"
            echo "  - MySQL is fully started in container"
            echo "  - Credentials are correct (admin/1234)"
            echo "  - MySQL port 3306 is accessible"
        fi
        
    else
        echo "⚠️  Container exists but is not running"
        echo "Start it with: docker start $CONTAINER_NAME"
    fi
    
else
    echo "❌ Container '$CONTAINER_NAME' not found"
    echo ""
    echo "Available containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}"
    echo ""
    echo "Please check the container name or create a MySQL container"
fi

echo ""
echo "🔧 Quick fixes if needed:"
echo "1. Start container: docker start $CONTAINER_NAME"
echo "2. Setup database: ./setup-docker-mysql.sh"
echo "3. Check logs: docker logs $CONTAINER_NAME"
echo "4. Access MySQL: docker exec -it $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASSWORD"
