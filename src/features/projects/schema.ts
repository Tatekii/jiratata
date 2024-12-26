import { TDictionary } from "@/context/DictionaryProvider"
import { z } from "zod"

export const buildCreateProjectSchema = (dic: TDictionary) =>
	z.object({
		name: z.string().trim().min(1, dic.form.required),
		image: z
			.union([z.instanceof(File), z.string().transform((value) => (value === "" ? undefined : value))])
			.optional(),
		workspaceId: z.string(),
	})

export const buildUpdateProjectSchema = (dic: TDictionary) =>
	z.object({
		name: z.string().trim().min(1, dic.form.minium1).optional(),
		image: z
			.union([z.instanceof(File), z.string().transform((value) => (value === "" ? undefined : value))])
			.optional(),
	})
