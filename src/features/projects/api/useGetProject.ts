import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

interface UseGetProjectProps {
	projectId: string
}

const useGetProject = ({ projectId }: UseGetProjectProps) => {
	const dic = useDictionary()
	const query = useQuery({
		queryKey: ["project", projectId],
		queryFn: async () => {
			const response = await client.api.projects[":projectId"].$get({
				param: { projectId },
			})

			if (!response.ok) {
				throw new Error(dic.projects.fetch.error)
			}

			const { data } = await response.json()

			return data
		},
	})

	return query
}

export default useGetProject
