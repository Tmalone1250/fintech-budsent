"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  TrendingUp, 
  Wallet,
  Play,
  Clock
} from "lucide-react"
import { toast } from "sonner"

export default function OverviewPage() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  
  // Trigger form state
  const [agentId, setAgentId] = useState("agent_001")
  const [amount, setAmount] = useState("100")

  const fetchBudgets = async () => {
    try {
      const res = await fetch("/api/budgets")
      const data = await res.json()
      if (Array.isArray(data)) {
        setBudgets(data)
      }
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
    const interval = setInterval(fetchBudgets, 5000) // Poll budgets every 5s
    return () => clearInterval(interval)
  }, [])

  const handleTrigger = async () => {
    setTriggering(true)
    const requestId = `req_${Math.random().toString(36).substring(7)}`
    
    try {
      const res = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          amount: parseFloat(amount),
          request_id: requestId
        })
      })

      const data = await res.json()
      
      if (data.status === "PASS") {
        toast.success(`Transaction Approved: $${amount}`, {
          description: `Request ID: ${requestId}`
        })
      } else {
        toast.error(`Transaction Rejected: ${data.reason}`, {
          description: `Request ID: ${requestId}`
        })
      }
    } catch (error) {
      toast.error("Failed to trigger transaction")
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sentinel Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Autonomous budget governance and risk mitigation.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-600">Sentinel Active</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Managed Assets</CardTitle>
            <Wallet className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">$8,000.00</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Uptime</CardTitle>
            <Zap className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">99.998%</div>
            <p className="text-xs text-slate-400 mt-1">Reliability Shield Active</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Blocked Attempts</CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">14</div>
            <p className="text-xs text-slate-400 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">AVG Latency</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">42ms</div>
            <p className="text-xs text-slate-400 mt-1">Direct Settlement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Live tracking of agent spending against allocated caps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {budgets.map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${budget.color}`} />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{budget.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({budget.id})</span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    ${budget.spent.toLocaleString()} / ${budget.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={(budget.spent / budget.limit) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle>Trigger Transaction</CardTitle>
            <CardDescription>Simulate an AI agent request to the sentinel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent_id">Agent Identifier</Label>
              <Input 
                id="agent_id" 
                value={agentId} 
                onChange={(e) => setAgentId(e.target.value)}
                className="bg-white dark:bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount ($)</Label>
              <Input 
                id="amount" 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <Button 
              className="w-full bg-[#0A192F] hover:bg-slate-800 text-white gap-2 h-11 shadow-lg"
              onClick={handleTrigger}
              disabled={triggering}
            >
              {triggering ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              Authorize & Settle
            </Button>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-4">
              <p className="text-[11px] text-amber-600 leading-tight">
                <strong>Note:</strong> Transactions are processed by the <code>sentinel.py</code> engine with full Reliability Shield (Idempotency + Atomicity).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
