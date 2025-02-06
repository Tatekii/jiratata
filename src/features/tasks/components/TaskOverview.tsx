import { PencilIcon } from "lucide-react"
import useEditTaskModal from "../hooks/useEditTaskModal"
import { TTask } from "@/features/types"
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/context/DictionaryProvider"
import { DottedSeparator } from "@/components/DottedSeparator"
import { snakeCaseToTitleCase } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import TaskDate from "./TaskDate"
import MemberAvatar from "@/features/members/components/MemberAvatar"

interface TaskOverviewProps {
	task: TTask
}

const TaskOverview = ({ task }: TaskOverviewProps) => {
	const { open } = useEditTaskModal()
	const dic = useDictionary()

	return (
		<div className="flex flex-col gap-y-4 col-span-1">
			<div className="bg-muted rounded-lg p-4">
				<div className="flex items-center justify-between">
					<p className="text-lg font-semibold">{dic.tasks.overview.title}</p>
					<Button onClick={() => open(task.$id)} size="sm" variant="secondary">
						<PencilIcon className="size-4 mr-2" />
						{dic.edit}
					</Button>
				</div>
				<DottedSeparator className="my-4" />
				<div className="flex flex-col gap-y-4">
					<OverviewProperty label="Assignee">
						<MemberAvatar name={task.assignee.name} className="size-6" />
						<p className="text-sm font-medium">{task.assignee.name}</p>
					</OverviewProperty>
					<OverviewProperty label="Due Date">
						<TaskDate value={task.dueDate} className="text-sm font-medium" />
					</OverviewProperty>
					<OverviewProperty label="Status">
						<Badge variant={task.status}>{snakeCaseToTitleCase(task.status)}</Badge>
					</OverviewProperty>
				</div>
			</div>
		</div>
	)
}

export default TaskOverview

interface OverviewPropertyProps {
	label: string
	children: React.ReactNode
}

export const OverviewProperty = ({ label, children }: OverviewPropertyProps) => {
	return (
		<div className="flex items-start gap-x-2">
			<div className="min-w-[100px]">
				<p className="text-sm text-muted-foreground">{label}</p>
			</div>
			<div className="flex items-center gap-x-2">{children}</div>
		</div>
	)
}
