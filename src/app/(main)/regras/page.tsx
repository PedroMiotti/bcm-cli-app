"use client"

import { motion } from "framer-motion"

const criteria = [
  {
    pts: 18,
    label: "Placar Exato",
    desc: "Se o palpite é exatamente igual ao resultado real.",
    example: { pred: "Palpite 3x1", real: "Real 3x1" },
    badgeColor: "bg-orange-500 text-white shadow-lg shadow-orange-500/30",
    exampleColor: "text-orange-400",
  },
  {
    pts: 12,
    label: "Vencedor + Gols de Um Time",
    desc: "Acertou o vencedor/empate + a quantidade exata de gols de um dos times.",
    example: { pred: "Palpite 3x0", real: "Real 3x1" },
    badgeColor: "bg-red-500 text-white shadow-lg shadow-red-500/25",
    exampleColor: "text-red-400",
  },
  {
    pts: 9,
    label: "Vencedor Apenas",
    desc: "Acertou qual time venceu ou se foi empate, mas errou os gols de ambos.",
    example: { pred: "Palpite 2x0", real: "Real 3x1" },
    badgeColor: "bg-green-500 text-white shadow-lg shadow-green-500/25",
    exampleColor: "text-green-400",
  },
  {
    pts: 3,
    label: "Placar de Um Time Apenas",
    desc: "Errou o resultado final (vencedor/empate), mas acertou a pontuação de um dos times.",
    example: { pred: "Palpite 3x4", real: "Real 3x1" },
    badgeColor: "bg-teal-500 text-white shadow-lg shadow-teal-500/25",
    exampleColor: "text-teal-400",
  },
  {
    pts: 0,
    label: "Sem Pontos",
    desc: "Acontece quando há erro total em todas as estimativas.",
    example: { pred: "Qualquer", real: "outro caso" },
    badgeColor: "bg-secondary text-muted-foreground border border-border",
    exampleColor: "text-muted-foreground",
  },
]

const tiebreakers = [
  { label: "Maior quantidade de placares exatos", pts: "18 pts" },
  { label: "Maior quantidade de acertos de vencedor mais gols de um time", pts: "12 pts" },
  { label: "Maior quantidade de acertos de resultado geral ou empates", pts: "18, 12 e 9 pts somados" },
  { label: "Maior quantidade de placares de um time isolados", pts: "3 pts" },
  { label: "Sorteio corporativo no final da Copa", pts: null },
]

export default function RegrasPage() {
  return (
    <div className="flex flex-col gap-5 p-4 pt-5">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🎯</span>
          <h1 className="text-xl font-black">Instruções e Critérios de Pontuação</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A pontuação oficial é calculada individualmente para cada partida, com base no placar real e nos seus
          palpites, seguindo uma escala de assertividade matemática progressiva de acordo com os seguintes casos:
        </p>
      </motion.div>

      {/* Criteria list */}
      <div className="flex flex-col gap-3">
        {criteria.map((c, i) => (
          <motion.div
            key={c.pts}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
            className="flex items-start gap-4 bg-card border border-border/60 rounded-2xl px-4 py-4"
          >
            {/* Points badge */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black shrink-0 ${c.badgeColor}`}>
              {c.pts}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{c.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.desc}</p>
            </div>

            {/* Example */}
            <div className="shrink-0 text-right">
              <p className={`text-[10px] font-bold ${c.exampleColor}`}>
                Ex: <span className="font-black">{c.example.pred}</span>
              </p>
              <p className={`text-[10px] ${c.exampleColor} opacity-70`}>
                • <span className="font-bold">{c.example.real}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tiebreakers */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border/60 rounded-2xl p-4"
      >
        <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">
          CRITÉRIOS DE DESEMPATE DO RANKING
        </p>
        <ol className="space-y-3">
          {tiebreakers.map((tb, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="text-xs text-muted-foreground font-bold w-4 shrink-0 mt-0.5">
                {i + 1}.
              </span>
              <span className="text-muted-foreground flex-1">
                {tb.label}
                {tb.pts && (
                  <span className="text-primary font-bold ml-1">({tb.pts}).</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </motion.div>
    </div>
  )
}
