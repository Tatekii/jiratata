// import { SignInCard } from "@/features/auth/components/SigninCard"

import SignInCard from "@/features/auth/components/SigninCard"
import { getCurrent } from "@/features/auth/service/queries"
import { redirect } from "next/navigation"

const SigninPage = async () => {
	const currentUser = await getCurrent()
	// 已经登录就跳走
	if (currentUser) {
		redirect("/")
	}

	return <SignInCard />
}

export default SigninPage
