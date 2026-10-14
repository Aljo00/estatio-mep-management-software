"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import Image from "next/image"
import { AlertTriangle, Check, CheckCircle2, ClipboardCheck, Clock3, ImagePlus, Mic, Music2, Package, Plus, ShieldCheck, Square, Trash2, WalletCards, Wrench, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WorkDoubtPanel } from "@/components/work-doubt-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { rolePeople, type AppRole, type DailyUpdate, type EvidencePhoto, type ExpenseCategory, type ExpenseRecord, type IssueCategory, type IssueStatus, type MaterialRequest, type MaterialStatus, type OperationsIssue, type Project, type QualityCheck, type QualityStatus, type TeamMember, type WorkAssignment, type WorkDoubtMessage, type WorkDoubtThread } from "@/data/mock-data"

type NewIssue = Omit<OperationsIssue, "id" | "reportedBy" | "reportedAt" | "status">
type NewMaterialRequest = Omit<MaterialRequest, "id" | "requestedBy" | "requestedAt" | "status">
type NewQualityCheck = Omit<QualityCheck, "id" | "requestedBy" | "requestedAt" | "status" | "reworkNote">
type NewExpense = Omit<ExpenseRecord, "id" | "recordedBy" | "recordedAt">
type WorkPackDraft = { id: string; activity: string; target: string; unit: string; instruction: string; materialQty: Record<string, string>; referencePhotos: EvidencePhoto[]; referenceAudioUrl?: string }

