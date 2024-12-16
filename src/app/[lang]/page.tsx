import { UserButton } from "@/features/auth/components/UserButton"
import { getCurrent } from "@/features/auth/queries"
import { redirect } from "next/navigation"

export default async function Home() {
	const user = await getCurrent()

	
	if (!user) {
		redirect("/signin")
	}

	return (
		<div className="flex gap-4 p-4">
			<UserButton />
		</div>
	)
}
