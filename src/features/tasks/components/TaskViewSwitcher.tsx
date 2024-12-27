"use client"

import { useQueryState } from "nuqs"
import { Loader, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DottedSeparator } from "@/components/DottedSeparator"

import DataFilters from "./DataFilters"

import useProjectId from "@/features/projects/hooks/useProjectId"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import useTaskFilters from "../hooks/useTaskFilters"
import { useDictionary } from "@/context/DictionaryProvider"

import useGetTasks from "../api/useGetTasks"
import useCreateTaskModal from "../hooks/useCreateTaskModal"

interface TaskViewSwitcherProps {
	hideProjectFilter?: boolean
}

const TaskViewSwitcher = ({ hideProjectFilter }: TaskViewSwitcherProps) => {
	const dic = useDictionary()

	const [{ status, assigneeId, projectId, dueDate }] = useTaskFilters()
	const [view, setView] = useQueryState("task-view", {
		defaultValue: "table",
	})

	const workspaceId = useWorkspaceId()
	const paramProjectId = useProjectId()
	const { open } = useCreateTaskModal()

	const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
		workspaceId,
		projectId: paramProjectId || projectId,
		assigneeId,
		status,
		dueDate,
	})

	return (
		<Tabs defaultValue={view} onValueChange={setView} className="flex-1 w-full border rounded-lg">
			<div className="h-full flex flex-col overflow-auto p-4">
				<div className="flex flex-col gap-y-2 lg:flex-row justify-between items-center">
					<TabsList className="w-full lg:w-auto">
						<TabsTrigger className="h-8 w-full lg:w-auto" value="table">
							{dic.tasks.table}
						</TabsTrigger>
						<TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
							{dic.tasks.kanban}
						</TabsTrigger>
						<TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
							{dic.tasks.calender}
						</TabsTrigger>
					</TabsList>
					<Button onClick={open} size="sm" className="w-full lg:w-auto">
						<PlusIcon className="size-4 mr-2" />
						{dic.tasks.create.name}
					</Button>
				</div>
				<DottedSeparator className="my-4" />
				<DataFilters hideProjectFilter={hideProjectFilter} />
				<DottedSeparator className="my-4" />
				{isLoadingTasks ? (
					<div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
						<Loader className="size-5 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						<TabsContent value="table" className="mt-0">
							{/* // TODO */}
							table
						</TabsContent>
						<TabsContent value="kanban" className="mt-0">
							{/* // TODO */}
							kanban
						</TabsContent>
						<TabsContent value="calendar" className="mt-0 h-full pb-4">
							{/* // TODO */}
							calender
						</TabsContent>
					</>
				)}
			</div>
		</Tabs>
	)
}

export default TaskViewSwitcher