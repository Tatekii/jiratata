import { toast } from "sonner"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

type ResponseType = InferResponseType<(typeof client.api.workspaces)["$post"]>
type RequestType = InferRequestType<(typeof client.api.workspaces)["$post"]>

export const useCreateWorkspace = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseType, Error, RequestType>({
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
		onError: () => {
			toast.error(dic.workspaces.form.failInCreate)
		},
	})

	return mutation
}
