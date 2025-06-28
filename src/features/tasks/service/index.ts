"use server"
/**
 * MongoDB版本的任务服务
 */
import { z } from "zod"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildCreateTaskSchema, buildUpdateTaskSchema, mapTaskStatus } from "../schemas"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { ETaskStatus } from "@/models"
import { isMemberOfWorkspace } from "@/features/members/utils-mongodb"
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  bulkUpdateTaskPositions,
  checkTaskAccess
} from "../utils"
import mongoose from 'mongoose'

const app = new Hono<{ Variables: AppVariables }>()
  // 删除任务
  .delete("/:taskId", authSessionMiddleware, async (c) => {
    try {
      const user = c.get("user")
      const { taskId } = c.req.param()

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return c.json({ error: "无效的任务ID" }, 400)
      }

      // 检查用户权限
      const hasAccess = await checkTaskAccess(taskId, user._id!.toString())
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const task = await deleteTask(taskId)
      if (!task) {
        return c.json({ error: "任务不存在" }, 404)
      }

      return c.json({ data: { $id: taskId } })
    } catch (error) {
      console.error('删除任务失败:', error)
      return c.json({ error: "删除任务失败" }, 500)
    }
  })

  // 获取任务列表
  .get("/", authSessionMiddleware, zValidator("query", z.object({
    workspaceId: z.string(),
    projectId: z.string().nullish(),
    assigneeId: z.string().nullish(),
    status: z.nativeEnum(ETaskStatus).nullish(),
    search: z.string().nullish(),
    dueDate: z.string().nullish(),
  })), async (c) => {
    try {
      const user = c.get("user")
      const query = c.req.valid("query")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(query.workspaceId)) {
        return c.json({ error: "无效的工作区ID" }, 400)
      }

      // 检查用户是否为工作区成员
      const isMember = await isMemberOfWorkspace(query.workspaceId, user._id!.toString())
      if (!isMember) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const tasks = await getTasks({
        workspaceId: query.workspaceId,
        projectId: query.projectId || undefined,
        assigneeId: query.assigneeId || undefined,
        status: query.status || undefined,
        search: query.search || undefined,
        dueDate: query.dueDate || undefined,
      })

      // 格式化返回数据，保持与原API兼容
      const formattedTasks = tasks.map(task => ({
        $id: task._id,
        name: task.name,
        description: task.description,
        status: task.status,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        position: task.position,
        $createdAt: task.createdAt,
        $updatedAt: task.updatedAt,
        project: task.projectId,
        assignee: task.assigneeId
      }))

      return c.json({ 
        data: { 
          documents: formattedTasks, 
          total: formattedTasks.length 
        } 
      })
    } catch (error) {
      console.error('获取任务列表失败:', error)
      return c.json({ error: "获取任务列表失败" }, 500)
    }
  })

  // 创建任务
  .post("/", authSessionMiddleware, localeMiddleware, localeValidatorMiddleware("json", buildCreateTaskSchema), async (c) => {
    try {
      const user = c.get("user")
      const { name, description, status, workspaceId, projectId, assigneeId, dueDate } = c.req.valid("json")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(workspaceId) || 
          !mongoose.Types.ObjectId.isValid(projectId) || 
          !mongoose.Types.ObjectId.isValid(assigneeId)) {
        return c.json({ error: "无效的ID格式" }, 400)
      }

      // 检查用户是否为工作区成员
      const isMember = await isMemberOfWorkspace(workspaceId, user._id!.toString())
      if (!isMember) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const task = await createTask({
        name,
        description,
        workspaceId,
        projectId,
        assigneeId,
        status: mapTaskStatus(status),
        dueDate: new Date(dueDate)
      })

      return c.json({ data: task })
    } catch (error) {
      console.error('创建任务失败:', error)
      return c.json({ error: "创建任务失败" }, 500)
    }
  })

  // 更新任务
  .patch("/:taskId", authSessionMiddleware, localeMiddleware, localeValidatorMiddleware("json", buildUpdateTaskSchema), async (c) => {
    try {
      const user = c.get("user")
      const { taskId } = c.req.param()
      const updates = c.req.valid("json")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return c.json({ error: "无效的任务ID" }, 400)
      }

      // 检查用户权限
      const hasAccess = await checkTaskAccess(taskId, user._id!.toString())
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.assigneeId !== undefined) updateData.assigneeId = updates.assigneeId
      if (updates.projectId !== undefined) updateData.projectId = updates.projectId
      if (updates.dueDate !== undefined) updateData.dueDate = new Date(updates.dueDate)

      const task = await updateTask(taskId, updateData)
      if (!task) {
        return c.json({ error: "任务不存在" }, 404)
      }

      return c.json({ data: task })
    } catch (error) {
      console.error('更新任务失败:', error)
      return c.json({ error: "更新任务失败" }, 500)
    }
  })

  // 批量更新任务（用于拖拽排序）
  .post("/bulk-update", authSessionMiddleware, zValidator("json", z.object({
    tasks: z.array(z.object({
      $id: z.string(),
      status: z.nativeEnum(ETaskStatus),
      position: z.number(),
    }))
  })), async (c) => {
    try {
      const user = c.get("user")
      const { tasks } = c.req.valid("json")

      // 验证所有任务ID格式
      for (const task of tasks) {
        if (!mongoose.Types.ObjectId.isValid(task.$id)) {
          return c.json({ error: "无效的任务ID格式" }, 400)
        }
      }

      // 检查用户对所有任务的权限（简化版本，实际应该优化批量检查）
      for (const task of tasks) {
        const hasAccess = await checkTaskAccess(task.$id, user._id!.toString())
        if (!hasAccess) {
          return c.json({ error: "Unauthorized" }, 401)
        }
      }

      await bulkUpdateTaskPositions(tasks)

      return c.json({ data: { success: true } })
    } catch (error) {
      console.error('批量更新任务失败:', error)
      return c.json({ error: "批量更新任务失败" }, 500)
    }
  })

export default app
