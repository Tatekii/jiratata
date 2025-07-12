import "server-only"
import mongoose from "mongoose"

// 评论模型接口
export interface IMongoComment extends mongoose.Document<string> {
	content: string
	taskId: mongoose.Types.ObjectId
	authorId: mongoose.Types.ObjectId
	workspaceId: mongoose.Types.ObjectId
	parentCommentId?: mongoose.Types.ObjectId // 支持回复评论
	mentions: mongoose.Types.ObjectId[] // @提及的用户
	isEdited: boolean
	editedAt?: Date
	isDeleted: boolean
	deletedAt?: Date
}

// 评论模式定义
const commentSchema = new mongoose.Schema<IMongoComment>(
	{
		content: {
			type: String,
			required: [true, "评论内容是必须的"],
			trim: true,
		},
		taskId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Task",
			required: [true, "任务ID是必须的"],
		},
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Member",
			required: [true, "作者ID是必须的"],
		},
		workspaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Workspace",
			required: [true, "工作区ID是必须的"],
		},
		parentCommentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
		},
		mentions: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Member",
		}],
		isEdited: {
			type: Boolean,
			default: false,
		},
		editedAt: {
			type: Date,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		deletedAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
)

// 为评论创建索引
commentSchema.index({ taskId: 1, createdAt: -1 })
commentSchema.index({ authorId: 1 })
commentSchema.index({ parentCommentId: 1 })
commentSchema.index({ workspaceId: 1 })
commentSchema.index({ isDeleted: 1 })

export const Comment =
	(mongoose.models.Comment as mongoose.Model<IMongoComment>) || 
	mongoose.model<IMongoComment>("Comment", commentSchema)

export default Comment
