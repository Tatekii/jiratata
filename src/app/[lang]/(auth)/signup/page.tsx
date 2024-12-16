import SignUpCard from "@/features/auth/components/SignupCard"
import { getCurrent } from "@/features/auth/queries"
import { redirect } from "next/navigation"

const SignupPage = async () => {
	const currentUser = await getCurrent()
	// 已经登录就跳走
	if (currentUser) {
		redirect("/")
	}
	return <SignUpCard />
}

export default SignupPage
