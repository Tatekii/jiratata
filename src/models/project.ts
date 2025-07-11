import "server-only"
import mongoose from "mongoose"
import { IClientProject } from "@/features/types"

// 项目模型接口
export interface IMongoProject extends Omit<IClientProject, "workspaceId">, mongoose.Document<string> {
	workspaceId: mongoose.Types.ObjectId
}

// 项目模式定义
const projectSchema = new mongoose.Schema<IMongoProject>(
	{
		name: {
			type: String,
			required: [true, "项目名称是必须的"],
			trim: true,
		},
		workspaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Workspace",
			required: [true, "工作区ID是必须的"],
		},
		image: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
	}
)

// 为项目创建索引，提高查询性能
projectSchema.index({ workspaceId: 1 })

// 确保这是第一次编译模型 - 已存在则复用，否则新建
export const Project = (mongoose.models.Project as mongoose.Model<IMongoProject>) || 
  mongoose.model<IMongoProject>('Project', projectSchema);

export default Project
