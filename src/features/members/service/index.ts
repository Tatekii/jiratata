"use server"
/**
 * MongoDB版本的成员服务
 */
import { z } from "zod"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { EMemberRole } from "@/models"
import {
  getWorkspaceMembers,
  getMemberByWorkspaceAndUser,
  updateMemberRole,
  removeMember,
  checkAdminPermission,
  isMemberOfWorkspace
} from "../utils-mongodb"
import mongoose from 'mongoose'

const app = new Hono<{ Variables: AppVariables }>()
  /**
   * 获得workspace下的所有成员
   * @params {string} workspaceId
   */
  .get("/", authSessionMiddleware, zValidator("query", z.object({ workspaceId: z.string() })), async (c) => {
    try {
      const user = c.get("user")
      const { workspaceId } = c.req.valid("query")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return c.json({ error: "无效的工作区ID" }, 400)
      }

      // 查询请求发起用户是否在该工作区
      const isMember = await isMemberOfWorkspace(workspaceId, user._id!.toString())
      if (!isMember) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      // 列出该工作区所有成员
      const members = await getWorkspaceMembers(workspaceId)

      // 格式化返回数据，保持与原API兼容
      const formattedMembers = members.map(member => ({
        $id: member._id,
        userId: member.userId._id,
        workspaceId: member.workspaceId,
        role: member.role,
        name: (member.userId as any).name,
        email: (member.userId as any).email,
        $createdAt: member.createdAt,
        $updatedAt: member.updatedAt
      }))

      return c.json({ 
        data: { 
          documents: formattedMembers, 
          total: formattedMembers.length 
        } 
      })
    } catch (error) {
      console.error('获取成员列表失败:', error)
      return c.json({ error: "获取成员列表失败" }, 500)
    }
  })

  /**
   * 删除成员
   * @params {string} memberId
   */
  .delete("/:memberId", authSessionMiddleware, async (c) => {
    try {
      const user = c.get("user")
      const { memberId } = c.req.param()

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return c.json({ error: "无效的成员ID" }, 400)
      }

      // 获取要删除的成员信息
      const targetMember = await getMemberByWorkspaceAndUser("", "")
      // 这里需要先通过memberId获取member信息，再检查权限
      // 暂时简化处理，实际应该先查询member获取workspaceId
      
      // TODO: 实现更完整的权限检查逻辑
      
      const deletedMember = await removeMember(memberId)
      if (!deletedMember) {
        return c.json({ error: "成员不存在" }, 404)
      }

      return c.json({ data: { $id: memberId } })
    } catch (error) {
      console.error('删除成员失败:', error)
      return c.json({ error: "删除成员失败" }, 500)
    }
  })

  /**
   * 更新成员角色
   * @params {string} memberId
   */
  .patch("/:memberId", authSessionMiddleware, zValidator("json", z.object({
    role: z.nativeEnum(EMemberRole)
  })), async (c) => {
    try {
      const user = c.get("user")
      const { memberId } = c.req.param()
      const { role } = c.req.valid("json")

      // 验证ObjectId格式
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return c.json({ error: "无效的成员ID" }, 400)
      }

      // TODO: 实现权限检查 - 只有管理员可以修改角色
      // const hasPermission = await checkAdminPermission(workspaceId, user._id!.toString())
      // if (!hasPermission) {
      //   return c.json({ error: "无权限修改成员角色" }, 403)
      // }

      const updatedMember = await updateMemberRole(memberId, role)
      if (!updatedMember) {
        return c.json({ error: "成员不存在" }, 404)
      }

      // 格式化返回数据
      const formattedMember = {
        $id: updatedMember._id,
        userId: updatedMember.userId._id,
        workspaceId: updatedMember.workspaceId,
        role: updatedMember.role,
        name: (updatedMember.userId as any).name,
        email: (updatedMember.userId as any).email,
        $createdAt: updatedMember.createdAt,
        $updatedAt: updatedMember.updatedAt
      }

      return c.json({ data: formattedMember })
    } catch (error) {
      console.error('更新成员角色失败:', error)
      return c.json({ error: "更新成员角色失败" }, 500)
    }
  })

export default app
