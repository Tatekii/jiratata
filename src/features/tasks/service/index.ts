import { z } from "zod"
import { Hono } from "hono"
import { ID, Query } from "node-appwrite"
import { zValidator } from "@hono/zod-validator"

import { getMember } from "@/features/members/utils"

import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID } from "@/config"
import { authSessionMiddleware } from "@/lib/hono-middleware"
import { AppVariables } from "@/app/api/[[...route]]/route"
import { ETaskStatus, TProject, TTask } from "@/features/types"
import { createAdminClient } from "@/lib/hono"
import { localeMiddleware, localeValidatorMiddleware } from "@/app/api/[[...route]]/middlewares"
import { buildCreateTaskSchema, buildUpdateTaskSchema } from "../schemas"

const app = new Hono<{ Variables: AppVariables }>()
	.delete("/:taskId", authSessionMiddleware, async (c) => {
		const user = c.get("user")
		const databases = c.get("databases")
		const { taskId } = c.req.param()

		const task = await databases.getDocument<TTask>(DATABASE_ID, TASKS_ID, taskId)

		const member = await getMember({
			databases,
			workspaceId: task.workspaceId,
			userId: user.$id,
		})

		if (!member) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		await databases.deleteDocument(DATABASE_ID, TASKS_ID, taskId)

		return c.json({ data: { $id: task.$id } })
	})
	.get(
		"/",
		authSessionMiddleware,
		zValidator(
			"query",
			z.object({
				workspaceId: z.string(),
				projectId: z.string().nullish(),
				assigneeId: z.string().nullish(),
				status: z.nativeEnum(ETaskStatus).nullish(),
				search: z.string().nullish(),
				dueDate: z.string().nullish(),
			})
		),
		async (c) => {
			const { users } = await createAdminClient()
			const databases = c.get("databases")
			const user = c.get("user")

			const { workspaceId, projectId, status, search, assigneeId, dueDate } = c.req.valid("query")

			const member = await getMember({
				databases,
				workspaceId,
				userId: user.$id,
			})

			if (!member) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const query = [Query.equal("workspaceId", workspaceId), Query.orderDesc("$createdAt")]

			if (projectId) {
				console.log("projectId: ", projectId)
				query.push(Query.equal("projectId", projectId))
			}

			if (status) {
				console.log("status: ", status)
				query.push(Query.equal("status", status))
			}

			if (assigneeId) {
				console.log("assigneeId: ", assigneeId)
				query.push(Query.equal("assigneeId", assigneeId))
			}

			if (dueDate) {
				console.log("dueDate: ", dueDate)
				query.push(Query.equal("dueDate", dueDate))
			}

			if (search) {
				console.log("search: ", search)
				query.push(Query.search("name", search))
			}

			const tasks = await databases.listDocuments<TTask>(DATABASE_ID, TASKS_ID, query)

			const projectIds = tasks.documents.map((task) => task.projectId)
			const assigneeIds = tasks.documents.map((task) => task.assigneeId)

			const projects = await databases.listDocuments<TProject>(
				DATABASE_ID,
				PROJECTS_ID,
				projectIds.length > 0 ? [Query.contains("$id", projectIds)] : []
			)

			const members = await databases.listDocuments(
				DATABASE_ID,
				MEMBERS_ID,
				assigneeIds.length > 0 ? [Query.contains("$id", assigneeIds)] : []
			)

			const assignees = await Promise.all(
				members.documents.map(async (member) => {
					const user = await users.get(member.userId)

					return {
						...member,
						name: user.name || user.email,
						email: user.email,
					}
				})
			)

			const populatedTasks = tasks.documents.map((task) => {
				const project = projects.documents.find((project) => project.$id === task.projectId)
				const assignee = assignees.find((assignee) => assignee.$id === task.assigneeId)

				return {
					...task,
					project,
					assignee,
				}
			})

			return c.json({
				data: {
					...tasks,
					documents: populatedTasks,
				},
			})
		}
	)
	.post(
		"/",
		authSessionMiddleware,
		localeMiddleware,
		localeValidatorMiddleware("json", buildCreateTaskSchema),
		async (c) => {
			const user = c.get("user")
			const databases = c.get("databases")
			const { name, status, workspaceId, projectId, dueDate, assigneeId } = c.req.valid("json")

			const member = await getMember({
				databases,
				workspaceId,
				userId: user.$id,
			})

			if (!member) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const highestPositionTask = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
				Query.equal("status", status),
				Query.equal("workspaceId", workspaceId),
				Query.orderAsc("position"),
				Query.limit(1),
			])

			const newPosition =
				highestPositionTask.documents.length > 0 ? highestPositionTask.documents[0].position + 1000 : 1000

			const task = await databases.createDocument(DATABASE_ID, TASKS_ID, ID.unique(), {
				name,
				status,
				workspaceId,
				projectId,
				dueDate,
				assigneeId,
				position: newPosition,
			})

			return c.json({ data: task })
		}
	)
	.patch(
		"/:taskId",
		authSessionMiddleware,
		localeMiddleware,
		localeValidatorMiddleware("json", buildUpdateTaskSchema),
		async (c) => {
			const user = c.get("user")
			const databases = c.get("databases")
			const { name, status, description, projectId, dueDate, assigneeId } = c.req.valid("json")
			const { taskId } = c.req.param()

			const existingTask = await databases.getDocument<TTask>(DATABASE_ID, TASKS_ID, taskId)

			const member = await getMember({
				databases,
				workspaceId: existingTask.workspaceId,
				userId: user.$id,
			})

			if (!member) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const task = await databases.updateDocument<TTask>(DATABASE_ID, TASKS_ID, taskId, {
				name,
				status,
				projectId,
				dueDate,
				assigneeId,
				description,
			})

			return c.json({ data: task })
		}
	)
	.get("/:taskId", authSessionMiddleware, async (c) => {
		const currentUser = c.get("user")
		const databases = c.get("databases")
		const { users } = await createAdminClient()
		const { taskId } = c.req.param()

		const task = await databases.getDocument<TTask>(DATABASE_ID, TASKS_ID, taskId)

		const currentMember = await getMember({
			databases,
			workspaceId: task.workspaceId,
			userId: currentUser.$id,
		})

		if (!currentMember) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		const project = await databases.getDocument<TProject>(DATABASE_ID, PROJECTS_ID, task.projectId)

		const member = await databases.getDocument(DATABASE_ID, MEMBERS_ID, task.assigneeId)

		const user = await users.get(member.userId)

		const assignee = {
			...member,
			name: user.name || user.email,
			email: user.email,
		}

		return c.json({
			data: {
				...task,
				project,
				assignee,
			},
		})
	})
	.post(
		"/bulk-update",
		authSessionMiddleware,
		zValidator(
			"json",
			z.object({
				tasks: z.array(
					z.object({
						$id: z.string(),
						status: z.nativeEnum(ETaskStatus),
						position: z.number().int().positive().min(1000).max(1_000_000),
					})
				),
			})
		),
		async (c) => {
			const databases = c.get("databases")
			const user = c.get("user")
			const { tasks } = await c.req.valid("json")

			const tasksToUpdate = await databases.listDocuments<TTask>(DATABASE_ID, TASKS_ID, [
				Query.contains(
					"$id",
					tasks.map((task) => task.$id)
				),
			])

			const workspaceIds = new Set(tasksToUpdate.documents.map((task) => task.workspaceId))
			
			// 检查工作区一致
			if (workspaceIds.size !== 1) {
				return c.json({ error: "All tasks must belong to the same workspace" })
			}

			const workspaceId = workspaceIds.values().next().value

			if (!workspaceId) {
				return c.json({ error: "Workspace ID is required" }, 400)
			}

			const member = await getMember({
				databases,
				workspaceId,
				userId: user.$id,
			})

			if (!member) {
				return c.json({ error: "Unauthorized" }, 401)
			}

			const updatedTasks = await Promise.all(
				tasks.map(async (task) => {
					const { $id, status, position } = task
					return databases.updateDocument<TTask>(DATABASE_ID, TASKS_ID, $id, { status, position })
				})
			)

			return c.json({ data: updatedTasks })
		}
	)

export default app
