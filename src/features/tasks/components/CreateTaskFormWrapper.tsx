import { Loader } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import useGetMembers from "@/features/members/api/useGetMembers"
import useGetProjects from "@/features/projects/api/useGetProjects"
import CreateTaskForm from "./CreateTaskForm"



interface CreateTaskFormWrapperProps {
	onCancel: () => void
}

const CreateTaskFormWrapper = ({ onCancel }: CreateTaskFormWrapperProps) => {
	const workspaceId = useWorkspaceId()

	const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })
	const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

	const projectOptions = projects?.documents.map((project) => ({
		id: project.$id,
		name: project.name,
		imageUrl: project.imageUrl,
	}))

	const memberOptions = members?.documents.map((project) => ({
		id: project.$id,
		name: project.name,
	}))

	const isLoading = isLoadingProjects || isLoadingMembers

	if (isLoading) {
		return (
			<Card className="w-full h-[714px] border-none shadow-none">
				<CardContent className="flex items-center justify-center h-full">
					<Loader className="size-5 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		)
	}

	return (
		<CreateTaskForm onCancel={onCancel} projectOptions={projectOptions ?? []} memberOptions={memberOptions ?? []} />
	)
}

export default CreateTaskFormWrapper
