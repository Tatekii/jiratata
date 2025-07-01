import "server-only"
import { Hono } from "hono"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { 
  getUserActiveTokens, 
  revokeUserSession, 
  revokeAllUserTokens 
} from "@/lib/hono-jwt"

const app = new Hono<{ Variables: AppVariables }>()
  // 获取用户的活跃token会话
  .get("/sessions", authSessionMiddleware, async (c) => {
    try {
      const user = c.get("user")
      const tokenInfo = await getUserActiveTokens(user._id.toString())
      
      return c.json({ 
        success: true, 
        data: {
          sessions: tokenInfo.sessions,
          totalTokens: tokenInfo.totalTokens
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get sessions"
      return c.json({ error: errorMessage }, 500)
    }
  })
  
  // 撤销特定会话
  .delete("/sessions/:sessionId", authSessionMiddleware, async (c) => {
    try {
      const user = c.get("user")
      const sessionId = c.req.param("sessionId")
      
      await revokeUserSession(user._id.toString(), sessionId, "user_session_revoke")
      
      return c.json({ success: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to revoke session"
      return c.json({ error: errorMessage }, 500)
    }
  })
  
  // 撤销所有其他会话（除了当前会话）
  .delete("/sessions/others", authSessionMiddleware, async (c) => {
    try {
      const user = c.get("user")
      
      // 获取当前token的会话ID
      const authToken = c.req.header("authorization")?.replace("Bearer ", "") || 
                       c.req.header("cookie")?.match(/auth_session=([^;]+)/)?.[1]
      
      if (!authToken) {
        return c.json({ error: "No current session found" }, 400)
      }
      
      // 撤销所有其他会话
      await revokeAllUserTokens(user._id.toString(), "user_logout_others")
      
      return c.json({ success: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to revoke other sessions"
      return c.json({ error: errorMessage }, 500)
    }
  })

export default app