function createWorkPackDraft(): WorkPackDraft {
  return { id: `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, activity: "", target: "", unit: "m", instruction: "", materialQty: {}, referencePhotos: [] }
}

function WorkInstructionAttachments({ photos, onPhotosChange, audioUrl, onAudioChange, title = "Instruction attachments", description = "Add reference photos or an audio instruction for this work pack." }: { photos: EvidencePhoto[]; onPhotosChange: (photos: EvidencePhoto[]) => void; audioUrl?: string; onAudioChange: (audioUrl?: string) => void; title?: string; description?: string }) {
  const photoInput = useRef<HTMLInputElement>(null)
  const audioInput = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [recordingError, setRecordingError] = useState("")
  const currentPhotos = photos ?? []

  useEffect(() => () => {
    const activeRecorder = recorder.current
    if (activeRecorder?.state === "recording") {
      activeRecorder.onstop = null
      activeRecorder.stop()
    }
    mediaStream.current?.getTracks().forEach((track) => track.stop())
  }, [])

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    onPhotosChange([...currentPhotos, ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))])
    event.target.value = ""
  }

  function addAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl)
    onAudioChange(URL.createObjectURL(file))
    event.target.value = ""
  }

  async function startRecording() {
    setRecordingError("")
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setRecordingError("Audio recording is not supported in this browser.")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream
      chunks.current = []
      const nextRecorder = new MediaRecorder(stream)
      recorder.current = nextRecorder
      nextRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data)
      }
      nextRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: nextRecorder.mimeType || "audio/webm" })
        if (blob.size > 0) {
          if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl)
          onAudioChange(URL.createObjectURL(blob))
        }
        stream.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
        setRecording(false)
      }
      nextRecorder.start()
      setRecording(true)
    } catch {
      mediaStream.current?.getTracks().forEach((track) => track.stop())
      mediaStream.current = null
      setRecordingError("Microphone access was unavailable. Allow microphone access and try again.")
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop()
  }

  function removePhoto(index: number) {
    const photo = currentPhotos[index]
    if (photo?.url.startsWith("blob:")) URL.revokeObjectURL(photo.url)
    onPhotosChange(currentPhotos.filter((_, photoIndex) => photoIndex !== index))
  }

  function removeAudio() {
    if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl)
    onAudioChange(undefined)
  }

  return <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[11px] font-medium text-slate-700">{title}</p><p className="mt-0.5 text-[10px] text-slate-500">{description}</p></div><div className="flex flex-wrap gap-2"><input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} /><input ref={audioInput} type="file" accept="audio/*" className="hidden" onChange={addAudio} /><Button type="button" variant="outline" size="sm" className="h-8 bg-white text-[10px]" onClick={() => photoInput.current?.click()}><ImagePlus className="mr-1 size-3.5" />Add photos</Button>{recording ? <Button type="button" variant="destructive" size="sm" className="h-8 text-[10px]" onClick={stopRecording}><Square className="mr-1 size-3" />Stop recording</Button> : <Button type="button" variant="outline" size="sm" className="h-8 bg-white text-[10px]" onClick={startRecording}><Mic className="mr-1 size-3.5" />Record audio</Button>}<Button type="button" variant="outline" size="sm" className="h-8 bg-white text-[10px]" onClick={() => audioInput.current?.click()}><Music2 className="mr-1 size-3.5" />Upload audio</Button></div></div>
    {recording && <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-rose-700"><span className="size-1.5 animate-pulse rounded-full bg-rose-600" />Recording voice note…</p>}
    {recordingError && <p role="alert" className="mt-2 text-[10px] text-rose-700">{recordingError}</p>}
    {currentPhotos.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{currentPhotos.map((photo, index) => <div key={`${photo.url}-${index}`} className="group relative overflow-hidden rounded-md border border-slate-200 bg-white"><Image src={photo.url} alt={photo.name} width={68} height={48} unoptimized className="h-12 w-[68px] object-cover" /><button type="button" aria-label={`Remove ${photo.name}`} onClick={() => removePhoto(index)} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-slate-900/75 text-white opacity-0 transition group-hover:opacity-100"><X className="size-3" /></button></div>)}</div>}
    {audioUrl && <div className="mt-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2"><audio controls src={audioUrl} className="h-8 min-w-0 flex-1" /><button type="button" aria-label="Remove audio instruction" onClick={removeAudio} className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Trash2 className="size-3.5" /></button></div>}
  </div>
}

function WorkInstructionPreview({ photos, audioUrl }: { photos?: EvidencePhoto[]; audioUrl?: string }) {
  if (!photos?.length && !audioUrl) return null
  return <div className="mt-2 flex flex-wrap items-center gap-2">{photos?.map((photo, index) => <a key={`${photo.url}-${index}`} href={photo.url} target="_blank" rel="noreferrer" title={photo.name} className="overflow-hidden rounded-md border border-slate-200"><Image src={photo.url} alt={photo.name} width={64} height={44} unoptimized className="h-11 w-16 object-cover" /></a>)}{audioUrl && <audio controls src={audioUrl} className="h-8 max-w-52" />}</div>
}

function SupervisorProgressUpdate({ assignment, onSubmit }: { assignment: WorkAssignment; onSubmit: (assignment: WorkAssignment, quantity: number, hoursWorked: number, note: string, photos: EvidencePhoto[], audioUrl?: string) => void }) {
  const [editing, setEditing] = useState(assignment.status === "Assigned" || assignment.status === "Returned")
  const [quantity, setQuantity] = useState(String(assignment.completedQty))
  const [hours, setHours] = useState(String(assignment.teamSize * 8))
  const [note, setNote] = useState("")
  const [photos, setPhotos] = useState<EvidencePhoto[]>([])
  const [audioUrl, setAudioUrl] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const completed = Number(quantity)
    const crewHours = Number(hours)
    const nextErrors: Record<string, string> = {}
    if (!Number.isFinite(completed) || completed < 0) nextErrors.quantity = "Enter a completed quantity of zero or more."
    if (completed > assignment.target) nextErrors.quantity = "Completion cannot exceed the assigned target."
    if (!Number.isFinite(crewHours) || crewHours <= 0) nextErrors.hours = "Enter the crew hours worked."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(assignment, completed, crewHours, note.trim(), photos, audioUrl)
    setNote("")
    setPhotos([])
    setAudioUrl(undefined)
    setErrors({})
    setEditing(false)
  }

  return <div className="mt-4 border-t border-slate-100 pt-4">
    {!editing && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-slate-500">{assignment.status === "Reviewed" ? "PM reviewed this progress. Submit a change to send it for review again." : "Progress is with the PM. You can submit a correction if needed."}</p><Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 cursor-pointer"><ClipboardCheck className="mr-1.5 size-3.5" />Update progress</Button></div>}
    {editing && <form noValidate onSubmit={submit} className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><Field label={`Completed quantity today (${assignment.unit})`} error={errors.quantity}><Input type="number" inputMode="decimal" min="0" max={assignment.target} step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-9" /></Field><Field label="Crew hours worked" error={errors.hours}><Input type="number" inputMode="decimal" min="0.5" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} className="h-9" /></Field><Button type="submit" size="sm" className="h-9 cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><CheckCircle2 className="mr-1.5 size-3.5" />{assignment.status === "Returned" ? "Resubmit progress" : assignment.status === "Assigned" ? "Submit progress" : "Save and resubmit"}</Button></div>
    <label className="block text-xs font-medium text-slate-700">Site note <span className="font-normal text-slate-400">(optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="What was completed today? Note any blockers or material needs." className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-teal-600" /></label>
    <WorkInstructionAttachments photos={photos} onPhotosChange={setPhotos} audioUrl={audioUrl} onAudioChange={setAudioUrl} title="Completion evidence" description="Attach photos or audio showing today’s site progress." />
    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-8 cursor-pointer text-slate-500">Cancel</Button>
    </form>}
  </div>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p role="alert" className="mt-1 text-[11px] font-medium text-rose-700">{message}</p>
}

function WorkflowHeader({ title, description, count, action }: { title: string; description: string; count: number; action: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-slate-800">{title}</h3><Badge variant="outline" className="text-[10px]">{count}</Badge></div><p className="mt-1 text-[11px] text-slate-500">{description}</p></div>{action}</div>
}

function WorkflowStatus({ status }: { status: string }) {
  const style = status === "Resolved" || status === "Received" || status === "Passed" || status === "Closed"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "Action planned" || status === "Approved" || status === "Ordered" || status === "Rework submitted"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "Rejected" || status === "Rework required"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-800"
  return <Badge variant="outline" className={`rounded-full px-2.5 text-[10px] ${style}`}>{status}</Badge>
}

export function OperationsCenter({
  role,
  projects,
  members,
  issues,
  materials,
  qualityChecks,
  assignments,
  doubtThreads,
  updates,
  expenses,
  onCreateAssignments,
  onRecordCompletion,
  onPostDoubt,
  onCreateIssue,
  onUpdateIssue,
  onCreateMaterial,
  onUpdateMaterial,
  onUpdateMaterialUsage,
  onCreateExpense,
  onCreateQualityCheck,
  onUpdateQualityCheck,
  notice,
}: {
  role: AppRole
  projects: Project[]
  members: TeamMember[]
  issues: OperationsIssue[]
  materials: MaterialRequest[]
  qualityChecks: QualityCheck[]
  assignments: WorkAssignment[]
  doubtThreads: WorkDoubtThread[]
  updates: DailyUpdate[]
  expenses: ExpenseRecord[]
  onCreateAssignments: (assignments: Omit<WorkAssignment, "id" | "completedQty" | "status">[]) => void
  onRecordCompletion: (assignment: WorkAssignment, quantity: number, hoursWorked: number, note: string, photos: EvidencePhoto[], audioUrl?: string) => void
  onPostDoubt: (assignmentId: string, threadId: string | undefined, message: Omit<WorkDoubtMessage, "id" | "sentAt">, resolveThread: boolean) => void
  onCreateIssue: (issue: NewIssue) => void
  onUpdateIssue: (id: string, patch: Partial<OperationsIssue>) => void
  onCreateMaterial: (request: NewMaterialRequest) => void
  onUpdateMaterial: (id: string, status: MaterialStatus) => void
  onUpdateMaterialUsage: (id: string, usedQuantity: number) => void
  onCreateExpense: (expense: NewExpense) => void
  onCreateQualityCheck: (check: NewQualityCheck) => void
  onUpdateQualityCheck: (id: string, status: QualityStatus, reworkNote?: string) => void
  notice: string
}) {
  const canManage = role === "pm" || role === "superadmin"
  const canSchedule = canManage || role === "engineer"
  const canRecordMaterialUse = canManage || role === "supervisor"
  const canManageQuality = role === "pm"
  const [issueOpen, setIssueOpen] = useState(false)
  const [materialOpen, setMaterialOpen] = useState(false)
  const [qualityOpen, setQualityOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [costOpen, setCostOpen] = useState(false)
  const [costCategory, setCostCategory] = useState<ExpenseCategory>("Labour")
  const [costProject, setCostProject] = useState(projects[0]?.name ?? "")
  const [costAmount, setCostAmount] = useState("")
  const [costDescription, setCostDescription] = useState("")
  const [costErrors, setCostErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState(canManage ? "cost" : "daily")
  const [issueProject, setIssueProject] = useState(projects[0]?.name ?? "")
  const [issueTitle, setIssueTitle] = useState("")
  const [issueCategory, setIssueCategory] = useState<IssueCategory>("Site access")
  const [issueDetails, setIssueDetails] = useState("")
  const [impactDays, setImpactDays] = useState("1")
  const [issueOwner, setIssueOwner] = useState(projects[0]?.manager ?? "")
  const [issueErrors, setIssueErrors] = useState<Record<string, string>>({})
  const [materialProject, setMaterialProject] = useState(projects[0]?.name ?? "")
  const [materialName, setMaterialName] = useState("")
  const [materialQuantity, setMaterialQuantity] = useState("")
  const [materialUnit, setMaterialUnit] = useState("pcs")
  const [materialDate, setMaterialDate] = useState("")
  const [materialPriority, setMaterialPriority] = useState<"Normal" | "High" | "Urgent">("Normal")
  const [materialNote, setMaterialNote] = useState("")
  const [materialErrors, setMaterialErrors] = useState<Record<string, string>>({})
  const [qualityProject, setQualityProject] = useState(projects[0]?.name ?? "")
  const [qualityActivity, setQualityActivity] = useState("")
  const [qualityLocation, setQualityLocation] = useState("")
  const [qualityNote, setQualityNote] = useState("")
  const [qualityErrors, setQualityErrors] = useState<Record<string, string>>({})
  const [scheduleProject, setScheduleProject] = useState(projects[0]?.name ?? "")
  const [workPacks, setWorkPacks] = useState<WorkPackDraft[]>(() => [createWorkPackDraft()])
  const [scheduleEngineer, setScheduleEngineer] = useState(role === "engineer" ? rolePeople.engineer.name : members.find((member) => member.role === "Engineer")?.name ?? "")
  const [scheduleSupervisor, setScheduleSupervisor] = useState(members.find((member) => member.role === "Supervisor")?.name ?? "")
  const [scheduleTeam, setScheduleTeam] = useState("")
  const [scheduleTeamSize, setScheduleTeamSize] = useState("4")
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({})
  const [materialUsageDrafts, setMaterialUsageDrafts] = useState<Record<string, string>>(() => Object.fromEntries(materials.map((item) => [item.id, String(item.usedQuantity ?? 0)])))
  const [materialUsageErrors, setMaterialUsageErrors] = useState<Record<string, string>>({})
  const [reworkDrafts, setReworkDrafts] = useState<Record<string, string>>({})
  const [reworkErrors, setReworkErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!projects.some((project) => project.name === scheduleProject)) setScheduleProject(projects[0]?.name ?? "")
    const engineers = members.filter((member) => member.role === "Engineer")
    const supervisors = members.filter((member) => member.role === "Supervisor")
    if (!engineers.some((member) => member.name === scheduleEngineer)) setScheduleEngineer(engineers[0]?.name ?? "")
    if (!supervisors.some((member) => member.name === scheduleSupervisor)) setScheduleSupervisor(supervisors[0]?.name ?? "")
  }, [projects, members, scheduleProject, scheduleEngineer, scheduleSupervisor])

  useEffect(() => {
    setActiveTab(canManage ? "cost" : "daily")
  }, [canManage])

  useEffect(() => {
    if (!projects.some((project) => project.name === costProject)) setCostProject(projects[0]?.name ?? "")
  }, [projects, costProject])

  useEffect(() => {
    setMaterialUsageDrafts(Object.fromEntries(materials.map((item) => [item.id, String(item.usedQuantity ?? 0)])))
  }, [materials])

  function createIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!issueProject) nextErrors.project = "Choose a project for this issue."
    if (issueTitle.trim().length < 4) nextErrors.title = "Enter a short title with at least 4 characters."
    if (!issueDetails.trim()) nextErrors.details = "Describe what is blocking the work."
    if (!Number.isFinite(Number(impactDays)) || Number(impactDays) < 0) nextErrors.impact = "Enter zero or more impact days."
    if (!issueOwner) nextErrors.owner = "Choose who should follow up."
    setIssueErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onCreateIssue({ project: issueProject, title: issueTitle.trim(), category: issueCategory, details: issueDetails.trim(), impactDays: Number(impactDays), owner: issueOwner, correctiveAction: "" })
    setIssueTitle("")
    setIssueDetails("")
    setImpactDays("1")
    setIssueOpen(false)
  }

  function createMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!materialProject) nextErrors.project = "Choose a project."
    if (materialName.trim().length < 2) nextErrors.item = "Enter the material name or specification."
    if (!Number.isFinite(Number(materialQuantity)) || Number(materialQuantity) <= 0) nextErrors.quantity = "Enter a quantity greater than zero."
    if (!materialDate) nextErrors.date = "Select when the material is needed."
    setMaterialErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onCreateMaterial({ project: materialProject, item: materialName.trim(), quantity: Number(materialQuantity), unit: materialUnit, requiredBy: new Date(`${materialDate}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), priority: materialPriority, note: materialNote.trim() })
    setMaterialName("")
    setMaterialQuantity("")
    setMaterialNote("")
    setMaterialOpen(false)
  }

  function createQuality(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!qualityProject) nextErrors.project = "Choose a project."
    if (qualityActivity.trim().length < 3) nextErrors.activity = "Enter the work item to inspect."
    if (!qualityLocation.trim()) nextErrors.location = "Add a floor, zone, or room."
    if (!qualityNote.trim()) nextErrors.note = "Add a short inspection handover note."
    setQualityErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onCreateQualityCheck({ project: qualityProject, activity: qualityActivity.trim(), location: qualityLocation.trim(), note: qualityNote.trim() })
    setQualityActivity("")
    setQualityLocation("")
    setQualityNote("")
    setQualityOpen(false)
  }

  function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const teamSize = Number(scheduleTeamSize)
    const nextErrors: Record<string, string> = {}
    if (!scheduleProject) nextErrors.project = "Choose a project."
    if (!scheduleEngineer) nextErrors.engineer = "Choose the Engineer responsible for this task."
    if (!scheduleSupervisor) nextErrors.supervisor = "Choose the Supervisor who will report progress."
    if (!Number.isFinite(teamSize) || teamSize < 1) nextErrors.teamSize = "Enter at least one team member."
    if (scheduleTeam.trim().length < 2) nextErrors.team = "Enter the crew or team name."
    workPacks.forEach((pack, index) => {
      if (pack.activity.trim().length < 4) nextErrors[`pack-${pack.id}-activity`] = `Enter a clear activity for work pack ${index + 1}.`
      if (!Number.isFinite(Number(pack.target)) || Number(pack.target) <= 0) nextErrors[`pack-${pack.id}-target`] = `Enter a target greater than zero for work pack ${index + 1}.`
    })
    setScheduleErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const stockRows = materials.filter((item) => item.project === scheduleProject && item.status === "Received" && (item.allottedQuantity ?? 0) > (item.usedQuantity ?? 0))
    const requestedByMaterial = new Map<string, number>()
    const invalidStock = stockRows.find((item) => workPacks.some((pack) => {
      const rawQuantity = pack.materialQty[item.id] ?? ""
      const quantity = Number(rawQuantity || 0)
      if (!Number.isFinite(quantity) || quantity < 0) return true
      requestedByMaterial.set(item.id, (requestedByMaterial.get(item.id) ?? 0) + quantity)
      return false
    }) || (requestedByMaterial.get(item.id) ?? 0) > (item.allottedQuantity ?? 0) - (item.usedQuantity ?? 0))
    if (invalidStock) {
      setScheduleErrors({ stock: `Use no more than ${Math.max(0, (invalidStock.allottedQuantity ?? 0) - (invalidStock.usedQuantity ?? 0))} ${invalidStock.unit} of ${invalidStock.item}.` })
      return
    }
    const assignmentsToCreate = workPacks.map((pack) => ({
      project: scheduleProject,
      activity: pack.activity.trim(),
      target: Number(pack.target),
      unit: pack.unit,
      engineer: scheduleEngineer,
      supervisor: scheduleSupervisor,
      assignedTeam: scheduleTeam.trim(),
      teamSize,
      due: "Today",
      instruction: pack.instruction.trim(),
      referencePhotos: pack.referencePhotos ?? [],
      referenceAudioUrl: pack.referenceAudioUrl,
      materialsUsed: stockRows.flatMap((item) => {
        const quantity = Number(pack.materialQty[item.id] || 0)
        return quantity > 0 ? [{ materialId: item.id, item: item.item, quantity, unit: item.unit }] : []
      }),
    }))
    onCreateAssignments(assignmentsToCreate)
    setWorkPacks([createWorkPackDraft()])
    setScheduleTeam("")
    setScheduleErrors({})
    setScheduleOpen(false)
  }

  function submitCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(costAmount)
    const nextErrors: Record<string, string> = {}
    if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = "Enter an amount greater than zero."
    if (costDescription.trim().length < 3) nextErrors.description = "Add a short description for this cost."
    setCostErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (!costProject) return
    onCreateExpense({ project: costProject, category: costCategory, amount, description: costDescription.trim() })
    setCostAmount("")
    setCostDescription("")
    setCostErrors({})
    setCostOpen(false)
  }

  function saveMaterialUsage(item: MaterialRequest) {
    const used = Number(materialUsageDrafts[item.id])
    const allotted = item.allottedQuantity ?? 0
    if (!Number.isFinite(used) || used < 0 || used > allotted) {
      setMaterialUsageErrors((current) => ({ ...current, [item.id]: `Enter a value from 0 to ${allotted} ${item.unit}.` }))
      return
    }
    setMaterialUsageErrors((current) => ({ ...current, [item.id]: "" }))
    onUpdateMaterialUsage(item.id, used)
  }

  function requestRework(id: string) {
    const note = reworkDrafts[id]?.trim() ?? ""
    if (!note) {
      setReworkErrors((current) => ({ ...current, [id]: "Write the correction required before returning this check." }))
      return
    }
    setReworkErrors((current) => ({ ...current, [id]: "" }))
    onUpdateQualityCheck(id, "Rework required", note)
  }

  const issuesByDate = [...issues].sort((a, b) => b.id.localeCompare(a.id))
  const materialsByDate = [...materials].sort((a, b) => b.id.localeCompare(a.id))
  const qualityByDate = [...qualityChecks].sort((a, b) => b.id.localeCompare(a.id))

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
      {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800"><CheckCircle2 className="size-4" />{notice}</div>}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="gap-4">
        <TabsList className="flex h-12 w-full max-w-[720px] flex-nowrap items-center justify-start gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 sm:overflow-hidden">
          {canManage && <TabsTrigger value="cost" className="h-9 min-w-fit flex-1 cursor-pointer gap-1.5 whitespace-nowrap px-2 text-[10px] sm:min-w-0 sm:px-2.5 sm:text-[11px]"><WalletCards className="size-3.5" />Cost</TabsTrigger>}
          <TabsTrigger value="daily" className="h-9 min-w-fit flex-1 cursor-pointer gap-1.5 whitespace-nowrap px-2 text-[10px] sm:min-w-0 sm:px-2.5 sm:text-[11px]"><Clock3 className="size-3.5" />Work schedule</TabsTrigger>
          <TabsTrigger value="issues" className="h-9 min-w-fit flex-1 cursor-pointer gap-1.5 whitespace-nowrap px-2 text-[10px] sm:min-w-0 sm:px-2.5 sm:text-[11px]"><AlertTriangle className="size-3.5" />Issues & delays</TabsTrigger>
          <TabsTrigger value="materials" className="h-9 min-w-fit flex-1 cursor-pointer gap-1.5 whitespace-nowrap px-2 text-[10px] sm:min-w-0 sm:px-2.5 sm:text-[11px]"><Package className="size-3.5" />Materials</TabsTrigger>
          {canManageQuality && <TabsTrigger value="quality" className="h-9 min-w-fit flex-1 cursor-pointer gap-1.5 whitespace-nowrap px-2 text-[10px] sm:min-w-0 sm:px-2.5 sm:text-[11px]"><ClipboardCheck className="size-3.5" />Quality checks</TabsTrigger>}
        </TabsList>

        {canManage && <TabsContent value="cost" className="animate-in fade-in-0 duration-200">
          <ProjectCostView projects={projects} expenses={expenses} onCreateCost={() => setCostOpen(true)} />
        </TabsContent>}

        <TabsContent value="daily" className="animate-in fade-in-0 duration-200">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
            <CardHeader className="border-b border-slate-100 pb-4"><WorkflowHeader title="Today’s work" description="Compare assigned targets with what the Supervisor has reported." count={assignments.length} action={<div className="flex flex-wrap items-center gap-2">{canSchedule && <Button size="sm" onClick={() => setScheduleOpen(true)} className="h-8 shrink-0 cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-3.5" />Schedule work</Button>}<Badge variant="outline" className="text-[10px]">{updates.length} progress updates</Badge></div>} /></CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {assignments.length === 0 && updates.length === 0 ? <EmptyState icon={<Clock3 />} title="No daily activity yet" description="Work assignments and site completion updates will appear here." /> : <>
                {assignments.length > 0 && <section className="space-y-3 p-4 sm:p-5"><h4 className="text-xs font-semibold text-slate-700">Assigned work</h4>{assignments.map((assignment) => <article key={assignment.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-slate-800">{assignment.activity}</p><p className="mt-1 text-[10px] text-slate-500">{assignment.project} · {assignment.id} · {assignment.due}</p></div><Badge variant="outline" className="text-[10px]">{assignment.status}</Badge></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span>Target <b className="text-slate-700">{assignment.target} {assignment.unit}</b></span><span>Completed <b className="text-slate-700">{assignment.completedQty} {assignment.unit}</b></span><span>Team <b className="text-slate-700">{assignment.assignedTeam} · {assignment.teamSize}</b></span></div><p className="mt-2 text-[11px] text-slate-500">Engineer: {assignment.engineer} · Supervisor: {assignment.supervisor}</p>{assignment.materialsUsed?.length ? <p className="mt-2 rounded-lg bg-teal-50 p-3 text-[11px] text-teal-900">Stock issued: {assignment.materialsUsed.map((material) => `${material.quantity} ${material.unit} ${material.item}`).join(" · ")}</p> : null}{assignment.instruction && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">{assignment.instruction}</p>}<WorkInstructionPreview photos={assignment.referencePhotos} audioUrl={assignment.referenceAudioUrl} /><WorkDoubtPanel assignmentId={assignment.id} role={role} currentUser={rolePeople[role].name} threads={doubtThreads} onPostMessage={onPostDoubt} />{role === "supervisor" && <SupervisorProgressUpdate assignment={assignment} onSubmit={onRecordCompletion} />}</article>)}</section>}
                {updates.length > 0 && <section className="space-y-3 p-4 sm:p-5"><h4 className="text-xs font-semibold text-slate-700">Site completion updates</h4>{updates.map((update) => <article key={update.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-slate-800">{update.activity}</p><p className="mt-1 text-[10px] text-slate-500">{update.date} · Reported by {update.submittedBy}</p></div><Badge variant="outline" className="text-[10px]">{update.status}</Badge></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span><b className="text-slate-700">{update.quantity} {update.unit}</b> completed</span><span>{update.people} people{update.hoursWorked ? ` · ${update.hoursWorked} crew hours` : ""}</span></div>{update.note && <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{update.note}</p>}<WorkInstructionPreview photos={update.photos} audioUrl={update.audioUrl} /></article>)}</section>}
              </>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="animate-in fade-in-0 duration-200">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
            <CardHeader className="border-b border-slate-100 pb-4"><WorkflowHeader title="Delay and issue log" description="Capture the cause, expected impact, owner, and corrective action." count={issues.length} action={<Button onClick={() => setIssueOpen(true)} className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />Report issue</Button>} /></CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {issuesByDate.map((issue) => <IssueCard key={issue.id} issue={issue} canManage={canManage} onUpdate={onUpdateIssue} onResolve={() => onUpdateIssue(issue.id, { status: "Resolved" })} />)}
              {issues.length === 0 && <EmptyState icon={<CheckCircle2 />} title="No open issues" description="Report material, access, manpower, equipment, or quality blockers here." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="animate-in fade-in-0 duration-200">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
            <CardHeader className="border-b border-slate-100 pb-4"><WorkflowHeader title="Project materials" description="Issue available project stock to scheduled work, or request anything that is missing." count={materials.length} action={<Button onClick={() => setMaterialOpen(true)} className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />Request material</Button>} /></CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {materialsByDate.map((request) => <MaterialCard key={request.id} request={request} canManage={canManage} canRecordUsage={canRecordMaterialUse} usageDraft={materialUsageDrafts[request.id] ?? String(request.usedQuantity ?? 0)} usageError={materialUsageErrors[request.id]} onUsageDraftChange={(value) => setMaterialUsageDrafts((current) => ({ ...current, [request.id]: value }))} onSaveUsage={() => saveMaterialUsage(request)} onStatusChange={(status) => onUpdateMaterial(request.id, status)} />)}
              {materials.length === 0 && <EmptyState icon={<Package />} title="No material requests" description="New site requests will appear here for follow-up." />}
            </CardContent>
          </Card>
        </TabsContent>

        {canManageQuality && <TabsContent value="quality" className="animate-in fade-in-0 duration-200">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
            <CardHeader className="border-b border-slate-100 pb-4"><WorkflowHeader title="PM quality checks" description="Set up and adjust inspections after the project kickoff, then track acceptance and rework." count={qualityChecks.length} action={<Button onClick={() => setQualityOpen(true)} className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />Add quality check</Button>} /></CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {qualityByDate.map((check) => <QualityCard key={check.id} check={check} canManage={canManageQuality} role={role} reworkDraft={reworkDrafts[check.id] ?? ""} reworkError={reworkErrors[check.id]} onReworkDraftChange={(value) => setReworkDrafts((current) => ({ ...current, [check.id]: value }))} onRequestRework={() => requestRework(check.id)} onUpdate={(status) => onUpdateQualityCheck(check.id, status)} />)}
              {qualityChecks.length === 0 && <EmptyState icon={<ShieldCheck />} title="No inspections yet" description="Request an inspection when an installation is ready to be checked." />}
            </CardContent>
          </Card>
        </TabsContent>}
      </Tabs>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Schedule work for today</DialogTitle><DialogDescription>Create one or more work packs and reserve project stock for each pack.</DialogDescription></DialogHeader>
          <form noValidate onSubmit={createSchedule} className="space-y-4 py-1">
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.length > 1 ? <FormSelect label="Project" value={scheduleProject} onChange={setScheduleProject} options={projects.map((project) => [project.name, project.name])} error={scheduleErrors.project} /> : <div className="space-y-1.5"><p className="text-xs font-medium text-slate-700">Project</p><p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{projects[0]?.name ?? "No project selected"}</p></div>}
              {role === "engineer" ? <div className="space-y-1.5"><p className="text-xs font-medium text-slate-700">Engineer</p><p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{scheduleEngineer}</p></div> : <FormSelect label="Engineer" value={scheduleEngineer} onChange={setScheduleEngineer} options={members.filter((member) => member.role === "Engineer").map((member) => [member.name, member.name])} error={scheduleErrors.engineer} />}
              <FormSelect label="Assign to Supervisor" value={scheduleSupervisor} onChange={setScheduleSupervisor} options={members.filter((member) => member.role === "Supervisor").map((member) => [member.name, member.name])} error={scheduleErrors.supervisor} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <Field label="Assigned crew" error={scheduleErrors.team}><Input value={scheduleTeam} onChange={(event) => setScheduleTeam(event.target.value)} placeholder="e.g. Plumbing Crew B" /></Field>
              <Field label="Crew size" error={scheduleErrors.teamSize}><Input type="number" min="1" step="1" value={scheduleTeamSize} onChange={(event) => setScheduleTeamSize(event.target.value)} /></Field>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-slate-800">Work packs <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{workPacks.length}</span></p><p className="mt-0.5 text-[11px] text-slate-500">Each work pack can use several items from project stock.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setWorkPacks((packs) => [...packs, createWorkPackDraft()])}><Plus className="mr-1 size-3.5" />Add work pack</Button></div>
              {workPacks.map((pack, index) => {
                const availableStock = materials.filter((item) => item.project === scheduleProject && item.status === "Received" && (item.allottedQuantity ?? 0) > (item.usedQuantity ?? 0))
                return <section key={pack.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-800">Work pack {index + 1}</p><p className="mt-0.5 text-[10px] text-slate-500">Materials selected here are linked to this task.</p></div>{workPacks.length > 1 && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove work pack ${index + 1}`} onClick={() => { pack.referencePhotos?.forEach((photo) => { if (photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url) }); if (pack.referenceAudioUrl?.startsWith("blob:")) URL.revokeObjectURL(pack.referenceAudioUrl); setWorkPacks((packs) => packs.filter((item) => item.id !== pack.id)) }}><Trash2 className="size-4 text-slate-500" /></Button>}</div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><Field label="Work activity" error={scheduleErrors[`pack-${pack.id}-activity`]}><Input value={pack.activity} onChange={(event) => setWorkPacks((packs) => packs.map((item) => item.id === pack.id ? { ...item, activity: event.target.value } : item))} placeholder="e.g. Level 4 chilled water pipe installation" /></Field><div className="grid grid-cols-[1fr_90px] gap-2"><Field label="Target" error={scheduleErrors[`pack-${pack.id}-target`]}><Input type="number" min="0.01" step="0.01" value={pack.target} onChange={(event) => setWorkPacks((packs) => packs.map((item) => item.id === pack.id ? { ...item, target: event.target.value } : item))} placeholder="0" /></Field><FormSelect label="Unit" value={pack.unit} onChange={(value) => setWorkPacks((packs) => packs.map((item) => item.id === pack.id ? { ...item, unit: value } : item))} options={["m", "sq.ft.", "units", "points", "kg"].map((unit) => [unit, unit])} /></div></div>
                  <details className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5" open={index === 0}><summary className="cursor-pointer text-xs font-medium text-slate-700">Project materials <span className="ml-1 text-[10px] font-normal text-slate-500">({availableStock.length} available)</span></summary><div className="mt-2 space-y-2">{availableStock.map((item) => { const available = (item.allottedQuantity ?? 0) - (item.usedQuantity ?? 0); return <div key={item.id} className="flex flex-col gap-2 border-t border-slate-200/70 pt-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-medium text-slate-800">{item.item}</p><p className="text-[10px] text-slate-500">Available: {available} {item.unit}</p></div><Field label="Quantity for this pack"><Input aria-label={`${item.item} quantity for work pack ${index + 1}`} type="number" min="0" max={available} step="0.01" value={pack.materialQty[item.id] ?? ""} onChange={(event) => setWorkPacks((packs) => packs.map((currentPack) => currentPack.id === pack.id ? { ...currentPack, materialQty: { ...currentPack.materialQty, [item.id]: event.target.value } } : currentPack))} placeholder="0" className="h-8 w-32 text-xs" /></Field></div> })}{availableStock.length === 0 && <p className="text-[11px] text-slate-500">No received stock is available. Request the required item from Materials.</p>}</div></details>
                  <Field label="Work instructions (optional)"><textarea value={pack.instruction} onChange={(event) => setWorkPacks((packs) => packs.map((item) => item.id === pack.id ? { ...item, instruction: event.target.value } : item))} rows={2} placeholder="Work sequence, coordination, or safety notes" className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-700/15" /><WorkInstructionAttachments photos={pack.referencePhotos} onPhotosChange={(referencePhotos) => setWorkPacks((packs) => packs.map((item) => item.id === pack.id ? { ...item, referencePhotos } : item))} audioUrl={pack.referenceAudioUrl} onAudioChange={(referenceAudioUrl) => setWorkPacks((packs) => packs.map((item) => item.id === pack.id ? { ...item, referenceAudioUrl } : item))} /></Field>
                </section>
              })}
              {scheduleErrors.stock && <FieldError message={scheduleErrors.stock} />}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><Button type="button" variant="link" size="sm" className="h-auto cursor-pointer p-0 text-xs text-teal-800" onClick={() => { setScheduleOpen(false); setActiveTab("materials") }}>Need another material? Request it</Button><DialogFooter><Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button><Button type="submit" className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />Assign {workPacks.length} work pack{workPacks.length === 1 ? "" : "s"}</Button></DialogFooter></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={costOpen} onOpenChange={setCostOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record project cost</DialogTitle><DialogDescription>Add an expense and update the project cost analytics.</DialogDescription></DialogHeader>
          <form noValidate onSubmit={submitCost} className="space-y-3 py-1">
            {projects.length > 1 && <FormSelect label="Project" value={costProject} onChange={setCostProject} options={projects.map((project) => [project.name, project.name])} />}
            <FormSelect label="Cost category" value={costCategory} onChange={(value) => setCostCategory(value as ExpenseCategory)} options={["Labour", "Materials", "Other"].map((category) => [category, category])} />
            <Field label="Amount (₹)" error={costErrors.amount}><Input type="number" min="0.01" step="0.01" value={costAmount} onChange={(event) => setCostAmount(event.target.value)} placeholder="0" /></Field>
            <Field label="Where was it used?" error={costErrors.description}><Input value={costDescription} onChange={(event) => setCostDescription(event.target.value)} placeholder="e.g. Labour · Level 8 duct installation" /></Field>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCostOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Save cost</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Report a site issue</DialogTitle><DialogDescription>Record what is slowing work and who should coordinate the next action.</DialogDescription></DialogHeader>
          <form noValidate onSubmit={createIssue} className="space-y-3 py-1">
            <FormSelect label="Project" value={issueProject} onChange={setIssueProject} options={projects.map((project) => [project.name, project.name])} error={issueErrors.project} />
            <Field label="Issue title" error={issueErrors.title}><Input value={issueTitle} aria-invalid={Boolean(issueErrors.title)} onChange={(event) => setIssueTitle(event.target.value)} placeholder="e.g. Ceiling access not cleared" /></Field>
            <div className="grid gap-3 sm:grid-cols-2"><FormSelect label="Reason" value={issueCategory} onChange={(value) => setIssueCategory(value as IssueCategory)} options={["Material shortage", "Client dependency", "Site access", "Drawings / design", "Manpower", "Equipment", "Rework / quality", "Internal planning", "Other"].map((value) => [value, value])} /><Field label="Expected delay (days)" error={issueErrors.impact}><Input type="number" inputMode="decimal" min="0" step="0.5" value={impactDays} aria-invalid={Boolean(issueErrors.impact)} onChange={(event) => setImpactDays(event.target.value)} /></Field></div>
            <FormSelect label="Follow-up owner" value={issueOwner} onChange={setIssueOwner} options={members.filter((member) => member.role === "Project Manager" || member.role === "Engineer").map((member) => [member.name, `${member.name} · ${member.role}`])} error={issueErrors.owner} />
            <Field label="What is happening?" error={issueErrors.details}><textarea value={issueDetails} aria-invalid={Boolean(issueErrors.details)} onChange={(event) => setIssueDetails(event.target.value)} rows={3} placeholder="Describe the blocker and the work affected." className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-700/15 aria-[invalid=true]:border-rose-500" /></Field>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Submit issue</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={materialOpen} onOpenChange={setMaterialOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Request materials</DialogTitle><DialogDescription>Submit a site requirement so the project team can approve and track delivery.</DialogDescription></DialogHeader>
          <form noValidate onSubmit={createMaterial} className="space-y-3 py-1">
            <FormSelect label="Project" value={materialProject} onChange={setMaterialProject} options={projects.map((project) => [project.name, project.name])} error={materialErrors.project} />
            <Field label="Material or specification" error={materialErrors.item}><Input value={materialName} aria-invalid={Boolean(materialErrors.item)} onChange={(event) => setMaterialName(event.target.value)} placeholder="e.g. 24 gauge GI duct sheet" /></Field>
            <div className="grid grid-cols-[1fr_120px] gap-3"><Field label="Quantity" error={materialErrors.quantity}><Input type="number" inputMode="decimal" min="0.01" step="0.01" value={materialQuantity} aria-invalid={Boolean(materialErrors.quantity)} onChange={(event) => setMaterialQuantity(event.target.value)} /></Field><FormSelect label="Unit" value={materialUnit} onChange={setMaterialUnit} options={["pcs", "m", "kg", "sheets", "sets", "boxes"].map((value) => [value, value])} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Needed by" error={materialErrors.date}><DatePicker value={materialDate} invalid={Boolean(materialErrors.date)} onValueChange={setMaterialDate} /></Field><FormSelect label="Priority" value={materialPriority} onChange={(value) => setMaterialPriority(value as "Normal" | "High" | "Urgent")} options={[["Normal", "Normal"], ["High", "High"], ["Urgent", "Urgent"]]} /></div>
            <Field label="Site note"><textarea value={materialNote} onChange={(event) => setMaterialNote(event.target.value)} rows={2} placeholder="What work depends on this material?" className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-700/15" /></Field>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setMaterialOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Send request</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={qualityOpen} onOpenChange={setQualityOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Request a quality inspection</DialogTitle><DialogDescription>Hand over a completed work section for inspection and acceptance.</DialogDescription></DialogHeader>
          <form noValidate onSubmit={createQuality} className="space-y-3 py-1">
            <FormSelect label="Project" value={qualityProject} onChange={setQualityProject} options={projects.map((project) => [project.name, project.name])} error={qualityErrors.project} />
            <Field label="Work activity" error={qualityErrors.activity}><Input value={qualityActivity} aria-invalid={Boolean(qualityErrors.activity)} onChange={(event) => setQualityActivity(event.target.value)} placeholder="e.g. Level 4 chilled water pipework" /></Field>
            <Field label="Location" error={qualityErrors.location}><Input value={qualityLocation} aria-invalid={Boolean(qualityErrors.location)} onChange={(event) => setQualityLocation(event.target.value)} placeholder="Floor, zone, or room" /></Field>
            <Field label="Inspection handover note" error={qualityErrors.note}><textarea value={qualityNote} aria-invalid={Boolean(qualityErrors.note)} onChange={(event) => setQualityNote(event.target.value)} rows={3} placeholder="Describe what is ready to be inspected." className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-700/15 aria-[invalid=true]:border-rose-500" /></Field>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setQualityOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Submit inspection</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProjectCostView({ projects, expenses, onCreateCost }: { projects: Project[]; expenses: ExpenseRecord[]; onCreateCost: () => void }) {
  const budget = projects.reduce((total, project) => total + project.budget, 0)
  const spent = projects.reduce((total, project) => total + project.spent, 0)
  const forecast = projects.reduce((total, project) => total + project.forecast, 0)
  const remaining = Math.max(0, budget - spent)
  const spendPercent = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const categories: ExpenseCategory[] = ["Labour", "Materials", "Other"]
  const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

  return <div className="space-y-4">
    <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
      <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Project cost overview</h3><p className="mt-1 text-[11px] text-slate-500">Budget used, remaining, forecast, and the cost entries recorded against this project.</p></div><Button onClick={onCreateCost} className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />Record cost</Button></CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <CostSummary label="Approved budget" value={money(budget)} detail={projects.length === 1 ? projects[0].name : `${projects.length} projects`} />
          <CostSummary label="Used to date" value={money(spent)} detail={`${spendPercent}% of the approved budget`} />
          <CostSummary label={spent > budget ? "Over budget" : "Budget remaining"} value={money(spent > budget ? spent - budget : remaining)} detail={`Forecast at completion ${money(forecast)}`} />
        </div>
        <div><div className="mb-2 flex items-center justify-between text-[10px]"><span className="font-medium text-slate-600">Budget usage</span><span className={spent > budget ? "font-semibold text-rose-700" : "font-semibold text-teal-800"}>{spendPercent}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${spent > budget ? "bg-rose-500" : "bg-teal-700"}`} style={{ width: `${spendPercent}%` }} /></div></div>
      </CardContent>
    </Card>

    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="pb-3"><h3 className="text-sm font-semibold text-slate-800">Where costs are going</h3><p className="text-[11px] text-slate-500">Totals from the cost entries recorded so far.</p></CardHeader><CardContent className="space-y-3">{categories.map((category) => { const total = expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0); const percent = expenseTotal ? Math.round(total / expenseTotal * 100) : 0; return <div key={category} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-700">{category}</span><b className="text-xs tabular-nums text-slate-800">{money(total)}</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${percent}%` }} /></div></div> })}{Math.max(0, spent - expenseTotal) > 0 && <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 p-3"><span className="text-xs text-slate-500">Previously recorded spend</span><b className="text-xs tabular-nums text-slate-700">{money(Math.max(0, spent - expenseTotal))}</b></div>}</CardContent></Card>
      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100 pb-4"><h3 className="text-sm font-semibold text-slate-800">Cost ledger</h3><p className="mt-1 text-[11px] text-slate-500">Each record shows the cost category, where it was used, and who entered it.</p></CardHeader><CardContent className="divide-y divide-slate-100 p-0">{expenses.length ? expenses.map((expense) => <article key={expense.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="text-[10px]">{expense.category}</Badge><span className="text-[10px] text-slate-400">{expense.id}</span></div><p className="mt-1.5 text-xs font-medium text-slate-800">{expense.description}</p><p className="mt-1 text-[10px] text-slate-500">{expense.recordedBy} · {expense.recordedAt}</p></div><b className="text-sm tabular-nums text-slate-800">{money(expense.amount)}</b></article>) : <EmptyState icon={<WalletCards />} title="No cost records yet" description="Add the first cost to start tracking project spend." />}</CardContent></Card>
    </div>
  </div>
}

function CostSummary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-slate-100 bg-white p-4"><p className="text-[10px] font-medium text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-xs font-medium text-slate-700">{label}{children}<FieldError message={error} /></label>
}

function FormSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][]; error?: string }) {
  return <div className="space-y-1.5"><p className="text-xs font-medium text-slate-700">{label}</p><Select value={value} onValueChange={(next) => { if (typeof next === "string") onChange(next) }}><SelectTrigger aria-invalid={Boolean(error)} className="h-9 w-full bg-white text-xs"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map(([option, title]) => <SelectItem key={option} value={option}>{title}</SelectItem>)}</SelectContent></Select><FieldError message={error} /></div>
}

