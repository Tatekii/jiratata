import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

interface UseGetMembersProps {
	workspaceId: string
}

const useGetMembers = ({ workspaceId }: UseGetMembersProps) => {
	const dic = useDictionary()
	const query = useQuery({
		queryKey: ["members", workspaceId],
		queryFn: async () => {
			const response = await client.api.members.$get({ query: { workspaceId } })

			if (!response.ok) {
				throw new Error(dic.members.fetch.error)
			}

			const { data } = await response.json()

			return data
		},
	})

	return query
}

export default useGetMembers
