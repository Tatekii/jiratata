/**
 * MongoDB版本的成员服务辅助函数
 */
import { Member } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import { EMemberRole, IClientMember, IClientUser, MemberRoleType } from "../types"
import mongoose from "mongoose"

export interface IClientMemberWithUserInfo extends IClientMember {
	user: IClientUser
}

// 获取工作区成员（带用户信息）
export const getWorkspaceMembers = async (workspaceId: string) => {
	await connectToDatabase()

	const members = await Member.aggregate<IClientMemberWithUserInfo>([
		{
			$match: {
				workspaceId: new mongoose.Types.ObjectId(workspaceId),
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user",
				pipeline: [
					{
						$project: {
							_id: 1,
							name: 1,
							email: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$user",
		},
		{
			$sort: {
				createdAt: -1,
			},
		},
	])

	return members
}

// 获取特定用户在工作区的成员信息
export const getMemberByWorkspaceAndUser = async (
	workspaceId: string,
	userId: string
): Promise<IClientMemberWithUserInfo | null> => {
	await connectToDatabase()

	const members = await Member.aggregate([
		{
			$match: {
				workspaceId: new mongoose.Types.ObjectId(workspaceId),
				userId: new mongoose.Types.ObjectId(userId),
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user",
				pipeline: [
					{
						$project: {
							_id: 1,
							name: 1,
							email: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$user",
		},
	])

	return members[0] || null
}

// 更新成员角色
export const updateMemberRole = async (memberId: string, role: MemberRoleType) => {
	await connectToDatabase()

	// 更新角色
	await Member.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(memberId),
			},
		},
		{
			$set: {
				role: role,
			},
		},
		{
			$merge: {
				into: "members",
				whenMatched: "replace",
			},
		},
	])

	// Get the updated member with user info
	const updatedMember = await Member.aggregate<IClientMemberWithUserInfo>([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(memberId),
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user",
				pipeline: [
					{
						$project: {
							_id: 1,
							name: 1,
							email: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$user",
		},
	])

	return updatedMember[0] || null
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
		workspaceId: new mongoose.Types.ObjectId(workspaceId),
		userId: new mongoose.Types.ObjectId(userId),
		role: EMemberRole.ADMIN,
	})

	return !!member
}

// 统计工作区成员数量
export const getWorkspaceMemberCount = async (workspaceId: string): Promise<number> => {
	await connectToDatabase()

	return await Member.countDocuments({
		workspaceId: new mongoose.Types.ObjectId(workspaceId),
	})
}

// 检查用户是否为工作区成员
export const isMemberOfWorkspace = async (workspaceId: string, userId: string): Promise<boolean> => {
	await connectToDatabase()

	const member = await Member.findOne({
		workspaceId: new mongoose.Types.ObjectId(workspaceId),
		userId: new mongoose.Types.ObjectId(userId),
	})

	return !!member
}

// 通过成员ID获取成员信息
export const getMemberById = async (memberId: string) => {
	await connectToDatabase()

	const members = await Member.aggregate<IClientMemberWithUserInfo>([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(memberId),
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user",
				pipeline: [
					{
						$project: {
							_id: 1,
							name: 1,
							email: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$user",
		},
	])

	return members[0] || null
}
