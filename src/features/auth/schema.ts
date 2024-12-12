import { TDictionary } from "@/context/DictionaryProvider"
import { z } from "zod"

export const buildLoginSchema = (dic: TDictionary) =>
	z.object({
		email: z.string().email(dic.auth.form.emailFormat),
		password: z.string().min(1, dic.auth.form.required),
	})
export const buildRegisterSchema = (dic: TDictionary) =>
	z.object({
		name: z.string().trim().min(1, dic.auth.form.required),
		email: z.string().email(),
		password: z.string().min(8, dic.auth.form.minium8),
	})