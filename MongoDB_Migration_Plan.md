# AppWrite to MongoDB Migration Plan

## Overview
This document outlines the plan to migrate the Jiratata application from AppWrite to MongoDB. The migration will involve setting up a local MongoDB server for development and creating appropriate collections that match the current data structure used in AppWrite.

## Current Structure (AppWrite)
The application currently uses the following AppWrite collections:

### 1. Workspaces
| Attribute | Type | Required | Description |
| :----:| :----: | :----: | :----: |
| name | string | Yes | Workspace name |
| userId | string | Yes | User ID |
| imageUrl | string | No | Workspace icon URL |
| inviteCode | string | Yes | Invitation code |
| $id | string | Yes | Auto-generated ID |

### 2. Members
| Attribute | Type | Required | Description |
| :----:| :----: | :----: | :----: |
| userId | string | Yes | User ID |
| workspaceId | string | Yes | Workspace ID |
| role | enum | Yes | Member role (ADMIN/MEMBER/GUEST) |
| $id | string | Yes | Auto-generated ID |

### 3. Projects
| Attribute | Type | Required | Description |
| :----:| :----: | :----: | :----: |
| name | string | Yes | Project name |
| workspaceId | string | Yes | Workspace ID |
| imageUrl | string | No | Project icon URL |
| $id | string | Yes | Auto-generated ID |

### 4. Tasks
| Attribute | Type | Required | Description |
| :----:| :----: | :----: | :----: |
| name | string | Yes | Task name |
| description | string | No | Task description |
| workspaceId | string | Yes | Workspace ID |
| projectId | string | Yes | Project ID |
| dueDate | DateTime | Yes | Due date |
| assigneeId | string | Yes | Assignee ID (Member ID) |
| status | enum | Yes | BACKLOG/TODO/IN_PROGRESS/IN_REVIEW/DONE |
| position | integer | Yes | Position for sorting |
| $id | string | Yes | Auto-generated ID |

### 5. User Authentication
Currently managed by AppWrite's built-in authentication system.

## Planned MongoDB Structure

### 1. Collection: users
```javascript
{
  _id: ObjectId,          // MongoDB auto-generated ID
  name: String,           // User's name
  email: String,          // User's email (unique)
  password: String,       // Hashed password
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

### 2. Collection: workspaces
```javascript
{
  _id: ObjectId,          // MongoDB auto-generated ID
  name: String,           // Workspace name
  userId: ObjectId,       // Reference to users collection
  imageUrl: String,       // Optional image URL
  inviteCode: String,     // Unique invite code
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

### 3. Collection: members
```javascript
{
  _id: ObjectId,          // MongoDB auto-generated ID
  userId: ObjectId,       // Reference to users collection
  workspaceId: ObjectId,  // Reference to workspaces collection
  role: String,           // Enum: "ADMIN", "MEMBER", "GUEST"
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

### 4. Collection: projects
```javascript
{
  _id: ObjectId,          // MongoDB auto-generated ID
  name: String,           // Project name
  workspaceId: ObjectId,  // Reference to workspaces collection
  imageUrl: String,       // Optional image URL
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

### 5. Collection: tasks
```javascript
{
  _id: ObjectId,          // MongoDB auto-generated ID
  name: String,           // Task name
  description: String,    // Optional task description
  workspaceId: ObjectId,  // Reference to workspaces collection
  projectId: ObjectId,    // Reference to projects collection
  dueDate: Date,          // Due date
  assigneeId: ObjectId,   // Reference to members collection
  status: String,         // Enum: "BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"
  position: Number,       // Position for ordering
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

### 6. Collection: files
```javascript
{
  _id: ObjectId,          // MongoDB auto-generated ID
  filename: String,       // Original filename
  contentType: String,    // MIME type
  size: Number,           // File size in bytes
  data: Binary,           // File data (or GridFS)
  uploadDate: Date        // Upload timestamp
}
```

## Indexes to Create
To optimize query performance:

1. **users collection**:
   - Unique index on `email`

2. **workspaces collection**:
   - Index on `userId`
   - Unique index on `inviteCode`

3. **members collection**:
   - Compound index on `workspaceId` and `userId`

4. **projects collection**:
   - Index on `workspaceId`

5. **tasks collection**:
   - Index on `workspaceId`
   - Index on `projectId`
   - Compound index on `projectId` and `status`
   - Compound index on `assigneeId` and `status`

## Authentication Strategy
Since we're moving away from AppWrite's authentication:

1. Use MongoDB for storing user credentials
2. Implement JWT (JSON Web Tokens) for authentication
3. Store hashed passwords using bcrypt
4. Implement proper session management

## Migration Steps

### Phase 1: Setup MongoDB Environment
1. Install MongoDB locally (`mongodb://localhost:27017`)
2. Set up MongoDB Compass for visual database management
3. Create a new database called `jiratata_dev`
4. Create the collections listed above with proper schemas and indexes

**快速设置说明**:
已创建初始化脚本，可以快速设置MongoDB环境：
```bash
# 启动MongoDB服务（如果尚未运行）
cd scripts
chmod +x start-mongodb.sh
./start-mongodb.sh

# 在另一个终端中，初始化数据库
cd scripts
npm install
npm run init-db

# 可选：生成示例数据
npm run seed-db
```

详细说明请参考 `scripts/README.md`

### Phase 2: Modify Application Code
1. Replace AppWrite SDK with Mongoose ODM
2. Update connection configuration in environment variables
3. Modify data access methods to use MongoDB instead of AppWrite
4. Implement custom authentication system using JWT

**使用Mongoose的优势**:
- **Schema定义**：强制执行数据结构，确保数据一致性
- **中间件支持**：提供pre/post钩子处理数据操作
- **查询构建**：更简洁的API用于构建和执行查询
- **数据验证**：内置的验证规则确保数据完整性
- **关联数据**：通过populate轻松处理文档之间的关联
- **类型转换**：自动转换为适当的JavaScript类型

### Phase 3: Data Migration Tool
1. Create a script to export data from AppWrite
2. Transform data to match MongoDB schema
3. Import data into MongoDB collections
4. Verify data integrity after migration

### Phase 4: File Storage Solution
1. Set up GridFS or a local file storage solution to replace AppWrite Storage
2. Migrate existing files from AppWrite to the new storage

## Environment Variables Update
替换现有的AppWrite环境变量:

```
# MongoDB连接（使用Mongoose）
MONGODB_URI=mongodb://localhost:27017/jiratata_dev

# 认证相关
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

# 文件存储
UPLOAD_DIR=./public/uploads
```

使用Mongoose连接示例:
```javascript
import mongoose from 'mongoose';

// 在应用启动时连接到MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));
```

## Testing Strategy
1. Unit tests for new MongoDB data access methods
2. Integration tests for end-to-end workflows
3. Comparison tests between AppWrite and MongoDB implementations

## Rollback Plan
In case of issues during migration:
1. Keep AppWrite integration functional alongside MongoDB development
2. Implement feature flags to switch between AppWrite and MongoDB
3. Have a script ready to migrate data back to AppWrite if needed

## Additional Considerations
1. MongoDB's document model is more flexible than AppWrite's structured collections
2. Consider adding schema validation in MongoDB to maintain data integrity
3. Plan for backup and restore procedures for the MongoDB database
4. Consider MongoDB Atlas as a future cloud-hosted option when moving to production
