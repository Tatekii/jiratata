import { redirect } from "next/navigation"

import { getCurrent } from "@/features/auth/service/queries"
import WorkspaceIdSettingsClient from "./client"


const WorkspaceIdSettingsPage = async () => {
	const user = await getCurrent()
	if (!user) redirect("/signin")

	return <WorkspaceIdSettingsClient />
}

export default WorkspaceIdSettingsPage
