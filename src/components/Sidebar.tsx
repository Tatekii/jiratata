import Link from "next/link"
import { DottedSeparator } from "./DottedSeparator"
import Navigation from "./Navigation"
import Image from "next/image"
import WorkspaceSwitcher from "../features/workspaces/components/WorkspaceSwitcher"

const BaseSidebar = () => {
	return (
		<aside className="h-full bg-neutral-100 p-4 w-full">
			<Link href="/">
				<div className="flex justify-start gap-4 items-center">
					<Image src="/image/logo.svg" alt={"logo"} width={60} height={48} />
					<h1 className="font-bold ">JIRATATA</h1>
				</div>
			</Link>
			{/* 工作区切换 */}
			<DottedSeparator className="my-4" />
			<WorkspaceSwitcher />
			{/* 导航菜单 */}
			<DottedSeparator className="my-4" />
			<Navigation />
		</aside>
	)
}

export default BaseSidebar
