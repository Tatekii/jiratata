import "server-only"
import { Octokit } from "@octokit/rest"
import { google } from "googleapis"
import { User, OAuthProvider } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { createTokenPair, TokenGenerationResult } from "@/lib/hono-jwt"
import { IClientUser } from "@/features/types"
import { APP_URI, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "@/config"

export const OAuthCallbackUrl = {
	google: `${APP_URI}/api/auth/oauth/google/callback`,
	github: `${APP_URI}/api/auth/oauth/github/callback`,
} as const

/**
 * GitHub OAuth认证
 */
export async function authenticateWithGitHub(
	accessToken: string,
	ipAddress?: string,
	userAgent?: string
): Promise<{
	user: IClientUser
	tokens: TokenGenerationResult
	isNewUser: boolean
}> {
	if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
		throw new Error("GitHub OAuth配置未设置")
	}

	try {
		// 使用访问令牌获取用户信息
		const octokit = new Octokit({
			auth: accessToken,
		})

		const { data: githubUser } = await octokit.rest.users.getAuthenticated()

		// 如果GitHub没有提供邮箱，尝试获取主要邮箱
		let userEmail = githubUser.email
		if (!userEmail) {
			const { data: emails } = await octokit.rest.users.listEmailsForAuthenticatedUser()
			const primaryEmail = emails.find((email) => email.primary && email.verified)
			userEmail = primaryEmail?.email || null
		}

		if (!userEmail) {
			throw new Error("无法获取GitHub用户邮箱地址")
		}

		await connectToDatabase()

		// 查找现有用户
		let user = await User.findOne({
			$or: [
				{ email: userEmail },
				{
					"oauthAccounts.provider": OAuthProvider.GITHUB,
					"oauthAccounts.providerId": githubUser.id.toString(),
				},
			],
		})

		let isNewUser = false

		if (!user) {
			// 创建新用户
			user = new User({
				name: githubUser.name || githubUser.login,
				email: userEmail,
				avatar: githubUser.avatar_url,
				isEmailVerified: true, // GitHub已验证邮箱
				oauthAccounts: [
					{
						provider: OAuthProvider.GITHUB,
						providerId: githubUser.id.toString(),
						email: userEmail,
						name: githubUser.name || githubUser.login,
						avatar: githubUser.avatar_url,
					},
				],
			})
			await user.save()
			isNewUser = true
		} else {
			// 更新现有用户的OAuth账户信息
			const existingAccount = user.oauthAccounts?.find((account) => account.provider === OAuthProvider.GITHUB)

			if (!existingAccount) {
				// 添加GitHub账户到现有用户
				if (!user.oauthAccounts) user.oauthAccounts = []
				user.oauthAccounts.push({
					provider: OAuthProvider.GITHUB,
					providerId: githubUser.id.toString(),
					email: userEmail,
					name: githubUser.name || githubUser.login,
					avatar: githubUser.avatar_url,
				})

				// 更新用户信息
				if (!user.avatar) user.avatar = githubUser.avatar_url
				user.isEmailVerified = true
				await user.save()
			} else {
				// 更新现有GitHub账户信息
				existingAccount.email = userEmail
				existingAccount.name = githubUser.name || githubUser.login
				existingAccount.avatar = githubUser.avatar_url

				// 更新用户信息
				if (!user.avatar) user.avatar = githubUser.avatar_url
				user.isEmailVerified = true
				await user.save()
			}
		}

		// 生成JWT令牌
		const tokens = await createTokenPair(user._id, ipAddress, userAgent)

		// 返回用户数据（不包含敏感信息）
		const userResponse: IClientUser = {
			_id: user._id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			avatar: user.avatar,
		}

		return { user: userResponse, tokens, isNewUser }
	} catch (error) {
		console.error("GitHub OAuth认证失败:", error)
		throw error instanceof Error ? error : new Error("GitHub登录失败")
	}
}

/**
 * Google OAuth认证
 */
