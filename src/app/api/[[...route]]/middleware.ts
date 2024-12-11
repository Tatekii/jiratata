import { Context, Next } from "hono"
import { match as matchLocale } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"
import { i18n, Locale } from "@/lib/i18n-config"
import { getDictionary } from "@/lib/get-dictionary"

// 获取请求中的语言accept-language
export const localeMiddleware = async (c: Context, next: Next) => {
	const negotiatorHeaders = c.req.header()

	// @ts-expect-error locales are readonly
	const locales: string[] = i18n.locales

	const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales)

	const locale = matchLocale(languages, locales, i18n.defaultLocale) as Locale

	console.log(locale);
	

	const dic = await getDictionary(locale)

	c.set("dic", dic)

	await next()
}
