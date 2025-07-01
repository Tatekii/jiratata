export const EMemberRole = {
	ADMIN: "ADMIN",
	MEMBER: "MEMBER",
	GUEST: "GUEST",
} as const // 任务状态枚举

export const ETaskStatus = {
	BACKLOG: "BACKLOG",
	TODO: "TODO",
	IN_PROGRESS: "IN_PROGRESS",
	IN_REVIEW: "IN_REVIEW",
	DONE: "DONE",
} as const

export type MemberRoleType = (typeof EMemberRole)[keyof typeof EMemberRole]
export type TaskStatusType = (typeof ETaskStatus)[keyof typeof ETaskStatus]

interface IClientBase {
	_id: string
	createdAt: Date
	updatedAt: Date
}

export interface IClientUser extends IClientBase {
	name: string
	email: string
}

export interface IClientMember extends IClientBase {
	workspaceId: string
	userId: string
	role: MemberRoleType
}

export interface IClientWorkspace extends IClientBase {
	name: string
	imageUrl?: string
	inviteCode: string
	userId: string
}

export interface IClientProject extends IClientBase {
	name: string
	imageUrl?: string
	workspaceId: string
}

export interface IClientTask extends IClientBase {
	name: string
	status: TaskStatusType
	workspaceId: string
	assigneeId: string
	projectId: string
	position: number
	dueDate: Date
	description?: string
}
