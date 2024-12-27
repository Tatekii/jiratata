import { FolderIcon, ListChecksIcon, UserIcon } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ETaskStatus } from "@/features/types"
import useGetMembers from "@/features/members/api/useGetMembers"
import useGetProjects from "@/features/projects/api/useGetProjects"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import useTaskFilters from "../hooks/useTaskFilters"
import DatePicker from "@/components/DatePicker"
import { useDictionary } from "@/context/DictionaryProvider"

interface DataFiltersProps {
	hideProjectFilter?: boolean
}

const DataFilters = ({ hideProjectFilter }: DataFiltersProps) => {
	const workspaceId = useWorkspaceId()
	const dic = useDictionary()

	const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })
	const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

	const isLoading = isLoadingProjects || isLoadingMembers

	const projectOptions = projects?.documents.map((project) => ({
		value: project.$id,
		label: project.name,
	}))

	const memberOptions = members?.documents.map((member) => ({
		value: member.$id,
		label: member.name,
	}))

	const [{ status, assigneeId, projectId, dueDate }, setFilters] = useTaskFilters()

	const onStatusChange = (value: string) => {
		setFilters({ status: value === "all" ? null : (value as ETaskStatus) })
	}

	const onAssigneeChange = (value: string) => {
		setFilters({ assigneeId: value === "all" ? null : (value as string) })
	}

	const onProjectChange = (value: string) => {
		setFilters({ projectId: value === "all" ? null : (value as string) })
	}

	if (isLoading) return null

	return (
		<div className="flex flex-col lg:flex-row gap-2">
			<Select defaultValue={status ?? "all"} onValueChange={(value) => onStatusChange(value)}>
				<SelectTrigger className="w-full lg:w-auto h-8">
					<div className="flex items-center pr-2">
						<ListChecksIcon className="size-4 mr-2" />
						<SelectValue placeholder={dic.tasks.form.status} />
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{dic.tasks.filter.allstatus}</SelectItem>
					<SelectSeparator />
					<SelectItem value={ETaskStatus.BACKLOG}>{dic.tasks.status.backlog}</SelectItem>
					<SelectItem value={ETaskStatus.IN_PROGRESS}>{dic.tasks.status.inprogress}</SelectItem>
					<SelectItem value={ETaskStatus.IN_REVIEW}>{dic.tasks.status.inreview}</SelectItem>
					<SelectItem value={ETaskStatus.TODO}>{dic.tasks.status.todo}</SelectItem>
					<SelectItem value={ETaskStatus.DONE}>{dic.tasks.status.done}</SelectItem>
				</SelectContent>
			</Select>
			<Select defaultValue={assigneeId ?? 'all'} onValueChange={(value) => onAssigneeChange(value)}>
				<SelectTrigger className="w-full lg:w-auto h-8">
					<div className="flex items-center pr-2">
						<UserIcon className="size-4 mr-2" />
						<SelectValue placeholder={dic.tasks.form.assign} />
					</div>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{dic.tasks.filter.allassignees}</SelectItem>
					<SelectSeparator />
					{memberOptions?.map((member) => (
						<SelectItem key={member.value} value={member.value}>
							{member.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{!hideProjectFilter && (
				<Select defaultValue={projectId ?? 'all'} onValueChange={(value) => onProjectChange(value)}>
					<SelectTrigger className="w-full lg:w-auto h-8">
						<div className="flex items-center pr-2">
							<FolderIcon className="size-4 mr-2" />
							<SelectValue placeholder={dic.tasks.form.project} />
						</div>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{dic.tasks.filter.allprojects}</SelectItem>
						<SelectSeparator />
						{projectOptions?.map((project) => (
							<SelectItem key={project.value} value={project.value}>
								{project.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
			<DatePicker
				placeholder={dic.tasks.filter.duedate}
				className="h-8 w-full lg:w-auto"
				value={dueDate ? new Date(dueDate) : undefined}
				onChange={(date) => {
					setFilters({ dueDate: date ? date.toISOString() : null })
				}}
			/>
		</div>
	)
}

export default DataFilters
