import { getCurrent } from "@/features/auth/service/queries"
import { getWorkspaces } from "@/features/workspaces/service/queries"
import { redirect } from "next/navigation"

export default async function Home() {
	const user = await getCurrent()
	if (!user) {
		redirect("/signin")
	}

	const workspaces = await getWorkspaces()

	if (!workspaces || !workspaces.total || !workspaces.documents.length) {
		redirect("/workspaces/create")
	} else {
		redirect(`/workspaces/${workspaces.documents[0].$id}`)
	}
}
