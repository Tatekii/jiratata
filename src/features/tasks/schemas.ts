import { z } from "zod"
import { ETaskStatus } from "../types"
import { TDictionary } from "@/context/DictionaryProvider"

export const buildCreateTaskSchema = (dic: TDictionary) =>
	z.object({
		name: z.string().trim().min(1, dic.form.required),
		status: z.nativeEnum(ETaskStatus, { required_error: dic.form.required }),
		workspaceId: z.string().trim().min(1, dic.form.required),
		projectId: z.string().trim().min(1, dic.form.required),
		dueDate: z.coerce.date(),
		assigneeId: z.string().trim().min(1, dic.form.required),
		description: z.string().optional(),
	})
