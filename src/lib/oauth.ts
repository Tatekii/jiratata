"use server"
import { APP_URI } from "@/config"
import { randomBytes } from "crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// 生成CSRF state token
function generateStateToken(): string {
	return randomBytes(32).toString("hex")
}

// GitHub OAuth登录
export async function signUpWithGithub(): Promise<boolean> {
	// 生成state token用于CSRF保护
	const state = generateStateToken()

	// 存储state到cookie
	const cookieStore = await cookies()
	cookieStore.set("oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 600, // 10分钟
		path: "/",
	})

	// 修正路径：移除多余的 /auth 前缀
	const authUrl = `${APP_URI}/api/auth/oauth/github/auth?state=${state}`
	redirect(authUrl)
}

// Google OAuth登录
export async function signUpWithGoogle(): Promise<boolean> {
	// 生成state token用于CSRF保护
	const state = generateStateToken()

	// 存储state到cookie
	const cookieStore = await cookies()
	cookieStore.set("oauth_state", state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 600, // 10分钟
		path: "/",
	})

	// 修正路径：移除多余的 /auth 前缀
	const authUrl = `${APP_URI}/api/auth/oauth/google/auth?state=${state}`

	redirect(authUrl)
}
