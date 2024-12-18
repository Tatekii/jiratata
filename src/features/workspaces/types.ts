import { Models } from "node-appwrite"
export enum EMemberRole {
	ADMIN = "ADMIN",
	MEMBER = "MEMBER",
}

export type Workspace = Models.Document & {
	name: string
	imageUrl: string
	inviteCode: string
	userId: string
}
