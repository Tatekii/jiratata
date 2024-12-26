"use client"

import Link from "next/link"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import PageError from "@/components/PageError"
import { PageLoader } from "@/components/PageLoader"

import useGetProject from "@/features/projects/api/useGetProject"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"
import useProjectId from "@/features/projects/hooks/useProjectId"
import { useDictionary } from "@/context/DictionaryProvider"

const ProjectIdClient = () => {
	const dic = useDictionary()
	const projectId = useProjectId()
	const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId })
	// const { data: analytics, isLoading: isLoadingAnalytics } = useGetProjectAnalytics({ projectId })

	const isLoading = isLoadingProject

	if (isLoading) {
		return <PageLoader />
	}

	if (!project) {
		return <PageError message="Project not found" />
	}

	return (
		<div className="flex flex-col gap-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-x-2">
					<ProjectAvatar name={project.name} image={project.imageUrl} className="size-8" />
					<p className="text-lg font-semibold">{project.name}</p>
				</div>
				<div>
					<Button variant="secondary" size="sm" asChild>
						<Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}/settings`}>
							<PencilIcon className="size-4 mr-2" />
							{dic.projects.edit.title}
						</Link>
					</Button>
				</div>
			</div>
			{/* {analytics ? <Analytics data={analytics} /> : null} */}
			{/* <TaskViewSwitcher hideProjectFilter /> */}
		</div>
	)
}

export default ProjectIdClient
