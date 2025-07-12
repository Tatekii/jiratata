import { client } from "@/lib/rpc"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from "hono"
import { toast } from "sonner"

type ResponseType = InferResponseType<typeof client.api.attachments.$post>
type RequestType = InferRequestType<typeof client.api.attachments.$post>["json"]

export const useCreateAttachment = () => {
	const queryClient = useQueryClient()

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationFn: async (json) => {
			const response = await client.api.attachments.$post({ json })

			if (!response.ok) {
				throw new Error("Failed to create attachment")
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success("附件上传成功")
			queryClient.invalidateQueries({ queryKey: ["attachments"] })
		},
		onError: () => {
			toast.error("附件上传失败")
		},
	})

	return mutation
}