function IssueCard({ issue, canManage, onUpdate, onResolve }: { issue: OperationsIssue; canManage: boolean; onUpdate: (id: string, patch: Partial<OperationsIssue>) => void; onResolve: () => void }) {
  const [action, setAction] = useState(issue.correctiveAction)
  return <article className="p-4 transition-colors hover:bg-slate-50/70 sm:p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="text-[10px]">{issue.id}</Badge><WorkflowStatus status={issue.status} /><Badge variant="secondary" className="text-[10px]">{issue.category}</Badge><span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Clock3 className="size-3" />{issue.reportedAt}</span></div><h4 className="mt-2 text-sm font-semibold text-slate-800">{issue.title}</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">{issue.details}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-500"><span>Project <b className="font-semibold text-slate-700">{issue.project}</b></span><span>Impact <b className="font-semibold text-rose-700">{issue.impactDays} days</b></span><span>Owner <b className="font-semibold text-slate-700">{issue.owner}</b></span><span>Reported by {issue.reportedBy}</span></div>{issue.correctiveAction && <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50/60 px-3 py-2 text-[11px] text-teal-900"><span className="font-semibold">Corrective action:</span> {issue.correctiveAction}</div>}</div>
      {canManage && issue.status !== "Resolved" && <div className="flex w-full flex-col gap-2 md:w-[230px]"><div className="flex gap-2"><Input value={action} onChange={(event) => setAction(event.target.value)} aria-label="Corrective action" placeholder="Add corrective action" className="h-8 text-xs" /><Button size="sm" className="h-8 cursor-pointer" onClick={() => onUpdate(issue.id, { correctiveAction: action.trim(), status: action.trim() ? "Action planned" : issue.status })}>Save</Button></div><Select value={issue.status} onValueChange={(value) => { if (typeof value === "string") onUpdate(issue.id, { status: value as IssueStatus }) }}><SelectTrigger className="h-8 w-full text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Action planned">Action planned</SelectItem><SelectItem value="Resolved">Resolved</SelectItem></SelectContent></Select></div>}
      {!canManage && issue.status === "Action planned" && <Button variant="outline" size="sm" className="cursor-pointer" onClick={onResolve}><Check className="size-3.5" />Mark resolved</Button>}</div></article>
}

