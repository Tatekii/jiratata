import "server-only"
import mongoose from "mongoose"

// 附件模型接口
export interface IMongoAttachment extends mongoose.Document<string> {
	filename: string
	originalName: string
	mimeType: string
	size: number
	url: string
	entityType: 'TASK' | 'COMMENT' | 'PROJECT'
	entityId: mongoose.Types.ObjectId
	uploadedBy: mongoose.Types.ObjectId
	workspaceId: mongoose.Types.ObjectId
	isDeleted: boolean
	deletedAt?: Date
}

// 附件模式定义
const attachmentSchema = new mongoose.Schema<IMongoAttachment>(
	{
		filename: {
			type: String,
			required: [true, "文件名是必须的"],
			trim: true,
		},
		originalName: {
			type: String,
			required: [true, "原始文件名是必须的"],
			trim: true,
		},
		mimeType: {
			type: String,
			required: [true, "文件类型是必须的"],
		},
		size: {
			type: Number,
			required: [true, "文件大小是必须的"],
			min: 0,
		},
		url: {
			type: String,
			required: [true, "文件URL是必须的"],
		},
		entityType: {
			type: String,
			enum: ['TASK', 'COMMENT', 'PROJECT'],
			required: [true, "关联实体类型是必须的"],
		},
		entityId: {
			type: mongoose.Schema.Types.ObjectId,
			required: [true, "关联实体ID是必须的"],
		},
		uploadedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Member",
			required: [true, "上传者ID是必须的"],
		},
		workspaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Workspace",
			required: [true, "工作区ID是必须的"],
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

// 为附件创建索引
attachmentSchema.index({ entityType: 1, entityId: 1 })
attachmentSchema.index({ workspaceId: 1 })
attachmentSchema.index({ uploadedBy: 1 })
attachmentSchema.index({ createdAt: -1 })
attachmentSchema.index({ isDeleted: 1 })

// 虚拟字段：获取文件扩展名
attachmentSchema.virtual('extension').get(function() {
	return this.originalName.split('.').pop()?.toLowerCase()
})

// 虚拟字段：格式化文件大小
attachmentSchema.virtual('formattedSize').get(function() {
	const bytes = this.size
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
})

export const Attachment =
	(mongoose.models.Attachment as mongoose.Model<IMongoAttachment>) || 
	mongoose.model<IMongoAttachment>("Attachment", attachmentSchema)

export default Attachment
