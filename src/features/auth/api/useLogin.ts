import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

type ResponseType = InferResponseType<(typeof client.api.auth.login)["$post"]>
type RequestType = InferRequestType<(typeof client.api.auth.login)["$post"]>

export default function UseLogin() {
	const router = useRouter()
	const dic = useDictionary()

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationFn: async ({ json }) => {
			await client.api.auth.login.$post({ json })

			const response = await client.api.auth.login.$post({ json })

			if (!response.ok) {
				throw new Error(dic.auth.failInLogin)
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.auth.successfulLogin)
			router.refresh()
		},
		onError: () => {
			toast.error(dic.auth.failInLogin)
		},
	})

	return mutation
}
