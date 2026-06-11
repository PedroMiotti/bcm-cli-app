"use client"

import { useEffect, useState } from "react"
import { Timer } from "lucide-react"

const DEADLINE = new Date("2026-06-11T12:00:00Z")

function getTimeLeft() {
  const now = new Date()
  const diff = DEADLINE.getTime() - now.getTime()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

const pad = (n: number) => String(n).padStart(2, "0")

export default function Countdown() {
  const [time, setTime] = useState(getTimeLeft())

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">ENCERRA EM</span>
      <div className="flex items-center gap-1">
        <Timer size={11} className="text-primary" />
        <span className="text-sm font-black tabular-nums text-foreground">
          {time.days > 0 && `${time.days}d `}
          {pad(time.hours)}h{pad(time.minutes)}
        </span>
        <span className="text-xs text-muted-foreground font-mono">({pad(time.hours)}h)</span>
      </div>
    </div>
  )
}
