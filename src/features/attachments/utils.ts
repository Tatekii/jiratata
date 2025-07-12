/**
 * 附件服务辅助函数
 */
import { Attachment } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

// 创建附件
export const createAttachment = async (data: {
	filename: string
	originalName: string
	mimeType: string
	size: number
	url: string
	entityType: 'TASK' | 'COMMENT' | 'PROJECT'
	entityId: string
	uploadedBy: string
	workspaceId: string
}) => {
	await connectToDatabase()

	const attachment = new Attachment({
		filename: data.filename,
		originalName: data.originalName,
		mimeType: data.mimeType,
		size: data.size,
		url: data.url,
		entityType: data.entityType,
		entityId: new mongoose.Types.ObjectId(data.entityId),
		uploadedBy: new mongoose.Types.ObjectId(data.uploadedBy),
		workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
	})

	return await attachment.save()
}

// 获取实体的附件列表
export const getAttachments = async (entityType: string, entityId: string) => {
	await connectToDatabase()

	const attachments = await Attachment.find({
		entityType,
		entityId: new mongoose.Types.ObjectId(entityId),
		isDeleted: false,
	})
		.populate('uploadedBy', 'name email avatar')
		.sort({ createdAt: -1 })

	return attachments
}

// 删除附件（软删除）
export const deleteAttachment = async (attachmentId: string, userId: string) => {
	await connectToDatabase()

	const attachment = await Attachment.findById(attachmentId)
	if (!attachment) {
		return null
	}

	// 检查权限（简化版本，实际应该检查工作区权限）
	if (attachment.uploadedBy.toString() !== userId) {
		throw new Error('Unauthorized')
	}

	attachment.isDeleted = true
	attachment.deletedAt = new Date()
	
	return await attachment.save()
}

// 获取附件详情
export const getAttachmentById = async (attachmentId: string) => {
	await connectToDatabase()

	return await Attachment.findById(attachmentId)
		.populate('uploadedBy', 'name email avatar')
}

// 检查用户对附件的访问权限
export const checkAttachmentAccess = async (attachmentId: string, userId: string): Promise<boolean> => {
	await connectToDatabase()

	const attachment = await Attachment.findById(attachmentId)
	if (!attachment) {
		return false
	}

	// 这里应该检查用户是否为对应工作区的成员
	// 简化实现，实际应该更复杂的权限检查
	const { Member } = await import('@/models')
	const member = await Member.findOne({
		workspaceId: attachment.workspaceId,
		userId: new mongoose.Types.ObjectId(userId),
	})

	return !!member
}
