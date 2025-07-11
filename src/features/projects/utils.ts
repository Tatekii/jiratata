/**
 * MongoDB版本的项目服务辅助函数
 */
import { Project, Member, Task } from "@/models"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { ETaskStatus, IClientProject, IProjectAnalytics } from "../types"

// 获取工作区的所有项目
export const getWorkspaceProjects = async (workspaceId: string) => {
	await connectToDatabase()

	return (await Project.find({
		workspaceId,
	})
		.sort({ createdAt: -1 })
		.lean()) as unknown as IClientProject[]
}

// 创建项目
export const createProject = async (data: Pick<IClientProject, "name" | "workspaceId" | "image">) => {
	await connectToDatabase()

	const project = new Project({
		name: data.name,
		workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
		image: data.image,
	})

	const savedProject = await project.save()
	
	return savedProject.toObject() as unknown as IClientProject
}

// 获取单个项目
export const getProjectById = async (projectId: string) => {
	await connectToDatabase()

	return (await Project.findById(projectId).lean()) as unknown as IClientProject
}

// 更新项目
export const updateProject = async (projectId: string, updates: Partial<Pick<IClientProject, "name" | "image">>) => {
	await connectToDatabase()

	return (await Project.findByIdAndUpdate(
		projectId,
		{ $set: updates },
		{ new: true }
	).lean()) as unknown as IClientProject
}

// 删除项目（级联删除任务）
export const deleteProject = async (projectId: string) => {
	await connectToDatabase()

	const projectObjectId = new mongoose.Types.ObjectId(projectId)

	// 删除项目下的所有任务
	await Task.deleteMany({ projectId: projectObjectId })

	// 删除项目
	const project = await Project.findByIdAndDelete(projectId)

	return project
}

// 获取项目统计信息
export const getProjectAnalytics = async (projectId: string, userId: string): Promise<IProjectAnalytics> => {
	await connectToDatabase()

	const { startOfMonth, endOfMonth, subMonths } = await import("date-fns")

	const projectObjectId = new mongoose.Types.ObjectId(projectId)
	const userObjectId = new mongoose.Types.ObjectId(userId)

	// 获取项目和成员信息
	const project = await Project.findById(projectId)

	if (!project) {
		throw new Error("Project not found")
	}

	const member = await Member.findOne({
		workspaceId: project.workspaceId,
		userId: userObjectId,
	})

	if (!member) {
		throw new Error("User is not a member of this workspace")
	}

	const now = new Date()
	const thisMonthStart = startOfMonth(now)
	const thisMonthEnd = endOfMonth(now)
	const lastMonthStart = startOfMonth(subMonths(now, 1))
	const lastMonthEnd = endOfMonth(subMonths(now, 1))

	// 获取本月任务数据
	const thisMonthTasks = await Task.countDocuments({
		projectId: projectObjectId,
		createdAt: {
			$gte: thisMonthStart,
			$lte: thisMonthEnd,
		},
	})

	// 获取上月任务数据
	const lastMonthTasks = await Task.countDocuments({
		projectId: projectObjectId,
		createdAt: {
			$gte: lastMonthStart,
			$lte: lastMonthEnd,
		},
	})

	const taskCount = thisMonthTasks
	const taskDifference = taskCount - lastMonthTasks

	// 获取本月分配给当前用户的任务
	const thisMonthAssignedTasks = await Task.countDocuments({
		projectId: projectObjectId,
		assigneeId: member._id,
		createdAt: {
			$gte: thisMonthStart,
			$lte: thisMonthEnd,
		},
	})

	// 获取上月分配给当前用户的任务
	const lastMonthAssignedTasks = await Task.countDocuments({
		projectId: projectObjectId,
		assigneeId: member._id,
		createdAt: {
			$gte: lastMonthStart,
			$lte: lastMonthEnd,
		},
	})

	const assignedTaskCount = thisMonthAssignedTasks
	const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTasks

	// 获取本月未完成任务
	const thisMonthIncompleteTasks = await Task.countDocuments({
		projectId: projectObjectId,
		status: { $ne: ETaskStatus.DONE },
		createdAt: {
			$gte: thisMonthStart,
			$lte: thisMonthEnd,
		},
	})

	// 获取上月未完成任务
	const lastMonthIncompleteTasks = await Task.countDocuments({
		projectId: projectObjectId,
		status: { $ne: ETaskStatus.DONE },
		createdAt: {
			$gte: lastMonthStart,
			$lte: lastMonthEnd,
		},
	})

	const incompleteTaskCount = thisMonthIncompleteTasks
	const incompleteTaskDifference = incompleteTaskCount - lastMonthIncompleteTasks

	// 获取本月已完成任务
	const thisMonthCompletedTasks = await Task.countDocuments({
		projectId: projectObjectId,
		status: ETaskStatus.DONE,
		createdAt: {
			$gte: thisMonthStart,
			$lte: thisMonthEnd,
		},
	})

	// 获取上月已完成任务
	const lastMonthCompletedTasks = await Task.countDocuments({
		projectId: projectObjectId,
		status: ETaskStatus.DONE,
		createdAt: {
			$gte: lastMonthStart,
			$lte: lastMonthEnd,
		},
	})

	const completedTaskCount = thisMonthCompletedTasks
	const completedTaskDifference = completedTaskCount - lastMonthCompletedTasks

	// 获取本月过期任务
	const thisMonthOverdueTasks = await Task.countDocuments({
		projectId: projectObjectId,
		status: { $ne: ETaskStatus.DONE },
		dueDate: { $lt: now },
		createdAt: {
			$gte: thisMonthStart,
			$lte: thisMonthEnd,
		},
	})

	// 获取上月过期任务
	const lastMonthOverdueTasks = await Task.countDocuments({
		projectId: projectObjectId,
		status: { $ne: ETaskStatus.DONE },
		dueDate: { $lt: now },
		createdAt: {
			$gte: lastMonthStart,
			$lte: lastMonthEnd,
		},
	})

	const overdueTaskCount = thisMonthOverdueTasks
	const overdueTaskDifference = overdueTaskCount - lastMonthOverdueTasks

	return {
		taskCount,
		taskDifference,
		assignedTaskCount,
		assignedTaskDifference,
		completedTaskCount,
		completedTaskDifference,
		incompleteTaskCount,
		incompleteTaskDifference,
		overdueTaskCount,
		overdueTaskDifference,
	}
}

// 检查用户是否为项目所在工作区的成员
export const checkProjectAccess = async (projectId: string, userId: string): Promise<boolean> => {
	await connectToDatabase()

	const project = await Project.findById(projectId)
	if (!project) {
		return false
	}

	const member = await Member.findOne({
		workspaceId: project.workspaceId,
		userId: new mongoose.Types.ObjectId(userId),
	})

	return !!member
}
