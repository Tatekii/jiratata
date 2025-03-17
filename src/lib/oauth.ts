"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { OAuthProvider } from "node-appwrite"
import { createAdminClient } from "./hono"

export async function signUpWithGithub() {
	const { account } = await createAdminClient()

	const headerStore = await headers()

	const origin = headerStore.get("origin")

	try {
		const redirectUrl = await account.createOAuth2Token(OAuthProvider.Github, `${origin}/oauth`, `${origin}/signup`)
		return redirect(redirectUrl)
	} catch {
		throw false
	}
}

export async function signUpWithGoogle() {
	const { account } = await createAdminClient()

	const headerStore = await headers()

	const origin = headerStore.get("origin")

	try {
		const redirectUrl = await account.createOAuth2Token(OAuthProvider.Google, `${origin}/oauth`, `${origin}/signup`)

		return redirect(redirectUrl)
	} catch {
		throw false
	}
}
