import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { handleOnError, MyRequestType, MyResponseFailType, MyResponseSuccessType } from "@/lib/utils"

type TCurFetch = (typeof client.api.workspaces)["$post"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

export const useCreateWorkspace = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ form }) => {
			const response = await client.api.workspaces["$post"]({ form })

			if (!response.ok) {
				throw new Error(dic.workspaces.form.failInCreate)
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.workspaces.form.succefulCreate)
			queryClient.invalidateQueries({ queryKey: ["workspaces"] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.workspaces.form.failInCreate)
			})
		},
	})

	return mutation
}
