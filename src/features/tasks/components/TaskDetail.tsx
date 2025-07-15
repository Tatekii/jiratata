"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	Calendar,
	Clock,
	Flag,
	MessageCircle,
	Paperclip,
	Activity,
	Edit,
	MoreHorizontal,
	CheckCircle,
	Circle,
	AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

import { IClientTaskWithDetail, ETaskStatus, ETaskPriority, ETaskType } from "@/features/types"
import { TaskComments } from "./TaskComments"
import { TaskAttachments } from "./TaskAttachments"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"
import useEditTaskModal from "../hooks/useEditTaskModal"
import { useDictionary } from "@/context/DictionaryProvider"

interface TaskDetailProps {
	task: IClientTaskWithDetail
}

export const TaskDetail = ({ task }: TaskDetailProps) => {
	const [activeTab, setActiveTab] = useState("overview")

	const { open } = useEditTaskModal()
	const dic = useDictionary()

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case ETaskPriority.HIGHEST:
				return "text-red-600 bg-red-50 border-red-200"
			case ETaskPriority.HIGH:
				return "text-orange-600 bg-orange-50 border-orange-200"
			case ETaskPriority.MEDIUM:
				return "text-yellow-600 bg-yellow-50 border-yellow-200"
			case ETaskPriority.LOW:
				return "text-blue-600 bg-blue-50 border-blue-200"
			case ETaskPriority.LOWEST:
				return "text-gray-600 bg-gray-50 border-gray-200"
			default:
				return "text-gray-600 bg-gray-50 border-gray-200"
		}
	}

	const getPriorityIcon = (priority: string) => {
		switch (priority) {
			case ETaskPriority.HIGHEST:
				return <Flag className="w-4 h-4 text-red-600" />
			case ETaskPriority.HIGH:
				return <Flag className="w-4 h-4 text-orange-600" />
			case ETaskPriority.MEDIUM:
				return <Flag className="w-4 h-4 text-yellow-600" />
			case ETaskPriority.LOW:
				return <Flag className="w-4 h-4 text-blue-600" />
			case ETaskPriority.LOWEST:
				return <Flag className="w-4 h-4 text-gray-600" />
			default:
				return <Flag className="w-4 h-4 text-gray-600" />
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case ETaskStatus.DONE:
				return <CheckCircle className="w-4 h-4 text-green-600" />
			case ETaskStatus.IN_PROGRESS:
				return <Circle className="w-4 h-4 text-blue-600" />
			case ETaskStatus.IN_REVIEW:
				return <AlertCircle className="w-4 h-4 text-orange-600" />
			default:
				return <Circle className="w-4 h-4 text-gray-600" />
		}
	}

	const getTaskTypeLabel = (type: string) => {
		switch (type) {
			case ETaskType.BUG:
				return dic.tasks.type.bug
			case ETaskType.STORY:
				return dic.tasks.type.story
			case ETaskType.TASK:
			default:
				return dic.tasks.type.task
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case ETaskStatus.TODO:
				return dic.tasks.status.todoStatus
			case ETaskStatus.IN_PROGRESS:
				return dic.tasks.status.inProgressStatus
			case ETaskStatus.IN_REVIEW:
				return dic.tasks.status.inReviewStatus
			case ETaskStatus.DONE:
				return dic.tasks.status.doneStatus
			case ETaskStatus.BACKLOG:
				return dic.tasks.status.backlogStatus
			default:
				return status
		}
	}

	const getPriorityLabel = (priority: string) => {
		switch (priority) {
			case ETaskPriority.HIGHEST:
				return dic.tasks.priority.highest
			case ETaskPriority.HIGH:
				return dic.tasks.priority.high
			case ETaskPriority.MEDIUM:
				return dic.tasks.priority.medium
			case ETaskPriority.LOW:
				return dic.tasks.priority.low
			case ETaskPriority.LOWEST:
				return dic.tasks.priority.lowest
			default:
				return priority
		}
	}

	return (
		<div className="max-w-5xl mx-auto space-y-8">
			{/* Task header card - Top visual hierarchy */}
			<Card className="shadow-lg bg-gradient-to-br from-white to-gray-50/50">
				<CardHeader className="pb-6">
					<div className="flex items-start justify-between">
						<div className="space-y-3">
							{/* Task ID and type */}
							<div className="flex items-center gap-3">
								<Badge
									variant="outline"
									className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200"
								>
									{getTaskTypeLabel(task.taskType || ETaskType.TASK)}
								</Badge>
								<div className="flex items-center gap-2">
									<span className="text-xs text-gray-400 font-mono">ID:</span>
									<code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
										#{task._id.slice(-8)}
									</code>
								</div>
							</div>
							{/* Task title */}
							<h1 className="text-3xl font-bold text-gray-900 leading-tight max-w-2xl">{task.name}</h1>
						</div>
						{/* Action buttons */}
						<div className="flex items-center gap-3">
							<Button
								onClick={() => open(task._id)}
								size="sm"
								className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
							>
								<Edit className="w-4 h-4 mr-2" />
								{dic.tasks.edit.editTask}
							</Button>
							<Button variant="ghost" size="sm" className="hover:bg-gray-100">
								<MoreHorizontal className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-8">
					{/* Status indicators */}
					<div className="flex items-center gap-6 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-full bg-blue-50">{getStatusIcon(task.status)}</div>
							<div>
								<p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{dic.tasks.detail.statusLabel}</p>
								<Badge variant="secondary" className="mt-1 font-medium">
									{getStatusLabel(task.status)}
								</Badge>
							</div>
						</div>

						<div className="w-px h-12 bg-gray-200" />

						<div className="flex items-center gap-3">
							<div className="p-2 rounded-full bg-orange-50">
								{getPriorityIcon(task.priority || ETaskPriority.MEDIUM)}
							</div>
							<div>
								<p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{dic.tasks.detail.priority}</p>
								<Badge
									variant="outline"
									className={`mt-1 font-medium ${getPriorityColor(
										task.priority || ETaskPriority.MEDIUM
									)}`}
								>
									{getPriorityLabel(task.priority || ETaskPriority.MEDIUM)}
								</Badge>
							</div>
						</div>

						{/* Progress indicator */}
						{task.estimatedHours && task.loggedHours !== undefined && (
							<>
								<div className="w-px h-12 bg-gray-200" />
								<div className="flex items-center gap-3">
									<div className="p-2 rounded-full bg-green-50">
										<Clock className="w-4 h-4 text-green-600" />
									</div>
									<div>
										<p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
											{dic.tasks.detail.progress}
										</p>
										<div className="flex items-center gap-2 mt-1">
											<div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div
													className="h-full bg-green-500 transition-all duration-300"
													style={{
														width: `${Math.min(
															(task.loggedHours / task.estimatedHours) * 100,
															100
														)}%`,
													}}
												/>
											</div>
											<span className="text-xs font-medium text-gray-600">
												{Math.round((task.loggedHours / task.estimatedHours) * 100)}%
											</span>
										</div>
									</div>
								</div>
							</>
						)}
					</div>

					{/* Task description */}
					<div className="space-y-3">
						<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<div className="w-1 h-5 bg-blue-500 rounded-full" />
							{dic.tasks.detail.taskDescription}
						</h3>
						<div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
							<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
								{task.description || dic.tasks.detail.noDescription}
							</p>
						</div>
					</div>

					{/* Core information grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Assignment info */}
						<Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-5">
								<div className="flex items-center justify-between mb-3">
									<h4 className="font-semibold text-gray-900">{dic.tasks.detail.assignee}</h4>
									<div className="p-1.5 rounded-full bg-blue-50">
										<MemberAvatar className="w-5 h-5" name={task.assignee?.name || dic.tasks.detail.unassigned} />
									</div>
								</div>
								{task.assignee ? (
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											<MemberAvatar className="w-8 h-8" name={task.assignee.name || "Unknown"} />
											<div>
												<p className="font-medium text-gray-900">{task.assignee.name}</p>
												<p className="text-xs text-gray-500">{task.assignee.email}</p>
											</div>
										</div>
									</div>
								) : (
									<p className="text-gray-400 italic">{dic.tasks.detail.notAssigned}</p>
								)}
							</CardContent>
						</Card>

						{/* Project info */}
						<Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-5">
								<div className="flex items-center justify-between mb-3">
									<h4 className="font-semibold text-gray-900">{dic.tasks.detail.project}</h4>
									<div className="p-1.5 rounded-full bg-green-50">
										<ProjectAvatar
											className="w-5 h-5"
											name={task.project?.name || dic.tasks.detail.noProject}
											image={task.project?.image}
										/>
									</div>
								</div>
								{task.project ? (
									<div className="flex items-center gap-3">
										<ProjectAvatar
											className="w-8 h-8"
											name={task.project.name}
											image={task.project.image}
										/>
										<div>
											<p className="font-medium text-gray-900">{task.project.name}</p>
											<p className="text-xs text-gray-500">
												{dic.tasks.detail.projectId}: {task.project._id.slice(-6)}
											</p>
										</div>
									</div>
								) : (
									<p className="text-gray-400 italic">{dic.tasks.detail.noRelatedProject}</p>
								)}
							</CardContent>
						</Card>

						{/* Time info */}
						<Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-5">
								<div className="flex items-center justify-between mb-3">
									<h4 className="font-semibold text-gray-900">{dic.tasks.detail.timeSchedule}</h4>
									<div className="p-1.5 rounded-full bg-orange-50">
										<Calendar className="w-5 h-5 text-orange-600" />
									</div>
								</div>
								<div className="space-y-3">
									{task.dueDate && (
										<div className="flex justify-between">
											<span className="text-sm text-gray-500">{dic.tasks.detail.dueTimeLabel}</span>
											<span className="text-sm font-medium">
												{new Date(task.dueDate).toLocaleDateString("zh-CN")}
											</span>
										</div>
									)}
									{!task.dueDate && (
										<p className="text-gray-400 italic text-sm">{dic.tasks.detail.timeNotSet}</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Work hours statistics */}
					<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
						<CardContent className="p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<Clock className="w-5 h-5 text-blue-600" />
								{dic.tasks.detail.hoursStatistics}
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600 mb-1">
										{task.estimatedHours || 0}h
									</div>
									<p className="text-sm text-gray-600">{dic.tasks.detail.estimatedHours}</p>
								</div>

								<div className="text-center">
									<div className="text-2xl font-bold text-green-600 mb-1">
										{task.loggedHours || 0}h
									</div>
									<p className="text-sm text-gray-600">{dic.tasks.detail.loggedHours}</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-orange-600 mb-1">
										{task.estimatedHours && task.loggedHours
											? Math.max(0, task.estimatedHours - task.loggedHours)
											: 0}
										h
									</div>
									<p className="text-sm text-gray-600">{dic.tasks.detail.remainingHours}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Hierarchy relationships */}
					{task.parentTask && (
						<Card className="bg-white border border-gray-100 shadow-sm">
							<CardContent className="p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
									<div className="w-1 h-5 bg-purple-500 rounded-full" />
									{dic.tasks.detail.taskHierarchy}
								</h3>
								<div>
									<p className="text-sm font-medium text-gray-500 mb-2">{dic.tasks.detail.parentTask}</p>
									<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
										{getStatusIcon(task.parentTask.status)}
										<div>
											<p className="font-medium">{task.parentTask.name}</p>
											<p className="text-xs text-gray-500">#{task.parentTask._id.slice(-6)}</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Metadata info */}
					<div className="border-t border-gray-200 pt-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-green-400 rounded-full" />
								<span>
									{dic.tasks.detail.createdAt}{" "}
									{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: zhCN })}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-blue-400 rounded-full" />
								<span>
									{dic.tasks.detail.updatedAt}{" "}
									{formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: zhCN })}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 
			{dic.tasks.detail.tabContent}
			{dic.tasks.detail.tabContentTodo}
			*/}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="comments">
						<MessageCircle className="w-4 h-4 mr-2" />
						{dic.tasks.detail.comments}
						{/* {task.comments && (
							<Badge variant="secondary" className="ml-2 text-xs">
								{task.comments.length}
							</Badge>
						)} */}
					</TabsTrigger>
					<TabsTrigger value="attachments">
						<Paperclip className="w-4 h-4 mr-2" />
						{dic.tasks.detail.attachments}
						{/* {task.attachments && (
							<Badge variant="secondary" className="ml-2 text-xs">
								{task.attachments.length}
							</Badge>
						)} */}
					</TabsTrigger>
					<TabsTrigger value="activity">
						<Activity className="w-4 h-4 mr-2" />
						{dic.tasks.detail.activity}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="comments" className="mt-6">
					<TaskComments taskId={task._id} />
				</TabsContent>

				<TabsContent value="attachments" className="mt-6">
					<TaskAttachments taskId={task._id} />
				</TabsContent>

				<TabsContent value="activity" className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Activity className="w-5 h-5" />
								{dic.tasks.detail.activityLog}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8 text-gray-500">
								<div className="flex justify-center">
									<Activity className="w-12 h-12 mb-2 opacity-30" />
								</div>
								<p>{dic.tasks.detail.activityLogComingSoon}</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
