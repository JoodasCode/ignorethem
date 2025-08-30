import { Navigation } from "@/components/navigation"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <LandingPage />
    </div>
  )
}
