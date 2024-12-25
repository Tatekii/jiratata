import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { MyResponseSuccessType, MyResponseFailType, MyRequestType, handleOnError } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

type TCurFetch = (typeof client.api.members)[":memberId"]["$patch"]
type ResponseSuccessType = MyResponseSuccessType<TCurFetch>
type ResponseFailType = MyResponseFailType
type RequestType = MyRequestType<TCurFetch>

const useDeleteMember = () => {
	const queryClient = useQueryClient()
	const dic = useDictionary()

	const mutation = useMutation<ResponseSuccessType, ResponseFailType, RequestType>({
		mutationFn: async ({ param, json }) => {
			const response = await client.api.members[":memberId"]["$patch"]({ param, json })

			if (!response.ok) {
				throw await response.json()
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success(dic.members.update.success)
			queryClient.invalidateQueries({ queryKey: ["members"] })
		},
		onError: (err) => {
			handleOnError(err, () => {
				toast.error(dic.members.update.fail)
			})
		},
	})

	return mutation
}

export default useDeleteMember
