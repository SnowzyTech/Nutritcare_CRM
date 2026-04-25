"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function MonthSelect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentMonthParam = searchParams.get("month")
  
  // Default to current month if not specified
  const now = new Date()
  const currentMonth = currentMonthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Generate last 12 months
  const months = React.useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
      return { value, label }
    })
  }, [])

  return (
    <Select
      value={currentMonth}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("month", value)
        router.push(`?${params.toString()}`)
      }}
    >
      <SelectTrigger className="h-6 px-2 py-0 text-xs bg-gray-100 border-gray-200 text-gray-500 rounded font-medium shadow-none outline-none focus:ring-0">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label === new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()) ? "This Month" : m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
