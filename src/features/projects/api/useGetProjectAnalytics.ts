import { InferResponseType } from "hono"
import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { extractDataFromResponse } from "@/lib/utils"
import { IProjectAnalytics } from "@/features/types"

interface UseGetProjectAnalyticsProps {
	projectId: string
}

export type ProjectAnalyticsResponseType = InferResponseType<
	(typeof client.api.projects)[":projectId"]["analytics"]["$get"],
	200
>

const useGetProjectAnalytics = ({ projectId }: UseGetProjectAnalyticsProps) => {
	const query = useQuery({
		queryKey: ["project-analytics", projectId],
		queryFn: async () => {
			const response = await client.api.projects[":projectId"]["analytics"].$get({
				param: { projectId },
			})

			if (!response.ok) {
				throw new Error("Failed to fetch project analytics")
			}

			return extractDataFromResponse<IProjectAnalytics>(await response.json())

		},
	})

	return query
}

export default useGetProjectAnalytics
