import "server-only"
import { ETaskStatus, IClientTask } from "@/features/types"
import mongoose from "mongoose"

// 任务模型接口
export interface IMongoTask
	extends Omit<IClientTask, "workspaceId" | "projectId" | "assigneeId" | "dueDate">,
		mongoose.Document<string> {
	workspaceId: mongoose.Types.ObjectId
	projectId: mongoose.Types.ObjectId
	assigneeId: mongoose.Types.ObjectId
	dueDate: Date
}

// 任务模式定义
const taskSchema = new mongoose.Schema<IMongoTask>(
	{
		name: {
			type: String,
			required: [true, "任务名称是必须的"],
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		workspaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Workspace",
			required: [true, "工作区ID是必须的"],
		},
		projectId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
			required: [true, "项目ID是必须的"],
		},
		dueDate: {
			type: Date,
			required: [true, "截止日期是必须的"],
		},
		assigneeId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Member",
			required: [true, "负责人ID是必须的"],
		},
		status: {
			type: String,
			enum: Object.values(ETaskStatus),
			default: ETaskStatus.BACKLOG,
			required: [true, "任务状态是必须的"],
		},
		position: {
			type: Number,
			required: [true, "任务位置是必须的"],
			default: 0,
		},
	},
	{
		timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
	}
)

// 为任务创建索引，提高查询性能
taskSchema.index({ workspaceId: 1 })
taskSchema.index({ projectId: 1 })
taskSchema.index({ projectId: 1, status: 1 })
taskSchema.index({ assigneeId: 1, status: 1 })

// 确保这是第一次编译模型 - 已存在则复用，否则新建
export const Task =
	(mongoose.models.Task as mongoose.Model<IMongoTask>) || mongoose.model<IMongoTask>("Task", taskSchema)

export default Task
