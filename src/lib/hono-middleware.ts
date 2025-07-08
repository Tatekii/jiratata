/**
 * middleware for hono client ONLY - 使用新的数据库支持的token系统
 */
import { createMiddleware } from "hono/factory"
import { getCookie } from "hono/cookie"
import { verifyAccessToken } from "@/lib/hono-jwt"
import { User } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { AUTH_TOKEN } from "@/features/auth/constants"
import { TDictionary } from "@/context/DictionaryProvider"
import { match as matchLocale } from "@formatjs/intl-localematcher"
import { ValidationTargets } from "hono"
import { validator } from "hono/validator"
import Negotiator from "negotiator"
import { ZodObject, ZodEffects, z } from "zod"
import { getDictionary } from "./get-dictionary"
import { i18n, Locale } from "./i18n-config"
import { IAuthUserInfo } from "@/app/api/[[...route]]/route"

export const authSessionMiddleware = createMiddleware(async (c, next) => {
	try {
		// 从cookie获取JWT token
		const token = getCookie(c, AUTH_TOKEN)

		if (!token) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		// 使用新的token服务验证JWT token
		const decoded = await verifyAccessToken(token)
		if (!decoded) {
			return c.json({ error: "Invalid token" }, 401)
		}

		// 连接数据库并获取用户信息
		await connectToDatabase()
		const user = await User.findById(decoded.userId)

		if (!user) {
			return c.json({ error: "User not found" }, 401)
		}

		// 将用户信息设置到上下文中
		c.set("user", {
			_id: user._id,
			name: user.name,
			email: user.email,
			avatar: user.avatar,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			oauthProvider: user.oauthAccounts?.map((o) => o.provider),
		} as IAuthUserInfo)

		await next()
	} catch {
		return c.json({ error: "Unauthorized" }, 401)
	}
})
// 获取请求中的语言accept-language

export const localeMiddleware = createMiddleware(async (c, next) => {
	const negotiatorHeaders = c.req.header()

	// @ts-expect-error locales are readonly
	const locales: string[] = i18n.locales

	const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales)

	const locale = matchLocale(languages, locales, i18n.defaultLocale) as Locale

	const dic = await getDictionary(locale)

	c.set("dic", dic)

	await next()
})
/**
 * 多语言校验信息
 */

export const localeValidatorMiddleware = <
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends ZodObject<any> | ZodEffects<ZodObject<any>>,
	Target extends keyof ValidationTargets
>(
	target: Target,
	schemaBuilder: (dic: TDictionary) => T
) =>
	validator(target, async (value, c) => {
		const dic = c.get("dic")

		const result = await schemaBuilder(dic).safeParseAsync(value)

		if (!result.success) {
			return c.json(result, 400)
		}

		return result.data as z.infer<T>
	})
