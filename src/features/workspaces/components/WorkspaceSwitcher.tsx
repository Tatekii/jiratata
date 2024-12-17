"use client"

import { useRouter } from "next/navigation"
import { RiAddCircleFill } from "react-icons/ri"
import Image from "next/image"
import { cn } from "@/lib/utils"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FC, HtmlHTMLAttributes } from "react"
import { useDictionary } from "@/context/DictionaryProvider"
import useGetWorkspaces from "../api/useGetWorkspaces"

interface WorkspaceAvatarProps extends HtmlHTMLAttributes<HTMLDivElement> {
	image?: string
	name: string
}

const WorkspaceAvatar: FC<WorkspaceAvatarProps> = ({ image, name, className }) => {
	if (image) {
		return (
			<div className={cn("size-10 relative rounded-md overflow-hidden p-2", className)}>
				<Image src={image} alt={name} fill className="object-cover" />
			</div>
		)
	}

	return (
		<Avatar className={cn("size-10 rounded-md", className)}>
			<AvatarFallback className="text-white bg-blue-600 font-semibold text-lg uppercase rounded-md">
				{name[0]}
			</AvatarFallback>
		</Avatar>
	)
}

const WorkspaceSwitcher = () => {
	// const workspaceId = useWorkspaceId()
	// const router = useRouter()
	const { data: workspaces } = useGetWorkspaces()
	// const { open } = useCreateWorkspaceModal()

	// const onSelect = (id: string) => {
	// 	router.push(`/workspaces/${id}`)
	// }

	const dic = useDictionary()

	return (
		<div className="flex flex-col gap-y-2">
			<div className="flex items-center justify-between">
				<p className="text-xs uppercase text-neutral-500">{dic.workspaces.name}</p>
				<RiAddCircleFill
					// onClick={open}
					className="size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition"
				/>
			</div>
			{/* <Select onValueChange={onSelect} value={workspaceId}> */}
			<Select>
				<SelectTrigger className="w-full bg-neutral-200 font-medium p-1 h-min">
					<SelectValue placeholder={dic.workspaces.switcher.noselect} />
				</SelectTrigger>
				<SelectContent>
					{workspaces?.documents.map((workspace) => (
						<SelectItem key={workspace.$id} value={workspace.$id}>
							<div className="flex justify-start items-center gap-3 font-medium">
								<WorkspaceAvatar name={workspace.name} image={workspace.imageUrl} />
								<span className="truncate">{workspace.name}</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}

export default WorkspaceSwitcher
