import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import DictionaryProvider from "@/context/DictionaryProvider"
import mockDictionary from "@/dictionaries/en-US.json"

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	})
}

export function createWrapper() {
	const queryClient = createQueryClient()
	const Wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<DictionaryProvider dictionary={mockDictionary}>
				{children}
			</DictionaryProvider>
		</QueryClientProvider>
	)
	Wrapper.displayName = "TestWrapper"
	return { wrapper: Wrapper, queryClient }
} 