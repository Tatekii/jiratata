import { getCurrent } from "@/features/auth/service/auth.queries"
import { redirect } from "next/navigation"
import TaskIdClient from "./client"

const TaskIdPage = async () => {
	const user = await getCurrent()
	if (!user) redirect("/signin")

	return <TaskIdClient />
}

export default TaskIdPage
