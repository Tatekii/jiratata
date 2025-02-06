"use client"
import useGetProjects from "@/features/projects/api/useGetProjects"
import useCreateProjectModal from "@/features/projects/hooks/useCreateProjectModal"
import TaskViewSwitcher from "@/features/tasks/components/TaskViewSwitcher"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import { useEffect } from "react"
import { AiOutlineLoading } from "react-icons/ai"

const TasksClient = () => {
	const workspaceId = useWorkspaceId()
	const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })

	const { open, isOpen } = useCreateProjectModal()
	// const router = useRouter()

	useEffect(() => {
		if (projects && !projects?.total && !isOpen) {
			open()
		}
	}, [projects])

	if (isLoadingProjects) {
		return <AiOutlineLoading className="size-5 text-neutral-500 animate-spin " />
	}

	return (
		<div className="h-full flex flex-col">
			<TaskViewSwitcher />
		</div>
	)
}

export default TasksClient
