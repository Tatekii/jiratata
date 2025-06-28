// MongoDB 示例数据生成脚本 - 使用Mongoose
// 用于在本地MongoDB实例中创建测试数据
// 使用方法: npx ts-node seed-mongodb.ts

// 数据库模型定义文件
// 包含所有Mongoose模型的Schema定义

import bcrypt from "bcrypt"
import mongoose, { Document, Schema } from "mongoose"

// 任务状态枚举
export enum TaskStatus {
	BACKLOG = "BACKLOG",
	TODO = "TODO",
	IN_PROGRESS = "IN_PROGRESS",
	IN_REVIEW = "IN_REVIEW",
	DONE = "DONE",
}

// 成员角色枚举
export enum MemberRole {
	ADMIN = "ADMIN",
	MEMBER = "MEMBER",
	GUEST = "GUEST",
}

// 用户接口定义
export interface IUser extends Document {
	name?: string
	email: string
	password: string
	createdAt: Date
	updatedAt: Date
}

// 工作区接口定义
export interface IWorkspace extends Document {
	name: string
	userId: mongoose.Types.ObjectId
	imageUrl?: string
	inviteCode: string
	createdAt: Date
	updatedAt: Date
}

// 成员接口定义
export interface IMember extends Document {
	userId: mongoose.Types.ObjectId
	workspaceId: mongoose.Types.ObjectId
	role: MemberRole
	createdAt: Date
	updatedAt: Date
}

// 项目接口定义
export interface IProject extends Document {
	name: string
	workspaceId: mongoose.Types.ObjectId
	imageUrl?: string
	createdAt: Date
	updatedAt: Date
}

// 任务接口定义
export interface ITask extends Document {
	name: string
	description?: string
	workspaceId: mongoose.Types.ObjectId
	projectId: mongoose.Types.ObjectId
	dueDate: Date
	assigneeId: mongoose.Types.ObjectId
	status: TaskStatus
	position: number
	createdAt: Date
	updatedAt: Date
}

// 文件接口定义
export interface IFile extends Document {
	filename: string
	contentType?: string
	size?: number
	url?: string
	uploadDate: Date
}

// 定义用户模型
const userSchema = new Schema<IUser>(
	{
		name: String,
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true, // 自动管理 createdAt 和 updatedAt
	}
)

// 定义工作区模型
const workspaceSchema = new Schema<IWorkspace>(
	{
		name: {
			type: String,
			required: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		imageUrl: String,
		inviteCode: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
	}
)

// 定义成员模型
const memberSchema = new Schema<IMember>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		workspaceId: {
			type: Schema.Types.ObjectId,
			ref: "Workspace",
			required: true,
		},
		role: {
			type: String,
			enum: Object.values(MemberRole),
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

// 添加复合索引确保用户在工作区中的唯一性
memberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true })

// 定义项目模型
const projectSchema = new Schema<IProject>(
	{
		name: {
			type: String,
			required: true,
		},
		workspaceId: {
			type: Schema.Types.ObjectId,
			ref: "Workspace",
			required: true,
		},
		imageUrl: String,
	},
	{
		timestamps: true,
	}
)

// 项目按工作区索引
projectSchema.index({ workspaceId: 1 })

