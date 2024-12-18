import { client } from "@/lib/rpc"
import { useQuery } from "@tanstack/react-query"

// TODO 记录登陆前想前往的路径，from=xxxx
const useCurrent = () => {
	const query = useQuery({
		queryKey: ["current"],
		queryFn: async () => {
			const response = await client.api.auth.current.$get()

			if (!response.ok) {
				return null
			}

			const { data } = await response.json()

			return data
		},
	})

	return query
}
export default useCurrent