export async function authenticateWithGoogle(
	accessToken: string,
	ipAddress?: string,
	userAgent?: string
): Promise<{
	user: IClientUser
	tokens: TokenGenerationResult
	isNewUser: boolean
}> {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
		throw new Error("Google OAuth配置未设置")
	}

	try {
		// 使用访问令牌获取用户信息
		const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

		oauth2Client.setCredentials({ access_token: accessToken })

		const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
		const { data: googleUser } = await oauth2.userinfo.get()

		if (!googleUser.email) {
			throw new Error("无法获取Google用户邮箱地址")
		}

		await connectToDatabase()

		// 查找现有用户
		let user = await User.findOne({
			$or: [
				{ email: googleUser.email },
				{ "oauthAccounts.provider": OAuthProvider.GOOGLE, "oauthAccounts.providerId": googleUser.id },
			],
		})

		let isNewUser = false

		if (!user) {
			// 创建新用户
			user = new User({
				name: googleUser.name || "Google用户",
				email: googleUser.email,
				avatar: googleUser.picture,
				isEmailVerified: googleUser.verified_email || false,
				oauthAccounts: [
					{
						provider: OAuthProvider.GOOGLE,
						providerId: googleUser.id!,
						email: googleUser.email,
						name: googleUser.name || "Google用户",
						avatar: googleUser.picture || undefined,
					},
				],
			})
			await user.save()
			isNewUser = true
		} else {
			// 更新现有用户的OAuth账户信息
			const existingAccount = user.oauthAccounts?.find((account) => account.provider === OAuthProvider.GOOGLE)

			if (!existingAccount) {
				// 添加Google账户到现有用户
				if (!user.oauthAccounts) user.oauthAccounts = []
				user.oauthAccounts.push({
					provider: OAuthProvider.GOOGLE,
					providerId: googleUser.id!,
					email: googleUser.email,
					name: googleUser.name || "Google用户",
					avatar: googleUser.picture,
				})

				// 更新用户信息
				if (!user.avatar) user.avatar = googleUser.picture || undefined
				if (googleUser.verified_email) user.isEmailVerified = true
				await user.save()
			}
		}

		// 生成JWT令牌
		const tokens = await createTokenPair(user._id, ipAddress, userAgent)

		// 返回用户数据（不包含敏感信息）
		const userResponse: IClientUser = {
			_id: user._id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			avatar: user.avatar,
		}

		return { user: userResponse, tokens, isNewUser }
	} catch (error) {
		console.error("Google OAuth认证失败:", error)
		throw new Error("Google登录失败")
	}
}

/**
 * 获取GitHub OAuth授权URL
 */
export function getGitHubAuthUrl(redirectUri: string, state?: string): string {
	if (!GITHUB_CLIENT_ID) {
		throw new Error("GitHub客户端ID未配置")
	}

	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		redirect_uri: redirectUri,
		scope: "user:email",
		...(state && { state }),
	})

	return `https://github.com/login/oauth/authorize?${params.toString()}`
}

/**
 * 获取Google OAuth授权URL
 */
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
	if (!GOOGLE_CLIENT_ID) {
		throw new Error("Google客户端ID未配置")
	}

	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: "openid email profile",
		access_type: "offline",
		...(state && { state }),
	})

	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * 通过授权码交换GitHub访问令牌
 */
export async function exchangeGitHubCode(code: string, redirectUri: string): Promise<string> {
	if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
		throw new Error("GitHub OAuth配置未设置")
	}

	try {
		const response = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: GITHUB_CLIENT_ID,
				client_secret: GITHUB_CLIENT_SECRET,
				code,
				redirect_uri: redirectUri,
			}),
		})

		if (!response.ok) {
			throw new Error(`GitHub OAuth令牌交换失败: ${response.status}`)
		}

		const data = await response.json()

		if (data.error) {
			throw new Error(`GitHub OAuth错误: ${data.error_description || data.error}`)
		}

		return data.access_token
	} catch (error) {
		console.error("GitHub授权码交换失败:", error)
		throw new Error("GitHub登录失败")
	}
}

/**
 * 通过授权码交换Google访问令牌
 */
export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
		throw new Error("Google OAuth配置未设置")
	}

	try {
		const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri)

		const { tokens } = await oauth2Client.getToken(code)

		if (!tokens.access_token) {
			throw new Error("未获取到访问令牌")
		}

		return tokens.access_token
	} catch (error) {
		console.error("Google授权码交换失败:", error)
		throw new Error("Google登录失败")
	}
}
