import { authGuard } from "@/features/auth/utils"
import TaskViewSwitcher from "@/features/tasks/components/TaskViewSwitcher"

const TasksPage = async () => {
	await authGuard()

	return (
		<div className="h-full flex flex-col">
			<TaskViewSwitcher />
		</div>
	)
}

export default TasksPage
