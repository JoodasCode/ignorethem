import type { Metadata } from "next"
import { Oxanium, Merriweather, Fira_Code } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const oxanium = Oxanium({ 
  subsets: ["latin"],
  variable: "--font-sans"
})

const merriweather = Merriweather({ 
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif"
})

const firaCode = Fira_Code({ 
  subsets: ["latin"],
  variable: "--font-mono"
})

export const metadata: Metadata = {
  title: "Stack Navigator - Build Your Perfect SaaS Stack in Minutes",
  description: "Stop researching. Start building. Get a fully integrated starter with your ideal tech stack.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${oxanium.variable} ${merriweather.variable} ${firaCode.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
