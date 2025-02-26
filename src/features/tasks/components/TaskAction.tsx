import { useRouter } from "next/navigation"
import { ExternalLinkIcon, PencilIcon, TrashIcon } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"

import useConfirm from "@/hooks/useConfirm"
import useDeleteTask from "../api/useDeleteTask"
import useEditTaskModal from "../hooks/useEditTaskModal"
import { useDictionary } from "@/context/DictionaryProvider"

interface TaskActionsProps {
	id: string
	projectId: string
	children: React.ReactNode
}

const TaskActions = ({ id, projectId, children }: TaskActionsProps) => {
	const workspaceId = useWorkspaceId()
	const router = useRouter()

	const dic = useDictionary()

	const { open } = useEditTaskModal()

	const [ConfirmDialog, confirm] = useConfirm("Delete task", "This action cannot be undone.", "destructive")
	const { mutate, isPending } = useDeleteTask()

	const onDelete = async () => {
		const ok = await confirm()
		if (!ok) return

		mutate({ param: { taskId: id } })
	}

	const onOpenTask = () => {
		router.push(`/workspaces/${workspaceId}/tasks/${id}`)
	}

	const onOpenProject = () => {
		router.push(`/workspaces/${workspaceId}/projects/${projectId}`)
	}

	return (
		<div className="flex justify-end">
			<ConfirmDialog />
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem onClick={onOpenTask} className="font-medium p-[10px]">
						<ExternalLinkIcon className="size-4 mr-2 stroke-2" />
						{dic.tasks.jump.task}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onOpenProject} className="font-medium p-[10px]">
						<ExternalLinkIcon className="size-4 mr-2 stroke-2" />
						{dic.tasks.jump.project}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => open(id)} className="font-medium p-[10px]">
						<PencilIcon className="size-4 mr-2 stroke-2" />
						{dic.tasks.edit.title}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={onDelete}
						disabled={isPending}
						className="text-amber-700 focus:text-amber-700 font-medium p-[10px]"
					>
						<TrashIcon className="size-4 mr-2 stroke-2" />
						{dic.tasks.delete.title}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
export default TaskActions
