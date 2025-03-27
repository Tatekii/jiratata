import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { customAlphabet } from "nanoid"
import { InferRequestType, InferResponseType } from "hono"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
export function generateInviteCode(length = 10) {
	return customAlphabet(characters, length)
}

/**
 * type utils
 */
export type MyResponseType<T> = InferResponseType<T>
export type MyResponseSuccessType<T> = InferResponseType<T, 200>
export type MyResponseFailType = {
	error: string
}
// export type MyResponseUnauthorizedType<T> = InferResponseType<T, 401>
export type MyRequestType<T> = InferRequestType<T>

export function fetchHasData<T>(response: MyResponseType<T>): response is MyResponseSuccessType<T> {
	return "data" in response
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchHasError(response: any): response is MyResponseFailType {
	return "error" in response
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleOnError = (err: any, defaultAction: () => void) => () => {
	if (fetchHasError(err)) {
		toast.error(err.error)
	} else if (err instanceof Error) {
		toast.error(err.message)
	} else {
		defaultAction()
	}
}

export function snakeCaseToTitleCase(str: string) {
	return str
		.toLowerCase()
		.replace(/_/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * jest mock使用
 * @param fn
 * @returns
 */
export function mockFunction<T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> {
	return fn as jest.MockedFunction<T>
}
