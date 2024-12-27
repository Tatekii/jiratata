import { ETaskStatus } from "@/features/types"
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs"

const useTaskFilters = () => {
	return useQueryStates({
		projectId: parseAsString,
		status: parseAsStringEnum(Object.values(ETaskStatus)),
		assigneeId: parseAsString,
		search: parseAsString,
		dueDate: parseAsString,
	})
}

export default useTaskFilters
