"use client"

import { PageLoader } from "@/components/PageLoader"
import useGetMembers from "@/features/members/api/useGetMembers"
import MemberList from "@/features/workspaces/components/MemberList"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"

const WorkspaceIdMemberClient = () => {
	const workspaceId = useWorkspaceId()
	const { data, isLoading } = useGetMembers({ workspaceId })

	if (isLoading) {
		return <PageLoader />
	}

	return (
		<div className="w-full lg:max-w-xl">
			<MemberList data={data} />
		</div>
	)
}

export default WorkspaceIdMemberClient
