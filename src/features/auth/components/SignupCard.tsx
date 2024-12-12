"use client"

import { z } from "zod"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// import { signUpWithGithub, signUpWithGoogle } from "@/lib/oauth";
import { DottedSeparator } from "@/components/DottedSeparator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"

import { buildRegisterSchema } from "../schema"
import { useDictionary } from "@/context/DictionaryProvider"
import useRegister from "../hooks/useRegister"

const SignUpCard = () => {
	const dic = useDictionary()

	const registerSchema = buildRegisterSchema(dic)

	const { mutate, isPending } = useRegister()

	const form = useForm<z.infer<typeof registerSchema>>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			password2: "",
		},
	})

	const onSubmit = (values: z.infer<typeof registerSchema>) => {
		mutate({ json: values })
	}

	return (
		<Card className="w-full h-full md:w-[487px] border-none shadow-none">
			<CardHeader className="flex items-center justify-center text-center p-7">
				<CardTitle className="text-2xl">{dic.auth.signup}</CardTitle>
				<CardDescription>
					{dic.auth.agreetermnotice + " "}
					<Link href="/privacy">
						<span className="text-blue-700">{dic.auth.privactploicy}</span>
					</Link>{" "}
					{dic.and + " "}
					<Link href="/terms">
						<span className="text-blue-700">{dic.auth.termsofservice}</span>
					</Link>
				</CardDescription>
			</CardHeader>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="name"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input {...field} type="text" placeholder={dic.auth.form.enterusername} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
						<FormField
							name="password2"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input
											{...field}
											type="password"
											placeholder={dic.auth.form.enterconfirmpassword}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button disabled={isPending} size="lg" className="w-full">
							{dic.auth.signup}
						</Button>
					</form>
				</Form>
			</CardContent>
			<div className="px-7">
				<DottedSeparator />
			</div>
			<CardContent className="p-7 flex flex-col gap-y-4">
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
					{dic.auth.haveaccount}?
					<Link href="/sign-in">
						<span className="text-blue-700">&nbsp;{dic.auth.signin}</span>
					</Link>
				</p>
			</CardContent>
		</Card>
	)
}

export default SignUpCard
