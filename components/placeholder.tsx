import Sidebar from "@/components/sidebar"

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400">This module is currently under development.</p>
    </div>
  )
}
