import { MemberRoleType } from "@/features/types"
import { useSearchParams } from "next/navigation"

const useInviteRole = () => {
	const searchParams = useSearchParams()

	return searchParams.get("role") as MemberRoleType
}

export default useInviteRole
