import { authGuard } from "@/features/auth/utils"
import { getWorkspaces } from "@/features/workspaces/service/queries"
import { redirect } from "next/navigation"

export default async function Home() {
	const user = await authGuard()

	const workspaces = await getWorkspaces(String(user._id))

	if (!workspaces || !workspaces.total || !workspaces.documents.length) {
		redirect("/workspaces/create")
	} else {
		redirect(`/workspaces/${workspaces.documents[0]._id}`)
	}
}
