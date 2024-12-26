"use client"

import { z } from "zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DottedSeparator } from "@/components/DottedSeparator"

import { useUpdateProject } from "../api/useUpdateProject"
import { buildUpdateProjectSchema } from "../schema"
import useDeleteProject from "../api/useDeleteProject"
import { TProject } from "@/features/types"
import useConfirm from "@/hooks/useConfirm"
import { useDictionary } from "@/context/DictionaryProvider"
import CommonEditFormControls from "@/components/CommonEditFormCard"

interface EditProjectFormProps {
	onCancel?: () => void
	initialValues: TProject
}

export const EditProjectForm = ({ onCancel, initialValues }: EditProjectFormProps) => {
	const router = useRouter()
	const { mutate, isPending } = useUpdateProject()
	const { mutate: deleteProject, isPending: isDeletingProject } = useDeleteProject()

	const dic = useDictionary()
	const updateProjectSchema = useMemo(() => {
		return buildUpdateProjectSchema(dic)
	}, [dic])

	const [DeleteDialog, confirmDelete] = useConfirm(dic.projects.dangerzone.delete, dic.canundonotice, "destructive")

	const form = useForm<z.infer<typeof updateProjectSchema>>({
		resolver: zodResolver(updateProjectSchema),
		defaultValues: {
			...initialValues,
			image: initialValues.imageUrl ?? "",
		},
	})

	const handleDelete = async () => {
		const ok = await confirmDelete()

		if (!ok) return

		deleteProject(
			{
				param: { projectId: initialValues.$id },
			},
			{
				onSuccess: () => {
					window.location.href = `/workspaces/${initialValues.workspaceId}`
				},
			}
		)
	}

	const onSubmit = (values: z.infer<typeof updateProjectSchema>) => {
		const finalValues = {
			...values,
			image: values.image instanceof File ? values.image : "",
		}

		mutate({
			form: finalValues,
			param: { projectId: initialValues.$id },
		})
	}

	return (
		<div className="flex flex-col gap-y-4">
			<DeleteDialog />
			<Card className="w-full h-full border-none shadow-none">
				<CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
					<Button
						size="sm"
						variant="secondary"
						onClick={
							onCancel
								? onCancel
								: () =>
										router.push(
											`/workspaces/${initialValues.workspaceId}/projects/${initialValues.$id}`
										)
						}
					>
						<ArrowLeftIcon className="size-4 mr-2" />
						{dic.back}
					</Button>
					<CardTitle className="text-xl font-bold">{initialValues.name}</CardTitle>
				</CardHeader>
				<div className="px-7">
					<DottedSeparator />
				</div>
				<CardContent className="p-7">
					<CommonEditFormControls
						nameText={dic.projects.form.name}
						enternameText={dic.projects.form.entername}
						iconText={dic.projects.form.icon}
						iconNotice={dic.form.iconnotice}
						onSubmit={onSubmit}
						onCancel={onCancel}
						submitText={dic.savechanges}
						cancelText={dic.cancel}
						form={form}
						isPending={isPending}
					/>
				</CardContent>
			</Card>

			<Card className="w-ful h-full border-none shadow-none">
				<CardContent className="p-7">
					<div className="flex flex-col">
						<h3 className="font-bold">{dic.projects.dangerzone.name}</h3>
						<p className="text-sm text-muted-foreground">{dic.projects.dangerzone.notice}</p>
						<DottedSeparator className="py-7" />
						<Button
							className="mt-6 w-fit ml-auto"
							size="sm"
							variant="destructive"
							type="button"
							disabled={isPending || isDeletingProject}
							onClick={handleDelete}
						>
							{dic.projects.dangerzone.delete}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
