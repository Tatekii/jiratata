import { useMedia } from "react-use"

import { Dialog, DialogContent } from "@/components/ui/dialog"

import { Drawer, DrawerContent } from "@/components/ui/drawer"

import "./ResponsiveModal.css"

interface ResponsiveModalProps {
	children: React.ReactNode
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const ResponsiveModal = ({ children, open, onOpenChange }: ResponsiveModalProps) => {
	const isDesktop = useMedia("(min-width: 1024px)", true)

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="w-full sm:max-w-lg p-0 border-none overflow-y-auto hide-scrollbar max-h-[85vh]">
					{/* <DialogHeader>
						<DialogTitle>Share link</DialogTitle>
						<DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
            </DialogHeader> */}
					{children}
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent>
				<div className="overflow-y-auto hide-scrollbar max-h-[85vh]">{children}</div>
			</DrawerContent>
		</Drawer>
	)
}
