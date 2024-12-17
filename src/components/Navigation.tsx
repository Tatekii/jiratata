"use client"

import Link from "next/link"
import { SettingsIcon, UsersIcon } from "lucide-react"
import { GoCheckCircle, GoCheckCircleFill, GoHome, GoHomeFill } from "react-icons/go"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

const routes = [
	{
		label: "home",
		href: "",
		icon: GoHome,
		activeIcon: GoHomeFill,
	},
	{
		label: "mytasks",
		href: "/tasks",
		icon: GoCheckCircle,
		activeIcon: GoCheckCircleFill,
	},
	{
		label: "settings",
		href: "/settings",
		icon: SettingsIcon,
		activeIcon: SettingsIcon,
	},
	{
		label: "members",
		href: "/members",
		icon: UsersIcon,
		activeIcon: UsersIcon,
	},
] as const

const Navigation = () => {

	const dic = useDictionary()

	return (
		<ul className="flex flex-col">
			{routes.map((item) => {
				const Icon = item.icon

				return (
					<Link key={item.href} href={item.href}>
						<div
							className={cn(
								"flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-primary transition text-neutral-500"
							)}
						>
							<Icon className="size-5 text-neutral-500" />
							{dic[item.label]}
						</div>
					</Link>
				)
			})}
		</ul>
	)
}
export default Navigation
