import AuthGuard from "@/components/AuthGuard"
import Header from "@/components/Header"
import MatchBanner from "@/components/MatchBanner"
import BottomNav from "@/components/BottomNav"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Header />
        <MatchBanner />
        <main className="flex-1 pb-20 max-w-2xl w-full mx-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
