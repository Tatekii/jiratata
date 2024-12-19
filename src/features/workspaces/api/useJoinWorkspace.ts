/**
 * 加入工作区
 */
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { handleOnError, MyRequestType, MyResponseFailType, MyResponseSuccessType } from "@/lib/utils"

type TCurFetch = (typeof client.api.workspaces)[":workspaceId"]["join"]["$post"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

export const useJoinWorkspace = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ param, json }) => {
			const response = await client.api.workspaces[":workspaceId"]["join"]["$post"]({ param, json })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: ({ data }) => {
			toast.success(dic.workspaces.join.success)
			queryClient.invalidateQueries({ queryKey: ["workspaces"] })
			queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] })
		},
		onError: (error) => {
			handleOnError(error, () => {
				toast.error(dic.workspaces.join.fail)
			})
		},
	})

	return mutation
}
