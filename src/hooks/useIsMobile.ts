import { useEffect, useState } from "react"

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    // Read synchronously on the client so the correct value is available on
    // the very first render — avoids a Dialog→Sheet flash on conditionally-
    // mounted modals where open=true arrives at the same time as mount.
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [breakpoint])

  return isMobile
}
