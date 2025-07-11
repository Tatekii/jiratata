/**
 * MongoDB版本的工作区服务辅助函数
 */
import { nanoid } from "nanoid"
import { Workspace, Member, Project, Task } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { EMemberRole, IClientUser, IClientWorkspace, MemberRoleType } from "../types"
import { IClientMemberWithUserInfo } from "../members/utils"

interface IClientWorkspaceWithUserInfo extends IClientWorkspace {
	user: IClientUser
}
// 生成邀请码
export const generateInviteCode = (): string => {
	return nanoid(10)
}

// 检查用户是否为工作区成员
export const getMemberByWorkspaceAndUser = async (
	workspaceId: string,
	userId: string
): Promise<IClientMemberWithUserInfo | null> => {
	await connectToDatabase()

	const result = await Member.aggregate([
		{
			$match: {
				workspaceId: new mongoose.Types.ObjectId(workspaceId),
				userId: new mongoose.Types.ObjectId(userId),
			},
		},
		{
			$lookup: {
				from: "users", // User 集合名
				localField: "userId",
				foreignField: "_id",
				as: "userInfo",
			},
		},
		{
			$project: {
				_id: 1,
				workspaceId: 1,
				role: 1,
				createdAt: 1,
				updatedAt: 1,
				// 重命名为 user
				user: {
					$let: {
						vars: { userDoc: { $arrayElemAt: ["$userInfo", 0] } },
						in: {
							_id: "$$userDoc._id",
							name: "$$userDoc.name",
							email: "$$userDoc.email",
						},
					},
				},
			},
		},
	])

	return result[0] || null
}

// 获取用户的所有工作区
export const getUserWorkspaces = async (userId: string): Promise<IClientWorkspaceWithUserInfo[] | null> => {
	await connectToDatabase()

	// 首先获取用户是成员的所有工作区ID
	const memberships = await Member.find({
		userId: new mongoose.Types.ObjectId(userId),
	}).select("workspaceId")

	if (memberships.length === 0) {
		return []
	}

	const workspaceIds = memberships.map((m) => m.workspaceId)

	// 获取工作区详情并按创建时间倒序排列
	const result = await Workspace.aggregate([
		{
			$match: {
				_id: { $in: workspaceIds },
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "userInfo",
			},
		},
		{
			$project: {
				_id: 1,
				name: 1,
				image: 1,
				inviteCode: 1,
				createdAt: 1,
				updatedAt: 1,
				user: {
					$let: {
						vars: { userDoc: { $arrayElemAt: ["$userInfo", 0] } },
						in: {
							_id: "$$userDoc._id",
							name: "$$userDoc.name",
							email: "$$userDoc.email",
						},
					},
				},
			},
		},
		{
			$sort: { createdAt: -1 },
		},
	])

	return result
}
// 获取用户的所有工作区
export const getWorkspaceById = async (workspaceId: string) => {
	await connectToDatabase()

	return await Workspace.findById(workspaceId).lean()
}

// 创建工作区
export const createWorkspace = async (data: {
	name: string
	userId: string
	image?: string
}): Promise<IClientWorkspaceWithUserInfo | null> => {
	await connectToDatabase()

	try {
		// 创建工作区
		const workspace = new Workspace({
			name: data.name,
			userId: new mongoose.Types.ObjectId(data.userId),
			image: data.image,
			inviteCode: generateInviteCode(),
		})

		const savedWorkspace = await workspace.save()

		// 自动将创建者添加为管理员
		const member = new Member({
			userId: new mongoose.Types.ObjectId(data.userId),
			workspaceId: savedWorkspace._id,
			role: EMemberRole.ADMIN,
		})

		await member.save()

		const result = await Workspace.aggregate<IClientWorkspaceWithUserInfo>([
			{
				$match: {
					_id: savedWorkspace._id,
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "userInfo",
				},
			},
			{
				$project: {
					_id: 1,
					name: 1,
					image: 1,
					inviteCode: 1,
					createdAt: 1,
					updatedAt: 1,
					user: {
						// 重命名为user
						$let: {
							vars: { userDoc: { $arrayElemAt: ["$userInfo", 0] } },
							in: {
								_id: "$$userDoc._id",
								name: "$$userDoc.name",
								email: "$$userDoc.email",
							},
						},
					},
				},
			},
		])

		return result[0]
	} catch (error) {
		// 如果创建成员失败，尝试清理已创建的工作区
		if (error instanceof Error && error.message.includes("Member")) {
			try {
				await Workspace.findByIdAndDelete(data.userId)
			} catch (cleanupError) {
				console.error("清理工作区失败:", cleanupError)
			}
		}
		throw error
	}
}

