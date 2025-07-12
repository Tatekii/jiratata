import { client } from "@/lib/rpc"
import { useQuery } from "@tanstack/react-query"
import { InferResponseType } from "hono"

type ResponseType = InferResponseType<typeof client.api.attachments.$get>

interface UseGetAttachmentsProps {
	entityType: 'TASK' | 'COMMENT' | 'PROJECT'
	entityId: string
}

export const useGetAttachments = ({ entityType, entityId }: UseGetAttachmentsProps) => {
	const query = useQuery<ResponseType, Error>({
		queryKey: ["attachments", entityType, entityId],
		queryFn: async () => {
			const response = await client.api.attachments.$get({
				query: {
					entityType,
					entityId,
				},
			})

			if (!response.ok) {
				throw new Error("Failed to fetch attachments")
			}

			return await response.json()
		},
		enabled: !!entityId,
	})

	return query
}
