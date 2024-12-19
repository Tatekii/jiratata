"use client"

import { PageLoader } from "@/components/PageLoader"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import JoinWorkspaceForm from "@/features/workspaces/components/JoinWorkspaceForm"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/useGetWorkspaceInfo"
import PageNotFound from "@/components/PageNotFound"

export const WorkspaceIdJoinClient = () => {
	const workspaceId = useWorkspaceId()
	const { data: initialValues, isLoading } = useGetWorkspaceInfo({ workspaceId })

	if (isLoading) {
		return <PageLoader />
	}

	if (!initialValues) {
		return <PageNotFound />
	}

	return (
		<div className="w-full lg:max-w-xl">
			<JoinWorkspaceForm initialValues={initialValues} />
		</div>
	)
}
