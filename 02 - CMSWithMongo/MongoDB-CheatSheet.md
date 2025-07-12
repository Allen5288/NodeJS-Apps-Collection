# MongoDB & Mongoose CheatSheet

## MongoDB Operations

### 1. Create DB and Collections

```sql
show dbs

use admin ...db to use

use school
db.createCollection("students")
db.DropDatabase()

show collections
-- limit the collection
db.createCollection("teachers", {captured:true, size: 100000, max:100}, {autoIndexId:false})
```

### 2. Insert & date type

```sql
db.students.insertOne({name:"allen", age: 30, gpa: 3.2})

db.students.insertMany(
 [
  {name:"pat", age: 32, gpa: 2.2},
  {name:"san", age: 22, gpa: 4.0},
  {name:"fe", age: 35, gpa: 3.1}
 ]
)

db.students.find()

db.students.insertOne({
 name:"allen",
 age: 30,
 fullTime: true,
 registerDate: new Date(),
 gradutionDate: null,
 courses: ["c1", "c2", "c3"],
 address: {street:"123 Fake St.", city:"Bik st", zip:12345}
})
```

### 3. Find

```sql
db.students.find().sort({name: 1}) -- -1 would be reverse find

db.students.find().limit(1) -- limit number of return

db.students.find({gpa:4.0, fullTime: true})
db.students.find({}, {name: true}) -- just return name of these finding

-- less, lessthan logic
db.students.find({age:{$lt:20}}) -- also less equal: lte, greter: gte
db.students.find({age:{$gt:10, $lt:20}})
db.students.find({name:{$in:["Sponge", "Sandy", "Allen"]}})

-- and logic for mutiple condition
db.students.find({$and:[{fullTime:true}, {age:{$lte:22}}]}) -- and - or - nor
```

### 4. Update

```sql
db.students.updateOne({name: allen}, {$set:{fullTime:true}})

db.students.updateOne({_id: ObjectId("xxxxxxxxxxxxxx")}, {$set:{fullTime:true}})

db.students.updateMany({fullTime: {$exists:false}}, {$set:{fullTime:true}})
```

### 5. Delete

```sql
db.students.deleteOne({name:"Larry"})

db.students.deleteMany({fullTime: false})
db.students.deleteMany({registerDate:{$exists:false}})
```

### 6. Index

```sql
db.students.createIndex({name:1})

db.students.getIndexes()
```

### 7. Aggregation Pipeline

```javascript
// Basic aggregation
db.students.aggregate([
  {$match: {age: {$gte: 20}}},
  {$group: {_id: "$fullTime", avgGPA: {$avg: "$gpa"}}},
  {$sort: {avgGPA: -1}}
])

// More complex aggregation
db.students.aggregate([
  {$match: {courses: {$exists: true}}},
  {$unwind: "$courses"},
  {$group: {
    _id: "$courses",
    students: {$push: "$name"},
    count: {$sum: 1}
  }},
  {$sort: {count: -1}}
])

// Lookup (similar to JOIN)
db.students.aggregate([
  {$lookup: {
    from: "courses",
    localField: "courses",
    foreignField: "_id",
    as: "courseDetails"
  }}
])
```

### 8. Text Search

```javascript
// Create text index
db.students.createIndex({name: "text", "address.city": "text"})

// Text search
db.students.find({$text: {$search: "allen"}})
db.students.find({$text: {$search: "allen patrick"}}) // OR search
db.students.find({$text: {$search: "\"allen patrick\""}}) // Exact phrase
```

### 9. Geospatial Operations

```javascript
// Create 2dsphere index
db.places.createIndex({location: "2dsphere"})

// Insert with GeoJSON
db.places.insertOne({
  name: "Central Park",
  location: {
    type: "Point",
    coordinates: [-73.968285, 40.785091]
  }
})

// Find nearby places
db.places.find({
  location: {
    $near: {
      $geometry: {type: "Point", coordinates: [-73.968285, 40.785091]},
      $maxDistance: 1000
    }
  }
})
```

### 10. Advanced Update Operations

