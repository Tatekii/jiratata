import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { extractDataFromResponse } from "@/lib/utils"
import { IClientDocuments, IClientProject } from "@/features/types"

interface UseGetProjectsProps {
	workspaceId: string
}

const useGetProjects = ({ workspaceId }: UseGetProjectsProps) => {
	const dic = useDictionary()
	const query = useQuery({
		queryKey: ["projects", workspaceId],
		queryFn: async () => {
			const response = await client.api.projects.$get({
				query: { workspaceId },
			})

			if (!response.ok) {
				throw new Error(dic.projects.fetch.error)
			}

			return extractDataFromResponse<IClientDocuments<IClientProject>>(await response.json())
		},
	})

	return query
}

export default useGetProjects
