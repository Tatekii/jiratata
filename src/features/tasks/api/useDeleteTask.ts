import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { handleOnError, MyRequestType, MyResponseFailType, MyResponseSuccessType } from "@/lib/utils"

type TCurFetch = (typeof client.api.tasks)[":taskId"]["$delete"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

const useDeleteTask = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ param }) => {
			const response = await client.api.tasks[":taskId"]["$delete"]({ param })

			if (!response.ok) {
				// throw new Error("Failed to delete task")
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: ({ data }) => {
			toast.success(dic.tasks.delete.success)

			queryClient.invalidateQueries({ queryKey: ["tasks"] })
			queryClient.invalidateQueries({ queryKey: ["task", data.$id] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.tasks.delete.fail)
			})
		},
	})

	return mutation
}

export default useDeleteTask
