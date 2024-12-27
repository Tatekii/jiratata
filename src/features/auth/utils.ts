import { redirect } from "next/navigation"
import { getCurrent } from "./service/queries"

/**
 * SSR页面的鉴权守卫
 */
export const authGuard = async (redirectTo = "/signin") => {
	"use server"
	const user = await getCurrent()
	if (!user) redirect(redirectTo)
}
