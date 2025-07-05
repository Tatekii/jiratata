import "server-only"
/**
 * MongoDB版本的成员服务
 */
import { z } from "zod"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { EMemberRole } from "@/features/types"
import {
	getWorkspaceMembers,
	getMemberById,
	updateMemberRole,
	removeMember,
	checkAdminPermission,
	isMemberOfWorkspace,
} from "../utils"
import mongoose from "mongoose"

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
			const isMember = await isMemberOfWorkspace(workspaceId, user._id.toString())
			
			if (!isMember) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			// 列出该工作区所有成员
			const members = await getWorkspaceMembers(workspaceId)

			// 直接返回MongoDB格式的数据
			return c.json({
				data: {
					documents: members,
					total: members.length,
				},
			})
		} catch (error) {
			console.error("获取成员列表失败:", error)
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
			const targetMember = await getMemberById(memberId)
			if (!targetMember) {
				return c.json({ error: "成员不存在" }, 404)
			}

			// 检查操作者是否有管理员权限
			const hasPermission = await checkAdminPermission(targetMember.workspaceId.toString(), user._id!.toString())
			if (!hasPermission) {
				return c.json({ error: "无权限删除成员" }, 403)
			}

			// 防止删除自己
			if (targetMember.user._id.toString() === user._id!.toString()) {
				return c.json({ error: "不能删除自己" }, 400)
			}

			const deletedMember = await removeMember(memberId)
			if (!deletedMember) {
				return c.json({ error: "删除失败" }, 500)
			}

			return c.json({ data: { _id: memberId } })
		} catch (error) {
			console.error("删除成员失败:", error)
			return c.json({ error: "删除成员失败" }, 500)
		}
	})

	/**
	 * 更新成员角色
	 * @params {string} memberId
	 */
	.patch(
		"/:memberId",
		authSessionMiddleware,
		zValidator(
			"json",
			z.object({
				role: z.nativeEnum(EMemberRole),
			})
		),
		async (c) => {
			try {
				const user = c.get("user")
				const { memberId } = c.req.param()
				const { role } = c.req.valid("json")

				// 验证ObjectId格式
				if (!mongoose.Types.ObjectId.isValid(memberId)) {
					return c.json({ error: "无效的成员ID" }, 400)
				}

				// 获取要修改的成员信息
				const targetMember = await getMemberById(memberId)
				if (!targetMember) {
					return c.json({ error: "成员不存在" }, 404)
				}

				// 检查操作者是否有管理员权限
				const hasPermission = await checkAdminPermission(targetMember.workspaceId.toString(), user._id!.toString())
				if (!hasPermission) {
					return c.json({ error: "无权限修改成员角色" }, 403)
				}

				// 防止修改自己的角色
				if (targetMember.user._id.toString() === user._id!.toString()) {
					return c.json({ error: "不能修改自己的角色" }, 400)
				}

				const updatedMember = await updateMemberRole(memberId, role)
				if (!updatedMember) {
					return c.json({ error: "更新失败" }, 500)
				}

				// 直接返回MongoDB格式的数据
				return c.json({ data: updatedMember })
			} catch (error) {
				console.error("更新成员角色失败:", error)
				return c.json({ error: "更新成员角色失败" }, 500)
			}
		}
	)

export default app
