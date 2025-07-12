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

// 任务优先级枚举
export const ETaskPriority = {
	LOWEST: "LOWEST",
	LOW: "LOW",
	MEDIUM: "MEDIUM",
	HIGH: "HIGH",
	HIGHEST: "HIGHEST",
} as const

// 任务类型枚举
export const ETaskType = {
	TASK: "TASK",
	BUG: "BUG",
	STORY: "STORY",
	SUBTASK: "SUBTASK",
} as const

export type MemberRoleType = (typeof EMemberRole)[keyof typeof EMemberRole]
export type TaskStatusType = (typeof ETaskStatus)[keyof typeof ETaskStatus]
export type TaskPriorityType = (typeof ETaskPriority)[keyof typeof ETaskPriority]
export type TaskTypeType = (typeof ETaskType)[keyof typeof ETaskType]

export interface IClientBase {
	_id: string
	createdAt: string
	updatedAt: string
}

export interface IClientUser extends IClientBase {
	name: string
	email: string
	avatar?: string
}

export interface IClientMember extends IClientBase {
	workspaceId: string
	userId: string
	role: MemberRoleType
}

export interface IClientWorkspace extends IClientBase {
	name: string
	image?: string
	inviteCode: string
	userId: string
}

export interface IClientProject extends IClientBase {
	name: string
	image?: string
	workspaceId: string
}

export interface IClientTask extends IClientBase {
	name: string
	status: TaskStatusType
	workspaceId: string
	projectId: string
	assigneeId?: string
	position: number // 看板中的位置
	dueDate?: string
	description?: string
	priority: TaskPriorityType
	estimatedHours?: number
	loggedHours: number
	parentTaskId?: string
	taskType: TaskTypeType
}

export interface IClientTaskWithDetail extends IClientTask {
	project: IClientProject
	assignee: IClientMember & Pick<IClientUser, "name" | "email" | "avatar">
	parentTask?: Pick<IClientTask, "_id" | "name" | "status">
}

// 附件接口
export interface IClientAttachment extends IClientBase {
	filename: string
	originalName: string
	mimeType: string
	size: number
	url: string
	entityType: "TASK" | "COMMENT" | "PROJECT"
	entityId: string
	uploadedBy: string
	formattedSize?: string
	extension?: string
}

// 评论接口
export interface IClientComment extends IClientBase {
	content: string
	taskId: string
	authorId: string
	parentCommentId?: string
	mentions: string[]
	isEdited: boolean
	editedAt?: string
	author?: IClientMember & Pick<IClientUser, "name" | "email" | "avatar">
	attachments?: IClientAttachment[]
}

// 活动日志接口
export interface IClientActivityLog extends IClientBase {
	entityType: "TASK" | "PROJECT" | "COMMENT" | "ATTACHMENT"
	entityId: string
	action: string
	actorId: string
	targetUserId?: string
	changes?: {
		field: string
		oldValue: unknown
		newValue: unknown
	}[]
	metadata?: Record<string, unknown>
	actor?: IClientMember & Pick<IClientUser, "name" | "email" | "avatar">
	targetUser?: IClientMember & Pick<IClientUser, "name" | "email" | "avatar">
}

export interface IProjectAnalytics {
	taskCount: number // 本月总任务数
	taskDifference: number // 与上月相比的差异
	assignedTaskCount: number // 本月分配给当前用户的任务数
	assignedTaskDifference: number
	completedTaskCount: number // 本月已完成任务数
	completedTaskDifference: number
	incompleteTaskCount: number // 本月未完成任务数
	incompleteTaskDifference: number
	overdueTaskCount: number // 本月过期任务数
	overdueTaskDifference: number
}

export interface IClientDocuments<T> {
	documents: T[]
	total: number
}
// OAuth提供商枚举
export enum OAuthProvider {
	GOOGLE = "google",
	GITHUB = "github",
}
