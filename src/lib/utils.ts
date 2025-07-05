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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchHasError(response: any): response is MyResponseFailType {
	return "error" in response
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleOnError = (err: any, defaultAction: () => void) => {

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
 * 响应数据提取工具
 */

// 定义成功响应类型
type SuccessResponse<T> = {
	data: T
}

// 定义错误响应类型
type ErrorResponse = {
	error: string
}

// 联合响应类型
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

// 类型守卫：检查是否为错误响应
function isErrorResponse<T>(response: ApiResponse<T>): response is ErrorResponse {
	return "error" in response && typeof (response as ErrorResponse).error === "string"
}

// 类型守卫：检查是否为成功响应
function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
	return "data" in response
}

/**
 * 从 API 响应中提取数据，自动推导成功响应的类型
 * @param response API 响应对象
 * @returns 成功响应的 data 字段
 * @throws Error 当响应包含错误或数据为空时抛出错误
 */
export function extractDataFromResponse<T>(response: ApiResponse<T>): T {
	// 检查错误响应
	if (isErrorResponse(response)) {
		throw new Error(response.error)
	}

	// 检查成功响应
	if (isSuccessResponse(response)) {
		// 额外检查 data 是否为 null 或 undefined
		if (response.data === null || response.data === undefined) {
			throw new Error("Data is null or undefined")
		}

		return response.data
	}

	// 如果响应格式不符合预期，抛出错误
	throw new Error("Invalid response format")
}

/**
 * 针对 Hono 客户端的类型安全响应处理器
 * 自动从 InferResponseType 中提取成功响应的 data 类型
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractDataFromHonoResponse<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TApiCall extends (...args: any[]) => Promise<Response>,
	TSuccessData = InferResponseType<TApiCall, 200> extends { data: infer U } ? U : never
>(response: InferResponseType<TApiCall>): TSuccessData {
	return extractDataFromResponse(response as ApiResponse<TSuccessData>)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
