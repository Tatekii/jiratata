/**
 * MongoDB版本的项目服务
 */
import { z } from "zod"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { localeMiddleware, localeValidatorMiddleware } from "@/lib/hono-middleware"
import { buildCreateProjectSchema, buildUpdateProjectSchema } from "../schema"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { isMemberOfWorkspace } from "@/features/members/utils"
import {
  getWorkspaceProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectAnalytics,
  checkProjectAccess
} from "../utils"
import mongoose from 'mongoose'

const app = new Hono<{ Variables: AppVariables }>()
  // 创建项目
  .post("/", authSessionMiddleware, localeMiddleware, localeValidatorMiddleware("form", buildCreateProjectSchema), async (c) => {
    try {
      const user = c.get("user")
      const { name, image, workspaceId } = c.req.valid("form")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return c.json({ error: "无效的工作区ID" }, 400)
      }

      // 检查用户是否为工作区成员
      const isMember = await isMemberOfWorkspace(workspaceId, user._id!.toString())
      if (!isMember) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      // 处理图片上传（简化版本，实际项目中应该实现文件上传服务）
      let uploadedImageUrl: string | undefined
      if (typeof image === 'string' && image) {
        uploadedImageUrl = image
      }
      // TODO: 实现文件上传逻辑，替代AppWrite Storage

      const project = await createProject({
        name,
        workspaceId,
        imageUrl: uploadedImageUrl
      })

      return c.json({ data: project })
    } catch (error) {
      console.error('创建项目失败:', error)
      return c.json({ error: "创建项目失败" }, 500)
    }
  })

  // 获取工作区的所有项目
  .get("/", authSessionMiddleware, zValidator("query", z.object({ workspaceId: z.string() })), async (c) => {
    try {
      const user = c.get("user")
      const { workspaceId } = c.req.valid("query")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return c.json({ error: "无效的工作区ID" }, 400)
      }

      // 检查用户是否为工作区成员
      const isMember = await isMemberOfWorkspace(workspaceId, user._id!.toString())
      if (!isMember) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const projects = await getWorkspaceProjects(workspaceId) ||[]

      // 直接返回MongoDB格式的数据
      return c.json({ 
        data: { 
          documents: projects, 
          total: projects.length 
        } 
      })
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return c.json({ error: "获取项目列表失败" }, 500)
    }
  })

  // 更新项目
  .patch("/:projectId", authSessionMiddleware, localeMiddleware, localeValidatorMiddleware("form", buildUpdateProjectSchema), async (c) => {
    try {
      const user = c.get("user")
      const { projectId } = c.req.param()
      const { name, image } = c.req.valid("form")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return c.json({ error: "无效的项目ID" }, 400)
      }

      // 检查用户权限
      const hasAccess = await checkProjectAccess(projectId, user._id!.toString())
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      // 处理图片更新
      let uploadedImageUrl: string | undefined
      if (typeof image === 'string' && image) {
        uploadedImageUrl = image
      }
      // TODO: 实现文件上传逻辑

      const updates: { name?: string; imageUrl?: string } = {}
      if (name) updates.name = name
      if (uploadedImageUrl !== undefined) updates.imageUrl = uploadedImageUrl

      const project = await updateProject(projectId, updates)
      if (!project) {
        return c.json({ error: "项目不存在" }, 404)
      }

      return c.json({ data: project })
    } catch (error) {
      console.error('更新项目失败:', error)
      return c.json({ error: "更新项目失败" }, 500)
    }
  })

  // 删除项目
  .delete("/:projectId", authSessionMiddleware, async (c) => {
    try {
      const user = c.get("user")
      const { projectId } = c.req.param()

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return c.json({ error: "无效的项目ID" }, 400)
      }

      // 检查用户权限
      const hasAccess = await checkProjectAccess(projectId, user._id!.toString())
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      await deleteProject(projectId)

      return c.json({ data: { _id: projectId } })
    } catch (error) {
      console.error('删除项目失败:', error)
      return c.json({ error: "删除项目失败" }, 500)
    }
  })

  // 获取项目分析数据
  .get("/:projectId/analytics", authSessionMiddleware, async (c) => {
    try {
      const user = c.get("user")
      const { projectId } = c.req.param()

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return c.json({ error: "无效的项目ID" }, 400)
      }

      // 检查用户权限
      const hasAccess = await checkProjectAccess(projectId, user._id!.toString())
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const analytics = await getProjectAnalytics(projectId)

      return c.json({ data: analytics })
    } catch (error) {
      console.error('获取项目分析数据失败:', error)
      return c.json({ error: "获取项目分析数据失败" }, 500)
    }
  })

export default app
