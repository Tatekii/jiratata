import type { ValidationTargets } from "hono"
import { validator } from "hono/validator"
import type { z, ZodSchema } from "zod"

// export type Hook<
//   T,
//   E extends Env,
//   P extends string,
//   Target extends keyof ValidationTargets = keyof ValidationTargets,
//   O = {}
// > = (
//   result: ({ success: true; data: T } | { success: false; error: ZodError; data: T }) & {
//     target: Target
//   },
//   c: Context<E, P>
// ) => Response | void | TypedResponse<O> | Promise<Response | void | TypedResponse<O>>

export const localeValidator = <
	T extends ZodSchema,
	Target extends keyof ValidationTargets,
	K = Record<string, z.ZodString>
>(
	target: Target,
	schemaBuilder: (raw: K) => T
	//   hook?: Hook<z.infer<T>, E, P, Target>
) =>
	validator(target, async (value, c) => {
		const dic = c.get("dic")

		const result = await schemaBuilder(dic).safeParseAsync(value)

		if (!result.success) {
			return c.json(result, 400)
		}

		return result.data as z.infer<T>
	})
