import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

type TCurFetch = (typeof client.api.projects)[":projectId"]["$delete"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

const useDeleteProject = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ param }) => {
			const response = await client.api.projects[":projectId"]["$delete"]({ param })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: ({ data }) => {
			toast.success(dic.projects.delete.success)

			queryClient.invalidateQueries({ queryKey: ["projects"] })
			queryClient.invalidateQueries({ queryKey: ["project", data.$id] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.projects.delete.fail)
			})
		},
	})

	return mutation
}

export default useDeleteProject
