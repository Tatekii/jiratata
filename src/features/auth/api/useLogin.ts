import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { handleOnError, MyRequestType, MyResponseFailType, MyResponseSuccessType } from "@/lib/utils"

type TCurFetch = (typeof client.api.auth.login)["$post"]
export type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
export type ResponseFailType = MyResponseFailType
export type RequestType = MyRequestType<TCurFetch>

export default function UseLogin() {
	const router = useRouter()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
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
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.auth.failInLogin)
			})
		},
	})

	return mutation
}
