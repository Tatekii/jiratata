import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

const useGetWorkspaces = () => {
	const dic = useDictionary()
	const query = useQuery({
		queryKey: ["workspaces"],
		queryFn: async () => {
			const response = await client.api.workspaces.$get()

			if (!response.ok) {
				throw new Error(dic.workspaces.fetch.error)
			}

			const { data } = await response.json()

			return data
		},
	})

	return query
}

export default useGetWorkspaces
