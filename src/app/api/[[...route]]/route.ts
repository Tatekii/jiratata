/**
 *   Hono backend application
 */
import { Hono } from "hono"
import { handle } from "hono/vercel"
import authService from "@/features/auth/service"
import workspaceService from "@/features/workspaces/service"
import memberService from "@/features/members/service"
import { TDictionary } from "@/context/DictionaryProvider"
import { Account, Databases, Models, Storage, Users } from "node-appwrite"

export type AppVariables = {
	dic: TDictionary
	account: Account
	databases: Databases
	storage: Storage
	users: Users
	user: Models.User<Models.Preferences>
}

const app = new Hono<{ Variables: AppVariables }>().basePath("/api")

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app.route("/auth", authService).route("/workspaces", workspaceService).route("/members", memberService)

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

export type AppType = typeof routes
