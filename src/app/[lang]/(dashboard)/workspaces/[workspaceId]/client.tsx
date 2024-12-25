"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { CalendarIcon, PlusIcon, SettingsIcon } from "lucide-react"
import { DottedSeparator } from "@/components/DottedSeparator"
import PageError from "@/components/PageError"
import { PageLoader } from "@/components/PageLoader"
import { Card, CardContent } from "@/components/ui/card"
import useGetMembers from "@/features/members/api/useGetMembers"
import MemberAvatar from "@/features/members/components/MemberAvatar"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import { Button } from "@/components/ui/button"
import { TMember } from "@/features/types"
import { useDictionary } from "@/context/DictionaryProvider"

const WorkspaceIdClient = () => {
	const workspaceId = useWorkspaceId()

	const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

	const isLoading = isLoadingMembers

	if (isLoading) {
		return <PageLoader />
	}

	// if (!analytics || !tasks || !projects || !members) {
	if (!members) {
		return <PageError message="Failed to load workspace data" />
	}

	return (
		<div className="h-full flex flex-col space-y-4">
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
				<MembersList data={members.documents} total={members.total} />
			</div>
		</div>
	)
}

interface MembersListProps {
	data: TMember[]
	total: number
}

export const MembersList = ({ data, total }: MembersListProps) => {
	const workspaceId = useWorkspaceId()
	const dic = useDictionary()

	return (
		<div className="flex flex-col gap-y-4 col-span-1">
			<div className="bg-white border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<p className="text-lg font-semibold">
						{dic.members.name} ({total})
					</p>
					<Button asChild variant="secondary" size="icon">
						<Link href={`/workspaces/${workspaceId}/members`}>
							<SettingsIcon className="size-4" />
						</Link>
					</Button>
				</div>
				<DottedSeparator className="my-4" />
				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{data.map((member) => (
						<li key={member.$id}>
							<Card className="shadow-none rounded-lg overflow-hidden">
								<CardContent className="p-3 flex flex-col items-center gap-x-2">
									<MemberAvatar className="size-12" name={member.name} />
									<div className="flex flex-col items-center overflow-hidden">
										<p className="text-lg font-medium line-clamp-1">{member.name}</p>
										<p className="text-sm text-muted-foreground line-clamp-1">{member.email}</p>
									</div>
								</CardContent>
							</Card>
						</li>
					))}
					<li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
						{dic.members.fetch.empty}
					</li>
				</ul>
			</div>
		</div>
	)
}

export default WorkspaceIdClient
