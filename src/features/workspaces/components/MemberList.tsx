"use client"

import Link from "next/link"
import { FC, Fragment } from "react"
import { ArrowLeftIcon, MoreVerticalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import useConfirm from "@/hooks/useConfirm"
import { Separator } from "@/components/ui/separator"
import { DottedSeparator } from "@/components/DottedSeparator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import useDeleteMember from "@/features/members/api/useDeleteMember"
import useGetMembers from "@/features/members/api/useGetMembers"
import useUpdateMember from "@/features/members/api/useUpdateMember"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import useWorkspaceId from "../hooks/useWorkspaceId"
import { EMemberRole } from "@/features/types"
import { useDictionary } from "@/context/DictionaryProvider"

interface IMemberListProps {
	data: ReturnType<typeof useGetMembers>["data"]
}
const MembersList: FC<IMemberListProps> = ({ data }) => {
	const workspaceId = useWorkspaceId()
	const dic = useDictionary()

	const [ConfirmDialog, confirm] = useConfirm(dic.members.delete.name, dic.members.delete.modalnotice, "destructive")

	const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember()
	const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember()

	const handleUpdateMember = (memberId: string, role: EMemberRole) => {
		updateMember({
			json: { role },
			param: { memberId },
		})
	}

	const handleDeleteMember = async (memberId: string) => {
		const ok = await confirm()
		if (!ok) return

		deleteMember(
			{ param: { memberId } },
			{
				onSuccess: () => {
					window.location.reload()
				},
			}
		)
	}

	return (
		<Card className="w-full h-full border-none shadow-none">
			<ConfirmDialog />
			<CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
				<Button asChild variant="secondary" size="sm">
					<Link href={`/workspaces/${workspaceId}`}>
						<ArrowLeftIcon className="size-4 mr-2" />
						{dic.back}
					</Link>
				</Button>
				<CardTitle className="text-xl font-bold">{dic.members.name + " " + dic.list}</CardTitle>
			</CardHeader>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7">
				{data?.documents.map((member, index) => (
					<Fragment key={member.$id}>
						<div className="flex items-center gap-2">
							<MemberAvatar className="size-10" fallbackClassName="text-lg" name={member.name} />
							<div className="flex flex-col">
								<p className="text-sm font-medium">{member.name}</p>
								<p className="text-xs text-muted-foreground">{member.email}</p>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button className="ml-auto" variant="secondary" size="icon">
										<MoreVerticalIcon className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent side="bottom" align="end">
									<DropdownMenuItem
										className="font-medium"
										onClick={() => handleUpdateMember(member.$id, EMemberRole.ADMIN)}
										disabled={isUpdatingMember}
									>
										{dic.members.update.toadmin}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="font-medium"
										onClick={() => handleUpdateMember(member.$id, EMemberRole.MEMBER)}
										disabled={isUpdatingMember}
									>
										{dic.members.update.tomember}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="font-medium"
										onClick={() => handleUpdateMember(member.$id, EMemberRole.GUEST)}
										disabled={isUpdatingMember}
									>
										{dic.members.update.toguest}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="font-medium text-amber-700"
										onClick={() => handleDeleteMember(member.$id)}
										disabled={isDeletingMember}
									>
										{dic.remove} {member.name}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						{index < data.documents.length - 1 && <Separator className="my-2.5" />}
					</Fragment>
				))}
			</CardContent>
		</Card>
	)
}

export default MembersList
