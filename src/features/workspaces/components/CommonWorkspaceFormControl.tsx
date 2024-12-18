"use client"

import Image from "next/image"
import { ImageIcon } from "lucide-react"
import { UseFormReturn, } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { TDictionary } from "@/context/DictionaryProvider"
import { useRef } from "react"

interface BaseWorkspaceFormProps {
	form: UseFormReturn
	dic: TDictionary
	isPending: boolean
}

const CommonWorkspaceFormControl = ({ form, dic, isPending }: BaseWorkspaceFormProps) => {
	const inputRef = useRef<HTMLInputElement>(null)

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			form.setValue("image", file)
		}
	}

	return (
		<>
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{dic.workspaces.form.name}</FormLabel>
						<FormControl>
							<Input {...field} placeholder={dic.workspaces.form.entername} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="image"
				render={({ field }) => (
					<div className="flex flex-col gap-y-2">
						<div className="flex items-center gap-x-5">
							{field.value ? (
								<div className="size-[72px] relative rounded-md overflow-hidden">
									<Image
										alt="preview"
										fill
										className="object-cover"
										src={
											field.value instanceof File ? URL.createObjectURL(field.value) : field.value
										}
									/>
								</div>
							) : (
								<Avatar className="size-[72px]">
									<AvatarFallback>
										<ImageIcon className="size-[36px] text-neutral-400" />
									</AvatarFallback>
								</Avatar>
							)}
							<div className="flex flex-col">
								<p className="text-sm">{dic.workspaces.form.icon}</p>
								<p className="text-sm text-muted-foreground">{dic.workspaces.form.imageNotice}</p>
								<input
									className="hidden"
									type="file"
									accept=".jpg, .png, .jpeg, .svg"
									ref={inputRef}
									onChange={handleImageChange}
									disabled={isPending}
								/>
								{field.value ? (
									<Button
										type="button"
										disabled={isPending}
										variant="destructive"
										size="xs"
										className="w-fit mt-2"
										onClick={() => {
											field.onChange(null)
											if (inputRef.current) {
												inputRef.current.value = ""
											}
										}}
									>
										{dic.delete}
									</Button>
								) : (
									<Button
										type="button"
										disabled={isPending}
										variant="teritary"
										size="xs"
										className="w-fit mt-2"
										onClick={() => inputRef.current?.click()}
									>
										{dic.upload}
									</Button>
								)}
							</div>
						</div>
					</div>
				)}
			/>
		</>
	)
}

export default CommonWorkspaceFormControl
