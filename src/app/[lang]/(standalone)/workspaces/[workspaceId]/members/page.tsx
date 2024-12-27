import WorkspaceIdMemberClient from "./client"
import { authGuard } from "@/features/auth/utils"

const WorkspaceIdMembersPage = async () => {
	await authGuard()

	return <WorkspaceIdMemberClient />
}

export default WorkspaceIdMembersPage
