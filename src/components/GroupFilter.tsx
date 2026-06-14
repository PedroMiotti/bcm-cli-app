"use client"

import { motion } from "framer-motion"

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"]

interface Props {
  selected: string
  onSelect: (group: string) => void
  progress: Record<string, { done: number; total: number }>
}

export default function GroupFilter({ selected, onSelect, progress }: Props) {
  return (
    <div className="overflow-x-auto scrollbar-primary">
      <div className="flex gap-1.5 px-4 pb-1 min-w-max">
        {GROUPS.map((g) => {
          const { done = 0, total = 6 } = progress[g] ?? {}
          const active = selected === g
          const complete = done === total && total > 0
          return (
            <motion.button
              key={g}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelect(g)}
              className={`relative flex flex-col items-center rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all duration-200 border ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                  : complete
                  ? "bg-primary/12 text-primary border-primary/30"
                  : "bg-secondary/80 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span className="text-xs font-black leading-tight">GRUPO {g}</span>
              <span className={`text-[9px] font-semibold tabular-nums ${active ? "text-primary-foreground/75" : "opacity-60"}`}>
                {done}/{total}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
