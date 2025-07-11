/**
 * MongoDB版本的任务服务辅助函数
 */
import { Task, Member } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { TaskStatusType, IClientTaskWithDetail } from "../types"

// 从models导入查询接口类型
interface TaskQuery {
	workspaceId: string
	projectId?: string
	assigneeId?: string
	status?: TaskStatusType
	search?: string
	dueDate?: string
}

// 任务过滤器类型
interface TaskFilter {
	workspaceId: mongoose.Types.ObjectId
	projectId?: mongoose.Types.ObjectId
	assigneeId?: mongoose.Types.ObjectId
	status?: TaskStatusType
	$or?: Array<{
		name?: { $regex: string; $options: string }
		description?: { $regex: string; $options: string }
	}>
	dueDate?: {
		$gte: Date
		$lt: Date
	}
}

// 任务更新数据类型
interface TaskUpdateData {
	name?: string
	description?: string
	status?: TaskStatusType
	dueDate?: Date
	position?: number
	assigneeId?: mongoose.Types.ObjectId
	projectId?: mongoose.Types.ObjectId
}

// 获取任务列表
export const getTasks = async (query: TaskQuery) => {
	await connectToDatabase()

	const filter: TaskFilter = {
		workspaceId: new mongoose.Types.ObjectId(query.workspaceId),
	}

	if (query.projectId) {
		filter.projectId = new mongoose.Types.ObjectId(query.projectId)
	}

	if (query.assigneeId) {
		filter.assigneeId = new mongoose.Types.ObjectId(query.assigneeId)
	}

	if (query.status) {
		filter.status = query.status
	}

	if (query.search) {
		filter.$or = [
			{ name: { $regex: query.search, $options: "i" } },
			{ description: { $regex: query.search, $options: "i" } },
		]
	}

	if (query.dueDate) {
		const date = new Date(query.dueDate)
		const nextDay = new Date(date)
		nextDay.setDate(date.getDate() + 1)

		filter.dueDate = {
			$gte: date,
			$lt: nextDay,
		}
	}

	const result = await Task.aggregate<IClientTaskWithDetail>([
		// 匹配过滤条件
		{ $match: filter },

		// 关联项目信息
		{
			$lookup: {
				from: "projects",
				localField: "projectId",
				foreignField: "_id",
				as: "project",
			},
		},

		// 关联分配者成员信息
		{
			$lookup: {
				from: "members",
				localField: "assigneeId",
				foreignField: "_id",
				as: "assigneeMember",
			},
		},

		// 关联分配者用户信息
		{
			$lookup: {
				from: "users",
				localField: "assigneeMember.userId",
				foreignField: "_id",
				as: "assigneeUser",
			},
		},

		// 重构输出结构
		{
			$project: {
				_id: 1,
				name: 1,
				description: 1,
				status: 1,
				dueDate: 1,
				position: 1,
				workspaceId: 1,
				projectId: 1,
				assigneeId: 1,
				createdAt: 1,
				updatedAt: 1,

				// 重构 project 字段
				project: {
					$let: {
						vars: { proj: { $arrayElemAt: ["$project", 0] } },
						in: {
							_id: "$$proj._id",
							name: "$$proj.name",
							image: "$$proj.image",
						},
					},
				},

				// 重构 assignee 字段
				assignee: {
					$let: {
						vars: {
							member: { $arrayElemAt: ["$assigneeMember", 0] },
							user: { $arrayElemAt: ["$assigneeUser", 0] },
						},
						in: {
							_id: "$$member._id",
							userId: "$$member.userId",
							role: "$$member.role",
							name: {
								$ifNull: ["$$user.name", "$$user.email"],
							},
							email: "$$user.email",
						},
					},
				},
			},
		},

		// 排序
		{ $sort: { position: 1, createdAt: -1 } },
	])

	return result
}

// 创建任务
export const createTask = async (data: {
	name: string
	description?: string
	workspaceId: string
	projectId: string
	assigneeId: string
	status: TaskStatusType
	dueDate: Date
}) => {
	await connectToDatabase()

	// 获取该状态下任务的最大position
	const lastTask = await Task.findOne({
		projectId: new mongoose.Types.ObjectId(data.projectId),
		status: data.status,
	}).sort({ position: -1 })

	const position = lastTask ? lastTask.position + 1000 : 1000

	const task = new Task({
		name: data.name,
		description: data.description,
		workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
		projectId: new mongoose.Types.ObjectId(data.projectId),
		assigneeId: new mongoose.Types.ObjectId(data.assigneeId),
		status: data.status,
		dueDate: data.dueDate,
		position,
	})

	return await task.save()
}

