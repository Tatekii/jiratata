"use client"

import { z } from "zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"

import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useDictionary } from "@/context/DictionaryProvider"
import { buildCreateWorkspaceSchema } from "../schema"
import { useCreateWorkspace } from "../api/useCreateWorkspace"
import CommonNameImageForm from "@/components/CommonNameImageForm"

interface CreateWorkspaceFormProps {
	onCancel?: () => void
}

const CreateWorkspaceForm = ({ onCancel }: CreateWorkspaceFormProps) => {
	const router = useRouter()
	const { mutate, isPending } = useCreateWorkspace()

	const dic = useDictionary()

	const createWorkspaceSchema = useMemo(() => {
		return buildCreateWorkspaceSchema(dic)
	}, [dic])

	const form = useForm<z.infer<typeof createWorkspaceSchema>>({
		resolver: zodResolver(createWorkspaceSchema),
		defaultValues: {
			name: "",
		},
	})

	const onSubmit = (values: z.infer<typeof createWorkspaceSchema>) => {
		const finalValues = {
			...values,
			image: values.image instanceof File ? values.image : "",
		}

		mutate(
			{ form: finalValues },
			{
				onSuccess: ({ data }) => {
					form.reset()
					router.push(`/workspaces/${data.$id}`)
				},
			}
		)
	}

	return (
		<Card className="w-full h-full border-none shadow-none">
			<CardHeader className="flex p-7">
				<CardTitle className="text-xl font-bold">{dic.workspaces.form.createTitle}</CardTitle>
			</CardHeader>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7">
				<CommonNameImageForm
					nameText={dic.workspaces.form.name}
					enternameText={dic.workspaces.form.entername}
					iconText={dic.workspaces.form.icon}
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
	)
}

export default CreateWorkspaceForm
