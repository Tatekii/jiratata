"use client"

import { isServer, QueryClient, QueryClientConfig, QueryClientProvider } from "@tanstack/react-query"

const queryClientConfig: QueryClientConfig = {
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
		},
	},
}

export const testingQueryClientConfig: QueryClientConfig = {
	defaultOptions: {
		...queryClientConfig.defaultOptions,
		// notice no deep merge
		queries: {
			retry: false,
			gcTime: 0,
		},
		mutations: {
			retry: false,
		},
	},
}

function makeQueryClient() {
	return new QueryClient(queryClientConfig)
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
	if (isServer) {
		return makeQueryClient()
	} else {
		if (!browserQueryClient) browserQueryClient = makeQueryClient()
		return browserQueryClient
	}
}

interface QueryProviderProps {
	children: React.ReactNode
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
	const queryClient = getQueryClient()
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
