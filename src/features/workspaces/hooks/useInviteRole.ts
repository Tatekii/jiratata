import { EMemberRole } from "@/features/types"
import { useSearchParams } from "next/navigation"

const useInviteRole = () => {
	const searchParams = useSearchParams()

	return searchParams.get("role") as EMemberRole
}

export default useInviteRole
