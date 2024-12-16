declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NEXT_PUBLIC_APP_URL: string
			NEXT_PUBLIC_APPWRITE_ENDPOINT: string
			NEXT_PUBLIC_APPWRITE_PROJECT: string
			NEXT_PUBLIC_APPWRITE_DARABASE_ID: string
			NEXT_APPWRITE_KEY: string
		}
	}
}
export {}
