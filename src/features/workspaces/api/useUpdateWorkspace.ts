import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { handleOnError, MyRequestType, MyResponseFailType, MyResponseSuccessType } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

type TCurFetch = (typeof client.api.workspaces)[":workspaceId"]["$patch"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

const useUpdateWorkspace = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ json, param }) => {
			const response = await client.api.workspaces[":workspaceId"]["$patch"]({ json, param })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: ({ data }) => {
			toast.success(dic.workspaces.update.success)

			queryClient.invalidateQueries({ queryKey: ["workspaces"] })
			queryClient.invalidateQueries({ queryKey: ["workspace", data._id] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.success(dic.workspaces.update.fail)
			})
		},
	})

	return mutation
}

export default useUpdateWorkspace
