import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"

interface UseGetTaskProps {
	taskId: string
}

const useGetTask = ({ taskId }: UseGetTaskProps) => {
	const dic = useDictionary()
	const query = useQuery({
		queryKey: ["task", taskId],
		queryFn: async () => {
			const response = await client.api.tasks[":taskId"].$get({
				param: {
					taskId,
				},
			})

			if (!response.ok) {
				throw new Error(dic.tasks.fetch.error)
			}

			const { data } = await response.json()

			return data
		},
	})

	return query
}

export default useGetTask
