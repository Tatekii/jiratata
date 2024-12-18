"use client"

import { usePathname } from "next/navigation"

import { UserButton } from "@/features/auth/components/UserButton"
import MobileSidebar from "./MobileSidebar"
import { useDictionary } from "@/context/DictionaryProvider"

const pathnameMap = {
	tasks: {
		title: "mytasks",
		description: "mytasksdesc",
	},
	projects: {
		title: "myprojects",
		description: "myprojectsdesc",
	},
} as const

const defaultMap = {
	title: "home",
	description: "homedesc",
} as const

const Navbar = () => {
	const pathname = usePathname()
	const pathnameParts = pathname.split("/")
	const pathnameKey = pathnameParts[3] as keyof typeof pathnameMap
	const dic = useDictionary()

	const { title, description } = pathnameMap[pathnameKey] || defaultMap

	return (
		<nav className="pt-4 px-6 flex items-center justify-between">
			<div className="flex-col hidden lg:flex">
				<h1 className="text-2xl font-semibold">{dic[title]}</h1>
				<p className="text-muted-foreground">{dic[description]}</p>
			</div>
			{/* 小屏幕渲染侧栏按钮 */}
			<MobileSidebar />
			<UserButton />
		</nav>
	)
}
export default Navbar
