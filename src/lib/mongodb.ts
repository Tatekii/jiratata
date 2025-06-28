import mongoose from 'mongoose';

/**
 * MongoDB 连接管理
 * 用于替换原有的 AppWrite 数据存储方式
 */

// 防止开发环境中重复连接的警告
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jiratata_dev';

// 连接缓存 - 避免在开发环境中创建多个连接
declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * 连接到 MongoDB 数据库
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options: mongoose.ConnectOptions = {
      // 连接选项
      bufferCommands: true,
    };

    // 创建数据库连接
    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
      console.log('MongoDB连接成功');
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB连接失败:', e);
    throw e;
  }

  return cached.conn;
}

// 监听连接事件
mongoose.connection.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB断开连接');
});

// 优雅关闭连接
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

export default mongoose;
