import { z } from "zod"

import { TDictionary } from "@/context/DictionaryProvider"
import { ETaskStatus, ETaskPriority, ETaskType, type IClientTask } from "../types"

// 基于 IClientTask 接口创建完整的 Task Schema
const createBaseTaskSchema = (dic: TDictionary) =>
	z.object({
		// 基本信息
		name: z.string().trim().min(1, dic.form.required),
		status: z.nativeEnum(ETaskStatus),
		workspaceId: z.string().trim().min(1, dic.form.required),
		projectId: z.string().trim().min(1, dic.form.required),
		assigneeId: z.string().trim().optional(),

		// 日期信息
		dueDate: z.coerce.date().transform((t) => t.toString()),

		// 详细信息
		description: z.string().optional(),
		priority: z.nativeEnum(ETaskPriority),
		taskType: z.nativeEnum(ETaskType),

		// 时间和层级
		position: z.number().min(0).default(0),
		estimatedHours: z.coerce.number().min(0, dic.form.invalidNumber).default(0),
		loggedHours: z.number().min(0).default(0),
		parentTaskId: z.string().optional(),
	} satisfies Record<keyof Omit<IClientTask, "_id" | "createdAt" | "updatedAt">, z.ZodTypeAny>)

// 创建任务的 Schema (排除系统生成的字段)
export const buildCreateTaskSchema = (dic: TDictionary) =>
	createBaseTaskSchema(dic).omit({
		position: true, // 系统自动生成
		loggedHours: true, // 创建时默认为0
	})

// 更新任务的 Schema (所有字段都是可选的，除了必需的标识符)
export const buildUpdateTaskSchema = (dic: TDictionary) =>
	createBaseTaskSchema(dic)
		.omit({
			workspaceId: true,
			projectId: true,
			name: true,
		})
		.extend({
			// 更新时允许修改已记录工时
			loggedHours: z.number().min(0).optional(),
			name: z.string().trim().min(1, dic.form.required).optional(),
		})
		.partial()
		.refine((data) => Object.keys(data).length > 0, { message: dic.form.required })

/** 更新任务的 Schema 除了工作区所有值都是可选的 */
export const buildSearchTaskSchema = (dic: TDictionary) =>
	createBaseTaskSchema(dic)
		.omit({
			workspaceId: true,
		})
		.partial()
		.extend({
			workspaceId: z.string().trim().min(1, dic.form.required),
			search: z.string().optional(),
		})

// 新增：评论相关的schemas
export const buildCreateCommentSchema = (dic: TDictionary) =>
	z.object({
		content: z.string().trim().min(1, dic.form.required),
		taskId: z.string().trim().min(1, dic.form.required),
		parentCommentId: z.string().optional(),
		mentions: z.array(z.string()).default([]),
	})

export const buildUpdateCommentSchema = (dic: TDictionary) =>
	z.object({
		content: z.string().trim().min(1, dic.form.required),
	})

// 新增：附件相关的schemas
export const buildCreateAttachmentSchema = (dic: TDictionary) =>
	z.object({
		filename: z.string().trim().min(1, dic.form.required),
		originalName: z.string().trim().min(1, dic.form.required),
		mimeType: z.string().trim().min(1, dic.form.required),
		size: z.number().min(0),
		url: z.string().url(),
		entityType: z.enum(["TASK", "COMMENT", "PROJECT"]),
		entityId: z.string().trim().min(1, dic.form.required),
	})
