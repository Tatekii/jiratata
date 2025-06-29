// MongoDB 示例数据生成脚本 - 使用Mongoose
// 用于在本地MongoDB实例中创建测试数据
// 使用方法: npx ts-node seed.ts

import bcrypt from "bcrypt"
import mongoose from "mongoose"
import { EMemberRole, ETaskStatus } from "../src/features/types"

// 导入现有的模型定义，避免重复定义schema
import { User, Workspace, Member, Project, Task, type IMongoUser, type IMongoMember } from "../src/models"

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
				role: EMemberRole.ADMIN,
			},
			{
				userId: users[1]._id,
				workspaceId: workspaces[0]._id,
				role: EMemberRole.MEMBER,
			},
			{
				userId: users[2]._id,
				workspaceId: workspaces[0]._id,
				role: EMemberRole.GUEST,
			},
			{
				userId: users[1]._id,
				workspaceId: workspaces[1]._id,
				role: EMemberRole.ADMIN,
			},
			{
				userId: users[0]._id,
				workspaceId: workspaces[1]._id,
				role: EMemberRole.MEMBER,
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
				status: ETaskStatus.IN_PROGRESS,
				position: 1000,
			},
			{
				name: "实现用户认证API",
				description: "开发JWT认证系统",
				workspaceId: workspaces[0]._id,
				projectId: projects[1]._id,
				dueDate: dueDate,
				assigneeId: members[0]._id, // 张三在开发团队
				status: ETaskStatus.TODO,
				position: 2000,
			},
			{
				name: "首页重构",
				description: "使用新的设计系统重构首页",
				workspaceId: workspaces[0]._id,
				projectId: projects[0]._id,
				dueDate: dueDate,
				assigneeId: members[1]._id, // 李四在开发团队
				status: ETaskStatus.BACKLOG,
				position: 3000,
			},
			{
				name: "编写API文档",
				description: "为新的API端点创建文档",
				workspaceId: workspaces[0]._id,
				projectId: projects[1]._id,
				dueDate: dueDate,
				assigneeId: members[2]._id, // 王五在开发团队
				status: ETaskStatus.DONE,
				position: 4000,
			},
		])
		console.log(`已创建 ${tasks.length} 个任务`)

		console.log("MongoDB 示例数据创建完成！")

		// 查询创建的数据示例
		console.log("\n数据验证:")

		// 查询李四的所有任务
		const lisiUser = users[1] as IMongoUser
		const lisiMember = (await Member.findOne({
			userId: lisiUser._id,
			workspaceId: workspaces[0]._id,
		})) as IMongoMember

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
		const todoTasks = await Task.find({ status: ETaskStatus.TODO })
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