// 更新任务
export const updateTask = async (
	taskId: string,
	updates: {
		name?: string
		description?: string
		status?: TaskStatusType
		assigneeId?: string
		projectId?: string
		dueDate?: Date
		position?: number
	}
) => {
	await connectToDatabase()

	const updateData: TaskUpdateData = {}

	if (updates.name !== undefined) updateData.name = updates.name
	if (updates.description !== undefined) updateData.description = updates.description
	if (updates.status !== undefined) updateData.status = updates.status
	if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate
	if (updates.position !== undefined) updateData.position = updates.position

	if (updates.assigneeId) {
		updateData.assigneeId = new mongoose.Types.ObjectId(updates.assigneeId)
	}

	if (updates.projectId) {
		updateData.projectId = new mongoose.Types.ObjectId(updates.projectId)
	}

	const updatedTask = await Task.findByIdAndUpdate(taskId, { $set: updateData })

	if (!updatedTask) {
		return null
	}

	// 使用 aggregate 获取更新后的任务详情
	const result = await Task.aggregate<IClientTaskWithDetail>([
		// 匹配更新后的任务
		{ $match: { _id: new mongoose.Types.ObjectId(taskId) } },

		// 关联项目信息
		{
			$lookup: {
				from: "projects",
				localField: "projectId",
				foreignField: "_id",
				as: "project",
			},
		},

		// 关联分配者成员信息
		{
			$lookup: {
				from: "members",
				localField: "assigneeId",
				foreignField: "_id",
				as: "assigneeMember",
			},
		},

		// 关联分配者用户信息
		{
			$lookup: {
				from: "users",
				localField: "assigneeMember.userId",
				foreignField: "_id",
				as: "assigneeUser",
			},
		},

		// 重构输出结构
		{
			$project: {
				_id: 1,
				name: 1,
				description: 1,
				status: 1,
				dueDate: 1,
				position: 1,
				workspaceId: 1,
				projectId: 1,
				assigneeId: 1,
				createdAt: 1,
				updatedAt: 1,

				// 重构 project 字段
				project: {
					$let: {
						vars: { proj: { $arrayElemAt: ["$project", 0] } },
						in: {
							_id: "$$proj._id",
							name: "$$proj.name",
							image: "$$proj.image",
						},
					},
				},

				// 重构 assignee 字段
				assignee: {
					$let: {
						vars: {
							member: { $arrayElemAt: ["$assigneeMember", 0] },
							user: { $arrayElemAt: ["$assigneeUser", 0] },
						},
						in: {
							_id: "$$member._id",
							userId: "$$member.userId",
							role: "$$member.role",
							name: {
								$ifNull: ["$$user.name", "$$user.email"],
							},
							email: "$$user.email",
						},
					},
				},
			},
		},
	])

	return result[0] || null
}

// 删除任务
export const deleteTask = async (taskId: string) => {
	await connectToDatabase()

	return await Task.findByIdAndDelete(taskId)
}

// 批量更新任务位置
export const bulkUpdateTaskPositions = async (
	updates: Array<{ _id: string; status: TaskStatusType; position: number }>
) => {
	await connectToDatabase()

	try {
		for (const update of updates) {
			await Task.findByIdAndUpdate(update._id, {
				$set: {
					status: update.status,
					position: update.position,
				},
			})
		}
	} catch (error) {
		throw error
	}
}

// 检查用户是否有访问任务的权限
export const checkTaskAccess = async (taskId: string, userId: string): Promise<boolean> => {
	await connectToDatabase()

	const task = await Task.findById(taskId)
	if (!task) {
		return false
	}

	const member = await Member.findOne({
		workspaceId: task.workspaceId,
		userId: new mongoose.Types.ObjectId(userId),
	})

	return !!member
}

/**
 * 使用 aggregate 管道获取任务详情（包含 project 和 assignee 信息）
 */
export const getTaskById = async (taskId: string) => {
	await connectToDatabase()

	const result = await Task.aggregate<IClientTaskWithDetail>([
		// 匹配指定的任务
		{ $match: { _id: new mongoose.Types.ObjectId(taskId) } },

		// 关联项目信息
		{
			$lookup: {
				from: "projects", // Project 集合名
				localField: "projectId",
				foreignField: "_id",
				as: "project",
			},
		},

		// 关联分配者成员信息
		{
			$lookup: {
				from: "members", // Member 集合名
				localField: "assigneeId",
				foreignField: "_id",
				as: "assigneeMember",
			},
		},

		// 关联分配者用户信息
		{
			$lookup: {
				from: "users", // User 集合名
				localField: "assigneeMember.userId",
				foreignField: "_id",
				as: "assigneeUser",
			},
		},

		// 重构输出结构
		{
			$project: {
				// 保留任务的所有字段
				_id: 1,
				name: 1,
				description: 1,
				status: 1,
				dueDate: 1,
				position: 1,
				workspaceId: 1,
				projectId: 1,
				assigneeId: 1,
				createdAt: 1,
				updatedAt: 1,

				// 重命名并重构 project 字段
				project: {
					$arrayElemAt: ["$project", 0],
				},

				// 重命名并重构 assignee 字段
				assignee: {
					$mergeObjects: [
						{ $arrayElemAt: ["$assigneeMember", 0] },
						{
							name: {
								$ifNull: [
									{ $arrayElemAt: ["$assigneeUser.name", 0] },
									{ $arrayElemAt: ["$assigneeUser.email", 0] },
								],
							},
							email: { $arrayElemAt: ["$assigneeUser.email", 0] },
						},
					],
				},
			},
		},
	])

	return result[0] || null
}
