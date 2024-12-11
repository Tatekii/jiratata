import { Hono } from "hono"
import { handle } from "hono/vercel"
import authService from "@/features/auth/service"
import { TDictionary } from "@/context/DictionaryProvider"
export type AppVariables = {
	dic: TDictionary
}

const app = new Hono<{ Variables: AppVariables }>().basePath("/api").route("/auth", authService)

export const GET = handle(app)

export type AppType = typeof app
