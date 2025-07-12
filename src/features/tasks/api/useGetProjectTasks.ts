import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/rpc"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"

interface UseGetProjectTasksProps {
	projectId?: string
}

export const useGetProjectTasks = ({ projectId }: UseGetProjectTasksProps) => {
	const workspaceId = useWorkspaceId()

	const query = useQuery({
		queryKey: ["project-tasks", workspaceId, projectId],
		queryFn: async () => {
			if (!projectId || !workspaceId) return { data: { tasks: [] } }

			const response = await client.api.tasks.$get({
				query: {
					workspaceId,
					projectId,
				},
			})

			if (!response.ok) {
				throw new Error("Failed to fetch project tasks")
			}

			const { data } = await response.json()
			return data
		},
		enabled: !!workspaceId && !!projectId,
	})

	return query
}
