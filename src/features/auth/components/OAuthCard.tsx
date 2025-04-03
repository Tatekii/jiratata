"use client"

import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { useDictionary } from "@/context/DictionaryProvider"
import { signUpWithGoogle, signUpWithGithub } from "@/lib/oauth"
import { Loader2 } from "lucide-react"
import { FC, useCallback, useState } from "react"
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { toast } from "sonner"

interface IOauthProps {
	isPending: boolean
}

const OAuthCard: FC<IOauthProps> = ({ isPending }) => {
	const dic = useDictionary()

	const [loading, setLoading] = useState<boolean>(false)

	const handleOAuth = useCallback((provider: () => Promise<boolean>) => {
		setLoading(true)

		provider().catch(() => {
            toast.error('OAuth Provider error')
			setLoading(false)
		})
	}, [])

	return (
		<CardContent className="flex flex-col gap-4 p-7">
			<Button
				onClick={() => handleOAuth(signUpWithGoogle)}
				disabled={isPending || loading}
				variant="secondary"
				size="lg"
				className="w-full"
			>
				<FcGoogle className="mr-2 size-5" />
				{loading ? <Loader2 className="animate-spin" /> : <>Google {dic.auth.signin}</>}
			</Button>
			<Button
				onClick={() => handleOAuth(signUpWithGithub)}
				disabled={isPending || loading}
				variant="secondary"
				size="lg"
				className="w-full"
			>
				<FaGithub className="mr-2 size-5" />
				{loading ? <Loader2 className="animate-spin" /> : <>Github {dic.auth.signin}</>}
			</Button>
		</CardContent>
	)
}

export default OAuthCard
