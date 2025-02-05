import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

type TCurFetch = (typeof client.api.tasks)[":taskId"]["$patch"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

export const useUpdateTask = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ json, param }) => {
			const response = await client.api.tasks[":taskId"]["$patch"]({ json, param })

			if (!response.ok) {
				// throw new Error("Failed to updated task");
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: ({ data }) => {
			toast.success(dic.tasks.update.success)
			queryClient.invalidateQueries({ queryKey: ["tasks"] })
			queryClient.invalidateQueries({ queryKey: ["task", data.$id] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.tasks.update.fail)
			})
		},
	})

	return mutation
}
