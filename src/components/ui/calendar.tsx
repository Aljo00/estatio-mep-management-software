"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date) => void
  minDate?: Date
}

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function Calendar({ selected, onSelect, minDate }: CalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()))
  const [activeDate, setActiveDate] = useState(() => selected ?? new Date())

  useEffect(() => {
    if (selected) {
      setMonth(startOfMonth(selected))
      setActiveDate(selected)
    }
  }, [selected?.getTime()])

  useEffect(() => {
    const key = `${activeDate.getFullYear()}-${activeDate.getMonth()}-${activeDate.getDate()}`
    document.querySelector<HTMLButtonElement>(`[data-calendar-date="${key}"]`)?.focus()
  }, [activeDate])

  const firstWeekday = month.getDay()
  const firstVisibleDate = new Date(month.getFullYear(), month.getMonth(), 1 - firstWeekday)
  const days = Array.from({ length: 42 }, (_, index) =>
    new Date(firstVisibleDate.getFullYear(), firstVisibleDate.getMonth(), firstVisibleDate.getDate() + index),
  )
  const today = new Date()

  return (
    <div className="w-[288px] select-none" role="group" aria-label="Choose a date">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="text-center" role="grid" aria-label={month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}>
        <div className="mb-1 grid grid-cols-7 gap-1" role="row">
          {weekdays.map((day) => (
            <div key={day} role="columnheader" className="py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, week) => (
          <div key={week} className="grid grid-cols-7 gap-1" role="row">
            {days.slice(week * 7, week * 7 + 7).map((day) => {
          const inMonth = day.getMonth() === month.getMonth()
          const isSelected = Boolean(selected && sameDay(day, selected))
          const isToday = sameDay(day, today)
          const isBeforeMin = Boolean(minDate && day < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()))
          const isActive = sameDay(day, activeDate)
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              data-calendar-date={key}
              tabIndex={isActive ? 0 : -1}
              aria-label={day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              disabled={isBeforeMin}
              onClick={() => onSelect?.(day)}
              onKeyDown={(event) => {
                const dayOffset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -7 : event.key === "ArrowDown" ? 7 : 0
                if (!dayOffset) return
                event.preventDefault()
                let nextDate = new Date(day.getFullYear(), day.getMonth(), day.getDate() + dayOffset)
                if (minDate && nextDate < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
                  nextDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
                }
                setActiveDate(nextDate)
                setMonth(startOfMonth(nextDate))
              }}
              className={cn(
                "grid size-9 place-items-center rounded-lg text-xs transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
                !inMonth && "text-muted-foreground/50",
                isToday && !isSelected && "ring-1 ring-primary/40",
                isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {day.getDate()}
            </button>
          )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Calendar }
