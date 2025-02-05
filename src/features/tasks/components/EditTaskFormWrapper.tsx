import { Loader } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import useGetProjects from "@/features/projects/api/useGetProjects"
import useGetMembers from "@/features/members/api/useGetMembers"
import { EditTaskForm } from "./EditTaskForm"
import useGetTask from "../api/useGetTask"

interface EditTaskFormWrapperProps {
	onCancel: () => void
	id: string
}

const EditTaskFormWrapper = ({ onCancel, id }: EditTaskFormWrapperProps) => {
	const workspaceId = useWorkspaceId()

	const { data: initialValues, isLoading: isLoadingTask } = useGetTask({
		taskId: id,
	})

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

	const isLoading = isLoadingProjects || isLoadingMembers || isLoadingTask

	if (isLoading) {
		return (
			<Card className="w-full h-[714px] border-none shadow-none">
				<CardContent className="flex items-center justify-center h-full">
					<Loader className="size-5 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		)
	}

	if (!initialValues) {
		return null
	}

	return (
		<EditTaskForm
			onCancel={onCancel}
			initialValues={initialValues}
			projectOptions={projectOptions ?? []}
			memberOptions={memberOptions ?? []}
		/>
	)
}

export default EditTaskFormWrapper
