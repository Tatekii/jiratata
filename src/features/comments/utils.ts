/**
 * 评论服务辅助函数
 */
import { Comment, ActivityLog } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { IClientComment } from "../types"

// 创建评论
export const createComment = async (data: {
	content: string
	taskId: string
	authorId: string
	workspaceId: string
	parentCommentId?: string
	mentions?: string[]
}) => {
	await connectToDatabase()

	const commentData: {
		content: string
		taskId: mongoose.Types.ObjectId
		authorId: mongoose.Types.ObjectId
		workspaceId: mongoose.Types.ObjectId
		mentions: mongoose.Types.ObjectId[]
		parentCommentId?: mongoose.Types.ObjectId
	} = {
		content: data.content,
		taskId: new mongoose.Types.ObjectId(data.taskId),
		authorId: new mongoose.Types.ObjectId(data.authorId),
		workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
		mentions: (data.mentions || []).map(id => new mongoose.Types.ObjectId(id)),
	}

	if (data.parentCommentId) {
		commentData.parentCommentId = new mongoose.Types.ObjectId(data.parentCommentId)
	}

	const comment = new Comment(commentData)
	const savedComment = await comment.save()

	// 记录活动日志
	const log = new ActivityLog({
		entityType: 'COMMENT',
		entityId: savedComment._id,
		action: 'created',
		actorId: new mongoose.Types.ObjectId(data.authorId),
		workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
		metadata: {
			taskId: data.taskId,
			parentCommentId: data.parentCommentId,
		},
	})
	await log.save()

	return savedComment
}

// 获取任务的评论列表
export const getComments = async (taskId: string) => {
	await connectToDatabase()

	const comments = await Comment.aggregate<IClientComment>([
		{
			$match: {
				taskId: new mongoose.Types.ObjectId(taskId),
				isDeleted: false,
			}
		},
		
		// 关联作者成员信息
		{
			$lookup: {
				from: "members",
				localField: "authorId",
				foreignField: "_id",
				as: "authorMember",
			},
		},

		// 关联作者用户信息
		{
			$lookup: {
				from: "users",
				localField: "authorMember.userId",
				foreignField: "_id",
				as: "authorUser",
			},
		},

		// 关联附件信息
		{
			$lookup: {
				from: "attachments",
				let: { commentId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $eq: ["$entityId", "$$commentId"] },
									{ $eq: ["$entityType", "COMMENT"] },
									{ $eq: ["$isDeleted", false] }
								]
							}
						}
					}
				],
				as: "attachments",
			},
		},

		// 重构输出结构
		{
			$project: {
				_id: 1,
				content: 1,
				taskId: 1,
				authorId: 1,
				parentCommentId: 1,
				mentions: 1,
				isEdited: 1,
				editedAt: 1,
				createdAt: 1,
				updatedAt: 1,

				// 作者信息
				author: {
					$let: {
						vars: {
							member: { $arrayElemAt: ["$authorMember", 0] },
							user: { $arrayElemAt: ["$authorUser", 0] },
						},
						in: {
							_id: "$$member._id",
							userId: "$$member.userId",
							role: "$$member.role",
							name: {
								$ifNull: ["$$user.name", "$$user.email"],
							},
							email: "$$user.email",
							avatar: "$$user.avatar",
						},
					},
				},

				// 附件信息
				attachments: 1,
			},
		},

		// 排序：顶级评论按时间排序，回复紧跟父评论
		{
			$sort: {
				parentCommentId: 1,
				createdAt: 1,
			}
		},
	])

	return comments
}

// 更新评论
export const updateComment = async (
	commentId: string,
	content: string,
	userId: string
) => {
	await connectToDatabase()

	const comment = await Comment.findById(commentId)
	if (!comment) {
		return null
	}

	// 检查权限
	if (comment.authorId.toString() !== userId) {
		throw new Error('Unauthorized')
	}

	comment.content = content
	comment.isEdited = true
	comment.editedAt = new Date()

	return await comment.save()
}

// 删除评论（软删除）
export const deleteComment = async (commentId: string, userId: string) => {
	await connectToDatabase()

	const comment = await Comment.findById(commentId)
	if (!comment) {
		return null
	}

	// 检查权限
	if (comment.authorId.toString() !== userId) {
		throw new Error('Unauthorized')
	}

	comment.isDeleted = true
	comment.deletedAt = new Date()

	return await comment.save()
}

// 检查用户对评论的访问权限
export const checkCommentAccess = async (commentId: string, userId: string): Promise<boolean> => {
	await connectToDatabase()

	const comment = await Comment.findById(commentId)
	if (!comment) {
		return false
	}

	const { Member } = await import('@/models')
	const member = await Member.findOne({
		workspaceId: comment.workspaceId,
		userId: new mongoose.Types.ObjectId(userId),
	})

	return !!member
}
