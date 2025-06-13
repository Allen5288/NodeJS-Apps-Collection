# MySQL Backend System - Quick Start Guide

🚀 **Get your MySQL backend system running in 5 minutes!**

## 📁 What You've Got

I've created a complete Node.js backend system with MySQL integration:

```
04 - BackendSystemWithMySql/
├── 🔧 Complete REST API with User & Product management
├── 🗄️ MySQL database integration with sample data
├── 🧪 Comprehensive testing scripts
├── 📚 Full documentation
└── 🚀 Production-ready features
```

## ⚡ Quick Start Options

### Option 1: Interactive Demo (Recommended)
```bash
cd "04 - BackendSystemWithMySql"
./demo.sh
```
This will:
- ✅ Check all prerequisites
- ✅ Install dependencies
- ✅ Setup database
- ✅ Start the server
- ✅ Run tests
- ✅ Show you everything!

### Option 2: Manual Setup
```bash
cd "04 - BackendSystemWithMySql"
npm install
npm run dev
```

### Option 3: Test APIs Only
```bash
cd "04 - BackendSystemWithMySql"
./quick-test.sh        # Quick core tests
# OR
./test-all-apis.sh     # Comprehensive tests
```

## 🔧 Prerequisites Check

**Before starting, ensure you have:**

1. **Node.js** installed
   ```bash
   node --version  # Should show v14+ 
   ```

2. **MySQL Server** running on localhost:3306
   ```bash
   mysql -u admin -p1234 -e "SELECT 1;"
   ```

3. **Database setup** (admin/1234 credentials)
   ```sql
   CREATE DATABASE backend_system;
   CREATE USER 'admin'@'localhost' IDENTIFIED BY '1234';
   GRANT ALL PRIVILEGES ON backend_system.* TO 'admin'@'localhost';
   ```

## 🌟 What You'll Get

### 🔗 API Endpoints
- **System:** Health check, API info, statistics
- **Users:** Full CRUD + search + pagination  
- **Products:** Full CRUD + stock management + filtering

### 🧪 Testing Scripts
- **`demo.sh`** - Interactive setup and demo
- **`quick-test.sh`** - Fast core functionality tests
- **`test-all-apis.sh`** - Comprehensive endpoint testing
- **`test-apis.bat`** - Windows batch version

### 📊 Sample Data
- 5 sample users with realistic data
- 10 sample products across different categories
- Proper database indexes for performance

## 🚀 Server URLs

Once running, access:
- **API Base:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health
- **API Documentation:** http://localhost:3000/api/info
- **Users API:** http://localhost:3000/api/users
- **Products API:** http://localhost:3000/api/products

## 🧪 Quick Test Commands

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Get All Users:**
```bash
curl http://localhost:3000/api/users
```

**Create User:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","age":30,"city":"NYC"}'
```

**Get All Products:**
```bash
curl http://localhost:3000/api/products
```

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":99.99,"category":"Electronics","stock_quantity":50}'
```

## 🔧 Configuration

The system is pre-configured for:
- **Port:** 3000
- **MySQL:** localhost:3306
- **Credentials:** admin/1234
- **Database:** backend_system

To change settings, edit the `.env` file.

## 🛡️ Features Included

- ✅ **Security:** Helmet, CORS, Rate limiting
- ✅ **Validation:** Joi schema validation
- ✅ **Performance:** Connection pooling, compression
- ✅ **Monitoring:** Health checks, logging
- ✅ **Error Handling:** Graceful error responses
- ✅ **Documentation:** Complete API docs

## 🐛 Troubleshooting

**Server won't start?**
- Check if MySQL is running: `mysql -u admin -p1234 -e "SELECT 1;"`
- Check if port 3000 is free: `lsof -i :3000`

**Database connection failed?**
- Verify MySQL credentials in `.env`
- Create database: `mysql -u admin -p1234 -e "CREATE DATABASE backend_system;"`

**Tests failing?**
- Ensure server is running on port 3000
- Check MySQL connection
- Run `npm install` to ensure dependencies

## 📚 More Information

- **Full Documentation:** `README.md`
- **Database Schema:** `database/schema.sql`
- **API Examples:** Run `./demo.sh` for interactive examples

---

**🎯 Ready to start? Run `./demo.sh` for the full experience!**

**Need help?** Check the README.md for detailed documentation and troubleshooting.