```javascript
// Increment/Decrement
db.students.updateOne({name: "allen"}, {$inc: {age: 1}})

// Add to array
db.students.updateOne({name: "allen"}, {$push: {courses: "newCourse"}})

// Add to array if not exists
db.students.updateOne({name: "allen"}, {$addToSet: {courses: "uniqueCourse"}})

// Remove from array
db.students.updateOne({name: "allen"}, {$pull: {courses: "oldCourse"}})

// Update array element
db.students.updateOne(
  {name: "allen", "courses": "math"},
  {$set: {"courses.$": "advanced_math"}}
)

// Upsert (insert if not exists)
db.students.updateOne(
  {name: "newStudent"},
  {$set: {age: 25, gpa: 3.5}},
  {upsert: true}
)
```

### 11. Data Validation

```javascript
// Create collection with validation
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "price"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        price: {
          bsonType: "number",
          minimum: 0,
          description: "must be a number greater than 0"
        }
      }
    }
  }
})
```

### 12. Bulk Operations

```javascript
// Bulk write operations
db.students.bulkWrite([
  {insertOne: {document: {name: "bulk1", age: 20}}},
  {updateOne: {filter: {name: "allen"}, update: {$set: {age: 31}}}},
  {deleteOne: {filter: {name: "oldStudent"}}}
])
```

### 13. Database Administration

```javascript
// Show database stats
db.stats()

// Show collection stats
db.students.stats()

// Compact collection
db.runCommand({compact: "students"})

// Create user
db.createUser({
  user: "appUser",
  pwd: "password123",
  roles: [{role: "readWrite", db: "school"}]
})

// Backup and restore
mongodump --db school --out /backup/
mongorestore --db school /backup/school/
```

---

## Mongoose CheatSheet

### 1. Connection & Setup

```javascript
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Connection events
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

// Close connection
mongoose.connection.close();
```

### 2. Schema Definition

```javascript
const mongoose = require('mongoose');

// Basic schema
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  age: {
    type: Number,
    required: true,
    min: 16,
    max: 100
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4.0,
    default: 0
  },
  fullTime: {
    type: Boolean,
    default: true
  },
  registerDate: {
    type: Date,
    default: Date.now
  },
  courses: [{
    type: String,
    enum: ['Math', 'Science', 'English', 'History']
  }],
  address: {
    street: String,
    city: String,
    zip: {
      type: String,
      match: /^\d{5}$/
    }
  },
  email: {
    type: String,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Create model
const Student = mongoose.model('Student', studentSchema);
```

### 3. Schema Methods & Virtuals

```javascript
// Instance methods
studentSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Static methods
studentSchema.statics.findByGPA = function(minGPA) {
  return this.find({gpa: {$gte: minGPA}});
};

// Virtuals
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre/Post hooks
studentSchema.pre('save', function(next) {
  console.log('About to save student');
  next();
});

studentSchema.post('save', function(doc, next) {
  console.log('Student saved:', doc.name);
  next();
});
```

### 4. CRUD Operations

```javascript
// CREATE
const student = new Student({
  name: 'John Doe',
  age: 20,
  gpa: 3.5,
  courses: ['Math', 'Science']
});

// Save instance
student.save()
  .then(doc => console.log('Saved:', doc))
  .catch(err => console.error('Error:', err));

// Or create directly
Student.create({
  name: 'Jane Smith',
  age: 22,
  gpa: 3.8
})
.then(doc => console.log('Created:', doc))
.catch(err => console.error('Error:', err));

// READ
// Find all
Student.find()
  .then(students => console.log(students))
  .catch(err => console.error(err));

// Find with conditions
Student.find({fullTime: true, gpa: {$gte: 3.0}})
  .select('name gpa') // only return name and gpa
  .sort({gpa: -1})
  .limit(10)
  .then(students => console.log(students));

// Find one
Student.findOne({name: 'John Doe'})
  .then(student => console.log(student));

// Find by ID
Student.findById('507f1f77bcf86cd799439011')
  .then(student => console.log(student));

// UPDATE
// Update one
Student.updateOne(
  {name: 'John Doe'},
  {$set: {age: 21}},
  {new: true}
)
.then(result => console.log('Updated:', result));

// Find and update
Student.findOneAndUpdate(
  {name: 'John Doe'},
  {$set: {age: 21}},
  {new: true, runValidators: true}
)
.then(student => console.log('Updated student:', student));

// Find by ID and update
Student.findByIdAndUpdate(
  '507f1f77bcf86cd799439011',
  {$set: {age: 21}},
  {new: true}
)
.then(student => console.log('Updated student:', student));

// DELETE
// Delete one
Student.deleteOne({name: 'John Doe'})
  .then(result => console.log('Deleted:', result.deletedCount));

// Find and delete
Student.findOneAndDelete({name: 'John Doe'})
  .then(student => console.log('Deleted student:', student));

// Find by ID and delete
Student.findByIdAndDelete('507f1f77bcf86cd799439011')
  .then(student => console.log('Deleted student:', student));
```

