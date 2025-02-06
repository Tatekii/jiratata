import { authGuard } from "@/features/auth/utils"
import TasksClient from "./client"

const TasksPage = async () => {
	await authGuard()

	return <TasksClient />
}

export default TasksPage
