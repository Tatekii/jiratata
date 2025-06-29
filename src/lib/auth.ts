import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { User, type IMongoUser } from '@/models';
import { connectToDatabase } from '@/lib/mongodb';

// JWT 密钥和过期时间
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret';

interface JWTPayload {
  userId: string;
}

// 生成 JWT token (简化版本)
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET);
};

// 验证 JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

// 注册新用户
export const registerUser = async (userData: { name: string; email: string; password: string }): Promise<{ user: Partial<IMongoUser>; token: string }> => {
  await connectToDatabase();

  // 检查邮箱是否已存在
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('此邮箱已被注册');
  }

  // 创建新用户
  const user = new User(userData);
  await user.save();

  // 生成 JWT
  const token = generateToken(user._id.toString());

  // 返回用户数据（不包含密码）
  const userWithoutPassword = {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return { user: userWithoutPassword, token };
};

// 用户登录
export const loginUser = async (credentials: { email: string; password: string }): Promise<{ user: Partial<IMongoUser>; token: string }> => {
  await connectToDatabase();

  // 查找用户并包含密码字段
  const user = await User.findOne({ email: credentials.email }).select('+password');
  if (!user) {
    throw new Error('邮箱或密码不正确');
  }

  // 验证密码
  const isPasswordValid = await user.comparePassword(credentials.password);
  if (!isPasswordValid) {
    throw new Error('邮箱或密码不正确');
  }

  // 生成 JWT
  const token = generateToken(user._id.toString());

  // 返回用户数据（不包含密码）
  const userWithoutPassword = {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return { user: userWithoutPassword, token };
};

// 从请求中获取当前用户
export const getCurrentUser = async (request: NextRequest): Promise<Partial<IMongoUser> | null> => {
  // 从 cookie 或 Authorization 头获取 token
  const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  // 验证 token
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  // 获取用户数据
  await connectToDatabase();
  const user = await User.findById(decoded.userId);
  if (!user) {
    return null;
  }

  // 返回不含密码的用户数据
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};