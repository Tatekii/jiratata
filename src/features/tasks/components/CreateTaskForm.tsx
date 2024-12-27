"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useDictionary } from "@/context/DictionaryProvider"
import { buildCreateTaskSchema } from "../schemas"
import DatePicker from "@/components/DatePicker"
import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import { cn } from "@/lib/utils"
import { useCreateTask } from "../api/useCreateTask"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ETaskStatus } from "@/features/types"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import useProjectId from "@/features/projects/hooks/useProjectId"

interface CreateTaskFormProps {
	onCancel?: () => void
	projectOptions: { id: string; name: string; imageUrl: string }[]
	memberOptions: { id: string; name: string }[]
}

const CreateTaskForm = ({ onCancel, projectOptions, memberOptions }: CreateTaskFormProps) => {
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
		},
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
							/>
							<FormField
								control={form.control}
								name="dueDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{dic.tasks.form.due}</FormLabel>
										<FormControl>
											<DatePicker {...field} placeholder={dic.select + "" + dic.tasks.form.due} />
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
													<SelectValue
														placeholder={dic.select + "" + dic.tasks.form.assign}
													/>
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
													<SelectValue
														placeholder={dic.select + "" + dic.tasks.form.status}
													/>
												</SelectTrigger>
											</FormControl>
											<FormMessage />
											<SelectContent>
												<SelectItem value={ETaskStatus.BACKLOG}>
													{dic.tasks.status.backlog}
												</SelectItem>
												<SelectItem value={ETaskStatus.IN_PROGRESS}>
													{dic.tasks.status.inprogress}
												</SelectItem>
												<SelectItem value={ETaskStatus.IN_REVIEW}>
													{dic.tasks.status.inreview}
												</SelectItem>
												<SelectItem value={ETaskStatus.TODO}>
													{dic.tasks.status.todo}
												</SelectItem>
												<SelectItem value={ETaskStatus.DONE}>
													{dic.tasks.status.done}
												</SelectItem>
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
													<SelectValue
														placeholder={dic.select + "" + dic.tasks.form.project}
													/>
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
