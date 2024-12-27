import { authGuard } from "@/features/auth/utils"
// import WorkspaceIdClient from "./client"

const WorkspaceIdPage = async () => {
	await authGuard()

	return <h1>FIXME </h1>

	// return <WorkspaceIdClient />
}

export default WorkspaceIdPage
