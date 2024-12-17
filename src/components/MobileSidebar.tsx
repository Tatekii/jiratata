import { MenuIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import BaseSidebar from "./Sidebar"
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const MobileSidebar = () => {
	"use client"
	const [isOpen, setIsOpen] = useState(false)
	const pathname = usePathname()

	useEffect(() => {
		setIsOpen(false)
	}, [pathname])

	return (
		<Sheet modal={false} open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button variant="secondary" className="lg:hidden">
					<MenuIcon className="size-4" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="p-0">
				<BaseSidebar />
			</SheetContent>
		</Sheet>
	)
}

export default MobileSidebar
