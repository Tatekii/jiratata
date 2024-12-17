declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NEXT_PUBLIC_APP_URL: string
			NEXT_PUBLIC_APPWRITE_ENDPOINT: string
			NEXT_PUBLIC_APPWRITE_PROJECT: string
			NEXT_PUBLIC_APPWRITE_DATABASE_ID: string
			NEXT_PUBLIC_APPWRITE_WORKSPACES_ID: string
			NEXT_APPWRITE_KEY: string
		}
	}
}
export {}
