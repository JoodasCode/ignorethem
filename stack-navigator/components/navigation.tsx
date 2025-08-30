"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Github, FileText, LayoutDashboard, Search, Layers } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl">Stack Navigator</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/browse" className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Browse Stacks</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/compare" className="flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Compare</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/templates" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Templates</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="https://github.com" className="flex items-center space-x-2">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/browse" className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Browse Stacks</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/compare" className="flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Compare</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/templates" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Templates</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link href="https://github.com" className="flex items-center space-x-2">
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
