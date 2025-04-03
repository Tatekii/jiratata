import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { handleOnError, MyRequestType, MyResponseFailType, MyResponseSuccessType } from "@/lib/utils"

type TCurFetch = (typeof client.api.auth.login)["$post"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

export default function UseLogin() {
	const router = useRouter()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ json }) => {
			await client.api.auth.login.$post({ json })

			const response = await client.api.auth.login.$post({ json })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.auth.successfulLogin)
			router.refresh()
		},
		onError: (error) => {
			handleOnError(error, () => {
				toast.error(dic.auth.failInLogin)
			})
		},
	})

	return mutation
}
