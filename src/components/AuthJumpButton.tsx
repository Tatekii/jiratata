"use client"
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/context/DictionaryProvider"
import Link from "next/link"
import { usePathname } from "next/navigation"

const AuthJumpButtom = () => {
	const dic = useDictionary()
	const path = usePathname()

	const isSignup = path.endsWith("signup")
	const btnText = isSignup ? dic.auth.signin : dic.auth.signup

	return (
		<Button asChild variant={"secondary"}>
			<Link href={isSignup ? "/signin" : "signup"}>{btnText}</Link>
		</Button>
	)
}

export default AuthJumpButtom
