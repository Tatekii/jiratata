import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"

type TCurFetch = (typeof client.api.tasks)["bulk-update"]["$post"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

const useBulkUpdateTasks = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ json }) => {
			const response = await client.api.tasks["bulk-update"]["$post"]({ json })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.tasks.update.success)
			queryClient.invalidateQueries({ queryKey: ["tasks"] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.tasks.update.fail)
			})
		},
	})

	return mutation
}

export default useBulkUpdateTasks
