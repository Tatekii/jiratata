import { TDictionary } from "@/context/DictionaryProvider"
import { z } from "zod"

export const buildLoginSchema = (dic: TDictionary) =>
	z.object({
		email: z.string().email(dic.auth.form.emailFormat),
		password: z.string().min(1, dic.auth.form.required),
	})
export const buildRegisterSchema = (dic: TDictionary) =>
	z
		.object({
			name: z.string().trim().min(1, dic.auth.form.required),
			email: z.string().email(dic.auth.form.emailFormat),
			password: z.string().min(8, dic.auth.form.minium8),
			password2: z.string().min(8, dic.auth.form.minium8),
		})
		.superRefine((val, ctx) => {
			if (val.password2 !== val.password) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: dic.auth.form.confirmpasswordfail,
					path: ["password2"],
				})
			}
		})