// 定义任务模型
const taskSchema = new Schema<ITask>(
	{
		name: {
			type: String,
			required: true,
		},
		description: String,
		workspaceId: {
			type: Schema.Types.ObjectId,
			ref: "Workspace",
			required: true,
		},
		projectId: {
			type: Schema.Types.ObjectId,
			ref: "Project",
			required: true,
		},
		dueDate: {
			type: Date,
			required: true,
		},
		assigneeId: {
			type: Schema.Types.ObjectId,
			ref: "Member",
			required: true,
		},
		status: {
			type: String,
			enum: Object.values(TaskStatus),
			required: true,
		},
		position: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

// 添加任务索引
taskSchema.index({ workspaceId: 1 })
taskSchema.index({ projectId: 1 })
taskSchema.index({ projectId: 1, status: 1 })
taskSchema.index({ assigneeId: 1, status: 1 })

// 定义文件模型
const fileSchema = new Schema<IFile>({
	filename: {
		type: String,
		required: true,
	},
	contentType: String,
	size: Number,
	url: String,
	uploadDate: {
		type: Date,
		default: Date.now,
	},
})

// 创建并导出模型
export const User = mongoose.model<IUser>("User", userSchema)
export const Workspace = mongoose.model<IWorkspace>("Workspace", workspaceSchema)
export const Member = mongoose.model<IMember>("Member", memberSchema)
export const Project = mongoose.model<IProject>("Project", projectSchema)
export const Task = mongoose.model<ITask>("Task", taskSchema)
export const File = mongoose.model<IFile>("File", fileSchema)

// 生成随机邀请码
export function generateInviteCode(): string {
	return Math.random().toString(36).substring(2, 10).toUpperCase()
}


// 连接URL
const url = "mongodb://localhost:27017/jiratata_dev"

async function seedMongoDB(): Promise<void> {
	try {
		// 连接到MongoDB
		await mongoose.connect(url)
		console.log("已成功连接到MongoDB")

		// 清空现有数据
		await User.deleteMany({})
		await Workspace.deleteMany({})
		await Member.deleteMany({})
		await Project.deleteMany({})
		await Task.deleteMany({})
		console.log("已清空现有数据")

		// 创建示例用户
		const hashedPassword = await bcrypt.hash("password123", 10)

		const users = await User.create([
			{
				name: "张三",
				email: "zhangsan@example.com",
				password: hashedPassword,
			},
			{
				name: "李四",
				email: "lisi@example.com",
				password: hashedPassword,
			},
			{
				name: "王五",
				email: "wangwu@example.com",
				password: hashedPassword,
			},
		])
		console.log(`已创建 ${users.length} 个用户`)

		// 创建工作区
		const workspaces = await Workspace.create([
			{
				name: "开发团队",
				userId: users[0]._id,
				imageUrl: "https://placeholder.com/150",
				inviteCode: generateInviteCode(),
			},
			{
				name: "设计团队",
				userId: users[1]._id,
				imageUrl: "https://placeholder.com/150",
				inviteCode: generateInviteCode(),
			},
		])
		console.log(`已创建 ${workspaces.length} 个工作区`)

		// 创建成员关系
		const members = await Member.create([
			{
				userId: users[0]._id,
				workspaceId: workspaces[0]._id,
				role: MemberRole.ADMIN,
			},
			{
				userId: users[1]._id,
				workspaceId: workspaces[0]._id,
				role: MemberRole.MEMBER,
			},
			{
				userId: users[2]._id,
				workspaceId: workspaces[0]._id,
				role: MemberRole.GUEST,
			},
			{
				userId: users[1]._id,
				workspaceId: workspaces[1]._id,
				role: MemberRole.ADMIN,
			},
			{
				userId: users[0]._id,
				workspaceId: workspaces[1]._id,
				role: MemberRole.MEMBER,
			},
		])
		console.log(`已创建 ${members.length} 个成员关系`)

		// 创建项目
		const projects = await Project.create([
			{
				name: "网站重构",
				workspaceId: workspaces[0]._id,
				imageUrl: "https://placeholder.com/150",
			},
			{
				name: "API开发",
				workspaceId: workspaces[0]._id,
				imageUrl: "https://placeholder.com/150",
			},
			{
				name: "用户界面设计",
				workspaceId: workspaces[1]._id,
				imageUrl: "https://placeholder.com/150",
			},
		])
		console.log(`已创建 ${projects.length} 个项目`)

		// 创建任务
		const dueDate = new Date()
		dueDate.setDate(dueDate.getDate() + 7) // 7天后的日期

		const tasks = await Task.create([
			{
				name: "设计登录页面",
				description: "创建新的登录界面设计，包括移动端适配",
				workspaceId: workspaces[1]._id,
				projectId: projects[2]._id,
				dueDate: dueDate,
				assigneeId: members[3]._id, // 李四在设计团队
				status: TaskStatus.IN_PROGRESS,
				position: 1000,
			},
			{
				name: "实现用户认证API",
				description: "开发JWT认证系统",
				workspaceId: workspaces[0]._id,
				projectId: projects[1]._id,
				dueDate: dueDate,
				assigneeId: members[0]._id, // 张三在开发团队
				status: TaskStatus.TODO,
				position: 2000,
			},
			{
				name: "首页重构",
				description: "使用新的设计系统重构首页",
				workspaceId: workspaces[0]._id,
				projectId: projects[0]._id,
				dueDate: dueDate,
				assigneeId: members[1]._id, // 李四在开发团队
				status: TaskStatus.BACKLOG,
				position: 3000,
			},
			{
				name: "编写API文档",
				description: "为新的API端点创建文档",
				workspaceId: workspaces[0]._id,
				projectId: projects[1]._id,
				dueDate: dueDate,
				assigneeId: members[2]._id, // 王五在开发团队
				status: TaskStatus.DONE,
				position: 4000,
			},
		])
		console.log(`已创建 ${tasks.length} 个任务`)

		console.log("MongoDB 示例数据创建完成！")

		// 查询创建的数据示例
		console.log("\n数据验证:")

		// 查询李四的所有任务
		const lisiUser = users[1] as IUser
		const lisiMember = (await Member.findOne({
			userId: lisiUser._id,
			workspaceId: workspaces[0]._id,
		})) as IMember

		const lisiTasks = await Task.find({ assigneeId: lisiMember._id })
			.populate("projectId", "name")
			.select("name status")

		console.log("\n李四的任务:")
		console.log(
			lisiTasks.map((task) => ({
				name: task.name,
				status: task.status,
				project: task.projectId,
			}))
		)

		// 查询开发团队的所有项目
		const devProjects = await Project.find({ workspaceId: workspaces[0]._id }).select("name")
		console.log("\n开发团队的项目:")
		console.log(devProjects.map((project) => project.name))

		// 查询所有状态为TODO的任务
		const todoTasks = await Task.find({ status: TaskStatus.TODO })
			.populate("assigneeId")
			.populate("projectId", "name")

		console.log(
			todoTasks.map((task) => ({
				name: task.name,
				project: task.projectId,
				assignee: task.assigneeId,
			}))
		)
	} catch (err) {
		console.error("创建示例数据时出错:", err)
	} finally {
		// 关闭连接
		await mongoose.disconnect()
		console.log("MongoDB连接已关闭")
	}
}

// 执行数据填充
seedMongoDB().catch(console.error)
