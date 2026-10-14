"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  Filter,
  ImagePlus,
  Layers3,
  LayoutDashboard,
  MapPin,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Square,
  Trash2,
  Users2,
  WalletCards,
  Wrench,
  X,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OperationsCenter } from "@/components/operations-center"
import { WorkDoubtPanel } from "@/components/work-doubt-panel"
import { CostControl } from "@/components/cost-control"
import { TeamView } from "@/components/team-view"
import { downloadCsv } from "@/lib/export-csv"
import {
  initialExpenses,
  initialIssues,
  initialMaterialRequests,
  initialQualityChecks,
  initialDailyUpdates,
  initialProjects,
  initialWorkAssignments,
  initialWorkDoubtThreads,
  reviewQueue,
  roleLabels,
  rolePeople,
  teamMembers,
  type AppRole,
  type DailyUpdate,
  type ExpenseRecord,
  type EvidencePhoto,
  type MaterialRequest,
  type MaterialStatus,
  type OperationsIssue,
  type Project,
  type QualityCheck,
  type QualityStatus,
  type TeamMember,
  type WorkAssignment,
  type WorkDoubtMessage,
  type WorkDoubtThread,
} from "@/data/mock-data"

type Section = "overview" | "projects" | "daily" | "operations" | "costs" | "reviews" | "team"
type ReviewStatus = "Pending review" | "Accepted" | "Returned"
type ReviewItem = (typeof reviewQueue)[number] & {
  status: ReviewStatus
  photos?: EvidencePhoto[]
  audioUrl?: string
  assignmentId?: string
  updateId?: string
}

function projectPeople(project: Project) {
  return {
    managers: project.managers?.length ? project.managers : [project.manager],
    engineers: project.engineers?.length ? project.engineers : [project.engineer],
    supervisors: project.supervisors?.length ? project.supervisors : [project.supervisor],
  }
}

function automaticProjectHealth(progress: number, plannedProgress: number): Project["health"] {
  const behindPlan = plannedProgress - progress
  if (behindPlan > 15) return "Needs attention"
  if (behindPlan > 5) return "At risk"
  return "On track"
}

const weekOutput = [
  { day: "Mon", planned: 72, actual: 54 },
  { day: "Tue", planned: 85, actual: 66 },
  { day: "Wed", planned: 78, actual: 72 },
  { day: "Thu", planned: 94, actual: 72 },
  { day: "Fri", planned: 88, actual: 64 },
  { day: "Sat", planned: 48, actual: 42 },
]

const navDefinitions: { id: Section; label: string; icon: typeof LayoutDashboard; roles: AppRole[] }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, roles: ["superadmin", "pm", "engineer", "supervisor"] },
  { id: "projects", label: "Projects", icon: Building2, roles: ["superadmin", "pm", "engineer", "supervisor"] },
  { id: "daily", label: "Daily updates", icon: ClipboardList, roles: ["engineer", "supervisor"] },
  { id: "reviews", label: "Review queue", icon: ClipboardCheck, roles: ["superadmin", "pm"] },
  { id: "costs", label: "Costs & productivity", icon: WalletCards, roles: ["superadmin", "pm"] },
  { id: "team", label: "People & teams", icon: Users2, roles: ["superadmin", "pm"] },
]

function formatCrore(amount: number) {
  return `₹${(amount / 10_000_000).toFixed(2)} Cr`
}

function shortDate(date: string) {
  return date.replace(" 2026", "")
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === "On track" || status === "Accepted" || status === "Reviewed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "At risk" || status === "Pending review" || status === "Submitted for PM review"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "Returned" || status === "Needs attention"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600"

  return (
    <Badge variant="outline" className={`h-6 rounded-full px-2.5 text-[11px] font-semibold ${className}`}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  )
}

function SectionHeading({ eyebrow, title, description, action }: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">{eyebrow}</p>}
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function MetricCard({ label, value, detail, icon: Icon, trend, tint = "teal" }: {
  label: string
  value: string
  detail: string
  icon: typeof Activity
  trend?: "up" | "down" | "neutral"
  tint?: "teal" | "amber" | "blue" | "rose"
}) {
  const tints = {
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
  }
  const TrendIcon = trend === "down" ? ArrowDownRight : ArrowUpRight

  return (
    <Card className="border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`grid size-10 place-items-center rounded-xl ${tints[tint]}`}>
            <Icon className="size-[18px]" strokeWidth={1.8} />
          </div>
          {trend && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
              <TrendIcon className="size-3" />
              {trend === "up" ? "+8.2%" : trend === "down" ? "−3.4%" : "This week"}
            </span>
          )}
        </div>
        <p className="mt-4 text-[12px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{value}</p>
        <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  )
}

