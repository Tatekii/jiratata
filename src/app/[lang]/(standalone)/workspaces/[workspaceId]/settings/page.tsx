import WorkspaceIdSettingsClient from "./client"
import { authGuard } from "@/features/auth/utils"

const WorkspaceIdSettingsPage = async () => {
	await authGuard()

	return <WorkspaceIdSettingsClient />
}

export default WorkspaceIdSettingsPage
