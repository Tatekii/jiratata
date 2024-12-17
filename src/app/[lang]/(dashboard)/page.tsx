import { getCurrent } from "@/features/auth/queries"
import CreateWorkspaceForm from "@/features/workspaces/components/CreateWorkspaceForm"
import { redirect } from "next/navigation"

export default async function Home() {
	
	const user = await getCurrent()
	if (!user) {
		redirect("/signin")
	}

	return (
		<>
			<CreateWorkspaceForm />
		</>
	)
}
