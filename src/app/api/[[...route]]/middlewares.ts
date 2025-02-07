import "server-only"
import { createMiddleware } from "hono/factory"
import { match as matchLocale } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"
import { i18n, Locale } from "@/lib/i18n-config"
import { getDictionary } from "@/lib/get-dictionary"
import { ValidationTargets } from "hono"
import { validator } from "hono/validator"
import { ZodEffects, ZodObject, z } from "zod"
import { TDictionary } from "@/context/DictionaryProvider"

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