### 5. Query Building

```javascript
// Query builder
Student.find()
  .where('age').gte(18)
  .where('gpa').gt(3.0)
  .where('courses').in(['Math', 'Science'])
  .select('name age gpa')
  .sort('-gpa')
  .limit(10)
  .exec()
  .then(students => console.log(students));

// Complex queries
Student.find({
  $or: [
    {age: {$lt: 20}},
    {gpa: {$gt: 3.5}}
  ]
})
.populate('courses') // if courses is referenced
.exec()
.then(students => console.log(students));
```

### 6. Population (References)

```javascript
// Define schemas with references
const courseSchema = new mongoose.Schema({
  name: String,
  credits: Number
});

const studentSchema = new mongoose.Schema({
  name: String,
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

const Course = mongoose.model('Course', courseSchema);
const Student = mongoose.model('Student', studentSchema);

// Populate referenced documents
Student.findById('507f1f77bcf86cd799439011')
  .populate('courses')
  .exec()
  .then(student => console.log(student));

// Populate with select
Student.find()
  .populate('courses', 'name credits')
  .exec()
  .then(students => console.log(students));

// Nested population
Student.find()
  .populate({
    path: 'courses',
    populate: {
      path: 'instructor',
      select: 'name'
    }
  })
  .exec()
  .then(students => console.log(students));
```

### 7. Aggregation with Mongoose

```javascript
// Basic aggregation
Student.aggregate([
  {$match: {age: {$gte: 18}}},
  {$group: {
    _id: '$fullTime',
    avgGPA: {$avg: '$gpa'},
    count: {$sum: 1}
  }},
  {$sort: {avgGPA: -1}}
])
.exec()
.then(results => console.log(results));

// Using aggregation pipeline builder
Student.aggregate()
  .match({age: {$gte: 18}})
  .group({
    _id: '$fullTime',
    avgGPA: {$avg: '$gpa'},
    count: {$sum: 1}
  })
  .sort({avgGPA: -1})
  .exec()
  .then(results => console.log(results));
```

### 8. Validation & Error Handling

```javascript
// Custom validators
const studentSchema = new mongoose.Schema({
  age: {
    type: Number,
    validate: {
      validator: function(v) {
        return v >= 16 && v <= 100;
      },
      message: 'Age must be between 16 and 100'
    }
  },
  email: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  }
});

// Handle validation errors
student.save()
  .then(doc => console.log('Saved:', doc))
  .catch(err => {
    if (err.name === 'ValidationError') {
      console.log('Validation errors:');
      Object.keys(err.errors).forEach(key => {
        console.log(`${key}: ${err.errors[key].message}`);
      });
    }
  });
```

### 9. Middleware & Plugins

```javascript
// Middleware
studentSchema.pre('save', function(next) {
  // Hash password before saving
  if (this.isModified('password')) {
    this.password = hashPassword(this.password);
  }
  next();
});

studentSchema.post('save', function(doc, next) {
  console.log('Student saved:', doc.name);
  next();
});

// Plugin example
const timestampPlugin = function(schema) {
  schema.add({
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
  });
  
  schema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
};

studentSchema.plugin(timestampPlugin);
```

### 10. Transactions

```javascript
// Using transactions
const session = await mongoose.startSession();
session.startTransaction();

try {
  const student = new Student({name: 'John', age: 20});
  await student.save({session});
  
  const course = new Course({name: 'Math 101', credits: 3});
  await course.save({session});
  
  await session.commitTransaction();
  console.log('Transaction committed successfully');
} catch (error) {
  await session.abortTransaction();
  console.error('Transaction aborted:', error);
} finally {
  session.endSession();
}
```

### 11. Best Practices

```javascript
// Connection with error handling
mongoose.connect('mongodb://localhost:27017/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Connection error:', err));

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// Use lean() for better performance when you don't need full documents
Student.find().lean().exec()
  .then(students => console.log(students));

// Use select() to limit fields
Student.find().select('name age').exec()
  .then(students => console.log(students));

// Use indexes for better query performance
studentSchema.index({email: 1});
studentSchema.index({age: 1, gpa: -1});
```
