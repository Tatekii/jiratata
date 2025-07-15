"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateTask } from "../api/useUpdateTask"
import { buildUpdateTaskSchema } from "../schemas"
import { useDictionary } from "@/context/DictionaryProvider"
import { ETaskStatus, ETaskPriority, ETaskType, IClientTaskWithDetail } from "@/features/types"
import { DottedSeparator } from "@/components/DottedSeparator"
import DatePicker from "@/components/DatePicker"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import { useMemo } from "react"
import { IClientMemberWithUserInfo } from "@/features/members/utils"

interface EditTaskFormProps {
	onCancel?: () => void
	// NOTE: Project cannot be changed during editing
	// projectOptions: { id: string; name: string; image?: string }[]
	initialValues: IClientTaskWithDetail
	memberOptions?: IClientMemberWithUserInfo[] // Workspace members
	availableTasks?: IClientTaskWithDetail[] // Available parent task options
}

export const EditTaskForm = ({
	onCancel,
	memberOptions,
	initialValues,
	availableTasks,
}: // projectOptions,
EditTaskFormProps) => {
	const { mutate, isPending } = useUpdateTask()

	const dic = useDictionary()
	const updateTaskSchema = useMemo(() => {
		return buildUpdateTaskSchema(dic)
	}, [dic])

	const form = useForm<z.infer<typeof updateTaskSchema>>({
		resolver: zodResolver(updateTaskSchema),
		defaultValues: {
			...initialValues,
		},
	})

	const onSubmit = (values: z.infer<typeof updateTaskSchema>) => {
		mutate(
			{ json: values, param: { taskId: initialValues._id } },
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
				<CardTitle className="text-xl font-bold">{dic.tasks.edit.title}</CardTitle>
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
										<FormLabel>{dic.tasks.form.name}</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Enter task name" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.description}</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder={dic.tasks.form.descriptionPlaceholder}
												className="resize-none"
												rows={3}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>							<FormField
								control={form.control}
								name="dueDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.due}</FormLabel>
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
							<FormField
								control={form.control}
								name="assigneeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.assign}</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select assignee" />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												{memberOptions?.map((member) => (
													<SelectItem key={member._id} value={member._id}>
														<div className="flex items-center gap-x-2">
															<MemberAvatar className="size-6" name={member.user.name} />
															{member.user.name}
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
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.status}</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												<SelectItem value={ETaskStatus.BACKLOG}>Backlog</SelectItem>
												<SelectItem value={ETaskStatus.IN_PROGRESS}>In Progress</SelectItem>
												<SelectItem value={ETaskStatus.IN_REVIEW}>In Review</SelectItem>
												<SelectItem value={ETaskStatus.TODO}>Todo</SelectItem>
												<SelectItem value={ETaskStatus.DONE}>Done</SelectItem>
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-x-4">
								<FormField
									control={form.control}
									name="priority"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{dic.tasks.form.priority}</FormLabel>
											<Select defaultValue={field.value} onValueChange={field.onChange}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={dic.tasks.form.priorityPlaceholder} />
													</SelectTrigger>
												</FormControl>
												<FormMessage />
												<SelectContent>
													<SelectItem value={ETaskPriority.HIGHEST}>{dic.tasks.priority.highest}</SelectItem>
													<SelectItem value={ETaskPriority.HIGH}>{dic.tasks.priority.high}</SelectItem>
													<SelectItem value={ETaskPriority.MEDIUM}>{dic.tasks.priority.medium}</SelectItem>
													<SelectItem value={ETaskPriority.LOW}>{dic.tasks.priority.low}</SelectItem>
													<SelectItem value={ETaskPriority.LOWEST}>{dic.tasks.priority.lowest}</SelectItem>
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
											<FormLabel>{dic.tasks.form.taskType}</FormLabel>
											<Select defaultValue={field.value} onValueChange={field.onChange}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={dic.tasks.form.taskTypePlaceholder} />
													</SelectTrigger>
												</FormControl>
												<FormMessage />
												<SelectContent>
													<SelectItem value={ETaskType.TASK}>{dic.tasks.type.task}</SelectItem>
													<SelectItem value={ETaskType.BUG}>{dic.tasks.type.bug}</SelectItem>
													<SelectItem value={ETaskType.STORY}>{dic.tasks.type.story}</SelectItem>
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="parentTaskId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.parentTask}</FormLabel>
										<Select value={field.value || ""} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={dic.tasks.form.parentTaskPlaceholder} />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												<SelectItem value=" ">{dic.tasks.form.noParentTask}</SelectItem>
												{availableTasks?.map((task) => (
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
							<div className="grid grid-cols-3 gap-x-4">
								<FormField
									control={form.control}
									name="estimatedHours"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{dic.tasks.form.estimatedHours}</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													min="0"
													step="0.5"
													placeholder="0"
													onChange={(e) =>
														field.onChange(
															e.target.value ? parseFloat(e.target.value) : undefined
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="loggedHours"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{dic.tasks.form.loggedHours}</FormLabel>
											<FormControl>
												<Input
													value={field.value || ""}
													type="number"
													min="0"
													step="0.5"
													placeholder="0"
													onChange={(e) =>
														field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
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
								{dic.submit}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}
