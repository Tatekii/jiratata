import "server-only"

import { EMemberRole, IClientMember } from "@/features/types"
import mongoose from "mongoose"

// 成员模型接口
export interface IMongoMember extends Omit<IClientMember, "userId" | "workspaceId">, mongoose.Document<string> {
	userId: mongoose.Types.ObjectId
	workspaceId: mongoose.Types.ObjectId
}

// 成员模式定义
const memberSchema = new mongoose.Schema<IMongoMember>(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "用户ID是必须的"],
		},
		workspaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Workspace",
			required: [true, "工作区ID是必须的"],
		},
		role: {
			type: String,
			enum: EMemberRole,
			default: EMemberRole.MEMBER,
			required: [true, "成员角色是必须的"],
		},
	},
	{
		timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
	}
)

// 为成员创建复合索引，确保用户在一个工作区内只有一个成员记录
memberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true })

// 确保这是第一次编译模型 - 已存在则复用，否则新建
export const Member = (mongoose.models.Member as mongoose.Model<IMongoMember>) || 
  mongoose.model<IMongoMember>('Member', memberSchema);

export default Member
