import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { extractDataFromResponse } from "@/lib/utils"
import { IClientTask } from "@/features/types"

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

			return extractDataFromResponse<IClientTask>(await response.json())
		},
	})

	return query
}

export default useGetTask
