"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "cn"

type DatePickerProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  invalid?: boolean
  minDate?: string
}

function parseDate(value: string) {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function DatePicker({ value, onValueChange, placeholder = "Pick a date", className, invalid, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)
  const minimum = parseDate(minDate ?? "")
  const label = selected
    ? selected.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label={selected ? `Selected date: ${label}` : placeholder}
            aria-invalid={invalid}
            className={cn(
              "h-9 w-full justify-start gap-2 border-input bg-card px-3 text-left text-xs font-normal text-foreground hover:bg-muted",
              !selected && "text-muted-foreground",
              invalid && "border-destructive ring-2 ring-destructive/15",
              className,
            )}
          />
        }
      >
        <CalendarDays className="size-3.5 text-muted-foreground" />
        <span>{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-3">
        <Calendar
          selected={selected}
          minDate={minimum}
          onSelect={(date) => {
            onValueChange(toDateValue(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
