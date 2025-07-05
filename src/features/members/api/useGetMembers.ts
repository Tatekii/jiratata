import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/rpc"
import { useDictionary } from "@/context/DictionaryProvider"
import { extractDataFromResponse } from "@/lib/utils"
import { IClientDocuments } from "@/features/types"
import { IClientMemberWithUserInfo } from "../utils"

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

			return extractDataFromResponse<IClientDocuments<IClientMemberWithUserInfo>>(await response.json())
		},
	})

	return query
}

export default useGetMembers
