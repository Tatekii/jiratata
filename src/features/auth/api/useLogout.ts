import { useDictionary } from "@/context/DictionaryProvider"
import { client } from "@/lib/rpc"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const useLogout = () => {
	const router = useRouter()
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation({
		mutationFn: async () => {
			const response = await client.api.auth.logout["$post"]()

			if (!response.ok) {
				throw new Error(dic.auth.failInLogout)
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.auth.successfulLogout)
			router.refresh()
			queryClient.invalidateQueries({ queryKey: ["current"] })
		},
		onError: () => {
			toast.error(dic.auth.failInLogout)
		},
	})

	return mutation
}

export default useLogout
