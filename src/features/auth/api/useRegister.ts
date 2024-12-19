import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"

type TCurFetch = (typeof client.api.auth.register)["$post"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

export default function UseRegister() {
	const queryClient = useQueryClient()
	const router = useRouter()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
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
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.auth.failInRegister)
			})
		},
	})

	return mutation
}
