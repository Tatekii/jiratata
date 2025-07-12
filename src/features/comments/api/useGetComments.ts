import { client } from "@/lib/rpc"
import { useQuery } from "@tanstack/react-query"
import { InferResponseType } from "hono"

type ResponseType = InferResponseType<typeof client.api.comments.$get>

interface UseGetCommentsProps {
	taskId: string
}

export const useGetComments = ({ taskId }: UseGetCommentsProps) => {
	const query = useQuery<ResponseType, Error>({
		queryKey: ["comments", taskId],
		queryFn: async () => {
			const response = await client.api.comments.$get({
				query: {
					taskId,
				},
			})

			if (!response.ok) {
				throw new Error("Failed to fetch comments")
			}

			return await response.json()
		},
		enabled: !!taskId,
	})

	return query
}
