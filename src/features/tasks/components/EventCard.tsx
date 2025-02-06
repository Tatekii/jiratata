import React from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { ETaskStatus, TMember, TProject } from "@/features/types"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"

interface EventCardProps {
	title: string
	assignee: TMember
	project: TProject
	status: ETaskStatus
	id: string
}

const statusColorMap: Record<ETaskStatus, string> = {
	[ETaskStatus.BACKLOG]: "border-l-pink-500",
	[ETaskStatus.TODO]: "border-l-red-500",
	[ETaskStatus.IN_PROGRESS]: "border-l-yellow-500",
	[ETaskStatus.IN_REVIEW]: "border-l-blue-500",
	[ETaskStatus.DONE]: "border-l-emerald-500",
}

const EventCard = ({ title, assignee, project, status, id }: EventCardProps) => {
	const workspaceId = useWorkspaceId()
	const router = useRouter()

	const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation()

		router.push(`/workspaces/${workspaceId}/tasks/${id}`)
	}

	return (
		<div className="px-2">
			<div
				onClick={onClick}
				className={cn(
					"p-1.5 text-xs bg-white text-primary border rounded-md border-l-4 flex flex-col gap-y-1.5 cursor-pointer hover:opacity-75 transition",
					statusColorMap[status]
				)}
			>
				<p>{title}</p>
				<div className="flex items-center gap-x-1">
					<MemberAvatar name={assignee?.name} />
					<div className="size-1 rounded-full bg-neutral-300" />
					<ProjectAvatar name={project?.name} image={project?.imageUrl} />
				</div>
			</div>
		</div>
	)
}

export default EventCard
