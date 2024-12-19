"use client"

import { PageLoader } from "@/components/PageLoader"
import PageNotFound from "@/components/PageNotFound"
import useGetWorkspace from "@/features/workspaces/api/useGetWorkspace"
import { EditWorkspaceForm } from "@/features/workspaces/components/EditWorkspaceForm"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"

const WorkspaceIdSettingsClient = () => {
	const workspaceId = useWorkspaceId()
	const { data: initialValues, isLoading } = useGetWorkspace({ workspaceId })

	if (isLoading) {
		return <PageLoader />
	}

	if (!initialValues) {
		return <PageNotFound />
	}

	return (
		<div className="w-full lg:max-w-xl">
			<EditWorkspaceForm initialValues={initialValues} />
		</div>
	)
}

export default WorkspaceIdSettingsClient
