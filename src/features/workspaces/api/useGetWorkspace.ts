import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

interface UseGetWorkspaceProps {
	workspaceId: string
}

const useGetWorkspace = ({ workspaceId }: UseGetWorkspaceProps) => {
	const dic = useDictionary()

	const query = useQuery({
		queryKey: ["workspace", workspaceId],
		queryFn: async () => {
			const response = await client.api.workspaces[":workspaceId"].$get({
				param: { workspaceId },
			})

			if (!response.ok) {
				throw new Error(dic.workspaces.fetch.error)
			}

			const { data } = await response.json()

			return data
		},
	})

	return query
}

export default useGetWorkspace
