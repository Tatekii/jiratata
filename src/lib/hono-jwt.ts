"use server"
import { sign, verify, decode } from "hono/jwt"
import { Token, TokenType, TokenStatus, IDeviceInfo } from "@/models/token"
import type { IToken } from "@/models/token"
import { User } from "@/models/user"
import { connectToDatabase } from "@/lib/mongodb"
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from "@/config"
import { IClientUser } from "@/features/types"
import mongoose from "mongoose"

// JWT Payload接口
interface JWTPayload {
	userId: string
	jti: string
	type?: string
	iat?: number
	exp?: number
	nbf?: number
}

// Token生成结果接口
export interface TokenGenerationResult {
	accessToken: string
	refreshToken: string
	sessionId: string
	expiresIn: number
	refreshExpiresIn: number
}

// 解析设备信息
function parseDeviceInfo(userAgent?: string): IDeviceInfo {
	if (!userAgent) return {}

	// 简单的设备信息解析 - 在生产环境中建议使用专门的库如ua-parser-js
	const deviceInfo: IDeviceInfo = {}

	if (userAgent.includes("Mobile")) {
		deviceInfo.device = "Mobile"
	} else if (userAgent.includes("Tablet")) {
		deviceInfo.device = "Tablet"
	} else {
		deviceInfo.device = "Desktop"
	}

	if (userAgent.includes("Windows")) {
		deviceInfo.os = "Windows"
	} else if (userAgent.includes("Mac OS")) {
		deviceInfo.os = "macOS"
	} else if (userAgent.includes("Linux")) {
		deviceInfo.os = "Linux"
	} else if (userAgent.includes("Android")) {
		deviceInfo.os = "Android"
	} else if (userAgent.includes("iOS")) {
		deviceInfo.os = "iOS"
	}

	if (userAgent.includes("Chrome")) {
		deviceInfo.browser = "Chrome"
	} else if (userAgent.includes("Firefox")) {
		deviceInfo.browser = "Firefox"
	} else if (userAgent.includes("Safari")) {
		deviceInfo.browser = "Safari"
	} else if (userAgent.includes("Edge")) {
		deviceInfo.browser = "Edge"
	}

	return deviceInfo
}

// 解析过期时间字符串为秒数
function parseExpiresIn(expiresIn: string): number {
	const match = expiresIn.match(/^(\d+)([smhd])$/)
	if (!match) {
		throw new Error(`Invalid expiresIn format: ${expiresIn}`)
	}

	const value = parseInt(match[1])
	const unit = match[2]

	switch (unit) {
		case "s":
			return value
		case "m":
			return value * 60
		case "h":
			return value * 60 * 60
		case "d":
			return value * 24 * 60 * 60
		default:
			throw new Error(`Invalid time unit: ${unit}`)
	}
}

// 生成JWT token的实际字符串
async function generateJWTString(payload: Omit<JWTPayload, "iat" | "exp" | "nbf">, expiresIn: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000)
	const expirationSeconds = parseExpiresIn(expiresIn)

	return await sign(
		{
			...payload,
			iat: now, // issued at
			nbf: now, // not before
			exp: now + expirationSeconds, // expires at
		},
		JWT_SECRET as string
	)
}

/**
 * 创建token对 - 核心token生成函数
 */
export async function createTokenPair(
	userId: string | mongoose.Types.ObjectId,
	ipAddress?: string,
	userAgent?: string
): Promise<TokenGenerationResult> {
	await connectToDatabase()

	const userObjectId = new mongoose.Types.ObjectId(userId)
	const deviceInfo = parseDeviceInfo(userAgent)

	// 创建数据库中的token记录
	const {
		accessToken: accessTokenDoc,
		refreshToken: refreshTokenDoc,
		sessionId,
	} = await Token.createTokenPair(userObjectId, deviceInfo, ipAddress, userAgent)

	// 生成实际的JWT字符串
	const accessToken = await generateJWTString(
		{
			userId: userObjectId.toString(),
			jti: accessTokenDoc.jti,
		},
		JWT_EXPIRES_IN
	)

	const refreshToken = await generateJWTString(
		{
			userId: userObjectId.toString(),
			jti: refreshTokenDoc.jti,
			type: "refresh",
		},
		JWT_REFRESH_EXPIRES_IN
	)

	// 计算过期时间（秒）
	const expiresIn = Math.floor((accessTokenDoc.expiresAt.getTime() - Date.now()) / 1000)
	const refreshExpiresIn = Math.floor((refreshTokenDoc.expiresAt.getTime() - Date.now()) / 1000)

	return {
		accessToken,
		refreshToken,
		sessionId,
		expiresIn,
		refreshExpiresIn,
	}
}

