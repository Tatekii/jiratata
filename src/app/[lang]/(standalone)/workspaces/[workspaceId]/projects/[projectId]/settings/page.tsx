import { getCurrent } from "@/features/auth/service/queries"
import { redirect } from "next/navigation"
import ProjectIdSettingsClient from "./client"


const ProjectIdSettingsPage = async () => {
	const user = await getCurrent()
	if (!user) redirect("/signin")

	return <ProjectIdSettingsClient />
}

export default ProjectIdSettingsPage
