import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

type TCurFetch = (typeof client.api.tasks)["$post"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

export const useCreateTask = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ json }) => {
			const response = await client.api.tasks["$post"]({ json })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.tasks.create.success)
			queryClient.invalidateQueries({ queryKey: ["tasks"] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.tasks.create.fail)
			})
		},
	})

	return mutation
}
