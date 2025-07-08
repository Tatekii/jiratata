"use client"

import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { useDictionary } from "@/context/DictionaryProvider"
import { signUpWithGoogle, signUpWithGithub } from "@/lib/oauth"
import { Loader2 } from "lucide-react"
import { FC, useCallback, useState, useTransition } from "react"
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { toast } from "sonner"

interface IOauthProps {
	isPending: boolean
}

const OAuthCard: FC<IOauthProps> = ({ isPending }) => {
	const dic = useDictionary()
	const [pending, startTransition] = useTransition()
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

	const handleOAuth = useCallback((provider: () => Promise<boolean>, providerName: string) => {
		setLoadingProvider(providerName)
		
		startTransition(async () => {
			try {
				await provider()
			} catch (error) {
				console.error(`${providerName} OAuth error:`, error)
				toast.error(`${providerName} OAuth失败`)
				setLoadingProvider(null)
			}
		})
	}, [])

	const isLoading = isPending || pending

	return (
		<CardContent className="flex flex-col gap-4 p-7" data-testid="oauth-card">
			<Button
				onClick={() => handleOAuth(signUpWithGoogle, "Google")}
				disabled={isLoading}
				variant="secondary"
				size="lg"
				className="w-full"
				data-testid="google-oauth-button"
			>
				<FcGoogle className="mr-2 size-5" />
				{loadingProvider === "Google" ? <Loader2 className="animate-spin" /> : <>Google {dic.auth.signin}</>}
			</Button>
			<Button
				onClick={() => handleOAuth(signUpWithGithub, "GitHub")}
				disabled={isLoading}
				variant="secondary"
				size="lg"
				className="w-full"
				data-testid="github-oauth-button"
			>
				<FaGithub className="mr-2 size-5" />
				{loadingProvider === "GitHub" ? <Loader2 className="animate-spin" /> : <>Github {dic.auth.signin}</>}
			</Button>
		</CardContent>
	)
}

export default OAuthCard
