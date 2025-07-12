import { client } from "@/lib/rpc"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from "hono"
import { toast } from "sonner"

type ResponseType = InferResponseType<typeof client.api.comments.$post>
type RequestType = InferRequestType<typeof client.api.comments.$post>["json"]

export const useCreateComment = () => {
	const queryClient = useQueryClient()

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationFn: async (json) => {
			const response = await client.api.comments.$post({ json })

			if (!response.ok) {
				throw new Error("Failed to create comment")
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success("评论创建成功")
			queryClient.invalidateQueries({ queryKey: ["comments"] })
			queryClient.invalidateQueries({ queryKey: ["tasks"] })
		},
		onError: () => {
			toast.error("评论创建失败")
		},
	})

	return mutation
}