function ProjectTable({
  projects,
  canSeeMoney,
  canManage,
  onOpen,
  onEdit,
}: {
  projects: Project[]
  canSeeMoney: boolean
  canManage?: boolean
  onOpen: (project: Project) => void
  onEdit?: (project: Project) => void
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All statuses")
  const visibleProjects = projects.filter((project) => {
    const text = `${project.name} ${project.code} ${project.client} ${project.location} ${project.discipline}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (statusFilter === "All statuses" || project.health === statusFilter)
  })

  return (
    <Card className="border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70">
      <CardHeader className="gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-[15px] font-semibold">Project portfolio</CardTitle>
          <CardDescription className="mt-1 text-xs">Live work, progress, and delivery health</CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search projects"
              placeholder="Search projects..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 border-slate-200 bg-slate-50/70 pl-9 text-xs shadow-none focus-visible:bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(typeof value === "string" ? value : "All statuses")}>
            <SelectTrigger className="h-9 w-full border-slate-200 bg-white text-xs sm:w-[142px]">
              <Filter className="mr-1 size-3.5 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All statuses">All statuses</SelectItem>
              <SelectItem value="On track">On track</SelectItem>
              <SelectItem value="At risk">At risk</SelectItem>
              <SelectItem value="Needs attention">Needs attention</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table className="min-w-[780px]">
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="h-10 pl-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Project</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Progress</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Project health</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Team</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Due date</TableHead>
              {canSeeMoney && <TableHead className="text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Forecast</TableHead>}
              <TableHead className="w-10 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProjects.map((project) => (
              <TableRow key={project.id} className="group cursor-pointer border-slate-100" onClick={() => onOpen(project)}>
                <TableCell className="py-3 pl-5">
                  <button className="text-left" onClick={(event) => { event.stopPropagation(); onOpen(project) }}>
                    <span className="block text-[13px] font-semibold text-slate-800 group-hover:text-teal-800">{project.name}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{project.code}</span><span className="size-0.5 rounded-full bg-slate-300" />{project.discipline}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="w-40 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-20"><Progress value={project.progress} className="gap-0 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-teal-700" /></div>
                    <span className="text-xs font-semibold tabular-nums text-slate-700">{project.progress}%</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Plan {project.plannedProgress}%</p>
                </TableCell>
                <TableCell className="py-3"><StatusPill status={project.health} /></TableCell>
                <TableCell className="py-3">
              <div className="flex -space-x-2">
                    {[...projectPeople(project).managers, ...projectPeople(project).engineers, ...projectPeople(project).supervisors].slice(0, 5).map((name, index) => (
                      <Avatar key={name} className="size-7 border-2 border-white">
                        <AvatarFallback className={`text-[8px] font-semibold ${index === 0 ? "bg-teal-100 text-teal-800" : index === 1 ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                          {name.split(" ").map((part) => part[0]).join("").replace(".", "")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    <span className="ml-2 self-center text-[10px] text-slate-400">+{Math.max(project.teamSize - projectPeople(project).managers.length - projectPeople(project).engineers.length - projectPeople(project).supervisors.length, 0)}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{shortDate(project.dueDate)}</TableCell>
                {canSeeMoney && <TableCell className="py-3 text-right text-xs font-medium tabular-nums text-slate-700">{formatCrore(project.forecast)}</TableCell>}
                <TableCell className="py-3 pr-4 text-right" onClick={(event) => event.stopPropagation()}><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${project.name}`} className="cursor-pointer text-slate-500" />}><MoreHorizontal className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className="cursor-pointer" onClick={() => onOpen(project)}>Open project</DropdownMenuItem>{canManage && onEdit && <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(project)}>Edit project details</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></TableCell>
              </TableRow>
            ))}
            {visibleProjects.length === 0 && (
              <TableRow><TableCell colSpan={canSeeMoney ? 7 : 6} className="h-24 text-center text-sm text-slate-500">No projects match this search.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
        <span>Showing {visibleProjects.length} of {projects.length} projects</span>
        <span>Demo data · Updated just now</span>
      </div>
    </Card>
  )
}

function ProjectDetails({ project, onClose, onOpenOperations, canSeeMoney }: { project: Project | null; onClose: () => void; onOpenOperations: (project: Project) => void; canSeeMoney: boolean }) {
  return (
    <Dialog open={Boolean(project)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="min-w-0 max-h-[90dvh] overflow-x-hidden overflow-y-auto border-slate-200 p-0 sm:max-w-2xl">
        {project && (
          <>
            <div className="min-w-0 border-b border-slate-100 bg-gradient-to-br from-teal-50/80 to-white p-6 pr-12 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-teal-200 bg-white/70 text-[10px] font-semibold text-teal-800">{project.code}</Badge>
                <StatusPill status={project.health} />
              </div>
              <DialogHeader className="mt-4 text-left">
                <DialogTitle className="text-2xl font-semibold tracking-[-0.04em]">{project.name}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span>{project.client}</span><span className="size-0.5 rounded-full bg-slate-300" />
                  <MapPin className="size-3" />{project.location}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="grid min-w-0 gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] sm:p-7">
              <div className="min-w-0 space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Progress so far</span><span className="text-lg font-semibold text-slate-900">{project.progress}%</span></div>
                  <Progress value={project.progress} className="gap-0 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-teal-700" />
                  <p className="mt-2 text-[11px] text-slate-400">Planned by today: {project.plannedProgress}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Milestones</p>
                  {project.milestones?.length ? <div className="mt-2 space-y-2">{project.milestones.map((milestone, index) => <div key={`${milestone.title}-${index}`} className="flex items-start justify-between gap-3"><span className="text-sm font-semibold text-slate-800">{milestone.title}</span><span className="shrink-0 text-[10px] text-slate-500">{shortDate(milestone.dueDate)}</span></div>)}</div> : <p className="mt-2 text-sm font-semibold text-slate-800">{project.nextMilestone === "Not set" ? "No milestones scheduled" : project.nextMilestone}</p>}
                  <p className="mt-2 text-xs text-slate-500">Project finish · {shortDate(project.dueDate)}</p>
                </div>
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-amber-800"><AlertCircle className="size-3.5" />Current site note</p>
                  <p className="mt-2 text-xs leading-relaxed text-amber-900/80">{project.blocker}</p>
                </div>
              </div>
              <div className="min-w-0 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile label="MEP work areas" value={project.discipline} />
                  <InfoTile label="Site team" value={`${project.teamSize} people`} />
                  <InfoTile label="Project managers" value={projectPeople(project).managers.join(", ")} />
                  <InfoTile label="Engineers" value={projectPeople(project).engineers.join(", ")} />
                  <InfoTile label="Supervisors" value={projectPeople(project).supervisors.join(", ")} />
                </div>
                {canSeeMoney && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700"><WalletCards className="size-3.5 text-teal-700" />Cost outlook</div>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-500"><span>Approved budget</span><span className="font-medium text-slate-800">{formatCrore(project.budget)}</span></div>
                      <div className="flex justify-between text-slate-500"><span>Spent to date</span><span className="font-medium text-slate-800">{formatCrore(project.spent)}</span></div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-500"><span>Forecast at completion</span><span className={`font-semibold ${project.forecast > project.budget ? "text-rose-700" : "text-emerald-700"}`}>{formatCrore(project.forecast)}</span></div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-xs text-slate-500"><CalendarDays className="size-4 text-slate-400" /> Due {project.dueDate}</div>
              </div>
            </div>
            <DialogFooter className="flex-row justify-between border-t border-slate-100 px-6 py-4 sm:px-7">
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
              <Button size="sm" className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700" onClick={() => onOpenOperations(project)}>View project activity <ArrowRight className="ml-1 size-3.5" /></Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-semibold leading-snug text-slate-700">{value}</p></div>
}

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="mt-1 text-[11px] font-medium text-rose-700">{message}</p> : null
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block space-y-2.5 text-xs font-medium text-slate-700">{label}{children}<FieldError message={error} /></label>
}

function FormSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][]; error?: string }) {
  return <div className="space-y-1.5"><p className="text-xs font-medium text-slate-700">{label}</p><Select value={value} onValueChange={(next) => { if (typeof next === "string") onChange(next) }}><SelectTrigger aria-invalid={Boolean(error)} className="h-9 w-full bg-white text-xs"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map(([option, title]) => <SelectItem key={option} value={option}>{title}</SelectItem>)}</SelectContent></Select><FieldError message={error} /></div>
}

type ProjectPurchaseDraft = { item: string; quantity: number; unit: string; estimatedUnitCost: number; requiredBy: string; priority: "Normal" | "High" | "Urgent"; note: string }
type ProjectDraft = Pick<Project, "name" | "client" | "location" | "discipline" | "progress" | "plannedProgress" | "health" | "startDate" | "dueDate" | "manager" | "engineer" | "supervisor" | "teamSize" | "nextMilestone" | "blocker" | "budget" | "contractValue"> & {
  managers: string[]
  engineers: string[]
  supervisors: string[]
  milestones: NonNullable<Project["milestones"]>
  purchases: ProjectPurchaseDraft[]
}

function dateInputValue(date: string) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? "" : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`
}

function displayDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""
}

function NewProjectDialog({ open, onOpenChange, project, members, onSave }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  members: TeamMember[]
  onSave: (draft: ProjectDraft) => void
}) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(project?.name ?? "")
  const [client, setClient] = useState(project?.client ?? "")
  const [location, setLocation] = useState(project?.location ?? "")
  const [discipline, setDiscipline] = useState(project?.discipline.split(" · ")[0] ?? "HVAC")
  const [managers, setManagers] = useState(project?.managers ?? [project?.manager ?? members.find((member) => member.role === "Project Manager")?.name ?? rolePeople.pm.name])
  const [engineers, setEngineers] = useState(project?.engineers ?? [project?.engineer ?? members.find((member) => member.role === "Engineer")?.name ?? rolePeople.engineer.name])
  const [supervisors, setSupervisors] = useState(project?.supervisors ?? [project?.supervisor ?? members.find((member) => member.role === "Supervisor")?.name ?? rolePeople.supervisor.name])
  const [teamSize, setTeamSize] = useState(String(project?.teamSize ?? 0))
  const [contractValue, setContractValue] = useState(String(project?.contractValue ?? ""))
  const [budget, setBudget] = useState(String(project?.budget ?? ""))
  const [startDate, setStartDate] = useState(dateInputValue(project?.startDate ?? "09 Oct 2026"))
  const [dueDate, setDueDate] = useState(dateInputValue(project?.dueDate ?? "31 Mar 2027"))
  const [progress, setProgress] = useState(String(project?.progress ?? 0))
  const [plannedProgress, setPlannedProgress] = useState(String(project?.plannedProgress ?? 0))
  const [milestones, setMilestones] = useState<NonNullable<Project["milestones"]>>(() => project?.milestones ?? (project?.nextMilestone && project.nextMilestone !== "Not set" ? [{ title: project.nextMilestone, dueDate: dateInputValue(project.dueDate) }] : []))
  const [purchases, setPurchases] = useState<ProjectPurchaseDraft[]>([{ item: "", quantity: 0, unit: "pcs", estimatedUnitCost: 0, requiredBy: "", priority: "Normal", note: "" }])
  const [blocker, setBlocker] = useState(project?.blocker ?? "No active blockers")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isCreating = !project
  const stepNames = isCreating ? ["Project details", "Budget & schedule", "Project team", "Purchasing"] : ["Project details", "Budget & schedule", "Project team"]
  const estimatedPurchases = purchases.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.estimatedUnitCost) || 0), 0)
  const optionsFor = (role: TeamMember["role"]) => members.filter((member) => member.role === role)

  function validateStep(targetStep: number) {
    const nextErrors: Record<string, string> = {}
    if (targetStep === 0) {
      if (name.trim().length < 3) nextErrors.name = "Enter a project name with at least 3 characters."
      if (client.trim().length < 2) nextErrors.client = "Enter the client or owner name."
      if (location.trim().length < 2) nextErrors.location = "Enter the project site location."
    }
    if (targetStep === 1) {
      if (!Number.isFinite(Number(teamSize)) || Number(teamSize) < 0) nextErrors.teamSize = "Enter a team size of zero or more."
      if (!Number.isFinite(Number(contractValue)) || Number(contractValue) <= 0) nextErrors.contractValue = "Enter an approved project value greater than zero."
      if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) nextErrors.budget = "Enter a baseline cost greater than zero."
      if (Number(budget) > Number(contractValue)) nextErrors.budget = "Baseline cost cannot exceed the approved project value."
      if (!startDate) nextErrors.startDate = "Choose the project start date."
      if (!dueDate) nextErrors.dueDate = "Choose the planned finish date."
      if (startDate && dueDate && dueDate < startDate) nextErrors.dueDate = "Planned finish must be on or after the start date."
      milestones.forEach((milestone, index) => {
        if (milestone.title.trim() && !milestone.dueDate) nextErrors[`milestone-${index}`] = "Choose a target date for this milestone."
        if (milestone.dueDate && milestone.dueDate < startDate) nextErrors[`milestone-${index}`] = "Milestone date must be on or after the project start."
      })
    }
    if (targetStep === 2) {
      if (!managers.length) nextErrors.managers = "Assign at least one project manager."
      if (!engineers.length) nextErrors.engineers = "Assign at least one engineer."
      if (!supervisors.length) nextErrors.supervisors = "Assign at least one supervisor."
    }
    if (targetStep === 3) {
      purchases.forEach((item, index) => {
        if (!item.item.trim()) return
        if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) nextErrors[`purchase-quantity-${index}`] = "Enter a quantity greater than zero."
        if (!Number.isFinite(Number(item.estimatedUnitCost)) || Number(item.estimatedUnitCost) < 0) nextErrors[`purchase-cost-${index}`] = "Enter an estimated unit cost of zero or more."
      })
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < stepNames.length - 1) {
      if (validateStep(step)) setStep((current) => current + 1)
      return
    }
    const finalStep = isCreating ? 3 : 2
    if (!validateStep(finalStep)) return
    const cleanMilestones = milestones.filter((item) => item.title.trim()).map((item) => ({ title: item.title.trim(), dueDate: displayDate(item.dueDate) }))
    const savedProgress = isCreating ? 0 : Number(progress)
    const savedPlannedProgress = isCreating ? 0 : Number(plannedProgress)
    onSave({ name: name.trim(), client: client.trim(), location: location.trim(), discipline, manager: managers[0], engineer: engineers[0], supervisor: supervisors[0], managers, engineers, supervisors, teamSize: Number(teamSize), contractValue: Number(contractValue), budget: Number(budget), progress: savedProgress, plannedProgress: savedPlannedProgress, health: project ? project.health : automaticProjectHealth(savedProgress, savedPlannedProgress), startDate: displayDate(startDate), dueDate: displayDate(dueDate), nextMilestone: cleanMilestones[0]?.title ?? "Not set", milestones: cleanMilestones, blocker: blocker.trim() || "No active blockers", purchases: isCreating ? purchases.filter((item) => item.item.trim()).map((item) => ({ ...item, item: item.item.trim(), requiredBy: item.requiredBy ? displayDate(item.requiredBy) : displayDate(dueDate), note: item.note.trim() })) : [] })
    onOpenChange(false)
  }

  function toggleMember(names: string[], setNames: (names: string[]) => void, member: string) {
    setNames(names.includes(member) ? names.filter((name) => name !== member) : [...names, member])
  }

  function memberPicker(label: string, role: TeamMember["role"], names: string[], setNames: (names: string[]) => void, error?: string) {
    const people = optionsFor(role)
    return <section className="rounded-xl border border-border bg-card/55 p-3.5 shadow-sm"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-foreground">{label}</p><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">{names.length} selected</span></div><div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border/70 bg-background/70 p-2">{people.length ? people.map((member) => <label key={member.name} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs text-foreground transition-colors hover:bg-accent"><input type="checkbox" checked={names.includes(member.name)} onChange={() => toggleMember(names, setNames, member.name)} className="size-3.5 accent-teal-700" /><span className="min-w-0 flex-1 truncate">{member.name}</span><span className="text-[10px] text-muted-foreground">{member.status}</span></label>) : <p className="px-2 py-3 text-xs text-muted-foreground">No {label.toLowerCase()} are in the team directory yet.</p>}</div><FieldError message={error} /></section>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[90dvh] max-h-[90dvh] min-h-0 w-full gap-0 overflow-hidden p-0 sm:max-w-5xl md:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col border-r border-border bg-muted/30 p-5 md:flex">
          <div className="mb-8"><div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/15 text-primary"><Building2 className="size-5" /></div><p className="text-sm font-semibold text-foreground">Project setup</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">A clear plan keeps delivery, people, and purchasing connected.</p></div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Setup steps</p>
          <ol className="space-y-1">{stepNames.map((label, index) => <li key={label} className={`relative flex gap-3 rounded-lg px-2.5 py-3 ${step === index ? "bg-primary/10" : ""}`}><span className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${step === index ? "border-primary bg-primary text-primary-foreground" : index < step ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground"}`}>{index < step ? <Check className="size-3.5" /> : index + 1}</span><span className="min-w-0"><span className={`block text-xs font-medium ${step === index ? "text-foreground" : "text-muted-foreground"}`}>{label}</span><span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{["Name the project and choose its work areas.", "Set the approved budget and delivery dates.", "Assign the people responsible for delivery.", "List materials and estimated purchase costs."][index]}</span></span></li>)}</ol>
          <div className="mt-auto rounded-xl border border-primary/20 bg-primary/5 p-3"><p className="text-[10px] font-semibold text-foreground">Need more detail later?</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">You can update project information and track requests after setup.</p></div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col">
        <DialogHeader className="border-b border-border px-6 py-5 pr-14">
          <div className="mb-1 flex items-center gap-2"><span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary md:hidden">Step {step + 1} of {stepNames.length}</span><span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-primary sm:inline">{project ? "Project settings" : "New project"}</span></div>
          <DialogTitle className="text-xl tracking-tight">{project ? "Edit project details" : "Create a project"}</DialogTitle>
          <DialogDescription className="max-w-xl">{project ? "Update project information and assigned team." : `Step ${step + 1} · ${stepNames[step]}. ${["Start with the project identity and scope.", "Set the budget, dates, and key checkpoints. Project health is calculated automatically when delivery is tracked.", "Bring the delivery team together.", "Plan the materials and estimated costs."][step]}`}</DialogDescription>
          {isCreating && <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted md:hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / stepNames.length) * 100}%` }} /></div>}
        </DialogHeader>
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-6 py-5"><div className="min-w-0 space-y-5">
          {step === 0 && <section className="rounded-2xl border border-border bg-card/45 p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary"><Building2 className="size-5" /></span><div><h3 className="text-sm font-semibold text-foreground">Project identity</h3><p className="mt-0.5 text-[11px] text-muted-foreground">Add the project name, client, site, and scope.</p></div></div><div className="min-w-0 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Project name" error={errors.name}><Input value={name} aria-invalid={Boolean(errors.name)} onChange={(event) => setName(event.target.value)} placeholder="e.g. Lakeside Medical Centre" /></Field><Field label="Client / owner" error={errors.client}><Input value={client} aria-invalid={Boolean(errors.client)} onChange={(event) => setClient(event.target.value)} placeholder="Client or developer" /></Field></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Site location" error={errors.location}><Input value={location} aria-invalid={Boolean(errors.location)} onChange={(event) => setLocation(event.target.value)} placeholder="City, district" /></Field><FormSelect label="Work areas" value={discipline} options={["HVAC", "Electrical", "Plumbing", "Fire Fighting", "ELV", "Multiple disciplines"].map((item) => [item, item])} onChange={setDiscipline} /></div></div></section>}
          {step === 1 && <div className="min-w-0 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Approved project value (₹)" error={errors.contractValue}><Input type="number" inputMode="decimal" min="1" step="1000" value={contractValue} aria-invalid={Boolean(errors.contractValue)} onChange={(event) => setContractValue(event.target.value)} placeholder="0" /></Field><Field label="Approved baseline cost (₹)" error={errors.budget}><Input type="number" inputMode="decimal" min="1" step="1000" value={budget} aria-invalid={Boolean(errors.budget)} onChange={(event) => setBudget(event.target.value)} placeholder="0" /></Field></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Start date" error={errors.startDate}><DatePicker value={startDate} invalid={Boolean(errors.startDate)} onValueChange={setStartDate} /></Field><Field label="Planned finish" error={errors.dueDate}><DatePicker value={dueDate} minDate={startDate} invalid={Boolean(errors.dueDate)} onValueChange={setDueDate} /></Field><Field label="Team size" error={errors.teamSize}><Input type="number" inputMode="numeric" min="0" step="1" value={teamSize} aria-invalid={Boolean(errors.teamSize)} onChange={(event) => setTeamSize(event.target.value)} /></Field></div><div className="rounded-xl border border-border p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="text-xs font-semibold text-foreground">Milestones <span className="font-normal text-muted-foreground">(optional)</span></h3><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Milestones are major checkpoints, such as duct installation or system testing. Add them now or later.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setMilestones((current) => [...current, { title: "", dueDate: "" }])}><Plus className="size-3.5" />Add</Button></div><div className="space-y-3">{milestones.map((milestone, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Field label={`Milestone ${index + 1}`} error={errors[`milestone-${index}`]}><Input value={milestone.title} onChange={(event) => setMilestones((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} placeholder="e.g. Main riser installation" /></Field><Field label="Target date"><DatePicker value={milestone.dueDate} minDate={startDate} onValueChange={(value) => setMilestones((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, dueDate: value } : item))} /></Field><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove milestone ${index + 1}`} className="mt-5" onClick={() => setMilestones((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button></div>)}</div></div></div>}
          {step === 2 && <div className="min-w-0 space-y-4"><p className="text-xs text-muted-foreground">Select everyone who will own or deliver this project. You can assign more than one person in each role.</p><div className="grid gap-4 lg:grid-cols-3">{memberPicker("Project managers", "Project Manager", managers, setManagers, errors.managers)}{memberPicker("Engineers", "Engineer", engineers, setEngineers, errors.engineers)}{memberPicker("Supervisors", "Supervisor", supervisors, setSupervisors, errors.supervisors)}</div><Field label="Current site note (optional)"><textarea value={blocker} onChange={(event) => setBlocker(event.target.value)} rows={3} placeholder="No active blockers" className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" /></Field></div>}
          {step === 3 && isCreating && <div className="min-w-0 space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Materials & purchasing</h3><p className="mt-1 text-[11px] text-muted-foreground">Add planned materials, quantities, and estimated unit costs. These become requests for the project team to track.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setPurchases((current) => [...current, { item: "", quantity: 0, unit: "pcs", estimatedUnitCost: 0, requiredBy: "", priority: "Normal", note: "" }])}><Plus className="size-3.5" />Add material</Button></div><div className="space-y-3">{purchases.map((item, index) => <div key={index} className="rounded-xl border border-border p-3.5"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold">Material {index + 1}</p>{purchases.length > 1 && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove material ${index + 1}`} onClick={() => setPurchases((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button>}</div><div className="grid gap-3 sm:grid-cols-[1.5fr_0.7fr_0.7fr_1fr]"><Field label="Material / specification"><Input value={item.item} onChange={(event) => setPurchases((current) => current.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, item: event.target.value } : purchase))} placeholder="e.g. GI duct sheet" /></Field><Field label="Quantity" error={errors[`purchase-quantity-${index}`]}><Input type="number" min="0.01" step="0.01" value={item.quantity || ""} onChange={(event) => setPurchases((current) => current.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, quantity: Number(event.target.value) } : purchase))} placeholder="0" /></Field><Field label="Unit"><Input value={item.unit} onChange={(event) => setPurchases((current) => current.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, unit: event.target.value } : purchase))} placeholder="pcs" /></Field><Field label="Est. unit cost (₹)" error={errors[`purchase-cost-${index}`]}><Input type="number" min="0" step="0.01" value={item.estimatedUnitCost || ""} onChange={(event) => setPurchases((current) => current.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, estimatedUnitCost: Number(event.target.value) } : purchase))} placeholder="0" /></Field></div><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_1.5fr]"><Field label="Needed by"><DatePicker value={item.requiredBy} minDate={startDate} onValueChange={(value) => setPurchases((current) => current.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, requiredBy: value } : purchase))} /></Field><FormSelect label="Priority" value={item.priority} options={[["Normal", "Normal"], ["High", "High"], ["Urgent", "Urgent"]]} onChange={(value) => setPurchases((current) => current.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, priority: value as ProjectPurchaseDraft["priority"] } : purchase))} /><Field label="Note (optional)"><Input value={item.note} onChange={(event) => setPurchases((current) => current.map((purchase, itemIndex) => itemIndex === index ? { ...purchase, note: event.target.value } : purchase))} placeholder="Supplier/specification notes" /></Field></div><p className="mt-3 text-right text-[10px] text-muted-foreground">Estimated line total: ₹{((Number(item.quantity) || 0) * (Number(item.estimatedUnitCost) || 0)).toLocaleString("en-IN")}</p></div>)}</div><div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-xs"><span className="font-medium">Estimated materials total</span><span className="font-semibold">₹{estimatedPurchases.toLocaleString("en-IN")}</span></div><p className="text-[10px] text-muted-foreground">You can skip this step and add purchase requests later from Project activity.</p></div>}
          </div></div>
          <DialogFooter className="shrink-0 flex-row justify-between border-t border-border bg-background px-6 py-4 sm:justify-between"><div>{step > 0 && <Button type="button" variant="outline" onClick={() => { setErrors({}); setStep((current) => current - 1) }}><ArrowRight className="size-3.5 rotate-180" />Back</Button>}</div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">{step < stepNames.length - 1 ? <>Continue<ArrowRight className="size-3.5" /></> : project ? "Save project" : "Create project"}</Button></div></DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Overview({
  role,
  projects,
  assignments,
  pendingReviews,
  canSeeMoney,
  onOpenProject,
  onEditProject,
  onGoToProjects,
}: {
  role: AppRole
  projects: Project[]
  assignments: WorkAssignment[]
  pendingReviews: number
  canSeeMoney: boolean
  onOpenProject: (project: Project) => void
  onEditProject: (project: Project) => void
  onGoToProjects: () => void
}) {
  const [period, setPeriod] = useState("This week")
  const visibleOutput = period === "This week" ? weekOutput : [
    { day: "Mon", planned: 66, actual: 59 },
    { day: "Tue", planned: 80, actual: 74 },
    { day: "Wed", planned: 74, actual: 61 },
    { day: "Thu", planned: 90, actual: 82 },
    { day: "Fri", planned: 84, actual: 70 },
    { day: "Sat", planned: 46, actual: 40 },
  ]
  const atRisk = projects.filter((project) => project.health !== "On track")
  const avgProgress = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0
  const plannedCost = projects.reduce((sum, project) => sum + project.budget, 0)
  const forecastCost = projects.reduce((sum, project) => sum + project.forecast, 0)
  const attentionHeading = role === "engineer" ? "Work assigned today" : role === "supervisor" ? "Today’s assigned work" : "Needs attention"
  const items = role === "engineer" || role === "supervisor"
    ? assignments.filter((assignment) => assignment.due === "Today").slice(0, 3).map((item) => ({ title: item.activity, detail: `${item.project} · ${item.target} ${item.unit}`, label: `${item.completedQty} complete`, icon: Wrench }))
    : atRisk.map((project) => ({ title: project.name, detail: project.blocker, label: project.health, icon: AlertCircle }))

  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active projects" value={`${projects.length}`} detail="Across your current portfolio" icon={Building2} trend="up" tint="teal" />
        <MetricCard label="Measured progress" value={`${avgProgress}%`} detail="Weighted average completion" icon={Activity} trend="up" tint="blue" />
        <MetricCard label={role === "pm" || role === "superadmin" ? "Pending reviews" : "Today’s assignments"} value={`${role === "pm" || role === "superadmin" ? pendingReviews : assignments.length}`} detail={role === "pm" || role === "superadmin" ? "Daily completion reports" : "Work assigned for today"} icon={ClipboardCheck} trend="neutral" tint="amber" />
        {canSeeMoney ? (
          <MetricCard label="Forecast at completion" value={formatCrore(forecastCost)} detail={`${forecastCost > plannedCost ? "Above" : "Within"} portfolio budget · ${formatCrore(plannedCost)} baseline`} icon={WalletCards} trend={forecastCost > plannedCost ? "down" : "up"} tint={forecastCost > plannedCost ? "rose" : "teal"} />
        ) : (
          <MetricCard label="Schedule attention" value={`${atRisk.length}`} detail="Projects need a follow-up" icon={Clock3} trend="down" tint="rose" />
        )}
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        <Card className="border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70">
          <CardHeader className="flex-row items-start justify-between pb-2">
            <div><CardTitle className="text-[15px]">Weekly work output</CardTitle><CardDescription className="mt-1 text-xs">Planned and completed quantities across active sites</CardDescription></div>
            <Select value={period} onValueChange={(value) => { if (typeof value === "string") setPeriod(value) }}><SelectTrigger aria-label="Choose chart period" className="h-8 w-[112px] border-slate-200 text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="This week">This week</SelectItem><SelectItem value="Last week">Last week</SelectItem></SelectContent></Select>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="mb-4 flex items-center gap-4 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-slate-200" />Planned</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-teal-700" />Completed</span><span className="ml-auto text-[10px] text-slate-400">Illustrative demo quantities</span></div>
            <div className="relative h-[154px] border-b border-slate-100">
              <div className="absolute inset-0 flex flex-col justify-between pb-0">
                {["100%", "75%", "50%", "25%"].map((label) => <div key={label} className="flex items-center border-t border-dashed border-slate-100"><span className="absolute -left-1 -translate-y-1/2 bg-white pr-2 text-[9px] text-slate-300">{label}</span></div>)}
              </div>
              <div className="absolute inset-x-6 bottom-0 top-0 flex items-end justify-around gap-3 pl-3">
                {visibleOutput.map((day) => (
                  <div key={day.day} className="flex h-full w-full max-w-14 items-end justify-center gap-1.5">
                    <div title={`Planned ${day.planned}%`} className="w-3.5 rounded-t-sm bg-slate-200" style={{ height: `${day.planned}%` }} />
                    <div title={`Completed ${day.actual}%`} className="w-3.5 rounded-t-sm bg-teal-700 transition-all hover:bg-teal-600" style={{ height: `${day.actual}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-around pl-8">{visibleOutput.map((day) => <span key={day.day} className="text-[10px] text-slate-400">{day.day}</span>)}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between"><div><CardTitle className="text-[15px]">{attentionHeading}</CardTitle><CardDescription className="mt-1 text-xs">Items that may need action</CardDescription></div><span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-700"><AlertCircle className="size-4" /></span></div>
          </CardHeader>
          <CardContent className="space-y-1 px-3 pb-3">
            {items.slice(0, 4).map((item, index) => {
              const Icon = item.icon
              return <div key={`${item.title}-${index}`} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-slate-50"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{item.title}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{item.detail}</span></span><span className="shrink-0 pt-0.5 text-[9px] font-medium text-amber-700">{item.label}</span></div>
            })}
            {items.length === 0 && <p className="p-4 text-xs text-slate-500">Everything looks clear right now.</p>}
            <button onClick={onGoToProjects} className="mt-1 inline-flex items-center gap-1 px-2.5 py-2 text-[11px] font-semibold text-teal-800 hover:text-teal-950">View project details <ArrowRight className="size-3" /></button>
          </CardContent>
        </Card>
      </div>

      <SectionHeading title="Portfolio snapshot" description="Quick access to projects across the team." action={<Button variant="outline" size="sm" onClick={onGoToProjects} className="h-8 border-slate-200 text-xs">All projects <ArrowRight className="ml-1 size-3.5" /></Button>} />
      <ProjectTable projects={projects.slice(0, 4)} canSeeMoney={canSeeMoney} canManage={role === "pm" || role === "superadmin"} onOpen={onOpenProject} onEdit={onEditProject} />
    </>
  )
}

function ReviewQueue({
  reviews,
  onDecision,
  notice,
}: {
  reviews: ReviewItem[]
  onDecision: (id: string, status: "Accepted" | "Returned") => void
  notice: string
}) {
  const pending = reviews.filter((review) => review.status === "Pending review")
  return (
    <>
      <SectionHeading eyebrow="Project manager workflow" title="Operations review" description="Compare the supervisor’s daily report with the target, then accept it or return it for correction." action={<Badge variant="outline" className="h-7 border-amber-200 bg-amber-50 px-2.5 text-[11px] text-amber-800">{pending.length} waiting</Badge>} />
      {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800"><CheckCircle2 className="size-4" />{notice}</div>}
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="text-[10px] text-slate-500">{review.id}</Badge><StatusPill status={review.status} /><span className="text-[10px] text-slate-400">{review.submitted}</span></div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-800">{review.activity}</h3>
                  <p className="mt-1 text-xs text-slate-500">{review.project} <span className="mx-1.5 text-slate-300">·</span> Submitted by {review.supervisor}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[150px_1fr]">
                    <div className="rounded-lg bg-slate-50 px-3 py-2.5"><p className="text-[10px] text-slate-400">Reported complete</p><p className="mt-1 text-sm font-semibold text-slate-800">{review.quantity}</p></div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2.5"><p className="text-[10px] text-slate-400">Supervisor note</p><p className="mt-1 text-xs leading-relaxed text-slate-600">{review.note}</p></div>
                  </div>
                  <EvidencePreview photos={review.photos} audioUrl={review.audioUrl} />
                </div>
                {review.status === "Pending review" ? (
                  <div className="flex gap-2 lg:pt-7"><Button variant="outline" size="sm" className="h-9 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onDecision(review.id, "Returned")}><X className="mr-1 size-3.5" />Return</Button><Button size="sm" className="h-9 bg-teal-800 text-white hover:bg-teal-700" onClick={() => onDecision(review.id, "Accepted")}><Check className="mr-1 size-3.5" />Accept report</Button></div>
                ) : <div className="pt-2 lg:pt-7"><span className={`text-xs font-semibold ${review.status === "Accepted" ? "text-emerald-700" : "text-rose-700"}`}>{review.status === "Accepted" ? "Accepted by PM" : "Returned for correction"}</span></div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs leading-relaxed text-slate-500"><CircleHelp className="mr-2 inline size-4 text-slate-400" />Prototype behavior: a decision updates the local demo status. It does not write to a database yet.</div>
    </>
  )
}

function EvidenceCapture({
  photos,
  onPhotosChange,
  audioUrl,
  onAudioChange,
}: {
  photos: EvidencePhoto[]
  onPhotosChange: (photos: EvidencePhoto[]) => void
  audioUrl?: string
  onAudioChange: (audioUrl?: string) => void
}) {
  const photoInput = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => () => {
    mediaStream.current?.getTracks().forEach((track) => track.stop())
  }, [])

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    onPhotosChange([...photos, ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))])
    event.target.value = ""
  }

  function removePhoto(index: number) {
    const photo = photos[index]
    if (photo?.url.startsWith("blob:")) URL.revokeObjectURL(photo.url)
    onPhotosChange(photos.filter((_, photoIndex) => photoIndex !== index))
  }

  async function startRecording() {
    setError("")
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("Audio recording is not supported in this browser.")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream
      chunks.current = []
      const nextRecorder = new MediaRecorder(stream)
      recorder.current = nextRecorder
      nextRecorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.current.push(event.data) }
      nextRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: nextRecorder.mimeType || "audio/webm" })
        if (blob.size > 0) onAudioChange(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
        setRecording(false)
      }
      nextRecorder.start()
      setRecording(true)
    } catch {
      setError("Microphone access was unavailable. Allow microphone access and try again.")
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop()
  }

  function clearAudio() {
    if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl)
    onAudioChange(undefined)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-xs font-semibold text-slate-700">Work evidence</p><p className="mt-0.5 text-[10px] text-slate-400">Attach photos or a voice note to this work record.</p></div>
        <div className="flex items-center gap-2">
          <input ref={photoInput} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={addPhotos} />
          <Button type="button" variant="outline" size="sm" className="h-8 border-slate-200 bg-white text-[10px]" onClick={() => photoInput.current?.click()}><ImagePlus className="mr-1.5 size-3.5" />Photo</Button>
          {recording ? (
            <Button type="button" variant="destructive" size="sm" className="h-8 text-[10px]" onClick={stopRecording}><Square className="mr-1.5 size-3" />Stop recording</Button>
          ) : (
            <Button type="button" variant="outline" size="sm" className="h-8 border-slate-200 bg-white text-[10px]" onClick={startRecording}><Mic className="mr-1.5 size-3.5" />Record audio</Button>
          )}
        </div>
      </div>
      {recording && <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-rose-700"><span className="size-1.5 animate-pulse rounded-full bg-rose-600" />Recording voice note…</p>}
      {error && <p role="alert" className="mt-2 text-[10px] text-rose-700">{error}</p>}
      {photos.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{photos.map((photo, index) => <div key={`${photo.url}-${index}`} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white"><Image src={photo.url} alt={photo.name} width={76} height={56} unoptimized className="h-14 w-[76px] object-cover" /><button type="button" aria-label={`Remove ${photo.name}`} onClick={() => removePhoto(index)} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-slate-900/75 text-white opacity-0 transition group-hover:opacity-100"><X className="size-3" /></button></div>)}</div>}
      {audioUrl && <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"><audio controls src={audioUrl} className="h-8 min-w-0 flex-1" /><button type="button" onClick={clearAudio} aria-label="Remove audio recording" className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Trash2 className="size-3.5" /></button></div>}
    </div>
  )
}

