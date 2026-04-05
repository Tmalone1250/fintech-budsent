"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, Clock, Activity, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuditLog {
  event: string
  agent_id?: string
  status: string
  timestamp: string
  details?: any
  message?: string
}

export default function SecurityAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/audit")
      const data = await res.json()
      setLogs(data)
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 3000) // Poll every 3s
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PASS":
      case "SETTLED":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Success</Badge>
      case "FAIL":
        return <Badge variant="destructive">Failure</Badge>
      case "RETRYING":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">Retrying</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Security Audit</h1>
        <p className="text-slate-500 dark:text-slate-400">Real-time surveillance of all budget sentinel activities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Events</CardTitle>
            <Activity className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Sentinels</CardTitle>
            <Shield className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">System Health</CardTitle>
            <Clock className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Operational</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  Initializing secure feed...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  No audit logs found. Trigger a transaction to begin.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, i) => (
                <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                    {log.event}
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {log.agent_id || "SYSTEM"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        {/* Use the Button component instead of a div */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          <Info className="w-4 h-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </SheetTrigger>

                      <SheetContent className="sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                        <SheetHeader className="mb-6">
                          <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            Event Details
                          </SheetTitle>
                          <SheetDescription>
                            Complete JSON payload for audit record {log.timestamp}
                          </SheetDescription>
                        </SheetHeader>
                        <div className="bg-slate-950 rounded-xl p-4 overflow-auto max-h-[70vh] border border-slate-800">
                          <pre className="text-xs font-mono text-emerald-400/90 leading-relaxed">
                            {JSON.stringify(log, null, 2)}
                          </pre>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
