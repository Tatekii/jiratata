import "server-only"
import { Client, Account, Databases, Storage, Users } from "node-appwrite"
import { cookies } from "next/headers"
import { AUTH_COOKIE } from "@/features/auth/constans"

export async function createSessionClient() {
	const client = new Client()
		.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
		.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)

	const session = await (await cookies()).get(AUTH_COOKIE)

	if (!session || !session.value) {
		throw new Error("No session")
	}

	client.setSession(session.value)

	return {
		get account() {
			return new Account(client)
		},
		get databases() {
			return new Databases(client)
		},
		get storage() {
			return new Storage(client)
		},
	}
}

export async function createAdminClient() {
	const client = new Client()
		.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
		.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
		.setKey(process.env.NEXT_APPWRITE_KEY)

	return {
		get account() {
			return new Account(client)
		},
		get users() {
			return new Users(client)
		},
		get databases() {
			return new Databases(client)
		},
	}
}
