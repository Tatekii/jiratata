import { AppType } from "@/app/api/[[...route]]/route"
import { hc } from "hono/client"

const APP_URL_LOCAL_ENV = process.env.NEXT_PUBLIC_APP_URL

export const client = hc<AppType>(APP_URL_LOCAL_ENV)
