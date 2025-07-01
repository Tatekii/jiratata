// src/app/oauth/route.js

import { AUTH_TOKEN } from "@/features/auth/constants"
import { createAdminClient } from "@/lib/hono"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest) {
	const userId = request.nextUrl.searchParams.get("userId") || ""
	const secret = request.nextUrl.searchParams.get("secret") || ""

	const { account } = await createAdminClient()
	const session = await account.createSession(userId, secret)

	const cookieStore = await cookies()

	cookieStore.set(AUTH_TOKEN, session.secret, {
		path: "/",
		httpOnly: true,
		sameSite: "strict",
		secure: true,
	})

	return NextResponse.redirect(`${request.nextUrl.origin}/`)
}
