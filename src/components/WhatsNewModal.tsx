"use client"

import { useEffect, useState } from "react"
import { ModalDrawer } from "@/components/ModalDrawer"
import { MousePointerClick, Zap, Pencil } from "lucide-react"
import { motion } from "framer-motion"

const STORAGE_KEY = "bolao:whats_new_v1"
const MAX_SHOWS = 2

const FEATURES = [
  {
    icon: MousePointerClick,
    color: "text-primary bg-primary/15 border-primary/25",
    title: "Palpites no Ranking",
    description:
      "Toque em qualquer participante no ranking para ver todos os palpites dele, o placar real e quantos pontos cada jogo rendeu.",
  },
  {
    icon: Zap,
    color: "text-yellow-400 bg-yellow-400/15 border-yellow-400/25",
    title: "Simulador de Placar",
    description:
      'Em "Palpites da Galera", simule qualquer placar em tempo real e veja quem pontuaria o quê — útil durante jogos ao vivo.',
  },
  {
    icon: Pencil,
    color: "text-blue-400 bg-blue-400/15 border-blue-400/25",
    title: "Palpitar pelos Cards de Hoje",
    description:
      "Os cards de hoje e amanhã agora são clicáveis: faça seu palpite direto, e veja sua previsão e pontuação sem sair da tela.",
  },
]

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10)
    if (count >= MAX_SHOWS) return
    const t = setTimeout(() => setOpen(true), 700)
    return () => clearTimeout(t)
  }, [])

  function handleClose() {
    setOpen(false)
    const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10)
    localStorage.setItem(STORAGE_KEY, String(count + 1))
  }

  return (
    <ModalDrawer open={open} onOpenChange={(o) => !o && handleClose()}>
      {/* Header */}
      <div className="bg-secondary/50 px-5 pt-5 pb-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">✨</span>
          <div>
            <p className="text-sm font-black">Novidades no Bolão</p>
            <p className="text-[11px] text-muted-foreground">Veja o que atualizamos para você</p>
          </div>
        </div>
      </div>

      {/* Feature list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {FEATURES.map(({ icon: Icon, color, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.07 }}
            className="flex items-start gap-3 bg-secondary/50 rounded-2xl border border-border/30 p-4"
          >
            <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${color}`}>
              <Icon size={16} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-0.5">{title}</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/40 p-4">
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={handleClose}
          className="w-full bg-primary text-primary-foreground font-bold text-sm rounded-xl py-3 hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          Entendi, bora jogar! 🚀
        </motion.button>
      </div>
    </ModalDrawer>
  )
}
