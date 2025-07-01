import "server-only"

import mongoose from "mongoose"
import { IClientWorkspace } from "@/features/types"

// 工作区模型接口
export interface IMongoWorkspace extends Omit<IClientWorkspace, "userId">, mongoose.Document<string> {
	userId: mongoose.Types.ObjectId
}

// 工作区模式定义
const workspaceSchema = new mongoose.Schema<IMongoWorkspace>(
	{
		name: {
			type: String,
			required: [true, "工作区名称是必须的"],
			trim: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "用户ID是必须的"],
		},
		imageUrl: {
			type: String,
			default: null,
		},
		inviteCode: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
	}
)

// 为工作区创建索引，提高查询性能
workspaceSchema.index({ userId: 1 })
workspaceSchema.index({ inviteCode: 1 }, { unique: true })

// 确保这是第一次编译模型 - 已存在则复用，否则新建
export const Workspace = (mongoose.models.Workspace as mongoose.Model<IMongoWorkspace>) || 
  mongoose.model<IMongoWorkspace>('Workspace', workspaceSchema);

export default Workspace
