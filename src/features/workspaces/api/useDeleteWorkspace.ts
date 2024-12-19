import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useRouter } from "next/navigation"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

type TCurFetch = (typeof client.api.workspaces)[":workspaceId"]["$delete"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

const useDeleteWorkspace = () => {
	const queryClient = useQueryClient()
	const router = useRouter()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ param }) => {
			const response = await client.api.workspaces[":workspaceId"]["$delete"]({ param })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: ({ data }) => {
			toast.success(dic.workspaces.delete.success)
			router.replace("/")
			queryClient.invalidateQueries({ queryKey: ["workspaces"] })
			queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.workspaces.delete.fail)
			})
		},
	})

	return mutation
}

export default useDeleteWorkspace
