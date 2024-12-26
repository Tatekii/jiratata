/**
 * 通用名称+图标标记的表单
 */

import { useRef } from "react"
import { DottedSeparator } from "./DottedSeparator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { FieldValues, UseFormReturn } from "react-hook-form"
import { Input } from "./ui/input"
import Image from "next/image"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { ImageIcon } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { useDictionary } from "@/context/DictionaryProvider"

interface IFormData extends FieldValues {
	name: string
	image?: File | string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[x: string]: any
}

interface ICommonEditFormControlsProps<T extends FieldValues = IFormData> {
	nameText: string
	enternameText: string
	iconText: string
	iconNotice: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onSubmit: (values: any) => void
	submitText: string
	onCancel?: () => void
	cancelText: string
	form: UseFormReturn<T>
	isPending: boolean
}

const CommonEditFormControls = ({
	nameText,
	enternameText,
	iconText,
	iconNotice,
	onSubmit,
	onCancel,
	submitText,
	cancelText,
	form,
	isPending,
}: ICommonEditFormControlsProps) => {
	const inputRef = useRef<HTMLInputElement>(null)

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			form.setValue("image", file)
		}
	}

	const dic = useDictionary()

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<div className="flex flex-col gap-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{nameText}</FormLabel>
								<FormControl>
									<Input {...field} placeholder={enternameText} />
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
													field.value instanceof File
														? URL.createObjectURL(field.value)
														: field.value
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
										<p className="text-sm">{iconText}</p>
										<p className="text-sm text-muted-foreground">{iconNotice}</p>
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
				</div>
				<DottedSeparator className="py-7" />
				<div className="flex items-center justify-between">
					<Button
						type="button"
						size="lg"
						variant="secondary"
						onClick={onCancel}
						disabled={isPending}
						className={cn(!onCancel && "invisible")}
					>
						{cancelText}
					</Button>
					<Button disabled={isPending} type="submit" size="lg">
						{submitText}
					</Button>
				</div>
			</form>
		</Form>
	)
}

export default CommonEditFormControls
