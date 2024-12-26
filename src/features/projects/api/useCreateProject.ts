import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

type TCurFetch = (typeof client.api.projects)["$post"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

const useCreateProject = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ form }) => {
			const response = await client.api.projects["$post"]({ form })

			if (!response.ok) {
				throw new Error(dic.projects.create.fail)
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.projects.create.success)
			queryClient.invalidateQueries({ queryKey: ["projects"] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.projects.create.fail)
			})
		},
	})

	return mutation
}

export default useCreateProject
