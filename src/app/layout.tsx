import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Bolão Trupe Thaki Tchaki 2026",
  description: "O hexa vem 🇧🇷🇧🇷 - Bolão Trupe Thaki Tchaki 2026",
  icons: {
    icon: "/public/logo-trupe.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
