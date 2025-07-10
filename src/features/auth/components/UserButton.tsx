"use client"

import { Loader, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import useLogout from "../api/useLogout"
import useCurrent from "../api/useCurrent"
import { DottedSeparator } from "@/components/DottedSeparator"
import { useDictionary } from "@/context/DictionaryProvider"
import LocaleSwitcher from "@/components/LocaleSwitcher"
import { OAuthProvider } from "@/features/types"
import { FaGithub, FaGoogle } from "react-icons/fa"

export const UserButton = () => {
	const { mutate: logout } = useLogout()
	const { data: user, isLoading } = useCurrent()
	const dic = useDictionary()

	if (isLoading) {
		return (
			<div className="size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300">
				<Loader className="size-4 animate-spin text-muted-foreground" />
			</div>
		)
	}

	if (!user) {
		return null
	}

	const { name, email, avatar } = user

	const avatarFallback = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase() ?? "U"

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger className="outline-none relative" data-testid="user-button">
				<Avatar className="size-10 hover:opacity-75 transition border border-neutral-300">
					<AvatarImage src={avatar} />
					<AvatarFallback className="bg-neutral-200 font-medium text-neutral-500 flex items-center justify-center">
						{avatarFallback}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" side="bottom" className="w-60" sideOffset={10}>
				<div className="flex flex-col items-center justify-center gap-2 px-2.5 py-4">
					<Avatar className="size-[52px] border border-neutral-300">
						<AvatarImage src={avatar} />
						<AvatarFallback className="bg-neutral-200 text-xl font-medium text-neutral-500 flex items-center justify-center">
							{avatarFallback}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col items-center justify-center gap-2">
						<p className="text-sm font-medium text-neutral-900">{name || "User"}</p>
						<p className="text-xs text-neutral-500">{email}</p>
						<div className="px-4 flex justify-between gap-4 text-xl">
							{user.oauthProvider.includes(OAuthProvider.GITHUB) ? (
								<FaGithub className="text-blue-900" />
							) : null}
							{user.oauthProvider.includes(OAuthProvider.GOOGLE) ? (
								<FaGoogle className="text-red-500" />
							) : null}
						</div>
					</div>
				</div>
				<DottedSeparator />

				<div className="flex items-center justify-evenly px-2 py-1.5">
					<div>{dic.chooselang}:</div>
					<LocaleSwitcher />
				</div>

				<DottedSeparator className="mb-1" />
				<DropdownMenuItem
					onClick={() => logout()}
					className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer"
					data-testid="logout-button"
				>
					<LogOut className="size-4 mr-2" />
					{dic.auth.logout}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
