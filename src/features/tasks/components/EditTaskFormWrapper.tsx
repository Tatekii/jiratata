import { Loader } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import useGetMembers from "@/features/members/api/useGetMembers"
import { EditTaskForm } from "./EditTaskForm"
import useGetTask from "../api/useGetTask"
import useGetTasks from "../api/useGetTasks"
import { useMemo } from "react"

interface EditTaskFormWrapperProps {
	onCancel: () => void
	id: string
}

const EditTaskFormWrapper = ({ onCancel, id }: EditTaskFormWrapperProps) => {
	const workspaceId = useWorkspaceId()

	const { data: initialValues, isLoading: isLoadingTask } = useGetTask({
		taskId: id,
	})

	// const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })
	const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })
	const { data: allWorkspaceTasks, isLoading: isTasksLoading } = useGetTasks({ workspaceId })

	const isLoading = isLoadingMembers || isTasksLoading || isLoadingTask

	const tasks = useMemo(() => {
		return allWorkspaceTasks?.documents?.filter((t) => t.projectId === initialValues?.projectId && t._id !== initialValues._id)
	}, [allWorkspaceTasks, initialValues])

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
			memberOptions={members?.documents}
			availableTasks={tasks}
		/>
	)
}

export default EditTaskFormWrapper
