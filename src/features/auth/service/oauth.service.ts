import "server-only"
import { Hono, Context } from "hono"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { setCookie, getCookie } from "hono/cookie"
import { AUTH_TOKEN, REFRESH_TOKEN } from "@/features/auth/constants"
import {
	exchangeGitHubCode,
	exchangeGoogleCode,
	authenticateWithGitHub,
	authenticateWithGoogle,
	getGitHubAuthUrl,
	getGoogleAuthUrl,
	OAuthCallbackUrl,
} from "@/lib/oauth-providers"

// Cookie配置统一化
const getCookieConfig = (maxAge: number) => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	maxAge,
	path: "/",
})

// 验证state token防止CSRF
function validateState(c: Context): boolean {
	const stateFromQuery = c.req.query("state")
	const stateFromCookie = getCookie(c, "oauth_state")

	if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
		return false
	}

	return true
}

const app = new Hono<{ Variables: AppVariables }>()

	// GitHub OAuth回调处理
	.get("/github/callback", async (c) => {
		try {
			const code = c.req.query("code")
			const error = c.req.query("error")

			if (error) {
				console.error("GitHub OAuth错误:", error)
				return c.redirect(`/signup?error=oauth_error&message=${encodeURIComponent(error)}`)
			}

			if (!code) {
				return c.redirect("/signup?error=oauth_missing_code")
			}

			// 验证state token防止CSRF攻击
			if (!validateState(c)) {
				console.error("GitHub OAuth state验证失败")
				return c.redirect("/signup?error=oauth_state_mismatch")
			}

			// 获取客户端信息
			const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
			const userAgent = c.req.header("user-agent") || "unknown"

			// 交换授权码获取访问令牌
			const redirectUri = OAuthCallbackUrl.github
			const accessToken = await exchangeGitHubCode(code, redirectUri)

			// 使用访问令牌进行用户认证
			const { tokens, isNewUser } = await authenticateWithGitHub(accessToken, ipAddress, userAgent)

			// 设置JWT cookies - 使用统一配置
			setCookie(c, AUTH_TOKEN, tokens.accessToken, getCookieConfig(tokens.expiresIn))
			setCookie(c, REFRESH_TOKEN, tokens.refreshToken, getCookieConfig(tokens.refreshExpiresIn))

			// 清除state cookie
			setCookie(c, "oauth_state", "", { ...getCookieConfig(0), maxAge: 0 })

			// 重定向到适当的页面
			const redirectTo = '/'
			return c.redirect(`${redirectTo}`)
		} catch (error) {
			console.error("GitHub OAuth回调错误:", error)
			return c.redirect(`/signup?error=oauth_callback_error&message=${encodeURIComponent(String(error))}`)
		}
	})

	// Google OAuth回调处理
	.get("/google/callback", async (c) => {
		try {
			const code = c.req.query("code")
			const error = c.req.query("error")

			if (error) {
				console.error("Google OAuth错误:", error)
				return c.redirect(`/signup?error=oauth_error&message=${encodeURIComponent(error)}`)
			}

			if (!code) {
				return c.redirect("/signup?error=oauth_missing_code")
			}

			// 验证state token防止CSRF攻击
			if (!validateState(c)) {
				console.error("Google OAuth state验证失败")
				return c.redirect("/signup?error=oauth_state_mismatch")
			}

			// 获取客户端信息
			const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
			const userAgent = c.req.header("user-agent") || "unknown"

			// 交换授权码获取访问令牌
			const redirectUri = OAuthCallbackUrl.google
			const accessToken = await exchangeGoogleCode(code, redirectUri)

			// 使用访问令牌进行用户认证
      // TODO isNewUser
			const { tokens, isNewUser } = await authenticateWithGoogle(accessToken, ipAddress, userAgent)

			// 设置JWT cookies - 使用统一配置
			setCookie(c, AUTH_TOKEN, tokens.accessToken, getCookieConfig(tokens.expiresIn))
			setCookie(c, REFRESH_TOKEN, tokens.refreshToken, getCookieConfig(tokens.refreshExpiresIn))

			// 清除state cookie
			setCookie(c, "oauth_state", "", { ...getCookieConfig(0), maxAge: 0 })

			// 重定向到适当的页面
			return c.redirect(`/`)
		} catch (error) {
			console.error("Google OAuth回调错误:", error)
			return c.redirect(`/signup?error=oauth_callback_error&message=${encodeURIComponent(String(error))}`)
		}
	})

	// GitHub OAuth授权URL获取
	.get("/github/auth", async (c) => {
		try {
			const state = c.req.query("state")
			const authUrl = getGitHubAuthUrl(OAuthCallbackUrl.github, state)
			return c.redirect(authUrl)
		} catch (error) {
			console.error("GitHub OAuth授权URL生成错误:", error)
			return c.redirect("/signup?error=oauth_config_error")
		}
	})

	// Google OAuth授权URL获取
	.get("/google/auth", async (c) => {
		try {
			const state = c.req.query("state")
			const authUrl = getGoogleAuthUrl(OAuthCallbackUrl.google, state)
			return c.redirect(authUrl)
		} catch (error) {
			console.error("Google OAuth授权URL生成错误:", error)
			return c.redirect("/signup?error=oauth_config_error")
		}
	})

export default app
