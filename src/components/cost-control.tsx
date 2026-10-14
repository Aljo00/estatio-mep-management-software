"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { AlertCircle, ArrowDownRight, ArrowUpRight, CircleHelp, Download, Plus, WalletCards } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DailyUpdate, ExpenseCategory, ExpenseRecord, Project } from "@/data/mock-data"
import { downloadCsv } from "@/lib/export-csv"

type NewExpense = Omit<ExpenseRecord, "id" | "recordedBy" | "recordedAt">
const expenseCategories: ExpenseCategory[] = ["Labour", "Materials", "Other"]

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="mt-1 text-[11px] font-medium text-rose-700">{message}</p> : null
}

export function CostControl({ projects, expenses, updates, onCreateExpense }: { projects: Project[]; expenses: ExpenseRecord[]; updates: DailyUpdate[]; onCreateExpense: (expense: NewExpense) => void }) {
  const [projectFilter, setProjectFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formProject, setFormProject] = useState(projects[0]?.name ?? "")
  const [category, setCategory] = useState<ExpenseCategory>("Labour")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const visibleProjects = projectFilter === "all" ? projects : projects.filter((project) => project.name === projectFilter)
  const visibleNames = new Set(visibleProjects.map((project) => project.name))
  const visibleExpenses = expenses.filter((expense) => visibleNames.has(expense.project) && (categoryFilter === "all" || expense.category === categoryFilter)).sort((a, b) => b.id.localeCompare(a.id))
  const totalValue = visibleProjects.reduce((sum, project) => sum + (project.contractValue ?? project.budget), 0)
  const baseline = visibleProjects.reduce((sum, project) => sum + project.budget, 0)
  const actual = visibleProjects.reduce((sum, project) => sum + project.spent, 0)
  const forecast = visibleProjects.reduce((sum, project) => sum + project.forecast, 0)
  const forecastProfit = totalValue - forecast
  const variance = forecast - baseline
  const portfolioProgress = visibleProjects.length ? Math.round(visibleProjects.reduce((sum, project) => sum + project.progress, 0) / visibleProjects.length) : 0
  const productivity = useMemo(() => {
    const groups = new Map<string, { quantity: number; crewHours: number; reports: number }>()
    for (const update of updates) {
      const current = groups.get(update.unit) ?? { quantity: 0, crewHours: 0, reports: 0 }
      current.quantity += update.quantity
      current.crewHours += update.hoursWorked ?? update.people * 8
      current.reports += 1
      groups.set(update.unit, current)
    }
    return Array.from(groups.entries()).map(([unit, data]) => ({ unit, ...data, rate: data.crewHours ? data.quantity / data.crewHours : 0 }))
  }, [updates])

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!formProject) nextErrors.project = "Choose a project for this expense."
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) nextErrors.amount = "Enter an amount greater than zero."
    if (description.trim().length < 3) nextErrors.description = "Add a short description for the cost record."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onCreateExpense({ project: formProject, category, amount: Number(amount), description: description.trim() })
    setAmount("")
    setDescription("")
    setDialogOpen(false)
  }

  function exportExpenses() {
    downloadCsv("estatio-cost-ledger.csv", [["Project", "Category", "Amount INR", "Description", "Recorded by", "Recorded at"], ...visibleExpenses.map((expense) => [expense.project, expense.category, expense.amount, expense.description, expense.recordedBy, expense.recordedAt])])
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Project financial control</p><h2 className="text-xl font-semibold tracking-tight text-slate-900">Costs & productivity</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Compare approved baseline, actual spend, and final cost forecast before project margin is affected.</p></div><div className="flex gap-2"><Select value={projectFilter} onValueChange={(value) => { if (typeof value === "string") setProjectFilter(value) }}><SelectTrigger className="h-9 w-[190px] bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>)}</SelectContent></Select><Button variant="outline" className="cursor-pointer" onClick={exportExpenses}><Download className="size-4" />Export</Button><Button className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700" onClick={() => setDialogOpen(true)}><Plus className="size-4" />Record cost</Button></div></div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CostMetric label="Approved project value" value={money(totalValue)} detail="Fixed after quotation approval" icon={<WalletCards />} tint="teal" />
        <CostMetric label="Baseline cost" value={money(baseline)} detail="Approved cost plan" icon={<CircleHelp />} tint="blue" />
        <CostMetric label="Actual spend to date" value={money(actual)} detail={`${portfolioProgress}% average project progress`} icon={<ArrowDownRight />} tint="amber" />
        <CostMetric label="Forecast cost at completion" value={money(forecast)} detail={`${variance > 0 ? "Over" : "Under"} baseline by ${money(Math.abs(variance))}`} icon={variance > 0 ? <ArrowUpRight /> : <ArrowDownRight />} tint={variance > 0 ? "rose" : "teal"} />
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="pb-3"><CardTitle className="text-[15px]">Budget health by project</CardTitle><CardDescription className="text-xs">Actual cost and forecast compared with each approved baseline.</CardDescription></CardHeader><CardContent className="space-y-4">{visibleProjects.map((project) => { const actualPct = project.budget ? Math.min(100, Math.round(project.spent / project.budget * 100)) : 0; const forecastPct = project.budget ? Math.round(project.forecast / project.budget * 100) : 0; return <div key={project.id}><div className="mb-1.5 flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-slate-700">{project.name}</span><span className={`shrink-0 text-[10px] font-semibold ${project.forecast > project.budget ? "text-rose-700" : "text-teal-800"}`}>{money(project.forecast)} forecast</span></div><div className="relative"><Progress value={actualPct} className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-teal-700" />{forecastPct > 100 && <span className="absolute right-0 top-0 h-2 w-1 rounded-full bg-rose-500" />}</div><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{money(project.spent)} spent</span><span>Baseline {money(project.budget)}</span></div></div>})}{visibleProjects.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No projects are available for this view.</p>}</CardContent></Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="pb-3"><CardTitle className="text-[15px]">Forecast margin</CardTitle><CardDescription className="text-xs">Expected project value less expected final cost.</CardDescription></CardHeader><CardContent><div className="rounded-xl bg-gradient-to-br from-teal-50 to-white p-5"><p className="text-[10px] font-semibold uppercase tracking-wide text-teal-800">Forecast profit</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{money(forecastProfit)}</p><p className="mt-1 text-xs text-slate-500">{totalValue ? `${Math.round(forecastProfit / totalValue * 100)}%` : "0%"} of approved project value</p></div><div className="mt-4 grid grid-cols-3 gap-2">{expenseCategories.map((item) => { const categoryTotal = visibleExpenses.filter((expense) => expense.category === item).reduce((sum, expense) => sum + expense.amount, 0); return <div key={item} className="rounded-lg border border-slate-100 p-3"><p className="text-[10px] text-slate-400">{item}</p><p className="mt-1 text-xs font-semibold text-slate-700">{money(categoryTotal)}</p></div>})}</div>{variance > 0 && <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-[11px] leading-relaxed text-rose-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />Forecast is above the approved cost baseline. Review labour use, materials, delays, and rework.</div>}</CardContent></Card>
      </div>

      <Card className="mb-5 border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-[15px]">Cost ledger</CardTitle><CardDescription className="mt-1 text-xs">Illustrative operating expenses recorded against projects.</CardDescription></div><div className="flex flex-wrap gap-2"><Select value={categoryFilter} onValueChange={(value) => { if (typeof value === "string") setCategoryFilter(value) }}><SelectTrigger className="h-8 w-36 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{expenseCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" className="h-8 cursor-pointer" onClick={exportExpenses}><Download className="size-3.5" />Export CSV</Button></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-slate-400"><tr className="border-b border-slate-100"><th className="px-5 py-3">Project / cost item</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Recorded by</th><th className="px-3 py-3">Date</th><th className="px-5 py-3 text-right">Amount</th></tr></thead><tbody>{visibleExpenses.map((expense) => <tr key={expense.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"><td className="px-5 py-3"><p className="font-semibold text-slate-700">{expense.description}</p><p className="mt-1 text-[10px] text-slate-400">{expense.project}</p></td><td className="px-3 py-3"><Badge variant="secondary" className="text-[10px]">{expense.category}</Badge></td><td className="px-3 py-3 text-slate-500">{expense.recordedBy}</td><td className="px-3 py-3 text-slate-500">{expense.recordedAt}</td><td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">{money(expense.amount)}</td></tr>)}{visibleExpenses.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No cost records match these filters.</td></tr>}</tbody></table></div></CardContent></Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="pb-3"><CardTitle className="text-[15px]">Measured productivity</CardTitle><CardDescription className="text-xs">Completed quantity against reported crew hours. Compare within the same unit.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{productivity.map((item) => <div key={item.unit} className="rounded-xl border border-slate-100 p-4"><p className="text-[10px] font-medium text-slate-400">Output per crew hour</p><p className="mt-1 text-lg font-semibold text-slate-900">{item.rate.toFixed(2)} <span className="text-xs font-medium text-slate-500">{item.unit}/hr</span></p><p className="mt-2 text-[10px] text-slate-500">{item.quantity} {item.unit} · {item.crewHours} crew hours · {item.reports} reports</p></div>)}{productivity.length === 0 && <div className="col-span-full py-8 text-center text-xs text-slate-500">Daily completion reports will build the productivity picture.</div>}</CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Record project cost</DialogTitle><DialogDescription>Add an actual expense to the project&apos;s cost ledger.</DialogDescription></DialogHeader><form noValidate onSubmit={submitExpense} className="space-y-3 py-1"><div className="space-y-1.5"><p className="text-xs font-medium text-slate-700">Project</p><Select value={formProject} onValueChange={(value) => { if (typeof value === "string") setFormProject(value) }}><SelectTrigger aria-invalid={Boolean(errors.project)} className="h-9 w-full bg-white text-xs"><SelectValue placeholder="Choose project" /></SelectTrigger><SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>)}</SelectContent></Select><FieldError message={errors.project} /></div><div className="space-y-1.5"><p className="text-xs font-medium text-slate-700">Cost category</p><Select value={category} onValueChange={(value) => { if (typeof value === "string") setCategory(value as ExpenseCategory) }}><SelectTrigger className="h-9 w-full bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{expenseCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><label className="block space-y-1.5 text-xs font-medium text-slate-700">Amount (₹)<Input type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} aria-invalid={Boolean(errors.amount)} onChange={(event) => setAmount(event.target.value)} className="h-9" /><FieldError message={errors.amount} /></label><label className="block space-y-1.5 text-xs font-medium text-slate-700">Description<Input value={description} aria-invalid={Boolean(errors.description)} onChange={(event) => setDescription(event.target.value)} placeholder="Supplier invoice, payroll, travel..." className="h-9" /><FieldError message={errors.description} /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Save cost record</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  )
}

function CostMetric({ label, value, detail, icon, tint }: { label: string; value: string; detail: string; icon: ReactNode; tint: "teal" | "blue" | "amber" | "rose" }) {
  const colors = { teal: "bg-teal-50 text-teal-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" }
  return <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="p-4"><span className={`grid size-9 place-items-center rounded-xl ${colors[tint]}`}>{icon}</span><p className="mt-4 text-[10px] font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></CardContent></Card>
}
