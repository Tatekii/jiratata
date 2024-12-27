import { useMedia } from "react-use"

import { Dialog, DialogContent } from "@/components/ui/dialog"

import { Drawer, DrawerContent } from "@/components/ui/drawer"

import "./ResponsiveModal.css"

import { ErrorBoundary, FallbackProps } from "react-error-boundary"

interface ResponsiveModalProps {
	children: React.ReactNode
	open: boolean
	onOpenChange: (open: boolean) => void
}

export const ResponsiveModal = ({ children, open, onOpenChange }: ResponsiveModalProps) => {
	const isDesktop = useMedia("(min-width: 1024px)", true)

	const childContent = (
		<ErrorBoundary
			fallbackRender={fallbackRender}
			// onReset={(details) => {
			// 	// Reset the state of your app so the error doesn't happen again
			// }}
		>
			{children}
		</ErrorBoundary>
	)

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="w-full sm:max-w-lg p-0 border-none overflow-y-auto hide-scrollbar max-h-[85vh]">
					{/* <DialogHeader>
						<DialogTitle>Share link</DialogTitle>
						<DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
            </DialogHeader> */}
					{childContent}
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent>
				<div className="overflow-y-auto hide-scrollbar max-h-[85vh]">{childContent}</div>
			</DrawerContent>
		</Drawer>
	)
}

const fallbackRender = ({ error, resetErrorBoundary }: FallbackProps) => {
	// Call resetErrorBoundary() to reset the error boundary and retry the render.

	return (
		<div role="alert">
			<p>Something went wrong:</p>
			<pre style={{ color: "red" }}>{error.message}</pre>
		</div>
	)
}
