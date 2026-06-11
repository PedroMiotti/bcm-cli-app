"use client"

import { motion } from "framer-motion"

const prizes = [
  {
    pos: 2,
    icon: "🥈",
    label: "Vice-Campeão",
    title: "2º LUGAR",
    value: 40,
    highlight: false,
    desc: "Prêmio para quem ficar logo atrás do líder na reta final.",
  },
  {
    pos: 1,
    icon: "🥇",
    label: "CAMPEÃO DO BOLÃO",
    title: "CAMPEÃO",
    value: 100,
    highlight: true,
    desc: "O maior pontuador da Copa leva o prêmio máximo.",
  },
  {
    pos: 3,
    icon: "🥉",
    label: "Terceiro Lugar",
    title: "3º LUGAR",
    value: 0,
    highlight: false,
    desc: "Fechando o pódio, também tem premiação garantida.",
  },
]

export default function PremiosPage() {
  return (
    <div className="flex flex-col items-center gap-6 p-4 pt-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-black">
          🏆 PREMIAÇÃO OFICIAL
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
          Os melhores serão coroados no final do campeonato.
          Prepare sua estratégia.
        </p>
      </motion.div>

      {/* 3 prize cards */}
      <div className="flex items-end gap-3 w-full max-w-lg">
        {prizes.map((prize, i) => (
          <motion.div
            key={prize.pos}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.35 }}
            className={`flex-1 rounded-2xl border flex flex-col items-center text-center p-4 gap-3 transition-all ${
              prize.highlight
                ? "bg-card border-primary/50 shadow-xl shadow-primary/15 relative"
                : "bg-card border-border/60"
            }`}
          >
            {/* Badge */}
            <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full ${
              prize.highlight
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground border border-border"
            }`}>
              {prize.title}
            </div>

            {/* Medal */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mt-2 ${
              prize.highlight ? "bg-primary/10 border border-primary/25" : "bg-secondary border border-border/40"
            }`}>
              {prize.icon}
            </div>

            <p className={`text-xs font-bold leading-tight ${prize.highlight ? "text-foreground" : "text-muted-foreground"}`}>
              {prize.label}
            </p>

            <p className="text-[11px] text-muted-foreground leading-snug">
              {prize.desc}
            </p>

            <div className={`text-2xl font-black tabular-nums tracking-tight ${
              prize.highlight ? "text-primary" : "text-foreground"
            }`}>
              R$ {prize.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total prize pool */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-lg rounded-2xl bg-card border border-border/60 p-5 text-center"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Premio Total em Jogo
        </p>
        <p className="text-4xl font-black text-primary tabular-nums">R$ 140 + BONUS</p>
        <p className="text-xs text-muted-foreground mt-1">distribuídos entre os 3 primeiros</p>
      </motion.div>

      {/* How to win */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-lg rounded-2xl bg-card border border-border/60 p-4"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Como ganhar
        </p>
        <ul className="space-y-2.5">
          {[
            "Faça seus palpites para todos os 72 jogos da fase de grupos",
            "Acumule pontos acertando placares e resultados",
            "Quem tiver mais pontos ao final leva o prêmio",
            "Em caso de empate, critérios de desempate são aplicados",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="text-primary font-black shrink-0">→</span>
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
