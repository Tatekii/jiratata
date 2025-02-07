// src/app/oauth/route.js

import { AUTH_COOKIE } from "@/features/auth/constans"
import { createAdminClient } from "@/lib/hono"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: { nextUrl: { searchParams: { get: (arg0: string) => any }; origin: any } }) {
	const userId = request.nextUrl.searchParams.get("userId")
	const secret = request.nextUrl.searchParams.get("secret")

	console.log({ userId, secret })

	const { account } = await createAdminClient()
	const session = await account.createSession(userId, secret)

	const cookieStore = await cookies()

	cookieStore.set(AUTH_COOKIE, session.secret, {
		path: "/",
		httpOnly: true,
		sameSite: "strict",
		secure: true,
	})

	return NextResponse.redirect(`${request.nextUrl.origin}/`)
}
