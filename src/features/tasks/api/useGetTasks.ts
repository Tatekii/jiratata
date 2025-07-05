import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { IClientDocuments, IClientTask, IClientTaskWithDetail, TaskStatusType } from "@/features/types"
import { useDictionary } from "@/context/DictionaryProvider"
import { extractDataFromResponse } from "@/lib/utils"

interface UseGetTasksProps {
	workspaceId: string
	projectId?: string | null
	status?: TaskStatusType | null
	search?: string | null
	assigneeId?: string | null
	dueDate?: string | null
}

const useGetTasks = ({ workspaceId, projectId, status, search, assigneeId, dueDate }: UseGetTasksProps) => {
	const dic = useDictionary()
	const query = useQuery({
		queryKey: ["tasks", workspaceId, projectId, status, search, assigneeId, dueDate],
		queryFn: async () => {
			const response = await client.api.tasks.$get({
				query: {
					workspaceId,
					projectId: projectId ?? undefined,
					status: status ?? undefined,
					assigneeId: assigneeId ?? undefined,
					search: search ?? undefined,
					dueDate: dueDate ?? undefined,
				},
			})

			if (!response.ok) {
				throw new Error(dic.tasks.fetch.error)
			}

			return extractDataFromResponse<IClientDocuments<IClientTaskWithDetail>>(await response.json())
		},
	})

	return query
}

export default useGetTasks
