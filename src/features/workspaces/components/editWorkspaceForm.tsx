"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import useConfirm from "@/hooks/useConfirm"
import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


import { EMemberRole, TWorkspace } from "@/features/types"
import { buildUpdateWorkspaceSchema } from "../schema"
import { useDictionary } from "@/context/DictionaryProvider"
import { useMemo, useState } from "react"
import useUpdateWorkspace from "../api/useUpdateWorkspace"
import useDeleteWorkspace from "../api/useDeleteWorkspace"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import CommonEditFormControls from "@/components/CommonEditFormCard"

interface EditWorkspaceFormProps {
	onCancel?: () => void
	initialValues: TWorkspace
}

export const EditWorkspaceForm = ({ onCancel, initialValues }: EditWorkspaceFormProps) => {
	const dic = useDictionary()

	const updateWorkspaceSchema = useMemo(() => {
		return buildUpdateWorkspaceSchema(dic)
	}, [dic])

	const router = useRouter()
	const { mutate, isPending } = useUpdateWorkspace()

	const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } = useDeleteWorkspace()
	//   const {
	//     mutate: resetInviteCode,
	//     isPending: isResettingInviteCode
	//   } = useResetInviteCode();

	const [DeleteDialog, confirmDelete] = useConfirm(dic.workspaces.dangerzone.delete, dic.canundonotice, "destructive")

	//   const [ResetDialog, confirmReset] = useConfirm(
	//     "Reset invite link",
	//     "This will invalidate the current invite link",
	//     "destructive",
	//   );

	const [inviteRole, setInviteRole] = useState<EMemberRole>(EMemberRole.MEMBER)

	const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
		resolver: zodResolver(updateWorkspaceSchema),
		defaultValues: {
			...initialValues,
			image: initialValues.imageUrl ?? "",
		},
	})

	const handleDelete = async () => {
		const ok = await confirmDelete()

		if (!ok) return

		deleteWorkspace(
			{
				param: { workspaceId: initialValues.$id },
			},
			{
				onSuccess: () => {
					window.location.href = "/"
				},
			}
		)
	}

	//   const handleResetInviteCode = async () => {
	// const ok = await confirmReset();

	// if (!ok) return;

	// resetInviteCode({
	//   param: { workspaceId: initialValues.$id },
	// });
	//   };

	const onSubmit = (values: z.infer<typeof updateWorkspaceSchema>) => {
		const finalValues = {
			...values,
			image: values.image instanceof File ? values.image : "",
		}

		mutate({
			form: finalValues,
			param: { workspaceId: initialValues.$id },
		})
	}

	const fullInviteLink = `${window.location.origin}/workspaces/${initialValues.$id}/join/${initialValues.inviteCode}?role=${inviteRole}`

	const handleCopyInviteLink = () => {
		navigator.clipboard.writeText(fullInviteLink).then(() => toast.success("Invite link copied to clipboard"))
	}

	return (
		<div className="flex flex-col gap-y-4">
			<DeleteDialog />
			{/* <ResetDialog />  */}
			<Card className="w-full h-full border-none shadow-none">
				<CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
					<Button
						size="sm"
						variant="secondary"
						onClick={onCancel ? onCancel : () => router.push(`/workspaces/${initialValues.$id}`)}
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
						titleText={dic.workspaces.form.createTitle}
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

			<Card className="w-ful h-full border-none shadow-none">
				<CardContent className="p-7">
					<div className="flex flex-col">
						<h3 className="font-bold"> {dic.workspaces.invite.name}</h3>
						<p className="text-sm text-muted-foreground">{dic.workspaces.invite.notice}</p>
						<div className="mt-4">
							<div className="flex items-center gap-x-2">
								<Input disabled value={fullInviteLink} />

								<Select
									value={inviteRole}
									onValueChange={(role: EMemberRole) => {
										setInviteRole(role)
									}}
								>
									<SelectTrigger className="w-[100px] h-10">
										<SelectValue placeholder={"role"} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem key={EMemberRole.MEMBER} value={EMemberRole.MEMBER}>
											{dic.workspaces.invite.member}
										</SelectItem>
										<SelectItem key={EMemberRole.GUEST} value={EMemberRole.GUEST}>
											{dic.workspaces.invite.guest}
										</SelectItem>
									</SelectContent>
								</Select>

								<Button onClick={handleCopyInviteLink} variant="secondary">
									<CopyIcon className="size-5" />
								</Button>
							</div>
						</div>
						{/* <DottedSeparator className="py-7" />
						<Button
							className="mt-6 w-fit ml-auto"
							size="sm"
							variant="destructive"
							type="button"
							disabled={isPending || isResettingInviteCode}
							onClick={handleResetInviteCode}
						>
							Reset invite link
						</Button> */}
					</div>
				</CardContent>
			</Card>

			<Card className="w-ful h-full border-none shadow-none">
				<CardContent className="p-7">
					<div className="flex flex-col">
						<h3 className="font-bold">{dic.workspaces.dangerzone.name}</h3>
						<p className="text-sm text-muted-foreground">{dic.workspaces.dangerzone.notice}</p>
						<DottedSeparator className="py-7" />
						<Button
							className="mt-6 w-fit ml-auto"
							variant="destructive"
							type="button"
							disabled={isPending || isDeletingWorkspace}
							onClick={handleDelete}
						>
							{dic.workspaces.dangerzone.delete}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
