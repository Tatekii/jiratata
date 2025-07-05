import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { extractDataFromResponse } from "@/lib/utils"
import { IClientWorkspace } from "@/features/types"

interface UseGetWorkspaceInfoProps {
	workspaceId: string
}

export const useGetWorkspaceInfo = ({ workspaceId }: UseGetWorkspaceInfoProps) => {
	const dic = useDictionary()

	const query = useQuery({
		queryKey: ["workspace-info", workspaceId],
		queryFn: async () => {
			const response = await client.api.workspaces[":workspaceId"]["info"].$get({
				param: { workspaceId },
			})

			if (!response.ok) {
				throw new Error(dic.workspaces.fetch.error)
			}

			return extractDataFromResponse<IClientWorkspace>(await response.json())
		},
	})

	return query
}