function EvidencePreview({ photos, audioUrl }: { photos?: EvidencePhoto[]; audioUrl?: string }) {
  if (!photos?.length && !audioUrl) return null
  return <div className="mt-3 flex flex-wrap items-center gap-2">{photos?.map((photo, index) => <a key={`${photo.url}-${index}`} href={photo.url} target="_blank" rel="noreferrer" title={photo.name} className="overflow-hidden rounded-md border border-slate-200"><Image src={photo.url} alt={photo.name} width={64} height={44} unoptimized className="h-11 w-16 object-cover" /></a>)}{audioUrl && <audio controls src={audioUrl} className="h-8 max-w-52" />}</div>
}

function AssignmentCompletionCard({
  assignment,
  onSubmit,
}: {
  assignment: WorkAssignment
  onSubmit: (assignment: WorkAssignment, quantity: number, hoursWorked: number, note: string, photos: EvidencePhoto[], audioUrl?: string) => void
}) {
  const [quantity, setQuantity] = useState(String(assignment.completedQty))
  const [hoursWorked, setHoursWorked] = useState(String(assignment.teamSize * 8))
  const [note, setNote] = useState("")
  const [photos, setPhotos] = useState<EvidencePhoto[]>([])
  const [audioUrl, setAudioUrl] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(assignment.status === "Assigned" || assignment.status === "Returned")
  const progress = assignment.target > 0 ? Math.min(100, Math.round((assignment.completedQty / assignment.target) * 100)) : 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const completed = Number(quantity)
    const hours = Number(hoursWorked)
    const nextErrors: Record<string, string> = {}
    if (!Number.isFinite(completed) || completed < 0) nextErrors.quantity = "Enter a completed quantity of zero or more."
    if (completed > assignment.target) nextErrors.quantity = "Completion cannot exceed the assigned target. Update the plan with the Engineer first."
    if (!Number.isFinite(hours) || hours <= 0) nextErrors.hours = "Enter the total crew hours worked today."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(assignment, completed, hours, note.trim(), photos, audioUrl)
    setNote("")
    setPhotos([])
    setAudioUrl(undefined)
    setErrors({})
    setEditing(false)
  }

  return (
    <Card className="border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="text-[10px] text-slate-500">{assignment.id}</Badge><StatusPill status={assignment.status} /><span className="text-[10px] text-slate-400">{assignment.due}</span></div><h3 className="mt-2.5 text-sm font-semibold text-slate-800">{assignment.activity}</h3><p className="mt-1 text-[11px] text-slate-500">{assignment.project} · Assigned by {assignment.engineer}</p></div>
          <div className="rounded-lg bg-teal-50 px-3 py-2 text-right"><p className="text-[10px] text-teal-700">Today’s target</p><p className="mt-0.5 text-sm font-bold text-teal-900">{assignment.target} {assignment.unit}</p></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px]">
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-center justify-between text-[10px]"><span className="font-medium text-slate-500">Completed against target</span><span className="font-semibold text-slate-700">{assignment.completedQty} / {assignment.target} {assignment.unit}</span></div><Progress value={progress} className="mt-2 gap-0 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-teal-700" /><p className="mt-2 text-[10px] text-slate-400">{assignment.assignedTeam} · {assignment.teamSize} people</p></div>
          <div className="rounded-lg border border-slate-100 p-3"><p className="text-[10px] font-medium text-slate-400">Work assigned by Engineer</p><p className="mt-1 text-[11px] leading-relaxed text-slate-600">{assignment.instruction || "No additional site instruction."}</p>{assignment.materialsUsed?.length ? <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-teal-800">Stock issued: {assignment.materialsUsed.map((material) => `${material.quantity} ${material.unit} ${material.item}`).join(" · ")}</p> : null}</div>
        </div>
        <EvidencePreview photos={assignment.referencePhotos} audioUrl={assignment.referenceAudioUrl} />
        {!editing && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0 text-teal-700" />{assignment.status === "Reviewed" ? "The PM reviewed this progress. You can submit a correction for review." : "Progress is with the PM. You can submit a correction if needed."}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)} className="h-8 cursor-pointer">Update progress</Button>
          </div>
        )}
        {editing && (
          <form noValidate onSubmit={submit} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label={`Completed quantity today (${assignment.unit})`} error={errors.quantity}><Input type="number" inputMode="decimal" min="0" step="0.01" value={quantity} aria-invalid={Boolean(errors.quantity)} onChange={(event) => setQuantity(event.target.value)} className="h-9" /></Field>
              <Field label="Crew hours worked" error={errors.hours}><Input type="number" inputMode="decimal" min="0.5" step="0.5" value={hoursWorked} aria-invalid={Boolean(errors.hours)} onChange={(event) => setHoursWorked(event.target.value)} className="h-9" /></Field>
              <Button type="submit" size="sm" className="h-9 cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><ClipboardCheck className="mr-1.5 size-3.5" />{assignment.status === "Returned" ? "Resubmit completion" : assignment.status === "Assigned" ? "Submit completion" : "Save and resubmit"}</Button>
            </div>
            <label className="block text-xs font-medium text-slate-700">Site note <span className="font-normal text-slate-400">(optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Progress, access issues, material needs, or rework..." className="mt-1.5 min-h-16 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600" /></label>
          <EvidenceCapture photos={photos} onPhotosChange={setPhotos} audioUrl={audioUrl} onAudioChange={setAudioUrl} />
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-8 cursor-pointer text-slate-500">Cancel</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function DailyUpdates({
  role,
  projects,
  members,
  assignments,
  doubtThreads,
  updates,
  onCreateAssignment,
  onRecordCompletion,
  onPostDoubt,
  notice,
}: {
  role: "engineer" | "supervisor"
  projects: Project[]
  members: TeamMember[]
  assignments: WorkAssignment[]
  doubtThreads: WorkDoubtThread[]
  updates: DailyUpdate[]
  onCreateAssignment: (assignment: Omit<WorkAssignment, "id" | "completedQty" | "status">) => void
  onRecordCompletion: (assignment: WorkAssignment, quantity: number, hoursWorked: number, note: string, photos: EvidencePhoto[], audioUrl?: string) => void
  onPostDoubt: (assignmentId: string, threadId: string | undefined, message: Omit<WorkDoubtMessage, "id" | "sentAt">, resolveThread: boolean) => void
  notice: string
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [projectName, setProjectName] = useState(projects[0]?.name ?? "")
  const [activity, setActivity] = useState("")
  const [target, setTarget] = useState("")
  const [unit, setUnit] = useState("m")
  const [supervisor, setSupervisor] = useState("Shameer K.")
  const [assignedTeam, setAssignedTeam] = useState("")
  const [teamSize, setTeamSize] = useState("4")
  const [instruction, setInstruction] = useState("")
  const [photos, setPhotos] = useState<EvidencePhoto[]>([])
  const [audioUrl, setAudioUrl] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEngineer = role === "engineer"

  function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!projectName) nextErrors.project = "Choose the project for this work."
    if (activity.trim().length < 4) nextErrors.activity = "Enter a clear work activity."
    if (!Number.isFinite(Number(target)) || Number(target) <= 0) nextErrors.target = "Enter a target greater than zero."
    if (!supervisor) nextErrors.supervisor = "Choose the Supervisor responsible for this work."
    if (!Number.isFinite(Number(teamSize)) || Number(teamSize) < 1) nextErrors.teamSize = "Enter at least one team member."
    if (assignedTeam.trim().length < 2) nextErrors.team = "Enter the crew or team name."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onCreateAssignment({
      project: projectName,
      activity: activity.trim(),
      target: Number(target),
      unit,
      engineer: rolePeople.engineer.name,
      supervisor,
      assignedTeam: assignedTeam.trim(),
      teamSize: Number(teamSize) || 0,
      due: "Today",
      instruction: instruction.trim(),
      referencePhotos: photos,
      referenceAudioUrl: audioUrl,
    })
    setActivity("")
    setTarget("")
    setAssignedTeam("")
    setInstruction("")
    setPhotos([])
    setAudioUrl(undefined)
    setErrors({})
    setScheduleOpen(false)
  }

  const availableSupervisors = members.filter((member) => member.role === "Supervisor")

  return (
    <>
      {isEngineer ? <div className="mb-5 flex justify-end"><Button onClick={() => setScheduleOpen(true)} className="h-9 cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><Plus className="mr-1.5 size-4" />Schedule work</Button></div> : <SectionHeading eyebrow="Daily work control" title="Today’s assigned work" description="See the Engineer’s work plan and record the quantity completed against each assignment." />}
      {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800"><CheckCircle2 className="size-4" />{notice}</div>}
      {isEngineer ? (
        <>
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader><DialogTitle>Schedule work for today</DialogTitle><DialogDescription>Create a work assignment for the Supervisor and team.</DialogDescription></DialogHeader>
              <form noValidate onSubmit={createAssignment} className="space-y-4 py-1">
                <FormSelect label="Project" value={projectName} onChange={setProjectName} options={projects.map((project) => [project.name, `${project.name} · ${project.code}`])} error={errors.project} />
                <Field label="Work activity" error={errors.activity}><Input value={activity} aria-invalid={Boolean(errors.activity)} onChange={(event) => setActivity(event.target.value)} placeholder="e.g. Level 4 chilled water pipe installation" className="h-9" /></Field>
                <div className="grid grid-cols-[1fr_110px] gap-3"><Field label="Today’s target" error={errors.target}><Input type="number" inputMode="decimal" min="0.01" step="0.01" value={target} aria-invalid={Boolean(errors.target)} onChange={(event) => setTarget(event.target.value)} placeholder="0" className="h-9" /></Field><FormSelect label="Unit" value={unit} onChange={setUnit} options={["m", "sq.ft.", "units", "points", "kg"].map((value) => [value, value])} /></div>
                <div className="grid gap-3 sm:grid-cols-2"><FormSelect label="Assign Supervisor" value={supervisor} onChange={setSupervisor} options={availableSupervisors.map((member) => [member.name, member.name])} error={errors.supervisor} /><Field label="Team size" error={errors.teamSize}><Input type="number" inputMode="numeric" min="1" step="1" value={teamSize} aria-invalid={Boolean(errors.teamSize)} onChange={(event) => setTeamSize(event.target.value)} className="h-9" /></Field></div>
                <Field label="Assigned team" error={errors.team}><Input value={assignedTeam} aria-invalid={Boolean(errors.team)} onChange={(event) => setAssignedTeam(event.target.value)} placeholder="e.g. Plumbing Crew B" className="h-9" /></Field>
                <label className="block text-xs font-medium text-slate-700">Site instruction <span className="font-normal text-slate-400">(optional)</span><textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Work sequence, coordination notes, or safety instruction..." className="mt-1.5 min-h-16 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600" /></label>
                <EvidenceCapture photos={photos} onPhotosChange={setPhotos} audioUrl={audioUrl} onAudioChange={setAudioUrl} />
                <DialogFooter><Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button><Button type="submit" className="h-9 cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><ClipboardList className="mr-1.5 size-3.5" />Assign work for today</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <div className="space-y-3"><div className="flex items-end justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Assignments sent today</h3><p className="mt-1 text-[11px] text-slate-500">Visible to each assigned Supervisor</p></div><Badge variant="outline" className="text-[10px]">{assignments.length} assignments</Badge></div>
            {assignments.map((assignment) => <Card key={assignment.id} className="border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-800">{assignment.activity}</p><p className="mt-1 text-[11px] text-slate-500">{assignment.project}</p></div><StatusPill status={assignment.status} /></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500"><span>Target <b className="text-slate-700">{assignment.target} {assignment.unit}</b></span><span>Supervisor <b className="text-slate-700">{assignment.supervisor}</b></span><span>Team <b className="text-slate-700">{assignment.assignedTeam}</b></span></div><p className="mt-2 text-[10px] text-slate-400">{assignment.completedQty} {assignment.unit} recorded by Supervisor so far</p><EvidencePreview photos={assignment.referencePhotos} audioUrl={assignment.referenceAudioUrl} /><WorkDoubtPanel assignmentId={assignment.id} role={role} currentUser={rolePeople[role].name} threads={doubtThreads} onPostMessage={onPostDoubt} /></CardContent></Card>)}
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/70 p-3.5 text-xs leading-relaxed text-teal-900/80"><Users2 className="size-4 shrink-0 text-teal-700" />The Engineer assigns each work item, target, team, and site instruction. Record the completed quantity against that assignment below.</div>
          <div className="space-y-3">{assignments.map((assignment) => <div key={assignment.id}><AssignmentCompletionCard assignment={assignment} onSubmit={onRecordCompletion} /><WorkDoubtPanel assignmentId={assignment.id} role={role} currentUser={rolePeople[role].name} threads={doubtThreads} onPostMessage={onPostDoubt} /></div>)}{assignments.length === 0 && <Card className="border border-dashed border-slate-300 bg-white/60"><CardContent className="p-8 text-center text-sm text-slate-500">No work has been assigned to you for today.</CardContent></Card>}</div>
          <Card className="mt-5 border-0 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="text-[15px]">Recent completion records</CardTitle><CardDescription className="text-xs">Quantity updates submitted against assigned work</CardDescription></CardHeader><CardContent className="divide-y divide-slate-100 px-5 py-0">{updates.map((update) => <div key={update.id} className="py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-800">{update.activity}</p><p className="mt-1 text-[11px] text-slate-500">{update.project} · {update.date}</p></div><StatusPill status={update.status} /></div><div className="mt-2 flex flex-wrap items-center gap-x-4 text-[10px] text-slate-500"><span><b className="text-slate-700">{update.quantity} {update.unit}</b> completed</span><span>{update.people} people</span><span>Reported by {update.submittedBy}</span></div><p className="mt-2 text-[11px] text-slate-500">{update.note}</p><EvidencePreview photos={update.photos} audioUrl={update.audioUrl} /></div>)}{updates.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No completion records yet.</p>}</CardContent></Card>
        </>
      )}
    </>
  )
}

export function EstatioApp() {
  const [role, setRole] = useState<AppRole>("pm")
  const [section, setSection] = useState<Section>("overview")
  const [projects, setProjects] = useState(initialProjects)
  const [members, setMembers] = useState<TeamMember[]>(teamMembers)
  const [assignments, setAssignments] = useState(initialWorkAssignments)
  const [doubtThreads, setDoubtThreads] = useState(initialWorkDoubtThreads)
  const [updates, setUpdates] = useState(initialDailyUpdates)
  const [reviews, setReviews] = useState<ReviewItem[]>(() => reviewQueue.map((review) => ({ ...review, status: "Pending review" as ReviewStatus })))
  const [issues, setIssues] = useState(initialIssues)
  const [materials, setMaterials] = useState(initialMaterialRequests)
  const [qualityChecks, setQualityChecks] = useState(initialQualityChecks)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectEditorVersion, setProjectEditorVersion] = useState(0)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [globalSearch, setGlobalSearch] = useState("")
  const [utilityDialog, setUtilityDialog] = useState<"settings" | "help" | null>(null)

  const person = rolePeople[role]
  const canSeeMoney = role === "superadmin" || role === "pm"
  const roleProjects = useMemo(() => projects.filter((project) => {
    if (role === "superadmin") return true
    const assigned = projectPeople(project)
    if (role === "pm") return assigned.managers.includes(person.name)
    if (role === "engineer") return assigned.engineers.includes(person.name)
    return assigned.supervisors.includes(person.name)
  }), [projects, role, person.name])
  const roleProjectNames = new Set(roleProjects.map((project) => project.name))
  const roleUpdates = updates.filter((update) => roleProjectNames.has(update.project))
  const roleAssignments = assignments.filter((assignment) =>
    assignment.due === "Today" && (
      role === "engineer" ? assignment.engineer === person.name :
        role === "supervisor" ? assignment.supervisor === person.name : true
    ),
  )
  const roleAssignmentIds = new Set(roleAssignments.map((assignment) => assignment.id))
  const roleDailyUpdates = roleUpdates.filter((update) => update.assignmentId && roleAssignmentIds.has(update.assignmentId))
  const roleReviews = reviews.filter((review) => roleProjectNames.has(review.project))
  const roleIssues = issues.filter((issue) => roleProjectNames.has(issue.project))
  const roleMaterials = materials.filter((request) => roleProjectNames.has(request.project))
  const roleQualityChecks = qualityChecks.filter((check) => roleProjectNames.has(check.project))
  const roleExpenses = expenses.filter((expense) => roleProjectNames.has(expense.project))
  const roleMemberNames = new Set(roleProjects.flatMap((project) => { const assigned = projectPeople(project); return [...assigned.managers, ...assigned.engineers, ...assigned.supervisors] }).concat(roleAssignments.flatMap((assignment) => [assignment.engineer, assignment.supervisor])))
  const roleMembers = role === "superadmin" ? members : members.filter((member) => roleMemberNames.has(member.name))
  const operationsProjects = activeProjectName ? roleProjects.filter((project) => project.name === activeProjectName) : roleProjects
  const operationsProjectNames = new Set(operationsProjects.map((project) => project.name))
  const operationsIssues = roleIssues.filter((issue) => operationsProjectNames.has(issue.project))
  const operationsMaterials = roleMaterials.filter((request) => operationsProjectNames.has(request.project))
  const operationsQualityChecks = roleQualityChecks.filter((check) => operationsProjectNames.has(check.project))
  const operationsExpenses = roleExpenses.filter((expense) => operationsProjectNames.has(expense.project))
  const operationsAssignments = assignments.filter((assignment) => operationsProjectNames.has(assignment.project) && (role !== "engineer" || assignment.engineer === person.name) && (role !== "supervisor" || assignment.supervisor === person.name))
  const pendingReviews = roleReviews.filter((review) => review.status === "Pending review").length
  const openIssues = roleIssues.filter((issue) => issue.status !== "Resolved").length
  const pendingMaterials = roleMaterials.filter((request) => request.status === "Requested").length
  const pendingQuality = roleQualityChecks.filter((check) => check.status === "Pending inspection" || check.status === "Rework required").length
  const alertCount = pendingReviews + openIssues + pendingMaterials + pendingQuality
  const searchTerm = globalSearch.trim().toLowerCase()
  const searchProjects = searchTerm ? roleProjects.filter((project) => `${project.name} ${project.code} ${project.client} ${project.location}`.toLowerCase().includes(searchTerm)).slice(0, 4) : []
  const searchAssignments = searchTerm ? roleAssignments.filter((assignment) => `${assignment.activity} ${assignment.project} ${assignment.assignedTeam}`.toLowerCase().includes(searchTerm)).slice(0, 3) : []
  const navItems = navDefinitions.filter((item) => item.roles.includes(role))
  const pageTitle: Record<Section, string> = {
    overview: "Overview",
    projects: role === "engineer" ? "My assigned work" : "Projects",
    daily: role === "engineer" ? "Assign today’s work" : "Today’s assigned work",
    operations: "Project activity",
    costs: "Costs & productivity",
    reviews: "Operations review",
    team: "People & teams",
  }

  function changeRole(value: string | null) {
    if (!value) return
    setRole(value as AppRole)
    setSection("overview")
    setActiveProjectName(null)
    setNotice("")
  }

  function saveProject(draft: ProjectDraft) {
    const { purchases, ...projectDraft } = draft
    if (editingProject) {
      const previousName = editingProject.name
      const updated: Project = { ...editingProject, ...projectDraft, contractValue: Number(projectDraft.contractValue ?? editingProject.contractValue ?? 0) }
      setProjects((current) => current.map((project) => project.id === editingProject.id ? updated : project))
      if (previousName !== updated.name) {
        setAssignments((current) => current.map((item) => item.project === previousName ? { ...item, project: updated.name } : item))
        setUpdates((current) => current.map((item) => item.project === previousName ? { ...item, project: updated.name } : item))
        setReviews((current) => current.map((item) => item.project === previousName ? { ...item, project: updated.name } : item))
        setIssues((current) => current.map((item) => item.project === previousName ? { ...item, project: updated.name } : item))
        setMaterials((current) => current.map((item) => item.project === previousName ? { ...item, project: updated.name } : item))
        setQualityChecks((current) => current.map((item) => item.project === previousName ? { ...item, project: updated.name } : item))
        setExpenses((current) => current.map((item) => item.project === previousName ? { ...item, project: updated.name } : item))
      }
      setSelectedProject(updated)
      setNotice(`${updated.name} project details were saved.`)
      setEditingProject(null)
      return
    }
    const nextNumber = projects.reduce((max, item) => Math.max(max, Number(item.code.replace(/\D/g, "")) || 0), 2429) + 1
    const code = `EST-${nextNumber}`
    const project: Project = { ...projectDraft, id: code, code, contractValue: Number(projectDraft.contractValue ?? 0), spent: 0, forecast: projectDraft.budget }
    setProjects((current) => [project, ...current])
    if (purchases.length) {
      const firstId = Math.max(110, ...materials.map((item) => Number(item.id.replace(/\D/g, "")) || 0)) + 1
      const requests: MaterialRequest[] = purchases.map((item, index) => ({
        ...item,
        id: `MAT-${firstId + index}`,
        project: project.name,
        requestedBy: rolePeople.superadmin.name,
        requestedAt: "Today, just now",
        status: "Requested",
        allottedQuantity: item.quantity,
        usedQuantity: 0,
        estimatedTotal: item.quantity * item.estimatedUnitCost,
      }))
      setMaterials((current) => [...requests, ...current])
    }
    setNotice(`${project.name} was added to the demo portfolio${purchases.length ? ` with ${purchases.length} material request${purchases.length === 1 ? "" : "s"}` : ""}.`)
    setSection("projects")
  }

  function openProjectEditor(project: Project | null = null) {
    setEditingProject(project)
    setProjectEditorVersion((version) => version + 1)
    setNewProjectOpen(true)
  }

  function createWorkAssignment(assignment: Omit<WorkAssignment, "id" | "completedQty" | "status">) {
    const nextAssignment: WorkAssignment = {
      ...assignment,
      id: `TASK-${1108 + assignments.length}`,
      completedQty: 0,
      status: "Assigned",
    }
    setAssignments((current) => [nextAssignment, ...current])
    if (nextAssignment.materialsUsed?.length) {
      const issued = new Map<string, number>()
      nextAssignment.materialsUsed.forEach((item) => issued.set(item.materialId, (issued.get(item.materialId) ?? 0) + item.quantity))
      setMaterials((current) => current.map((item) => issued.has(item.id) ? { ...item, usedQuantity: (item.usedQuantity ?? 0) + (issued.get(item.id) ?? 0) } : item))
    }
    setNotice(`“${nextAssignment.activity}” was assigned to ${nextAssignment.supervisor} for today${nextAssignment.materialsUsed?.length ? " and project stock was issued to the work" : ""}.`)
  }

  function createWorkAssignments(workPacks: Omit<WorkAssignment, "id" | "completedQty" | "status">[]) {
    if (!workPacks.length) return
    const highestTaskNumber = assignments.reduce((highest, assignment) => Math.max(highest, Number(assignment.id.match(/\d+$/)?.[0] ?? 0)), 1107)
    const nextAssignments: WorkAssignment[] = workPacks.map((assignment, index) => ({
      ...assignment,
      id: `TASK-${highestTaskNumber + index + 1}`,
      completedQty: 0,
      status: "Assigned",
    }))
    setAssignments((current) => [...nextAssignments, ...current])
    const issued = new Map<string, number>()
    nextAssignments.forEach((assignment) => assignment.materialsUsed?.forEach((item) => issued.set(item.materialId, (issued.get(item.materialId) ?? 0) + item.quantity)))
    if (issued.size) setMaterials((current) => current.map((item) => issued.has(item.id) ? { ...item, usedQuantity: (item.usedQuantity ?? 0) + (issued.get(item.id) ?? 0) } : item))
    setNotice(`${nextAssignments.length} work pack${nextAssignments.length === 1 ? " was" : "s were"} assigned to ${nextAssignments[0].supervisor}${issued.size ? " and project stock was issued to the linked work packs" : ""}.`)
  }

  function postWorkDoubt(assignmentId: string, threadId: string | undefined, message: Omit<WorkDoubtMessage, "id" | "sentAt">, resolveThread: boolean) {
    if (!threadId && message.role !== "supervisor") return
    const sentAt = "Today, just now"
    setDoubtThreads((current) => {
      const nextMessageNumber = Math.max(504, ...current.flatMap((thread) => thread.messages.map((item) => Number(item.id.replace(/\D/g, "")) || 0))) + 1
      const nextMessage: WorkDoubtMessage = { ...message, id: `DMSG-${nextMessageNumber}`, sentAt }
      if (!threadId) {
        const nextThreadNumber = Math.max(301, ...current.map((thread) => Number(thread.id.replace(/\D/g, "")) || 0)) + 1
        return [{ id: `DOU-${nextThreadNumber}`, assignmentId, status: "Open", messages: [nextMessage] }, ...current]
      }
      return current.map((thread) => thread.id === threadId && thread.assignmentId === assignmentId && thread.status === "Open"
        ? { ...thread, status: resolveThread && message.role === "engineer" ? "Resolved" : thread.status, messages: [...thread.messages, nextMessage] }
        : thread,
      )
    })
    setNotice(resolveThread && message.role === "engineer" ? "The doubt was answered and marked resolved." : `${message.role === "supervisor" ? "Question" : "Reply"} added to the work discussion.`)
  }

  function recordCompletion(assignment: WorkAssignment, quantity: number, hoursWorked: number, note: string, photos: EvidencePhoto[], audioUrl?: string) {
    const updateId = `UPD-${1110 + updates.length}`
    const reviewId = `REV-${90 + reviews.length}`
    const nextUpdate: DailyUpdate = {
      id: updateId,
      assignmentId: assignment.id,
      project: assignment.project,
      activity: assignment.activity,
      quantity,
      unit: assignment.unit,
      people: assignment.teamSize,
      hoursWorked,
      submittedBy: rolePeople.supervisor.name,
      date: "Today, just now",
      status: "Submitted for PM review",
      note: note || "No additional site note provided.",
      photos,
      audioUrl,
    }
    setAssignments((current) => current.map((item) => item.id === assignment.id
      ? { ...item, completedQty: quantity, status: "Submitted for PM review" }
      : item,
    ))
    setUpdates((current) => [nextUpdate, ...current])
    setReviews((current) => [{
      id: reviewId,
      assignmentId: assignment.id,
      updateId,
      project: assignment.project,
      activity: assignment.activity,
      submitted: "Today, just now",
      quantity: `${quantity} ${assignment.unit}`,
      supervisor: rolePeople.supervisor.name,
      status: "Pending review",
      note: nextUpdate.note,
      photos,
      audioUrl,
    }, ...current])
    setNotice(`Completion for “${assignment.activity}” was sent to the PM review queue.`)
  }

  function createIssue(issue: Omit<OperationsIssue, "id" | "reportedBy" | "reportedAt" | "status">) {
    const id = `ISS-${Math.max(200, ...issues.map((item) => Number(item.id.replace(/\D/g, "")) || 0)) + 1}`
    setIssues((current) => [{ ...issue, id, status: "Open", reportedBy: person.name, reportedAt: "Today, just now" }, ...current])
    setNotice(`${issue.title} was added to the site issue log.`)
  }

  function updateIssue(id: string, patch: Partial<OperationsIssue>) {
    setIssues((current) => current.map((issue) => issue.id === id ? { ...issue, ...patch } : issue))
    setNotice("The issue log was updated.")
  }

  function createMaterialRequest(request: Omit<MaterialRequest, "id" | "requestedBy" | "requestedAt" | "status">) {
    const id = `MAT-${Math.max(110, ...materials.map((item) => Number(item.id.replace(/\D/g, "")) || 0)) + 1}`
    setMaterials((current) => [{ ...request, id, status: "Requested", requestedBy: person.name, requestedAt: "Today, just now", allottedQuantity: 0, usedQuantity: 0 }, ...current])
    setNotice(`${request.item} was sent to the project team for approval.`)
  }

  function updateMaterial(id: string, status: MaterialStatus) {
    setMaterials((current) => current.map((request) => request.id === id ? {
      ...request,
      status,
      ...(status === "Received" ? { allottedQuantity: request.allottedQuantity ?? request.quantity } : {}),
    } : request))
    setNotice(`Material request ${id} is now ${status.toLowerCase()}.`)
  }

  function updateMaterialUsage(id: string, usedQuantity: number) {
    setMaterials((current) => current.map((request) => request.id === id ? { ...request, usedQuantity } : request))
    setNotice(`Material usage for ${id} was updated.`)
  }

  function createQualityCheck(check: Omit<QualityCheck, "id" | "requestedBy" | "requestedAt" | "status" | "reworkNote">) {
    const id = `QLT-${Math.max(40, ...qualityChecks.map((item) => Number(item.id.replace(/\D/g, "")) || 0)) + 1}`
    setQualityChecks((current) => [{ ...check, id, status: "Pending inspection", requestedBy: person.name, requestedAt: "Today, just now", reworkNote: "" }, ...current])
    setNotice(`${check.activity} was added to the inspection queue.`)
  }

  function updateQualityCheck(id: string, status: QualityStatus, reworkNote?: string) {
    setQualityChecks((current) => current.map((check) => check.id === id ? { ...check, status, ...(reworkNote ? { reworkNote } : {}) } : check))
    setNotice(`Quality check ${id} is now ${status.toLowerCase()}.`)
  }

  function createExpense(expense: Omit<ExpenseRecord, "id" | "recordedBy" | "recordedAt">) {
    const id = `EXP-${Math.max(650, ...expenses.map((item) => Number(item.id.replace(/\D/g, "")) || 0)) + 1}`
    setExpenses((current) => [{ ...expense, id, recordedBy: person.name, recordedAt: "Today, just now" }, ...current])
    setProjects((current) => current.map((project) => project.name === expense.project ? { ...project, spent: project.spent + expense.amount, forecast: project.forecast + expense.amount } : project))
    setNotice(`${expense.description} was added to the project cost ledger.`)
  }

  function addTeamMember(member: Omit<TeamMember, "initials" | "projects" | "status">) {
    const initials = member.name.split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join("")
    setMembers((current) => [{ ...member, initials, projects: 0, status: "Available" }, ...current])
    setNotice(`${member.name} was added to the demo team directory.`)
  }

  function decideReview(id: string, status: "Accepted" | "Returned") {
    const review = reviews.find((item) => item.id === id)
    setReviews((current) => current.map((item) => item.id === id ? { ...item, status } : item))
    if (review?.assignmentId) {
      setAssignments((current) => current.map((assignment) => assignment.id === review.assignmentId
        ? { ...assignment, status: status === "Accepted" ? "Reviewed" : "Returned" }
        : assignment,
      ))
    }
    if (review?.updateId) {
      setUpdates((current) => current.map((update) => update.id === review.updateId
        ? { ...update, status: status === "Accepted" ? "Reviewed" : "Returned by PM" }
        : update,
      ))
    }
    setNotice(status === "Accepted" ? "Completion accepted and the review status was updated." : "Report returned to the Supervisor for correction.")
  }

  function switchSection(nextSection: Section) {
    setSection(nextSection)
    setActiveProjectName(null)
    setNotice("")
  }

  function openProjectOperations(project: Project) {
    setSelectedProject(null)
    setActiveProjectName(project.name)
    setSection("operations")
    setNotice("")
  }

  function exportPortfolio() {
    downloadCsv("estatio-operations-report.csv", [
      ["Project", "Code", "Client", "Location", "Progress %", "Plan %", "Health", "Baseline INR", "Spent INR", "Forecast INR"],
      ...roleProjects.map((project) => [project.name, project.code, project.client, project.location, project.progress, project.plannedProgress, project.health, project.budget, project.spent, project.forecast]),
    ])
    setNotice("The portfolio report was downloaded as a CSV file.")
  }

  function openSearchProject(project: Project) {
    setGlobalSearch("")
    setSelectedProject(project)
  }

  function openSearchAssignment() {
    setGlobalSearch("")
    switchSection("daily")
  }

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      <div className="flex h-full min-h-0">
        <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-[252px] shrink-0 flex-col overflow-y-auto border-r border-slate-200/80 bg-white xl:flex">
          <div className="flex h-[74px] items-center gap-3 border-b border-slate-100 px-6">
            <div className="grid size-9 place-items-center rounded-xl bg-teal-800 text-white shadow-sm shadow-teal-900/15"><Wrench className="size-[18px]" strokeWidth={2.2} /></div>
            <div><p className="text-[17px] font-bold tracking-[-0.04em] text-slate-900">estatio<span className="text-teal-700">.</span></p><p className="-mt-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">MEP operations</p></div>
          </div>
          <div className="px-4 pt-5">
            <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = section === item.id
                return <button key={item.id} onClick={() => switchSection(item.id)} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-medium transition ${active ? "bg-teal-50 text-teal-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon className={`size-[16px] ${active ? "text-teal-700" : "text-slate-400"}`} strokeWidth={1.8} /><span>{item.id === "projects" && role === "engineer" ? "My assigned work" : item.id === "daily" && role === "engineer" ? "Work assignments" : item.id === "daily" && role === "supervisor" ? "Today’s work" : item.label}</span>{item.id === "reviews" && pendingReviews > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">{pendingReviews}</span>}</button>
              })}
            </nav>
          </div>
          <div className="mt-7 px-4">
            <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Quick view</p>
            <button onClick={() => switchSection(role === "pm" || role === "superadmin" ? "reviews" : "daily")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"><span className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-700"><Clock3 className="size-3.5" /></span><span className="flex-1"><span className="block font-medium text-slate-700">{role === "pm" || role === "superadmin" ? "Pending reviews" : role === "engineer" ? "Assign today’s work" : "Record completion"}</span><span className="mt-0.5 block text-[10px] text-slate-400">{role === "pm" || role === "superadmin" ? `${pendingReviews} reports waiting` : "Site workflow"}</span></span><ArrowRight className="size-3.5 text-slate-300" /></button>
          </div>
          <div className="mt-auto px-4 pb-4">
            <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-3.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-900"><ShieldCheck className="size-3.5 text-teal-700" />Demo workspace</div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">All project data shown here is sample data for the frontend prototype.</p>
            </div>
            <button onClick={() => setUtilityDialog("settings")} className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] text-slate-500 hover:bg-slate-50"><Settings2 className="size-4 text-slate-400" />Workspace settings</button>
            <button onClick={() => setUtilityDialog("help")} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] text-slate-500 hover:bg-slate-50"><CircleHelp className="size-4 text-slate-400" />Help and support</button>
          </div>
        </aside>

        <main className="h-full min-h-0 min-w-0 flex-1 overscroll-y-contain overflow-y-auto xl:ml-[252px]">
          <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl sm:px-6 xl:px-8">
            <div className="flex items-center gap-3 xl:hidden"><div className="grid size-8 place-items-center rounded-lg bg-teal-800 text-white"><Wrench className="size-4" /></div><span className="text-sm font-bold tracking-tight">estatio<span className="text-teal-700">.</span></span></div>
            <div className="hidden items-center gap-2 text-[11px] text-slate-400 xl:flex"><span className="font-medium text-slate-500">Workspace</span><span>/</span><span className="font-semibold text-slate-700">{pageTitle[section]}</span></div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="relative hidden w-52 lg:block"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><Input aria-label="Search projects and assignments" placeholder="Search projects or work..." value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (searchProjects[0]) openSearchProject(searchProjects[0]); else if (searchAssignments[0]) openSearchAssignment() } if (event.key === "Escape") setGlobalSearch("") }} className="h-8 border-slate-200 bg-slate-50/70 pl-9 text-[11px] shadow-none" />{searchTerm && <div className="absolute right-0 top-10 z-40 w-[min(360px,90vw)] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><p className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Search results</p>{searchProjects.map((project) => <button key={project.id} onClick={() => openSearchProject(project)} className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-teal-50"><Building2 className="mt-0.5 size-3.5 shrink-0 text-teal-700" /><span><span className="block text-[11px] font-semibold text-slate-700">{project.name}</span><span className="text-[10px] text-slate-400">{project.code} · {project.location}</span></span></button>)}{searchAssignments.map((assignment) => <button key={assignment.id} onClick={openSearchAssignment} className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-teal-50"><ClipboardList className="mt-0.5 size-3.5 shrink-0 text-blue-700" /><span><span className="block text-[11px] font-semibold text-slate-700">{assignment.activity}</span><span className="text-[10px] text-slate-400">{assignment.project} · today’s work</span></span></button>)}{searchProjects.length + searchAssignments.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">No matching projects or assigned work.</p>}</div>}</div>
              <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Notifications${alertCount ? `, ${alertCount} items need attention` : ""}`} className="relative cursor-pointer text-slate-500" />}><Bell className="size-4" />{alertCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white ring-2 ring-white">{alertCount > 9 ? "9+" : alertCount}</span>}</DropdownMenuTrigger><DropdownMenuContent align="end" className="w-72"><div className="px-2 py-1.5"><p className="text-xs font-semibold text-slate-800">Needs attention</p><p className="text-[10px] text-slate-400">Updates for your current role</p></div>{pendingReviews > 0 && <DropdownMenuItem onClick={() => switchSection("reviews")}><ClipboardCheck className="size-3.5 text-amber-700" />{pendingReviews} completion report{pendingReviews === 1 ? "" : "s"} to review</DropdownMenuItem>}{openIssues > 0 && <DropdownMenuItem onClick={() => switchSection("operations")}><AlertCircle className="size-3.5 text-rose-700" />{openIssues} open site issue{openIssues === 1 ? "" : "s"}</DropdownMenuItem>}{pendingMaterials > 0 && <DropdownMenuItem onClick={() => switchSection("operations")}><Layers3 className="size-3.5 text-amber-700" />{pendingMaterials} material request{pendingMaterials === 1 ? "" : "s"} awaiting action</DropdownMenuItem>}{pendingQuality > 0 && <DropdownMenuItem onClick={() => switchSection("operations")}><ShieldCheck className="size-3.5 text-blue-700" />{pendingQuality} quality item{pendingQuality === 1 ? "" : "s"} needs attention</DropdownMenuItem>}{alertCount === 0 && <p className="px-2 py-4 text-center text-xs text-slate-500">You’re all caught up.</p>}</DropdownMenuContent></DropdownMenu>
              <span className="hidden h-7 w-px bg-slate-200 sm:block" />
              <Select value={role} onValueChange={changeRole}>
                <SelectTrigger aria-label="Switch demo role" className="h-9 min-w-[150px] gap-2 border-slate-200 bg-white px-2 sm:min-w-[180px]">
                  <Avatar className="size-6"><AvatarFallback className="bg-teal-100 text-[9px] font-bold text-teal-800">{person.initials}</AvatarFallback></Avatar>
                  <span className="min-w-0 flex-1 truncate text-left"><span className="block truncate text-[10px] font-semibold text-slate-800 sm:text-[11px]">{person.name}</span><span className="hidden truncate text-[9px] text-slate-400 sm:block">{roleLabels[role]}</span></span>
                  <ChevronDown className="size-3.5 text-slate-400" />
                </SelectTrigger>
                <SelectContent align="end">
                  {(Object.keys(roleLabels) as AppRole[]).map((option) => <SelectItem key={option} value={option}><span className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-teal-50 text-[8px] font-bold text-teal-800">{rolePeople[option].initials}</span>{roleLabels[option]}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-slate-200/70 bg-white px-4 py-2 xl:hidden">
            {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => switchSection(item.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium ${section === item.id ? "bg-teal-50 text-teal-900" : "text-slate-500"}`}><Icon className="size-3.5" />{item.id === "projects" && role === "engineer" ? "My work" : item.id === "daily" && role === "engineer" ? "Assignments" : item.id === "daily" && role === "supervisor" ? "Today’s work" : item.label}</button> })}
          </div>

          <div key={`${section}-${activeProjectName ?? "all"}`} className="mx-auto max-w-[1560px] animate-in fade-in-0 slide-in-from-bottom-1 duration-200 px-4 py-5 motion-reduce:animate-none sm:px-6 sm:py-7 xl:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="mb-1 text-xs font-medium text-slate-500">Friday, October 9, 2026 <span className="mx-1.5 text-slate-300">·</span> Kerala, India</p><h1 className="text-[25px] font-semibold tracking-[-0.045em] text-slate-900 sm:text-[28px]">{section === "overview" ? `Good morning, ${person.name.split(" ")[0]}` : section === "operations" && activeProjectName ? activeProjectName : pageTitle[section]}</h1><p className="mt-1 text-xs text-slate-500">{section === "overview" ? "Here’s what’s happening across your projects today." : section === "projects" ? role === "engineer" ? "Projects and work packages assigned to you." : role === "supervisor" ? "Projects assigned to you for daily site work." : "Browse project progress, teams, and delivery health." : section === "operations" && activeProjectName ? "Project activity · Schedules, materials, cost, and daily progress." : section === "daily" && role === "engineer" ? "Assign today’s targets, team, and instructions for the Supervisor." : section === "daily" && role === "supervisor" ? "Record the work completed against each Engineer assignment." : role === "pm" && section === "reviews" ? "Review measured completion before updating the project status." : `Your Estatio MEP operations workspace · ${roleLabels[role]}`}</p></div>
              <div className="flex items-center gap-2">
                {section === "overview" && <Button variant="outline" size="sm" className="h-8 border-slate-200 bg-white text-[11px]" onClick={exportPortfolio}><Download className="mr-1.5 size-3.5" />Export report</Button>}
                {role === "superadmin" && (section === "overview" || section === "projects") && <Button size="sm" onClick={() => openProjectEditor(null)} className="h-8 bg-teal-800 text-[11px] text-white hover:bg-teal-700"><Plus className="mr-1 size-3.5" />New project</Button>}
              </div>
            </div>
            {notice && section === "overview" && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800"><CheckCircle2 className="size-4" />{notice}<button className="ml-auto" onClick={() => setNotice("")} aria-label="Dismiss"><X className="size-3.5" /></button></div>}
            {notice && (section === "costs" || section === "team") && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800"><CheckCircle2 className="size-4" />{notice}<button className="ml-auto cursor-pointer" onClick={() => setNotice("")} aria-label="Dismiss"><X className="size-3.5" /></button></div>}
            {section === "operations" && activeProjectName && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-100 bg-teal-50/70 px-3 py-2 text-xs text-teal-900"><span>Project: <b>{activeProjectName}</b> · showing its activity only</span><Button variant="ghost" size="sm" className="h-7 cursor-pointer text-[10px] text-teal-900" onClick={() => setActiveProjectName(null)}>View all projects</Button></div>}

            {section === "overview" && <Overview role={role} projects={roleProjects} assignments={roleAssignments} pendingReviews={pendingReviews} canSeeMoney={canSeeMoney} onOpenProject={setSelectedProject} onEditProject={openProjectEditor} onGoToProjects={() => switchSection("projects")} />}
            {section === "projects" && <>{notice && <div role="status" className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800">{notice}</div>}<ProjectTable projects={roleProjects} canSeeMoney={canSeeMoney} canManage={role === "pm" || role === "superadmin"} onOpen={setSelectedProject} onEdit={openProjectEditor} /></>}
            {section === "daily" && (role === "engineer" || role === "supervisor") && <DailyUpdates role={role} projects={roleProjects} members={roleMembers} assignments={roleAssignments} doubtThreads={doubtThreads.filter((thread) => roleAssignmentIds.has(thread.assignmentId))} updates={roleDailyUpdates} onCreateAssignment={createWorkAssignment} onRecordCompletion={recordCompletion} onPostDoubt={postWorkDoubt} notice={notice} />}
            {section === "operations" && <OperationsCenter role={role} projects={operationsProjects} members={roleMembers} issues={operationsIssues} materials={operationsMaterials} qualityChecks={operationsQualityChecks} assignments={operationsAssignments} doubtThreads={doubtThreads.filter((thread) => operationsAssignments.some((assignment) => assignment.id === thread.assignmentId))} updates={roleUpdates.filter((update) => operationsProjectNames.has(update.project) && (role !== "supervisor" || update.submittedBy === person.name))} expenses={operationsExpenses} onCreateAssignments={createWorkAssignments} onRecordCompletion={recordCompletion} onPostDoubt={postWorkDoubt} onCreateIssue={createIssue} onUpdateIssue={updateIssue} onCreateMaterial={createMaterialRequest} onUpdateMaterial={updateMaterial} onUpdateMaterialUsage={updateMaterialUsage} onCreateExpense={createExpense} onCreateQualityCheck={createQualityCheck} onUpdateQualityCheck={updateQualityCheck} notice={notice} />}
            {section === "costs" && canSeeMoney && <CostControl projects={roleProjects} expenses={roleExpenses} updates={roleUpdates} onCreateExpense={createExpense} />}
            {section === "reviews" && (role === "pm" || role === "superadmin") && <ReviewQueue reviews={roleReviews} onDecision={decideReview} notice={notice} />}
            {section === "team" && (role === "pm" || role === "superadmin") && <TeamView members={roleMembers} projects={roleProjects} assignments={roleAssignments} canManage={role === "pm" || role === "superadmin"} onAddMember={addTeamMember} />}

            <footer className="mt-8 flex flex-col gap-2 border-t border-slate-200/80 pt-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Estatio MEP Operations <span className="mx-1.5">·</span> Frontend prototype</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />Demo mode · No live project data</span></footer>
          </div>
        </main>
      </div>
      <ProjectDetails project={selectedProject} onClose={() => setSelectedProject(null)} onOpenOperations={openProjectOperations} canSeeMoney={canSeeMoney} />
      <NewProjectDialog key={`${editingProject?.id ?? "new"}-${projectEditorVersion}`} open={newProjectOpen} onOpenChange={setNewProjectOpen} project={editingProject} members={roleMembers} onSave={saveProject} />
      <Dialog open={utilityDialog !== null} onOpenChange={(open) => { if (!open) setUtilityDialog(null) }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{utilityDialog === "settings" ? "Workspace settings" : "Help and support"}</DialogTitle><DialogDescription>{utilityDialog === "settings" ? "Prototype preferences and current workspace context." : "Quick guide to the Estatio daily operations workflow."}</DialogDescription></DialogHeader>{utilityDialog === "settings" ? <div className="space-y-3 text-xs"><div className="rounded-lg border border-slate-100 p-3"><p className="font-semibold text-slate-700">Current demo role</p><p className="mt-1 text-slate-500">{person.name} · {roleLabels[role]}</p></div><div className="rounded-lg border border-slate-100 p-3"><p className="font-semibold text-slate-700">Workspace mode</p><p className="mt-1 text-slate-500">Sample data is stored only in this browser session and resets when the app reloads.</p></div></div> : <div className="space-y-3 text-xs leading-relaxed text-slate-600"><p><b className="text-slate-800">Engineer:</b> assigns a daily activity, target quantity, Supervisor, crew, and instructions.</p><p><b className="text-slate-800">Supervisor:</b> records actual quantity and crew hours against that assignment, with photos or a voice note.</p><p><b className="text-slate-800">Project Manager:</b> reviews completion, tracks issues and materials, manages quality checks, and monitors cost and productivity.</p><p className="rounded-lg bg-teal-50 p-3 text-teal-900">Use the role selector in the top bar to preview each workflow.</p></div>}<DialogFooter><Button variant="outline" onClick={() => setUtilityDialog(null)}>Close</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
