"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { DottedSeparator } from "@/components/DottedSeparator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import useInviteCode from "../hooks/useInviteCode"
import useWorkspaceId from "../hooks/useWorkspaceId"
import { useJoinWorkspace } from "../api/useJoinWorkspace"
import { useDictionary } from "@/context/DictionaryProvider"
import { useGetWorkspaceInfo } from "../api/useGetWorkspaceInfo"
import { WorkspaceAvatar } from "./WorkspaceSwitcher"
import useInviteRole from "../hooks/useInviteRole"

interface JoinWorkspaceFormProps {
	initialValues: ReturnType<typeof useGetWorkspaceInfo>["data"]
}

const JoinWorkspaceForm = ({ initialValues }: JoinWorkspaceFormProps) => {
	const router = useRouter()
	const workspaceId = useWorkspaceId()
	const inviteCode = useInviteCode()
	const inviteRole = useInviteRole()

	const { mutate, isPending } = useJoinWorkspace()

	const dic = useDictionary()

	const onSubmit = () => {
		mutate(
			{
				param: { workspaceId },
				json: { code: inviteCode, role: inviteRole },
			},
			{
				onSuccess: ({ data }) => {
					router.push(`/workspaces/${data.$id}`)
				},
			}
		)
	}

	return (
		<Card className="w-full h-full border-none shadow-none">
			<CardHeader className="p-7">
				<CardTitle className="text-xl font-bold flex justify-between">
					{dic.workspaces.join.name}{" "}
					<WorkspaceAvatar name={initialValues?.name || ""} image={initialValues?.imageUrl} />
				</CardTitle>
				<CardDescription>
					{dic.workspaces.join.notice} <strong>{initialValues?.name}</strong> {dic.workspaces.name}
				</CardDescription>
			</CardHeader>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7">
				<div className="flex flex-col lg:flex-row gap-2 items-center justify-between">
					<Button
						variant="secondary"
						type="button"
						asChild
						size="lg"
						className="w-full lg:w-fit"
						disabled={isPending}
					>
						<Link href="/">{dic.cancel}</Link>
					</Button>
					<Button size="lg" className="w-full lg:w-fit" type="button" onClick={onSubmit} disabled={isPending}>
						{dic.workspaces.join.name}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}

export default JoinWorkspaceForm
