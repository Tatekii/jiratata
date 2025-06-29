/**
 * MongoDB版本的成员服务辅助函数
 */
import { IMongoMember, IMongoUser, Member } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { EMemberRole, MemberRoleType } from "../types"

export interface IMongoMemberWithUserInfo extends Omit<IMongoMember, "userId"> {
	userId: Pick<IMongoUser, "_id" | "name" | "email">
}

// 获取工作区成员（带用户信息）
export const getWorkspaceMembers = async (workspaceId: string): Promise<IMongoMemberWithUserInfo[] | null> => {
	await connectToDatabase()

	return await Member.find({
		workspaceId,
	})
		.populate("userId", "_id name email")
		.sort({ createdAt: -1 })
}

// 获取特定用户在工作区的成员信息
export const getMemberByWorkspaceAndUser = async (
	workspaceId: string,
	userId: string
): Promise<IMongoMemberWithUserInfo | null> => {
	await connectToDatabase()

	return await Member.findOne({
		workspaceId,
		userId,
	}).populate<{ userId: Pick<IMongoUser, "_id" | "name" | "email"> }>("userId", "_id name email")
}

// 更新成员角色
export const updateMemberRole = async (memberId: string, role: MemberRoleType) => {
	await connectToDatabase()

	return await Member.findByIdAndUpdate(memberId, { $set: { role } }, { new: true }).populate(
		"userId",
		"_id name email"
	)
}

// 删除成员
export const removeMember = async (memberId: string) => {
	await connectToDatabase()

	return await Member.findByIdAndDelete(memberId)
}

// 检查用户是否有管理员权限
export const checkAdminPermission = async (workspaceId: string, userId: string): Promise<boolean> => {
	await connectToDatabase()

	const member = await Member.findOne({
		workspaceId,
		userId,
		role: EMemberRole.ADMIN,
	})

	return !!member
}

// 统计工作区成员数量
export const getWorkspaceMemberCount = async (workspaceId: string): Promise<number> => {
	await connectToDatabase()

	return await Member.countDocuments({
		workspaceId,
	})
}

// 检查用户是否为工作区成员
export const isMemberOfWorkspace = async (workspaceId: string, userId: string): Promise<boolean> => {
	await connectToDatabase()

	const member = await Member.findOne({
		workspaceId,
		userId,
	})

	return !!member
}

// 通过成员ID获取成员信息
export const getMemberById = async (memberId: string): Promise<IMongoMemberWithUserInfo | null> => {
	await connectToDatabase()

	return await Member.findById(memberId).populate<{ userId: Pick<IMongoUser, "_id" | "name" | "email"> }>(
		"userId",
		"_id name email"
	)
}
