import Link from "next/link"
import { DottedSeparator } from "./DottedSeparator"
import Navigation from "./Navigation"
import Image from "next/image"

const BaseSidebar = () => {
	return (
		<aside className="h-full bg-neutral-100 p-4 w-full">
			<Link href="/">
				<Image src="/image/logo.svg" alt={"logo"} width={60} height={48} />
			</Link>
			<DottedSeparator className="my-4" />
			<Navigation />
		</aside>
	)
}

export default BaseSidebar
