import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

type ResponseType = InferResponseType<(typeof client.api.auth.register)["$post"]>
type RequestType = InferRequestType<(typeof client.api.auth.register)["$post"]>

export default function UseRegister() {
	const queryClient = useQueryClient()
	const router = useRouter()
	const dic = useDictionary()

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationFn: async ({ json }) => {
			const response = await client.api.auth.register["$post"]({ json })

			if (!response.ok) {
				throw new Error(dic.auth.failInRegister)
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.auth.successfulRegister)
			router.refresh()
			queryClient.invalidateQueries({ queryKey: ["current"] })
		},
		onError: () => {
			toast.error(dic.auth.failInRegister)
		},
		onSettled: () => {},
	})

	return mutation
}
