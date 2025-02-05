"use client"

import { z } from "zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"

import useCreateProject from "../api/useCreateProject"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import { useDictionary } from "@/context/DictionaryProvider"
import { buildCreateProjectSchema } from "../schema"
import CommonNameImageForm from "@/components/CommonNameImageForm"
import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface CreateProjectFormProps {
	onCancel?: () => void
}

const CreateProjectForm = ({ onCancel }: CreateProjectFormProps) => {
	const workspaceId = useWorkspaceId()
	const router = useRouter()
	const { mutate, isPending } = useCreateProject()

	const dic = useDictionary()
	const createProjectSchema = useMemo(() => {
		return buildCreateProjectSchema(dic)
	}, [dic])

	const form = useForm<z.infer<typeof createProjectSchema>>({
		resolver: zodResolver(createProjectSchema.omit({ workspaceId: true })),
		defaultValues: {
			name: "",
		},
	})

	const onSubmit = (values: z.infer<typeof createProjectSchema>) => {
		const finalValues = {
			...values,
			workspaceId,
			image: values.image instanceof File ? values.image : "",
		}

		mutate(
			{ form: finalValues },
			{
				onSuccess: ({ data }) => {
					form.reset()
					router.push(`/workspaces/${workspaceId}/projects/${data.$id}`)
				},
			}
		)
	}

	return (
		<Card className="w-full h-full border-none shadow-none">
			<CardHeader className="flex p-7">
				<CardTitle className="text-xl font-bold">{dic.projects.form.createTitle}</CardTitle>
			</CardHeader>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7">
				<CommonNameImageForm
					nameText={dic.projects.form.name}
					enternameText={dic.projects.form.entername}
					iconText={dic.projects.form.icon}
					iconNotice={dic.form.iconnotice}
					onSubmit={onSubmit}
					onCancel={onCancel}
					submitText={dic.submit}
					cancelText={dic.cancel}
					form={form}
					isPending={isPending}
				/>
			</CardContent>
		</Card>
	)
}

export default CreateProjectForm
