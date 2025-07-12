import "server-only"
import mongoose from "mongoose"

// 活动日志模型接口
export interface IMongoActivityLog extends mongoose.Document<string> {
	entityType: 'TASK' | 'PROJECT' | 'COMMENT' | 'ATTACHMENT'
	entityId: mongoose.Types.ObjectId
	action: string // 'created', 'updated', 'deleted', 'assigned', 'status_changed', etc.
	actorId: mongoose.Types.ObjectId
	workspaceId: mongoose.Types.ObjectId
	targetUserId?: mongoose.Types.ObjectId // 目标用户（如分配任务时）
	changes?: {
		field: string
		oldValue: unknown
		newValue: unknown
	}[]
	metadata?: Record<string, unknown>
}

// 活动日志模式定义
const activityLogSchema = new mongoose.Schema<IMongoActivityLog>(
	{
		entityType: {
			type: String,
			enum: ['TASK', 'PROJECT', 'COMMENT', 'ATTACHMENT'],
			required: [true, "实体类型是必须的"],
		},
		entityId: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "实体ID是必须的"],
		},
		action: {
			type: String,
			required: [true, "操作类型是必须的"],
		},
		actorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Member",
			required: [true, "操作者ID是必须的"],
		},
		workspaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Workspace",
			required: [true, "工作区ID是必须的"],
		},
		targetUserId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Member",
		},
		changes: [{
			field: {
				type: String,
				required: true,
			},
			oldValue: mongoose.Schema.Types.Mixed,
			newValue: mongoose.Schema.Types.Mixed,
		}],
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
	}
)

// 为活动日志创建索引
activityLogSchema.index({ workspaceId: 1, createdAt: -1 })
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })
activityLogSchema.index({ actorId: 1, createdAt: -1 })
activityLogSchema.index({ targetUserId: 1, createdAt: -1 })

export const ActivityLog =
	(mongoose.models.ActivityLog as mongoose.Model<IMongoActivityLog>) || 
	mongoose.model<IMongoActivityLog>("ActivityLog", activityLogSchema)

export default ActivityLog