function MaterialCard({ request, canManage, canRecordUsage, usageDraft, usageError, onUsageDraftChange, onSaveUsage, onStatusChange }: { request: MaterialRequest; canManage: boolean; canRecordUsage: boolean; usageDraft: string; usageError?: string; onUsageDraftChange: (value: string) => void; onSaveUsage: () => void; onStatusChange: (status: MaterialStatus) => void }) {
  const allotted = request.allottedQuantity ?? 0
  const used = request.usedQuantity ?? 0
  const remaining = Math.max(0, allotted - used)
  return <article className="space-y-4 p-4 transition-colors hover:bg-slate-50/70 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><Package className="size-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="text-[10px]">{request.id}</Badge><WorkflowStatus status={request.status} /><Badge variant={request.priority === "Urgent" ? "destructive" : "secondary"} className="text-[10px]">{request.priority}</Badge></div><h4 className="mt-2 text-sm font-semibold text-slate-800">{request.item}</h4><p className="mt-1 text-[11px] text-slate-500">{request.project} · Requested by {request.requestedBy} · Needed by {request.requiredBy}</p><p className="mt-1 text-[11px] text-slate-500">Requested: {request.quantity} {request.unit}{request.note ? ` · ${request.note}` : ""}</p>{request.estimatedTotal !== undefined && <p className="mt-1 text-[11px] font-medium text-slate-700">Estimated total ₹{request.estimatedTotal.toLocaleString("en-IN")}{request.estimatedUnitCost !== undefined ? ` · ₹${request.estimatedUnitCost.toLocaleString("en-IN")} per ${request.unit}` : ""}</p>}</div></div>{canManage && <Select value={request.status} onValueChange={(value) => { if (typeof value === "string") onStatusChange(value as MaterialStatus) }}><SelectTrigger aria-label={`Material status for ${request.item}`} className="h-9 w-full text-xs sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Requested">Requested</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Ordered">Ordered</SelectItem><SelectItem value="Received">Received</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select>}</div>
    <div className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-3"><div><p className="text-[10px] text-slate-500">Total allotted</p><p className="mt-1 text-xs font-semibold text-slate-800">{allotted} {request.unit}</p></div><div><p className="text-[10px] text-slate-500">Used</p><p className="mt-1 text-xs font-semibold text-slate-800">{used} {request.unit}</p></div><div><p className="text-[10px] text-slate-500">Remaining</p><p className="mt-1 text-xs font-semibold text-teal-800">{remaining} {request.unit}</p></div></div>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><p className="text-[10px] text-slate-500">{request.status === "Received" ? "Material received for this project." : allotted > 0 ? "Quantity allocated to this project; delivery is still pending." : "No quantity allocated yet. Mark the request Received to start tracking stock."}</p>{canRecordUsage && allotted > 0 && request.status === "Received" && <div className="flex flex-wrap items-end gap-2"><Field label="Used to date"><Input aria-label={`Used quantity for ${request.item}`} type="number" min="0" max={allotted} step="0.01" value={usageDraft} onChange={(event) => onUsageDraftChange(event.target.value)} className="h-8 w-28 text-xs" /></Field><Button size="sm" variant="outline" className="h-8 cursor-pointer" onClick={onSaveUsage}>Save usage</Button>{usageError && <p role="alert" className="w-full text-[10px] text-rose-700">{usageError}</p>}</div>}</div>
  </article>
}

function QualityCard({ check, canManage, role, reworkDraft, reworkError, onReworkDraftChange, onRequestRework, onUpdate }: { check: QualityCheck; canManage: boolean; role: AppRole; reworkDraft: string; reworkError?: string; onReworkDraftChange: (value: string) => void; onRequestRework: () => void; onUpdate: (status: QualityStatus) => void }) {
  return <article className="p-4 transition-colors hover:bg-slate-50/70 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><ClipboardCheck className="size-4" /></span><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="text-[10px]">{check.id}</Badge><WorkflowStatus status={check.status} /><span className="text-[10px] text-slate-400">{check.requestedAt}</span></div><h4 className="mt-2 text-sm font-semibold text-slate-800">{check.activity}</h4><p className="mt-1 text-[11px] text-slate-500">{check.project} · {check.location} · Requested by {check.requestedBy}</p><p className="mt-2 text-xs leading-relaxed text-slate-600">{check.note}</p>{check.reworkNote && <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] text-rose-800"><b>Correction required:</b> {check.reworkNote}</p>}</div></div>
    <div className="flex w-full flex-col gap-2 lg:max-w-[360px]">{canManage && check.status === "Pending inspection" && <><div className="flex flex-wrap gap-2"><Button size="sm" className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700" onClick={() => onUpdate("Passed")}><Check className="size-3.5" />Pass inspection</Button><Button size="sm" variant="outline" className="cursor-pointer border-rose-200 text-rose-700 hover:bg-rose-50" onClick={onRequestRework}>Request rework</Button></div><textarea value={reworkDraft} onChange={(event) => onReworkDraftChange(event.target.value)} rows={2} placeholder="Describe the correction required before requesting rework" className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-700/15 aria-[invalid=true]:border-rose-500" aria-invalid={Boolean(reworkError)} /><FieldError message={reworkError} /></>}{!canManage && check.status === "Rework required" && <Button size="sm" className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700" onClick={() => onUpdate("Rework submitted")}><Wrench className="size-3.5" />Submit corrected work</Button>}{canManage && check.status === "Rework submitted" && <Button size="sm" className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700" onClick={() => onUpdate("Closed")}><CheckCircle2 className="size-3.5" />Verify and close</Button>}{canManage && check.status === "Passed" && <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => onUpdate("Closed")}>Close inspection</Button>}{check.status === "Closed" && <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="size-4" />Quality item closed</span>}{role === "engineer" && check.status === "Pending inspection" && <span className="text-[11px] text-slate-500">Waiting for PM inspection</span>}</div>
  </div></article>
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="grid justify-items-center px-6 py-12 text-center"><span className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">{icon}</span><h4 className="mt-3 text-sm font-semibold text-slate-800">{title}</h4><p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p></div>
}
