"use client"

import Link from "next/link"
import { CalendarIcon, PlusIcon, SettingsIcon } from "lucide-react"
import { DottedSeparator } from "@/components/DottedSeparator"
import PageError from "@/components/PageError"
import { PageLoader } from "@/components/PageLoader"
import { Card, CardContent } from "@/components/ui/card"
import useGetMembers from "@/features/members/api/useGetMembers"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import { Button } from "@/components/ui/button"
import { TMember, TProject, TTask } from "@/features/types"
import { useDictionary } from "@/context/DictionaryProvider"
import useGetTasks from "@/features/tasks/api/useGetTasks"
import useGetProjects from "@/features/projects/api/useGetProjects"
import useGetWorkspaceAnalytics from "@/features/workspaces/api/useGetWorkSpaceAnalytics"
import useCreateTaskModal from "@/features/tasks/hooks/useCreateTaskModal"
import { formatDistanceToNow } from "date-fns"
import useCreateProjectModal from "@/features/projects/hooks/useCreateProjectModal"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"
import Analytics from "@/components/Analystics"

const WorkspaceIdClient = () => {
	const workspaceId = useWorkspaceId()
	const dic = useDictionary()

	const { data: analytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId })
	const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId })
	const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })
	const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

	const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingProjects || isLoadingMembers

	if (isLoading) {
		return <PageLoader />
	}

	if (!analytics || !tasks || !projects || !members) {
		return <PageError message={dic.workspaces.fetch.error} />
	}

	return (
		<div className="h-full flex flex-col space-y-4">
			<Analytics data={analytics} />
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
				<TaskList data={tasks.documents} total={tasks.total} />
				<ProjectList data={projects.documents} total={projects.total} />
				<MembersList data={members.documents} total={members.total} />
			</div>
		</div>
	)
}

interface MembersListProps {
	data: TMember[]
	total: number
}

export const MembersList = ({ data, total }: MembersListProps) => {
	const workspaceId = useWorkspaceId()
	const dic = useDictionary()

	return (
		<div className="flex flex-col gap-y-4 col-span-1">
			<div className="bg-white border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<p className="text-lg font-semibold">
						{dic.members.name} ({total})
					</p>
					<Button asChild variant="secondary" size="icon">
						<Link href={`/workspaces/${workspaceId}/members`}>
							<SettingsIcon className="size-4" />
						</Link>
					</Button>
				</div>
				<DottedSeparator className="my-4" />
				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{data.map((member) => (
						<li key={member.$id}>
							<Card className="shadow-none rounded-lg overflow-hidden">
								<CardContent className="p-3 flex flex-col items-center gap-x-2">
									<MemberAvatar className="size-12" name={member.name} />
									<div className="flex flex-col items-center overflow-hidden">
										<p className="text-lg font-medium line-clamp-1">{member.name}</p>
										<p className="text-sm text-muted-foreground line-clamp-1">{member.email}</p>
									</div>
								</CardContent>
							</Card>
						</li>
					))}
					<li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
						{dic.members.fetch.empty}
					</li>
				</ul>
			</div>
		</div>
	)
}

export default WorkspaceIdClient

interface TaskListProps {
	data: TTask[]
	total: number
}

export const TaskList = ({ data, total }: TaskListProps) => {
	const workspaceId = useWorkspaceId()
	const { open: createTask } = useCreateTaskModal()
	const dic = useDictionary()

	return (
		<div className="flex flex-col gap-y-4 col-span-1">
			<div className="bg-muted rounded-lg p-4">
				<div className="flex items-center justify-between">
					<p className="text-lg font-semibold">
						{dic.tasks.name} ({total})
					</p>
					<Button variant="muted" size="icon" onClick={createTask}>
						<PlusIcon className="size-4 text-neutral-400" />
					</Button>
				</div>
				<DottedSeparator className="my-4" />
				<ul className="flex flex-col gap-y-4">
					{data.map((task) => (
						<li key={task.$id}>
							<Link href={`/workspaces/${workspaceId}/tasks/${task.$id}`}>
								<Card className="shadow-none rounded-lg hover:opacity-75 transition">
									<CardContent className="p-4">
										<p className="text-lg font-medium truncate">{task.name}</p>
										<div className="flex items-center gap-x-2">
											<p>{task.project?.name}</p>
											<div className="size-1 rounded-full bg-neutral-300" />
											<div className="text-sm text-muted-foreground flex items-center">
												<CalendarIcon className="size-3 mr-1" />
												<span className="truncate">
													{formatDistanceToNow(new Date(task.dueDate))}
												</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						</li>
					))}
					<li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
						{dic.tasks.fetch.empty}
					</li>
				</ul>
				<Button variant="muted" className="mt-4 w-full" asChild>
					<Link href={`/workspaces/${workspaceId}/tasks`}>Show All</Link>
				</Button>
			</div>
		</div>
	)
}

interface ProjectListProps {
	data: TProject[]
	total: number
}

export const ProjectList = ({ data, total }: ProjectListProps) => {
	const workspaceId = useWorkspaceId()
	const { open: createProject } = useCreateProjectModal()
	const dic = useDictionary()

	return (
		<div className="flex flex-col gap-y-4 col-span-1">
			<div className="bg-white border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<p className="text-lg font-semibold">
						{dic.projects.name} ({total})
					</p>
					<Button variant="secondary" size="icon" onClick={createProject}>
						<PlusIcon className="size-4" />
					</Button>
				</div>
				<DottedSeparator className="my-4" />
				<ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{data.map((project) => (
						<li key={project.$id}>
							<Link href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
								<Card className="shadow-none rounded-lg hover:opacity-75 transition">
									<CardContent className="p-4 flex items-center gap-x-2.5">
										<ProjectAvatar
											className="size-12"
											fallbackClassName="text-lg"
											name={project.name}
											image={project.imageUrl}
										/>
										<p className="text-lg font-medium truncate">{project.name}</p>
									</CardContent>
								</Card>
							</Link>
						</li>
					))}
					<li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
						{dic.projects.fetch.empty}
					</li>
				</ul>
			</div>
		</div>
	)
}
