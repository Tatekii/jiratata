/**
 *   Hono backend application - 更新为MongoDB版本
 */
import { Hono } from "hono"
import { handle } from "hono/vercel"
import authService from "@/features/auth/service"
import workspaceService from "@/features/workspaces/service"
import memberService from "@/features/members/service"
import projectService from "@/features/projects/service"
import taskService from "@/features/tasks/service"
import { TDictionary } from "@/context/DictionaryProvider"
import { IUser } from "@/models"

export type AppVariables = {
	dic: TDictionary
	user: Partial<IUser> // 替代AppWrite的用户类型
}

const app = new Hono<{ Variables: AppVariables }>().basePath("/api")

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
	.route("/auth", authService)
	.route("/workspaces", workspaceService)
	.route("/members", memberService)
	.route("/projects", projectService)
	.route("/tasks", taskService)

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

export type AppType = typeof routes
