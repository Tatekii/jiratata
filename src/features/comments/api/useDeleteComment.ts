import { client } from "@/lib/rpc"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InferResponseType } from "hono"
import { toast } from "sonner"

type ResponseType = InferResponseType<typeof client.api.comments[":commentId"]["$delete"]>

export const useDeleteComment = () => {
	const queryClient = useQueryClient()

	const mutation = useMutation<ResponseType, Error, string>({
		mutationFn: async (commentId) => {
			const response = await client.api.comments[":commentId"].$delete({
				param: { commentId },
			})

			if (!response.ok) {
				throw new Error("Failed to delete comment")
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success("评论删除成功")
			queryClient.invalidateQueries({ queryKey: ["comments"] })
			queryClient.invalidateQueries({ queryKey: ["tasks"] })
		},
		onError: () => {
			toast.error("评论删除失败")
		},
	})

	return mutation
}
