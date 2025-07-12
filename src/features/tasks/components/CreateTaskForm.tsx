"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useDictionary } from "@/context/DictionaryProvider"
import { buildCreateTaskSchema } from "../schemas"
import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import { cn } from "@/lib/utils"
import { useCreateTask } from "../api/useCreateTask"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ETaskStatus, ETaskPriority, ETaskType, IClientProject } from "@/features/types"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import useProjectId from "@/features/projects/hooks/useProjectId"
import useGetTasks from "../api/useGetTasks"
import DatePicker from "@/components/DatePicker"

interface CreateTaskFormProps {
	onCancel?: () => void
	projectOptions: Pick<IClientProject, "_id" | "name" | "image">[]
	memberOptions?: { id: string; name: string }[] // 添加用户选择选项
}

const CreateTaskForm = ({ onCancel, projectOptions, memberOptions = [] }: CreateTaskFormProps) => {
	const workspaceId = useWorkspaceId()
	const projectId = useProjectId()
	const { mutate, isPending } = useCreateTask()

	const dic = useDictionary()
	const createTaskSchema = useMemo(() => {
		return buildCreateTaskSchema(dic)
	}, [dic])

	const form = useForm<z.infer<typeof createTaskSchema>>({
		resolver: zodResolver(createTaskSchema.omit({ workspaceId: true })),
		defaultValues: {
			workspaceId,
			projectId,
			status: ETaskStatus.TODO,
			priority: ETaskPriority.MEDIUM,
			taskType: ETaskType.TASK,
			estimatedHours: 0,
		},
	})

	// Watch the selected projectId to fetch its tasks for parent selection
	const selectedProjectId = form.watch("projectId")
	const { data: projectTasks } = useGetTasks({
		projectId: selectedProjectId,
		workspaceId,
	})

	const onSubmit = (values: z.infer<typeof createTaskSchema>) => {
		mutate(
			{ json: { ...values, workspaceId } },
			{
				onSuccess: () => {
					form.reset()
					onCancel?.()
				},
			}
		)
	}

	return (
		<Card className="w-full h-full border-none shadow-none">
			<CardHeader className="flex p-7">
				<CardTitle className="text-xl font-bold">{dic.tasks.create.name}</CardTitle>
			</CardHeader>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="flex flex-col gap-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.name}</FormLabel>
										<FormControl>
											<Input {...field} placeholder={dic.tasks.form.entername} className="h-12" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>							<FormField
								control={form.control}
								name="dueDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>到期日期</FormLabel>
										<FormControl>
											<DatePicker
												{...field}
												value={field.value ? new Date(field.value) : undefined}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-x-4">
								<FormField
									control={form.control}
									name="priority"
									render={({ field }) => (
										<FormItem>
											<FormLabel>优先级</FormLabel>
											<Select defaultValue={field.value} onValueChange={field.onChange}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="选择优先级" />
													</SelectTrigger>
												</FormControl>
												<FormMessage />
												<SelectContent>
													<SelectItem value={ETaskPriority.HIGHEST}>最高</SelectItem>
													<SelectItem value={ETaskPriority.HIGH}>高</SelectItem>
													<SelectItem value={ETaskPriority.MEDIUM}>中</SelectItem>
													<SelectItem value={ETaskPriority.LOW}>低</SelectItem>
													<SelectItem value={ETaskPriority.LOWEST}>最低</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>状态</FormLabel>
											<Select defaultValue={field.value} onValueChange={field.onChange}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="选择状态" />
													</SelectTrigger>
												</FormControl>
												<FormMessage />
												<SelectContent>
													<SelectItem value={ETaskStatus.BACKLOG}>待办</SelectItem>
													<SelectItem value={ETaskStatus.TODO}>待做</SelectItem>
													<SelectItem value={ETaskStatus.IN_PROGRESS}>进行中</SelectItem>
													<SelectItem value={ETaskStatus.IN_REVIEW}>审核中</SelectItem>
													<SelectItem value={ETaskStatus.DONE}>已完成</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="projectId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.project}</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={dic.select + "" + dic.tasks.form.project}
													/>
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												{projectOptions.map((project) => (
													<SelectItem key={project._id} value={project._id}>
														<div className="flex items-center gap-x-2">
															<ProjectAvatar
																className="size-6"
																name={project.name}
																image={project.image}
															/>
															{project.name}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="assigneeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>分配给</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="选择分配人员..." />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												{memberOptions.map((member) => (
													<SelectItem key={member.id} value={member.id}>
														{member.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="taskType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>任务类型</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="选择类型" />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												<SelectItem value={ETaskType.TASK}>任务</SelectItem>
												<SelectItem value={ETaskType.BUG}>缺陷</SelectItem>
												<SelectItem value={ETaskType.STORY}>用户故事</SelectItem>
												<SelectItem value={ETaskType.SUBTASK}>子任务</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="parentTaskId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>父任务 (可选)</FormLabel>
										<Select value={field.value || ""} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="选择父任务..." />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												<SelectItem value="-1">无父任务</SelectItem>
												{projectTasks?.documents.map((task) => (
													<SelectItem key={task._id} value={task._id}>
														<div className="flex items-center gap-x-2">
															<span className="text-xs text-muted-foreground">
																#{task._id.slice(-6)}
															</span>
															<span className="truncate">{task.name}</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
						</div>
						<DottedSeparator className="py-7" />
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>任务描述</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="请输入任务描述"
											className="resize-none"
											rows={4}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="estimatedHours"
							render={({ field }) => (
								<FormItem>
									<FormLabel>预估工时（小时）</FormLabel>
									<FormControl>
										<Input {...field} type="number" min="0" step="0.5" placeholder="0" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DottedSeparator className="py-7" />
						<div className="flex items-center justify-between">
							<Button
								type="button"
								size="lg"
								variant="secondary"
								onClick={onCancel}
								disabled={isPending}
								className={cn(!onCancel && "invisible")}
							>
								{dic.cancel}
							</Button>
							<Button disabled={isPending} type="submit" size="lg">
								{dic.tasks.create.name}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}

export default CreateTaskForm
