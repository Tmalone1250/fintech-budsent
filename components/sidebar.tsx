"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  Settings, 
  Lock,
  ArrowLeftRight
} from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Users, label: "Agent Management", href: "/agents" },
  { icon: ShieldAlert, label: "Security Audit", href: "/security-audit" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/transactions" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen w-64 bg-[#0A192F] text-slate-300 border-r border-slate-800 shadow-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Lock className="w-5 h-5 text-[#0A192F]" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Sentinel-Pay</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-400"
              )} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">System Live</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            Audit Engine v1.0.4<br/>
            Last Sync: Just now
          </p>
        </div>
      </div>
    </div>
  )
}
