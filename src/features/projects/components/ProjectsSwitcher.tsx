"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiAddCircleFill } from "react-icons/ri"

import { cn } from "@/lib/utils"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"
import useCreateProjectModal from "@/features/projects/hooks/useCreateProjectModal"
import useGetProjects from "@/features/projects/api/useGetProjects"
import { useDictionary } from "@/context/DictionaryProvider"
import { AiOutlineLoading } from "react-icons/ai"

const ProjectsSwitcher = () => {
	const pathname = usePathname()
	const { open } = useCreateProjectModal()
	const workspaceId = useWorkspaceId()
	const { data, isLoading } = useGetProjects({
		workspaceId,
	})
	const dic = useDictionary()

	return (
		<div className="flex flex-col gap-y-2">
			<div className="flex items-center justify-between">
				<p className="text-xs uppercase text-neutral-500">{dic.projects.name}</p>

				{isLoading ? (
					<AiOutlineLoading className="size-5 text-neutral-500 animate-spin " />
				) : (
					<RiAddCircleFill
						onClick={open}
						className="size-5 text-neutral-500 cursor-pointer hover:opacity-75 transition"
					/>
				)}
			</div>

			{data?.documents.length ? (
				<>
					{data?.documents.map((project) => {
						const href = `/workspaces/${workspaceId}/projects/${project.$id}`
						const isActive = pathname === href

						return (
							<Link href={href} key={project.$id}>
								<div
									className={cn(
										"flex items-center gap-2.5 p-2.5 rounded-md hover:text-purple-500 transition cursor-pointer text-neutral-500",
										isActive && "bg-white shadow-sm hover:opacity-100 text-primary"
									)}
								>
									<ProjectAvatar image={project.imageUrl} name={project.name} />
									<span className="truncate">{project.name}</span>
								</div>
							</Link>
						)
					})}
				</>
			) : (
				<div
					className={cn(
						"flex items-center gap-2.5 p-2.5 rounded-md font-medium transition text-neutral-500 "
					)}
				>
					{dic.projects.fetch.empty}
				</div>
			)}
		</div>
	)
}

export default ProjectsSwitcher
