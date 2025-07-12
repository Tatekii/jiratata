/**
 *   Hono backend application - 更新为MongoDB版本
 */
import { Hono } from "hono"
import { handle } from "hono/vercel"
import authService from "@/features/auth/service/auth.service"
import workspaceService from "@/features/workspaces/service"
import memberService from "@/features/members/service"
import projectService from "@/features/projects/service"
import taskService from "@/features/tasks/service"
import attachmentService from "@/features/attachments/service"
import commentService from "@/features/comments/service"
import { TDictionary } from "@/context/DictionaryProvider"
import { IClientUser } from "@/features/types"
import { OAuthProvider } from "@/features/types"


export interface IAuthUserInfo extends IClientUser {
	oauthProvider: OAuthProvider[]
}

export type AppVariables = {
	dic: TDictionary
	user: IAuthUserInfo
}

const app = new Hono<{ Variables: AppVariables }>().basePath("/api")

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
	.route("/auth", authService)
	.route("/workspaces", workspaceService)
	.route("/members", memberService)
	.route("/projects", projectService)
	.route("/tasks", taskService)
	.route("/attachments", attachmentService)
	.route("/comments", commentService)

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

export type AppType = typeof routes
