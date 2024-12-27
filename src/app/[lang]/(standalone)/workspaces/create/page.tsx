import CreateWorkspaceForm from "@/features/workspaces/components/CreateWorkspaceForm"
import { authGuard } from "@/features/auth/utils"

const WorkspaceCreatePage = async () => {
	await authGuard()

	return (
		<div className="w-full lg:max-w-xl">
			<CreateWorkspaceForm />
		</div>
	)
}

export default WorkspaceCreatePage
