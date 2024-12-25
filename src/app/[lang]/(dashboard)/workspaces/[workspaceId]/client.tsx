"use client"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"

const WorkspaceIdClient = () => {
	const workspaceId = useWorkspaceId()
	return <div>page for {workspaceId}</div>
}

export default WorkspaceIdClient
