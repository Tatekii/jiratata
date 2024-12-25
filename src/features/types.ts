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
