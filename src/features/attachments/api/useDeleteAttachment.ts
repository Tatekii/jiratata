import { client } from "@/lib/rpc"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InferResponseType } from "hono"
import { toast } from "sonner"

type ResponseType = InferResponseType<typeof client.api.attachments[":attachmentId"]["$delete"]>

export const useDeleteAttachment = () => {
	const queryClient = useQueryClient()

	const mutation = useMutation<ResponseType, Error, string>({
		mutationFn: async (attachmentId) => {
			const response = await client.api.attachments[":attachmentId"].$delete({
				param: { attachmentId },
			})

			if (!response.ok) {
				throw new Error("Failed to delete attachment")
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success("附件删除成功")
			queryClient.invalidateQueries({ queryKey: ["attachments"] })
		},
		onError: () => {
			toast.error("附件删除失败")
		},
	})

	return mutation
}
