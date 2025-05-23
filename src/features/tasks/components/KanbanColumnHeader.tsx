import {
	CircleCheckIcon,
	CircleDashedIcon,
	CircleDotDashedIcon,
	CircleDotIcon,
	CircleIcon,
} from "lucide-react"

import { snakeCaseToTitleCase } from "@/lib/utils"
import { ETaskStatus } from "@/features/types"
// import useCreateTaskModal from "../hooks/useCreateTaskModal"

interface KanbanColumnHeaderProps {
	board: ETaskStatus
	taskCount: number
}

const statusIconMap: Record<ETaskStatus, React.ReactNode> = {
	[ETaskStatus.BACKLOG]: <CircleDashedIcon className="size-[18px] text-pink-400" />,
	[ETaskStatus.TODO]: <CircleIcon className="size-[18px] text-red-400" />,
	[ETaskStatus.IN_PROGRESS]: <CircleDotDashedIcon className="size-[18px] text-yellow-400" />,
	[ETaskStatus.IN_REVIEW]: <CircleDotIcon className="size-[18px] text-blue-400" />,
	[ETaskStatus.DONE]: <CircleCheckIcon className="size-[18px] text-emerald-400" />,
}

const KanbanColumnHeader = ({ board, taskCount }: KanbanColumnHeaderProps) => {
	// const { open } = useCreateTaskModal()

	const icon = statusIconMap[board]

	return (
		<div className="px-2 py-1.5 flex items-center justify-between">
			<div className="flex items-center gap-x-2">
				{icon}
				<h2 className="text-sm font-medium">{snakeCaseToTitleCase(board)}</h2>
			</div>
			{/* <Button onClick={open} variant="ghost" size="icon" className="size-5">
				<PlusIcon className="size-4 text-neutral-500" />
			</Button> */}
			<div className="size-5 flex items-center justify-center rounded-md bg-neutral-200 text-xs text-neutral-700 font-medium">
				{taskCount}
			</div>
		</div>
	)
}

export default KanbanColumnHeader
