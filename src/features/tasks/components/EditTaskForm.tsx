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
	// NOTE 不允许中途切换项目
	// projectOptions: { id: string; name: string; image?: string }[]
	initialValues: IClientTaskWithDetail
	memberOptions?: IClientMemberWithUserInfo[] // 本工作区的成员
	availableTasks?: IClientTaskWithDetail[] // 可选择的父任务列表
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
										<FormLabel>描述</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="输入任务描述..."
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
										<FormLabel>父任务 (可选)</FormLabel>
										<Select value={field.value || ""} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="选择父任务..." />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												<SelectItem value=" ">无父任务</SelectItem>
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
											<FormLabel>预估工时（小时）</FormLabel>
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
											<FormLabel>已记录工时（小时）</FormLabel>
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
