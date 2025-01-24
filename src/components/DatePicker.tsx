"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { zhCN } from "date-fns/locale/zh-CN"
// import { enUS } from "date-fns/locale/en-US"

import useCurLang from "@/hooks/useCurLang"

interface DatePickerProps {
	value: Date | undefined
	onChange: (date: Date) => void
	className?: string
	placeholder?: string
	disabled?: boolean
}

const DatePicker = ({ disabled = false, value, onChange, className, placeholder = "Select date" }: DatePickerProps) => {
	const lang = useCurLang()

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="lg"
					className={cn(
						"w-full justify-start text-left font-normal px-3",
						!value && "text-muted-foreground",
						className
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{value ? format(value, "PPP") : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					locale={lang === "zh-CN" ? zhCN : undefined}
					mode="single"
					selected={value}
					onSelect={(date) => onChange(date as Date)}
					initialFocus
					lang="cn"
					disabled={disabled}
				/>
			</PopoverContent>
		</Popover>
	)
}

export default DatePicker
