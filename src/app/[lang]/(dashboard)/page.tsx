import { getCurrent } from "@/features/auth/queries"
import { redirect } from "next/navigation"

export default async function Home() {
	const user = await getCurrent()

	
	if (!user) {
		redirect("/signin")
	}

	return (
		<h1>
			DASHBOARD
		</h1>
	)
}
