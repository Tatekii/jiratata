"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/context/DictionaryProvider"

const RootError = () => {
	const dic = useDictionary()
	return (
		<div className="h-screen flex flex-col gap-y-4 items-center justify-center">
			<AlertTriangle className="size-6 text-muted-foreground" />
			<p className="text-sm text-muted-foreground">{dic.error.title}</p>
			<Button variant="secondary" size="sm">
				<Link href="/">{dic.returnhome}</Link>
			</Button>
		</div>
	)
}

export default RootError
