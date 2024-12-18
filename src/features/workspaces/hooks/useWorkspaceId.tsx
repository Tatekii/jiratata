import { useParams } from "next/navigation"

/**
 * 获取地址栏的id
 */
const useWorkspaceId = () => {
	const params = useParams()

	return params.workspaceId as string
}

export default useWorkspaceId
