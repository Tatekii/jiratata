"use client"
import { Button } from "@/components/ui/button"
import { client } from "@/lib/rpc"

export default function Home() {
	return (
		<div className="flex gap-4 p-4">
			<Button>default</Button>
			<Button variant={"destructive"}>destructive</Button>
			<Button variant={"ghost"}>ghost</Button>
			<Button variant={"link"}>link</Button>
			<Button variant={"outline"}>outline</Button>
			<Button variant={"secondary"}>secondary</Button>
			<Button
				onClick={async () => {
					await client.api.auth.logout.$post()
				}}
			>
				logout
			</Button>
		</div>
	)
}
