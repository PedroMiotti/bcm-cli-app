"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import { Eye, EyeOff, ArrowRight, Loader2, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import UserAvatar from "@/components/UserAvatar"

type Step = "username" | "password"

export default function LoginPage() {
  const [step, setStep] = useState<Step>("username")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Usuário não encontrado"); return }
      setDisplayName(data.displayName)
      setDescription(data.username ?? data.description)
      setStep("password")
    } catch { setError("Erro de conexão") }
    finally { setLoading(false) }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Senha incorreta"); return }
      setUser(data)
      router.replace("/jogos")
    } catch { setError("Erro de conexão") }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center login-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="inline-flex mb-4"
          >
            <Image
              src="/logo-trupe.png"
              alt="Bolão Trupe"
              width={80}
              height={80}
              className="h-20 w-20 rounded-3xl object-cover shadow-2xl shadow-primary/40"
            />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-foreground">BOLÃO TRUPE</span>
            <span className="text-primary">2026</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Copa do Mundo FIFA™</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-2xl shadow-black/40">
          <AnimatePresence mode="wait">
            {step === "username" ? (
              <motion.form
                key="username"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleUsernameSubmit}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-black">Bem-vindo!</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Digite seu usuário para entrar
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="username" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    Usuário
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seu_usuario"
                    className="w-full rounded-xl border border-border bg-secondary/80 px-4 py-3 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full h-12 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98]"
                >
                  {loading
                    ? <Loader2 size={18} className="animate-spin" />
                    : <><span>Continuar</span><ArrowRight size={16} /></>
                  }
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-5"
              >
                <button
                  type="button"
                  onClick={() => { setStep("username"); setPassword(""); setError("") }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors -mb-1"
                >
                  <ChevronLeft size={14} /> Voltar
                </button>

                <div className="bg-secondary/60 rounded-xl px-2 py-2.5 border border-border/40 mt-6">
                  <UserAvatar displayName={displayName} description={description} size="md" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full rounded-xl border border-border bg-secondary/80 px-4 py-3 pr-12 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full h-12 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg shadow-primary/25 active:scale-[0.98]"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Entrar"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Copa do Mundo 2026 · Bolão Oficial do Grupo
        </p>
      </motion.div>
    </div>
  )
}