/**
 * 验证access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
	try {
		await connectToDatabase()

		// 验证JWT签名和基本结构
		const decoded = (await verify(token, JWT_SECRET)) as unknown as JWTPayload

		// 检查数据库中的token状态 - 只查找活跃的token
		const tokenDoc = await Token.findActiveTokenByJTI(decoded.jti)
		if (!tokenDoc || tokenDoc.type !== TokenType.ACCESS) {
			console.warn("Token not found in database or wrong type")
			return null
		}

		if (!tokenDoc.isActive()) {
			console.warn("Token is not active")
			return null
		}

		// 更新最后使用时间
		await tokenDoc.updateLastUsed()

		return decoded
	} catch (error) {
		console.warn("JWT verification failed:", error instanceof Error ? error.message : "Unknown error")
		return null
	}
}

/**
 * 验证refresh token
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
	try {
		await connectToDatabase()

		const decoded = (await verify(token, JWT_SECRET as string)) as unknown as JWTPayload

		if (decoded.type !== "refresh") {
			return null
		}

		const tokenDoc = await Token.findActiveTokenByJTI(decoded.jti)
		if (!tokenDoc || tokenDoc.type !== TokenType.REFRESH) {
			return null
		}

		if (!tokenDoc.isActive()) {
			return null
		}

		return decoded
	} catch (error) {
		console.warn("Refresh token verification failed:", error instanceof Error ? error.message : "Unknown error")
		return null
	}
}

/**
 * 刷新token - 实现token轮换
 */
export async function refreshTokenPair(
	refreshToken: string,
	ipAddress?: string,
	userAgent?: string
): Promise<TokenGenerationResult | null> {
	await connectToDatabase()

	// 验证refresh token
	const decoded = await verifyRefreshToken(refreshToken)
	if (!decoded) {
		return null
	}

	// 验证用户仍然存在
	const user = await User.findById(decoded.userId)
	if (!user) {
		return null
	}

	// 获取原始的refresh token文档
	const oldRefreshTokenDoc = await Token.findByJTI(decoded.jti)
	if (!oldRefreshTokenDoc) {
		return null
	}

	// 撤销旧的token家族（包括关联的access token）
	await Token.revokeTokenFamily(oldRefreshTokenDoc._id, "token_rotation")

	// 创建新的token对
	return createTokenPair(decoded.userId, ipAddress, userAgent)
}

/**
 * 撤销单个token
 */
export async function revokeToken(token: string, reason = "manual_revocation", revokedBy?: string): Promise<boolean> {
	try {
		await connectToDatabase()

		const decoded = (await verify(token, JWT_SECRET as string)) as unknown as JWTPayload

		const tokenDoc = await Token.findByJTI(decoded.jti)

		if (!tokenDoc) {
			return false
		}

		const revokedByObjectId = revokedBy ? new mongoose.Types.ObjectId(revokedBy) : undefined
		await tokenDoc.revoke(reason, revokedByObjectId)

		return true
	} catch {
		return false
	}
}

/**
 * 撤销用户的所有token
 */
export async function revokeAllUserTokens(userId: string, reason = "user_logout"): Promise<void> {
	await connectToDatabase()
	const userObjectId = new mongoose.Types.ObjectId(userId)
	await Token.revokeAllUserTokens(userObjectId, reason)
}

/**
 * 撤销用户的特定会话
 */
