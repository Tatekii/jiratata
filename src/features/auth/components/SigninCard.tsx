"use client"

import { z } from "zod"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// import { signUpWithGithub, signUpWithGoogle } from "@/lib/oauth"
import { DottedSeparator } from "@/components/DottedSeparator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"

import { buildLoginSchema } from "../schema"
// import { useLogin } from "../api/use-login"
import { useDictionary } from "@/context/DictionaryProvider"
import { FC, useEffect } from "react"
import { useLogin } from "../hooks/useLogin"
import { client } from "@/lib/rpc"

export const SignInCard: FC = () => {
	const { mutate, isPending } = useLogin()

	const dic = useDictionary()

	const loginSchema = buildLoginSchema(dic)

	const form = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

	const onSubmit = (values: z.infer<typeof loginSchema>) => {
		mutate({ json: values })
	}

	return (
		<Card className="w-full max-w-screen-sm h-full md:w-[487px] border-none shadow-none">
			<CardHeader className="flex items-center justify-center text-center p-7">
				<CardTitle className="text-2xl">{dic.auth.welcomeback}!</CardTitle>
			</CardHeader>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="email"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input {...field} type="email" placeholder={dic.auth.form.enteremail} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="password"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input {...field} type="password" placeholder={dic.auth.form.enterpassword} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button disabled={isPending} size="lg" className="w-full">
							{dic.auth.signin}
						</Button>
					</form>
				</Form>
			</CardContent>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="flex flex-col gap-4 p-7">
				<Button
					// onClick={() => signUpWithGoogle()}
					disabled={isPending}
					variant="secondary"
					size="lg"
					className="w-full"
				>
					<FcGoogle className="mr-2 size-5" />
					Google {dic.auth.signin}
				</Button>
				<Button
					// onClick={() => signUpWithGithub()}
					disabled={isPending}
					variant="secondary"
					size="lg"
					className="w-full"
				>
					<FaGithub className="mr-2 size-5" />
					Github {dic.auth.signin}
				</Button>
			</CardContent>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7 flex items-center justify-center">
				<p>
					{dic.auth.donthaveaccount}?
					<Button asChild variant={"link"} className="text-base">
						<Link href="/sign-up">{dic.auth.signup}</Link>
					</Button>
				</p>
			</CardContent>
		</Card>
	)
}
