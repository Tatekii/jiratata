"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// import { useConfirm } from "@/hooks/use-confirm";
import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"

import { Workspace } from "../types"
import { buildUpdateWorkspaceSchema } from "../schema"
import { useDictionary } from "@/context/DictionaryProvider"
import useUpdateWorkspace from "../api/useUpdateWorkspace"
import CommonWorkspaceFormControl from "./CommonWorkspaceFormControl"
import { useMemo } from "react"
// import { useUpdateWorkspace } from "../api/use-update-workspace";
// import { useDeleteWorkspace } from "../api/use-delete-workspace";
// import { useResetInviteCode } from "../api/use-reset-invite-code";

interface EditWorkspaceFormProps {
	onCancel?: () => void
	initialValues: Workspace
}

export const EditWorkspaceForm = ({ onCancel, initialValues }: EditWorkspaceFormProps) => {
	const dic = useDictionary()

	const updateWorkspaceSchema = useMemo(() => {
		return buildUpdateWorkspaceSchema(dic)
	}, [dic])

	const router = useRouter()
	const { mutate, isPending } = useUpdateWorkspace()
	//   const {
	//     mutate: deleteWorkspace,
	//     isPending: isDeletingWorkspace
	//   } = useDeleteWorkspace();
	//   const {
	//     mutate: resetInviteCode,
	//     isPending: isResettingInviteCode
	//   } = useResetInviteCode();

	//   const [DeleteDialog, confirmDelete] = useConfirm(
	//     "Delete Workspace",
	//     "This action cannot be undone.",
	//     "destructive",
	//   );

	//   const [ResetDialog, confirmReset] = useConfirm(
	//     "Reset invite link",
	//     "This will invalidate the current invite link",
	//     "destructive",
	//   );

	const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
		resolver: zodResolver(updateWorkspaceSchema),
		defaultValues: {
			...initialValues,
			image: initialValues.imageUrl ?? "",
		},
	})

	//   const handleDelete = async () => {
	// const ok = await confirmDelete();

	// if (!ok) return;

	// deleteWorkspace({
	//   param: { workspaceId: initialValues.$id },
	// }, {
	//   onSuccess: () => {
	//     window.location.href = "/";
	//   },
	// });
	//   };

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

	//   const fullInviteLink = `${window.location.origin}/workspaces/${initialValues.$id}/join/${initialValues.inviteCode}`;

	//   const handleCopyInviteLink = () => {
	//     navigator.clipboard.writeText(fullInviteLink)
	//       .then(() => toast.success("Invite link copied to clipboard"));
	//   };

	return (
		<div className="flex flex-col gap-y-4">
			{/* <DeleteDialog />
      <ResetDialog /> */}
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
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<div className="flex flex-col gap-y-4">
								<CommonWorkspaceFormControl isPending={isPending} form={form} dic={dic} />
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
									{dic.savechanges}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* <Card className="w-ful h-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="flex flex-col">
           <h3 className="font-bold">Invite Members</h3>
           <p className="text-sm text-muted-foreground">
             Use the invite link to add members to your workspace.
           </p>
           <div className="mt-4">
             <div className="flex items-center gap-x-2">
              <Input disabled value={fullInviteLink} />
              <Button
                onClick={handleCopyInviteLink}
                variant="secondary"
                className="size-12"
              >
                <CopyIcon className="size-5" />
              </Button>
             </div>
           </div>
           <DottedSeparator className="py-7" />
           <Button
            className="mt-6 w-fit ml-auto"
            size="sm"
            variant="destructive"
            type="button"
            disabled={isPending || isResettingInviteCode}
            onClick={handleResetInviteCode}
           >
            Reset invite link
           </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-ful h-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="flex flex-col">
           <h3 className="font-bold">Danger Zone</h3>
           <p className="text-sm text-muted-foreground">
             Deleting a workspace is irreversible and will remove all associated data.
           </p>
           <DottedSeparator className="py-7" />
           <Button
            className="mt-6 w-fit ml-auto"
            size="sm"
            variant="destructive"
            type="button"
            disabled={isPending || isDeletingWorkspace}
            onClick={handleDelete}
           >
            Delete Workspace
           </Button>
          </div>
        </CardContent>
      </Card> */}
		</div>
	)
}
