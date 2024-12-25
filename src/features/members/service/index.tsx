import { Hono } from "hono"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildLoginSchema, buildRegisterSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { setCookie, deleteCookie } from "hono/cookie"
import { createAdminClient } from "@/lib/hono"
import { ID } from "node-appwrite"

const app = new Hono<{ Variables: AppVariables }>()

export default app
