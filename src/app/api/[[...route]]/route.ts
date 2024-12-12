/**
 *   Hono backend application
 */
import { Hono } from "hono"
import { handle } from "hono/vercel"
import authService from "@/features/auth/service"
import { TDictionary } from "@/context/DictionaryProvider"
export type AppVariables = {
	dic: TDictionary
}

const app = new Hono<{ Variables: AppVariables }>().basePath("/api")

const routes = app.route("/auth", authService)

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes
