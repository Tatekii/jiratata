"use client"

import { z } from "zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"

import { useDictionary } from "@/context/DictionaryProvider"
import { buildCreateWorkspaceSchema } from "../schema"
import { useCreateWorkspace } from "../api/useCreateWorkspace"
import CommonWorkspaceFormControl from "./CommonWorkspaceFormControl"

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
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="flex flex-col gap-y-4">
							<CommonWorkspaceFormControl isPending={isPending} form={form} dic={dic} />
						</div>
						<DottedSeparator className="py-7" />
						<div className="flex items-center justify-end gap-4">
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

export default CreateWorkspaceForm