// 更新工作区
export const updateWorkspace = async (
	workspaceId: string,
	updates: {
		name?: string
		image?: File | string // TODO image
	}
) => {
	await connectToDatabase()

	// 更新信息
	await Workspace.aggregate<IClientWorkspaceWithUserInfo>([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(workspaceId),
			},
		},
		{
			$set: updates,
		},
		{
			$merge: {
				into: "workspaces",
				whenMatched: "replace",
			},
		},
	])

	// 获取更新后的文档并关联用户信息
	const updatedResult = await Workspace.aggregate<IClientWorkspaceWithUserInfo>([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(workspaceId),
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "userInfo",
			},
		},
		{
			$project: {
				_id: 1,
				name: 1,
				image: 1,
				inviteCode: 1,
				createdAt: 1,
				updatedAt: 1,
				user: {
					$let: {
						vars: { userDoc: { $arrayElemAt: ["$userInfo", 0] } },
						in: {
							_id: "$$userDoc._id",
							name: "$$userDoc.name",
							email: "$$userDoc.email",
						},
					},
				},
			},
		},
	])

	return updatedResult[0]
}

// 删除工作区（级联删除）
export const deleteWorkspace = async (workspaceId: string) => {
	await connectToDatabase()

	const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId)

	// 删除相关任务
	await Task.deleteMany({ workspaceId: workspaceObjectId })

	// 删除相关项目
	await Project.deleteMany({ workspaceId: workspaceObjectId })

	// 删除相关成员
	await Member.deleteMany({ workspaceId: workspaceObjectId })

	// 删除工作区
	const workspace = await Workspace.findByIdAndDelete(workspaceId)

	return workspace
}

// 重置工作区邀请码
export const resetWorkspaceInviteCode = async (workspaceId: string) => {
	await connectToDatabase()

	return await Workspace.findByIdAndUpdate(workspaceId, { $set: { inviteCode: generateInviteCode() } }, { new: true })
}

// 通过邀请码加入工作区
export const joinWorkspaceByInviteCode = async (
	workspaceId: string,
	inviteCode: string,
	userId: string,
	role: MemberRoleType
): Promise<IClientWorkspace | null> => {
	await connectToDatabase()

	// 验证邀请码是否正确
	const result = await Workspace.aggregate<IClientWorkspace>([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(workspaceId),
				inviteCode,
			},
		},
	])

	const workspace = result[0]

	if (!workspace) {
		throw new Error("工作区不存在")
	}

	if (workspace.inviteCode !== inviteCode) {
		throw new Error("邀请码无效")
	}

	// 检查用户是否已经是成员
	const existingMember = await Member.findOne({
		workspaceId: new mongoose.Types.ObjectId(workspaceId),
		userId: new mongoose.Types.ObjectId(userId),
	}).lean()

	if (existingMember) {
		throw new Error("用户已经是该工作区的成员")
	}

	// 创建新成员
	const newMember = new Member({
		workspaceId: new mongoose.Types.ObjectId(workspaceId),
		userId: new mongoose.Types.ObjectId(userId),
		role,
	})

	await newMember.save()

	return workspace as unknown as IClientWorkspace
}
