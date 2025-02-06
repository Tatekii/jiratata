"use client"

import Link from "next/link"
import { BoltIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import PageError from "@/components/PageError"
import { PageLoader } from "@/components/PageLoader"

import useGetProject from "@/features/projects/api/useGetProject"
import ProjectAvatar from "@/features/projects/components/ProjectAvatar"
import useProjectId from "@/features/projects/hooks/useProjectId"
import { useDictionary } from "@/context/DictionaryProvider"
import TaskViewSwitcher from "@/features/tasks/components/TaskViewSwitcher"
import Analytics from "@/components/Analystics"
import useGetProjectAnalytics from "@/features/projects/api/useGetProjectAnalystics"

const ProjectIdClient = () => {
	const dic = useDictionary()
	const projectId = useProjectId()
	const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId })
	const { data: analytics, isLoading: isLoadingAnalytics } = useGetProjectAnalytics({ projectId })

	const isLoading = isLoadingProject || isLoadingAnalytics

	if (isLoading) {
		return <PageLoader />
	}

	if (!project) {
		return <PageError message={dic.projects.fetch.notfound} />
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
							<BoltIcon className="size-4 mr-2" />
							{dic.settings}
						</Link>
					</Button>
				</div>
			</div>
			{analytics ? <Analytics data={analytics} /> : null}
			<TaskViewSwitcher hideProjectFilter />
		</div>
	)
}

export default ProjectIdClient