export async function revokeUserSession(userId: string, sessionId: string, reason = "session_logout"): Promise<void> {
	await connectToDatabase()

	await Token.updateMany(
		{
			userId: new mongoose.Types.ObjectId(userId),
			sessionId,
			status: TokenStatus.ACTIVE,
		},
		{
			status: TokenStatus.REVOKED,
			revokedAt: new Date(),
			revokedReason: reason,
		}
	)
}

/**
 * 获取用户的活跃token信息
 */
export async function getUserActiveTokens(userId: string): Promise<{
	sessions: Array<{
		sessionId: string
		createdAt: Date
		lastUsedAt?: Date
		deviceInfo?: IDeviceInfo
		ipAddress?: string
		tokenCount: number
	}>
	totalTokens: number
}> {
	await connectToDatabase()

	const userObjectId = new mongoose.Types.ObjectId(userId)
	const tokens = await Token.findActiveTokensByUser(userObjectId)

	// 按会话分组
	const sessionMap = new Map()

	tokens.forEach((token: IToken) => {
		if (!sessionMap.has(token.sessionId)) {
			sessionMap.set(token.sessionId, {
				sessionId: token.sessionId,
				createdAt: token.createdAt,
				lastUsedAt: token.lastUsedAt,
				deviceInfo: token.deviceInfo,
				ipAddress: token.ipAddress,
				tokenCount: 0,
			})
		}
		sessionMap.get(token.sessionId).tokenCount++

		// 更新最后使用时间为最新的
		const session = sessionMap.get(token.sessionId)
		if (!session.lastUsedAt || (token.lastUsedAt && token.lastUsedAt > session.lastUsedAt)) {
			session.lastUsedAt = token.lastUsedAt
		}
	})

	return {
		sessions: Array.from(sessionMap.values()),
		totalTokens: tokens.length,
	}
}

/**
 * 从请求中获取当前用户
 */
export async function getUserByToken(token: string): Promise<IClientUser | null> {
	if (!token) {
		return null
	}

	// 验证 token
	const decoded = await verifyAccessToken(token)
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

/**
 * 检查token是否即将过期
 */
export async function isTokenExpiringSoon(token: string, thresholdMinutes = 5): Promise<boolean> {
	try {
		const { payload } = decode(token)
		const decoded = payload as unknown as JWTPayload
		if (!decoded || !decoded.exp) return true

		const now = Math.floor(Date.now() / 1000)
		const threshold = now + thresholdMinutes * 60

		return decoded.exp < threshold
	} catch {
		return true
	}
}

/**
 * 清理过期的token（定时任务使用）
 */
export async function cleanupExpiredTokens(): Promise<number> {
	await connectToDatabase()
	return Token.cleanupExpiredTokens()
}

/**
 * 用户登录
 */
export async function loginUser(
	credentials: {
		email: string
		password: string
	},
	ipAddress?: string,
	userAgent?: string
): Promise<{
	user: IClientUser
	tokens: TokenGenerationResult
}> {
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

	// 生成token对
	const tokens = await createTokenPair(user._id, ipAddress, userAgent)

	// 返回用户数据（不包含密码）
	const userWithoutPassword: IClientUser = {
		_id: user._id,
		name: user.name,
		email: user.email,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	}

	return { user: userWithoutPassword, tokens }
}

/**
 * 用户注册
 */
export async function registerUser(
	userData: {
		name: string
		email: string
		password: string
	},
	ipAddress?: string,
	userAgent?: string
): Promise<{
	user: IClientUser
	tokens: TokenGenerationResult
}> {
	await connectToDatabase()

	// 检查邮箱是否已存在
	const existingUser = await User.findOne({ email: userData.email })
	if (existingUser) {
		throw new Error("此邮箱已被注册")
	}

	// 创建新用户
	const user = new User(userData)
	await user.save()

	// 生成token对
	const tokens = await createTokenPair(user._id, ipAddress, userAgent)

	// 返回用户数据（不包含密码）
	const userWithoutPassword: IClientUser = {
		_id: user._id,
		name: user.name,
		email: user.email,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	}

	return { user: userWithoutPassword, tokens }
}
