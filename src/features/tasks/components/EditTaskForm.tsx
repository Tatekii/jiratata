"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateTask } from "../api/useUpdateTask"
import { buildCreateTaskSchema } from "../schemas"
import { useDictionary } from "@/context/DictionaryProvider"
import { ETaskStatus, TTask } from "@/features/types"
import { DottedSeparator } from "@/components/DottedSeparator"
import DatePicker from "@/components/DatePicker"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"

interface EditTaskFormProps {
	onCancel?: () => void
	projectOptions: { id: string; name: string; imageUrl: string }[]
	memberOptions: { id: string; name: string }[]
	initialValues: TTask
}

export const EditTaskForm = ({ onCancel, projectOptions, memberOptions, initialValues }: EditTaskFormProps) => {
	const { mutate, isPending } = useUpdateTask()

	const dic = useDictionary()
	const createTaskSchema = buildCreateTaskSchema(dic)

	const form = useForm<z.infer<typeof createTaskSchema>>({
		resolver: zodResolver(createTaskSchema.omit({ workspaceId: true, description: true })),
		defaultValues: {
			...initialValues,
			dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : undefined,
		},
	})

	const onSubmit = (values: z.infer<typeof createTaskSchema>) => {
		mutate(
			{ json: values, param: { taskId: initialValues.$id } },
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
								name="dueDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.due}</FormLabel>
										<FormControl>
											<DatePicker {...field} />
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
												{memberOptions.map((member) => (
													<SelectItem key={member.id} value={member.id}>
														<div className="flex items-center gap-x-2">
															<MemberAvatar className="size-6" name={member.name} />
															{member.name}
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
							<FormField
								control={form.control}
								name="projectId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.project}</FormLabel>
										<Select defaultValue={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select project" />
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												{projectOptions.map((project) => (
													<SelectItem key={project.id} value={project.id}>
														<div className="flex items-center gap-x-2">
															<ProjectAvatar
																className="size-6"
																name={project.name}
																image={project.imageUrl}
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
