"use client"

import Link from "next/link"
import { SettingsIcon, UsersIcon } from "lucide-react"
import { GoCheckCircle, GoCheckCircleFill, GoHome, GoHomeFill } from "react-icons/go"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"
import { usePathname } from "next/navigation"
import useWorkspaceId from "@/features/workspaces/hooks/useWorkspaceId"

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
		label: "navmembers",
		href: "/members",
		icon: UsersIcon,
		activeIcon: UsersIcon,
	},
] as const

const Navigation = () => {
	const workspaceId = useWorkspaceId()
	const dic = useDictionary()
	const pathname = usePathname()

	return (
		<ul className="flex flex-col">
			{routes.map((item) => {
				const fullHref = `/workspaces/${workspaceId}${item.href}`
				// 使用endwith，跳过多语言地址段
				const isActive = pathname.endsWith(fullHref)
				const Icon = isActive ? item.activeIcon : item.icon

				return (
					<Link key={item.href} href={fullHref}>
						<div
							className={cn(
								"flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-primary transition text-neutral-500 ",
								isActive && "bg-white shadow-sm hover:opacity-100 text-primary"
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
