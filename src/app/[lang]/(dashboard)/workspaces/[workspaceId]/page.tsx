import { authGuard } from "@/features/auth/utils"
import WorkspaceIdClient from "./client"
// import WorkspaceIdClient from "./client"

const WorkspaceIdPage = async () => {
	await authGuard()

	return <WorkspaceIdClient />
}

export default WorkspaceIdPage
