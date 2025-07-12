import { z } from "zod"
import { TDictionary } from "@/context/DictionaryProvider"

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
