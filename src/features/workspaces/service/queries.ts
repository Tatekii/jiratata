import "server-only"
import { connectToDatabase } from "@/lib/mongodb"
import { Member, Workspace } from "@/models"
import mongoose from "mongoose"

export const getWorkspaces = async (userId: string) => {
	await connectToDatabase()

	// 验证用户ID格式
	if (!mongoose.Types.ObjectId.isValid(userId)) {
		return { documents: [], total: 0 }
	}

	// 查找用户参与的所有成员关系
	const members = await Member.find({ userId: new mongoose.Types.ObjectId(userId) })

	if (members.length === 0) {
		return { documents: [], total: 0 }
	}

	// 提取工作区ID
	const workspaceIds = members.map((member) => member.workspaceId)

	// 查找用户参与的所有工作区
	const workspaces = await Workspace.find({
		_id: { $in: workspaceIds }
	}).sort({ createdAt: -1 })

	return {
		documents: workspaces,
		total: workspaces.length
	}
}
