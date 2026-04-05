"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface Agent {
  id: string
  name: string
  limit: number
  spent: number
  color: string
}

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [newLimit, setNewLimit] = useState<string>("")
  const [editOpen, setEditOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/budgets")
      const data = await res.json()
      if (Array.isArray(data)) {
        setAgents(data)
      }
    } catch (error) {
      toast.error("Failed to fetch agents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleUpdateLimit = async () => {
    if (!selectedAgent) return
    const limitNum = parseFloat(newLimit)
    
    if (isNaN(limitNum) || limitNum <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (limitNum < selectedAgent.spent) {
      toast.error(`Limit cannot be less than current spent amount ($${selectedAgent.spent})`)
      return
    }

    setUpdating(true)
    try {
      const res = await fetch(`/api/budgets/${selectedAgent.id}`, {
        method: "PATCH",
        body: JSON.stringify({ authorized_limit: limitNum })
      })
      const result = await res.json()
      
      if (res.ok) {
        toast.success(`Budget updated for ${selectedAgent.id}`)
        setEditOpen(false)
        fetchAgents()
      } else {
        toast.error(result.error || "Update failed")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setUpdating(false)
    }
  }

  const handleRevokeAgent = async () => {
    if (!selectedAgent) return
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/budgets/${selectedAgent.id}`, {
        method: "DELETE"
      })
      const result = await res.json()
      
      if (res.ok) {
        toast.success(`Access revoked for ${selectedAgent.id}`)
        setRevokeOpen(false)
        fetchAgents()
      } else {
        toast.error(result.error || "Revocation failed")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setUpdating(false)
    }
  }

  const openEdit = (agent: Agent) => {
    setSelectedAgent(agent)
    setNewLimit(agent.limit.toString())
    setEditOpen(true)
  }

  const openRevoke = (agent: Agent) => {
    setSelectedAgent(agent)
    setRevokeOpen(true)
  }

  return (
    <div className="space-y-6 container mx-auto py-8 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Agent Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure security guardrails and budget limits for all autonomous agents.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-slate-200 dark:border-slate-800"
          onClick={fetchAgents}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-950">
            <TableRow>
              <TableHead className="w-[200px]">Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Spend</TableHead>
              <TableHead>Budget Limit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500 italic">Syncing with Sentinel...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">
                  No active agents found in Sentinel registry.
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{agent.name}</span>
                      <span className="text-xs text-slate-500 font-mono italic">{agent.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 shadow-none">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-slate-700 dark:text-slate-300">
                    ${agent.spent.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-slate-700 dark:text-slate-300">
                    ${agent.limit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        onClick={() => openEdit(agent)}
                      >
                        <Edit3 className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        onClick={() => openRevoke(agent)}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Budget Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-emerald-500" />
              Adjust Agent Budget
            </DialogTitle>
            <DialogDescription>
              Increase or decrease the spending limit for <strong>{selectedAgent?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4 rounded-lg bg-slate-50 dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Current Spend:</span>
                <span className="font-mono font-bold">${selectedAgent?.spent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Current Limit:</span>
                <span className="font-mono font-bold font-amber-600">${selectedAgent?.limit.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_limit" className="text-right">New Budget Limit ($)</Label>
              <Input 
                id="new_limit" 
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="bg-white dark:bg-slate-950 font-mono h-11"
              />
              <p className="text-[11px] text-slate-500 italic">Sentinel will reject any amount higher than this limit.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={updating}>Cancel</Button>
            <Button 
                onClick={handleUpdateLimit} 
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Dialog */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="sm:max-w-[425px] border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-950">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="text-center">
                <DialogTitle className="text-rose-600 dark:text-rose-400 text-xl font-bold">Nuclear Option</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                    Are you sure you want to revoke all access for <strong>{selectedAgent?.name}</strong>?
                </DialogDescription>
            </div>
          </DialogHeader>
          <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-100 dark:border-rose-900/50 my-2">
            <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                <p className="text-sm text-rose-700 dark:text-rose-300">
                    This will permanently delete the agent from the <code>budgets.json</code> registry using an atomic safe-write operation.
                </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2 mt-4">
            <Button variant="outline" onClick={() => setRevokeOpen(false)} disabled={updating}>Keep Agent</Button>
            <Button 
                variant="destructive" 
                onClick={handleRevokeAgent}
                disabled={updating}
                className="bg-rose-600 hover:bg-rose-700"
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
