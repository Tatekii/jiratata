import { Models } from "node-appwrite"

export enum EMemberRole {
	ADMIN = "ADMIN",
	MEMBER = "MEMBER",
	GUEST = "GUEST",
}
export type TMember = Models.Document & {
	workspaceId: string
	userId: string
	role: EMemberRole
}

export type TWorkspace = Models.Document & {
	name: string
	imageUrl: string
	inviteCode: string
	userId: string
}

export type TProject = Models.Document & {
	name: string
	imageUrl: string
	workspaceId: string
}

export const ETaskStatus = {
	BACKLOG: "BACKLOG",
	TODO: "TODO",
	IN_PROGRESS: "IN_PROGRESS",
	IN_REVIEW: "IN_REVIEW",
	DONE: "DONE",
} as const

export type TTask = Models.Document & {
	name: string
	status: typeof ETaskStatus[keyof typeof ETaskStatus]
	workspaceId: string
	assigneeId: string
	projectId: string
	position: number
	dueDate: string
	description?: string
}
