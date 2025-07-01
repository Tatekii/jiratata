import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { User, type IMongoUser } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { IClientUser } from "@/features/types"
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from "@/config"
import { nanoid } from 'nanoid'

interface JWTPayload {
	userId: string
	iat?: number
	exp?: number
	nbf?: number  // not before
	jti?: string  // JWT ID for uniqueness
	type?: string
}

// 生成唯一的JWT ID
const generateJTI = (): string => {
	return nanoid() // 默认生成21个字符的唯一ID
}

// 生成 JWT token - 生产级安全配置
export const generateToken = (userId: string): string => {
	const now = Math.floor(Date.now() / 1000)
	
	return jwt.sign(
		{ 
			userId,
			jti: generateJTI(),  // 唯一标识符，防止重放攻击
			nbf: now,           // 不早于当前时间生效
		}, 
		JWT_SECRET, 
		{ 
			expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
			// iat 会自动设置为当前时间
		}
	)
}

// 验证 JWT token - 增强安全性验证
export const verifyToken = (token: string): JWTPayload | null => {
	try {
		// 首先检查token是否已被撤销
		if (isTokenRevoked(token)) {
			console.warn('Token has been revoked')
			return null
		}
		
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
		
		// 生产环境额外安全检查
		const now = Math.floor(Date.now() / 1000)
		
		// 检查token是否太旧 (可选: 拒绝超过一定时间的token，即使未过期)
		if (decoded.iat && (now - decoded.iat) > 24 * 60 * 60) { // 24小时
			console.warn('Token too old, rejecting for security')
			return null
		}
		
		// 检查nbf (not before) 声明
		if (decoded.nbf && now < decoded.nbf) {
			console.warn('Token not yet valid (nbf)')
			return null
		}
		
		return decoded
	} catch (error) {
		console.warn('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error')
		return null
	}
}

// 生成刷新token - 有效期更长，包含安全增强
export const generateRefreshToken = (userId: string): string => {
	const now = Math.floor(Date.now() / 1000)
	
	return jwt.sign(
		{ 
			userId, 
			type: 'refresh',
			jti: generateJTI(),  // 唯一标识符
			nbf: now,           // 不早于当前时间生效
		}, 
		JWT_SECRET, 
		{ expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
	)
}

// 验证刷新token
export const verifyRefreshToken = (token: string): JWTPayload | null => {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

		// 检查是否是刷新token类型
		if (decoded.type !== 'refresh') {
			return null
		}

		return decoded
	} catch (error) {
		console.warn('Refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error')
		return null
	}
}

// 检查token是否即将过期（提前5分钟）
export const isTokenExpiringSoon = (token: string): boolean => {
	try {
		const decoded = jwt.decode(token) as JWTPayload
		if (!decoded || !decoded.exp) return true

		const now = Math.floor(Date.now() / 1000)
		const fiveMinutesFromNow = now + (5 * 60) // 5分钟后
		
		return decoded.exp < fiveMinutesFromNow
	} catch {
		return true
	}
}

// 注册新用户 - 返回access token和refresh token
export const registerUser = async (userData: {
	name: string
	email: string
	password: string
}): Promise<{ user: Partial<IMongoUser>; token: string; refreshToken: string }> => {
	await connectToDatabase()

	// 检查邮箱是否已存在
	const existingUser = await User.findOne({ email: userData.email })
	if (existingUser) {
		throw new Error("此邮箱已被注册")
	}

	// 创建新用户
	const user = new User(userData)
	await user.save()

	// 生成 JWT tokens
	const token = generateToken(user._id.toString())
	const refreshToken = generateRefreshToken(user._id.toString())

	// 返回用户数据（不包含密码）
	const userWithoutPassword: IClientUser = {
		_id: user._id,
		name: user.name,
		email: user.email,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	}

	return { user: userWithoutPassword, token, refreshToken }
}

// 用户登录 - 返回access token和refresh token
export const loginUser = async (credentials: {
	email: string
	password: string
}): Promise<{ user: Partial<IMongoUser>; token: string; refreshToken: string }> => {
	await connectToDatabase()

	// 查找用户并包含密码字段
	const user = await User.findOne({ email: credentials.email }).select("+password")
	if (!user) {
		throw new Error("邮箱或密码不正确")
	}

	// 验证密码
	const isPasswordValid = await user.comparePassword(credentials.password)

	if (!isPasswordValid) {
		throw new Error("邮箱或密码不正确")
	}

	// 生成 JWT tokens
	const token = generateToken(user._id.toString())
	const refreshToken = generateRefreshToken(user._id.toString())

	// 返回用户数据（不包含密码）
	const userWithoutPassword: IClientUser = {
		_id: user._id,
		name: user.name,
		email: user.email,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	}

	return { user: userWithoutPassword, token, refreshToken }
}

// 刷新访问token
export const refreshAccessToken = async (refreshToken: string): Promise<{ token: string; refreshToken: string } | null> => {
	// 验证刷新token
	const decoded = verifyRefreshToken(refreshToken)
	if (!decoded) {
		return null
	}

	// 验证用户仍然存在且活跃
	await connectToDatabase()
	const user = await User.findById(decoded.userId)
	if (!user) {
		return null
	}

	// 生成新的访问token和刷新token
	const newToken = generateToken(user._id.toString())
	const newRefreshToken = generateRefreshToken(user._id.toString())

	return { token: newToken, refreshToken: newRefreshToken }
}

// 从请求中获取当前用户
export const getCurrentUser = async (request: NextRequest): Promise<IClientUser | null> => {
	// 从 cookie 或 Authorization 头获取 token
	const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

	if (!token) {
		return null
	}

	// 验证 token
	const decoded = verifyToken(token)
	if (!decoded) {
		return null
	}

	// 获取用户数据
	await connectToDatabase()

	const user = await User.findById(decoded.userId)

	if (!user) {
		return null
	}

	// 返回不含密码的用户数据
	return {
		_id: user._id,
		name: user.name,
		email: user.email,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	}
}

// Token黑名单管理 (生产环境建议使用Redis)
const tokenBlacklist = new Set<string>()

// 撤销token (将jti加入黑名单)
export const revokeToken = (token: string): boolean => {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
		if (decoded.jti) {
			tokenBlacklist.add(decoded.jti)
			return true
		}
		return false
	} catch {
		return false
	}
}

// 检查token是否已被撤销
export const isTokenRevoked = (token: string): boolean => {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
		return decoded.jti ? tokenBlacklist.has(decoded.jti) : false
	} catch {
		return true // 无效token视为已撤销
	}
}
