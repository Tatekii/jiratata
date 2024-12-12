import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<(typeof client.api.auth.login)["$post"]>
type RequestType = InferRequestType<(typeof client.api.auth.login)["$post"]>

export const useLogin = () => {
	const router = useRouter()

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationFn: async ({ json }) => {

			await client.api.auth.test.$get()

			const response = await client.api.auth.login.$post({ json })

			if (!response.ok) {
				throw new Error("Failed to login")
			}

			return await response.json()
		},
		onSuccess: () => {
			toast.success("Logged in")
			router.refresh()
		},
		onError: () => {
			toast.error("Failed to log in")
		},
	})

	return mutation
}
