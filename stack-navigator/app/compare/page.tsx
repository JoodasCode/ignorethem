"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Plus, Minus } from "lucide-react"
import { useState } from "react"

const stackOptions = [
  {
    id: 1,
    name: "Next.js + Supabase",
    description: "Modern React framework with real-time database",
    pros: ["Server-side rendering", "Real-time subscriptions", "Built-in auth", "Excellent DX"],
    cons: ["Vendor lock-in", "Learning curve", "Pricing at scale"],
    bestFor: "SaaS applications, dashboards, real-time apps",
    setupTime: "15 min",
    difficulty: "Medium",
    cost: "Free tier available",
    performance: 9,
    scalability: 8,
    community: 9,
  },
  {
    id: 2,
    name: "MERN Stack",
    description: "MongoDB, Express, React, Node.js - full JavaScript",
    pros: ["Single language", "Flexible schema", "Large community", "Rich ecosystem"],
    cons: ["Complex setup", "No built-in auth", "Callback hell potential"],
    bestFor: "Complex web applications, APIs, content management",
    setupTime: "25 min",
    difficulty: "Hard",
    cost: "Variable hosting costs",
    performance: 7,
    scalability: 9,
    community: 10,
  },
  {
    id: 3,
    name: "Django + PostgreSQL",
    description: "Python web framework with robust relational database",
    pros: ["Batteries included", "Admin interface", "ORM", "Security focused"],
    cons: ["Monolithic", "Python performance", "Template system"],
    bestFor: "Content-heavy sites, admin panels, rapid prototyping",
    setupTime: "20 min",
    difficulty: "Medium",
    cost: "Low hosting costs",
    performance: 6,
    scalability: 7,
    community: 8,
  },
]

export default function ComparePage() {
  const [selectedStacks, setSelectedStacks] = useState([stackOptions[0], stackOptions[1]])

  const addStack = (stack: (typeof stackOptions)[0]) => {
    if (selectedStacks.length < 3 && !selectedStacks.find((s) => s.id === stack.id)) {
      setSelectedStacks([...selectedStacks, stack])
    }
  }

  const removeStack = (stackId: number) => {
    setSelectedStacks(selectedStacks.filter((s) => s.id !== stackId))
  }

  const availableStacks = stackOptions.filter((stack) => !selectedStacks.find((s) => s.id === stack.id))

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Compare Tech Stacks</h1>
          <p className="text-muted-foreground">
            Side-by-side comparison to help you choose the right stack for your project
          </p>
        </div>

        {/* Add Stack Options */}
        {availableStacks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Add Stack to Compare</h3>
            <div className="flex flex-wrap gap-2">
              {availableStacks.map((stack) => (
                <Button
                  key={stack.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addStack(stack)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {stack.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {selectedStacks.map((stack) => (
            <Card key={stack.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-1">{stack.name}</CardTitle>
                    <CardDescription>{stack.description}</CardDescription>
                  </div>
                  {selectedStacks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStack(stack.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Setup Time:</span>
                    <div className="font-medium">{stack.setupTime}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Difficulty:</span>
                    <div className="font-medium">{stack.difficulty}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <div className="font-medium">{stack.cost}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Best For:</span>
                    <div className="font-medium text-xs">{stack.bestFor}</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Performance</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${stack.performance * 10}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{stack.performance}/10</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Scalability</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${stack.scalability * 10}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{stack.scalability}/10</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Community</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${stack.community * 10}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{stack.community}/10</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pros */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1 text-green-600">
                    <Check className="h-4 w-4" />
                    Pros
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {stack.pros.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1 text-red-600">
                    <X className="h-4 w-4" />
                    Cons
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {stack.cons.map((con, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <X className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full">Choose This Stack</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedStacks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Select stacks to compare</p>
            <div className="flex flex-wrap justify-center gap-2">
              {stackOptions.map((stack) => (
                <Button
                  key={stack.id}
                  variant="outline"
                  onClick={() => addStack(stack)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {stack.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
