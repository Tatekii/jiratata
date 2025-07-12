import { client } from "@/lib/rpc"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from "hono"
import { toast } from "sonner"

type ResponseType = InferResponseType<typeof client.api.comments[":commentId"]["$patch"]>
type RequestType = InferRequestType<typeof client.api.comments[":commentId"]["$patch"]>["json"]

interface UseUpdateCommentParams extends RequestType {
	commentId: string
}

export const useUpdateComment = () => {
	const queryClient = useQueryClient()

	const mutation = useMutation<ResponseType, Error, UseUpdateCommentParams>({
		mutationFn: async ({ commentId, ...json }) => {
			const response = await client.api.comments[":commentId"].$patch({
				param: { commentId },
				json,
			})

			if (!response.ok) {
				throw new Error("Failed to update comment")
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success("评论更新成功")
			queryClient.invalidateQueries({ queryKey: ["comments"] })
		},
		onError: () => {
			toast.error("评论更新失败")
		},
	})

	return mutation
}
