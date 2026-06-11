"use client"

import { useEffect, useState } from "react"
import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"
import type { SessionUser } from "@/lib/types"

interface AuthState {
  user: SessionUser | null
  setUser: (user: SessionUser) => void
  logout: () => void
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

function getAuthStorage(): StateStorage {
  if (typeof window === "undefined") return noopStorage
  return window.localStorage
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "bolao-session",
      storage: createJSONStorage(getAuthStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const { persist } = useAuthStore
    if (!persist) {
      setHydrated(true)
      return
    }

    setHydrated(persist.hasHydrated())
    return persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}
