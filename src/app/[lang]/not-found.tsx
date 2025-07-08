"use client"

import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/context/DictionaryProvider"

const RootNotFoundPage = () => {
	const dic = useDictionary()
	return (
		<div className="h-screen flex flex-col gap-y-4 items-center justify-center">
			<FileQuestion className="size-6 text-muted-foreground" />
			<div className="text-center space-y-2">
				<h1 className="text-2xl font-semibold text-foreground">404</h1>
				<p className="text-sm text-muted-foreground">{dic.notfound.title}</p>
				<p className="text-xs text-muted-foreground">{dic.notfound.description}</p>
			</div>
			<Button variant="secondary" size="sm">
				<Link href="/">{dic.returnhome}</Link>
			</Button>
		</div>
	)
}

export default RootNotFoundPage