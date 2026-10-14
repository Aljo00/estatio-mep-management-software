"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Download, Search, UserPlus, Users2 } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Project, TeamMember, WorkAssignment } from "@/data/mock-data"
import { downloadCsv } from "@/lib/export-csv"

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="mt-1 text-[11px] font-medium text-rose-700">{message}</p> : null
}

export function TeamView({ members, projects, assignments, canManage, onAddMember }: { members: TeamMember[]; projects: Project[]; assignments: WorkAssignment[]; canManage: boolean; onAddMember: (member: Omit<TeamMember, "initials" | "projects" | "status">) => void }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [memberRole, setMemberRole] = useState<TeamMember["role"]>("Supervisor")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const visibleMembers = useMemo(() => members.filter((member) => `${member.name} ${member.role} ${member.email ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (roleFilter === "all" || member.role === roleFilter)), [members, roleFilter, search])
  const selectedProjects = selectedMember ? projects.filter((project) => [
    ...(project.managers?.length ? project.managers : [project.manager]),
    ...(project.engineers?.length ? project.engineers : [project.engineer]),
    ...(project.supervisors?.length ? project.supervisors : [project.supervisor]),
  ].includes(selectedMember.name)) : []
  const selectedAssignments = selectedMember ? assignments.filter((assignment) => assignment.engineer === selectedMember.name || assignment.supervisor === selectedMember.name) : []

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (name.trim().length < 2) nextErrors.name = "Enter a name with at least 2 characters."
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email address or leave it blank."
    if (members.some((member) => member.email?.toLowerCase() === email.trim().toLowerCase() && email.trim())) nextErrors.email = "This email is already in the demo directory."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onAddMember({ name: name.trim(), email: email.trim() || undefined, role: memberRole })
    setName("")
    setEmail("")
    setMemberRole("Supervisor")
    setDialogOpen(false)
  }

  function exportTeam() {
    downloadCsv("estatio-team-directory.csv", [["Name", "Role", "Email", "Projects", "Status"], ...visibleMembers.map((member) => [member.name, member.role, member.email ?? "", member.projects, member.status])])
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">People and teams</p><h2 className="text-xl font-semibold tracking-tight text-slate-900">Project teams</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">See who is responsible across sites and which daily assignments are in flight.</p></div><div className="flex gap-2"><Button variant="outline" className="cursor-pointer" onClick={exportTeam}><Download className="size-4" />Export list</Button>{canManage && <Button className="cursor-pointer bg-teal-800 text-white hover:bg-teal-700" onClick={() => setDialogOpen(true)}><UserPlus className="size-4" />Add member</Button>}</div></div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3"><TeamMetric label="People in directory" value={members.length} /><TeamMetric label="Supervisors on site" value={members.filter((member) => member.role === "Supervisor" && member.status === "On site").length} /><TeamMetric label="Teams with active work" value={new Set(assignments.map((assignment) => assignment.assignedTeam)).size} /></div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-[15px]">Team directory</CardTitle><CardDescription className="mt-1 text-xs">Select a person to view their projects and active work.</CardDescription></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative min-w-48"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><Input aria-label="Search team members" placeholder="Search people..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 pl-9 text-xs" /></div><Select value={roleFilter} onValueChange={(value) => { if (typeof value === "string") setRoleFilter(value) }}><SelectTrigger className="h-9 w-full bg-white text-xs sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{["Project Manager", "Engineer", "Supervisor", "Technician"].map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></div></CardHeader>
        <div className="overflow-x-auto"><Table className="min-w-[650px]"><TableHeader><TableRow className="border-slate-100"><TableHead className="pl-5 text-[10px] uppercase tracking-wider text-slate-400">Team member</TableHead><TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Role</TableHead><TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Active projects</TableHead><TableHead className="text-[10px] uppercase tracking-wider text-slate-400">Current status</TableHead><TableHead className="pr-5 text-right text-[10px] uppercase tracking-wider text-slate-400">Profile</TableHead></TableRow></TableHeader><TableBody>{visibleMembers.map((member) => <TableRow key={member.email ?? member.name} className="border-slate-100 transition-colors hover:bg-slate-50/70"><TableCell className="py-3 pl-5"><div className="flex items-center gap-3"><Avatar className="size-8"><AvatarFallback className="bg-teal-50 text-[10px] font-semibold text-teal-800">{member.initials}</AvatarFallback></Avatar><span><span className="block text-xs font-semibold text-slate-800">{member.name}</span>{member.email && <span className="mt-0.5 block text-[10px] text-slate-400">{member.email}</span>}</span></div></TableCell><TableCell><Badge variant="secondary" className="text-[10px]">{member.role}</Badge></TableCell><TableCell className="text-xs text-slate-600">{member.projects} projects</TableCell><TableCell><span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"><span className={`size-1.5 rounded-full ${member.status === "Available" ? "bg-emerald-500" : member.status === "On site" ? "bg-blue-500" : "bg-slate-400"}`} />{member.status}</span></TableCell><TableCell className="pr-5 text-right"><Button variant="ghost" size="sm" className="h-7 cursor-pointer text-[11px] text-teal-800" onClick={() => setSelectedMember(member)}>View profile</Button></TableCell></TableRow>)}{visibleMembers.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center text-sm text-slate-500">No team members match this search.</TableCell></TableRow>}</TableBody></Table></div><div className="flex justify-between border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400"><span>Showing {visibleMembers.length} of {members.length} people</span><span>Demo directory</span></div></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Add a team member</DialogTitle><DialogDescription>Add a person to the demo directory so they can be selected for site work.</DialogDescription></DialogHeader><form noValidate onSubmit={submitMember} className="space-y-3 py-1"><label className="block space-y-1.5 text-xs font-medium text-slate-700">Full name<Input value={name} aria-invalid={Boolean(errors.name)} onChange={(event) => setName(event.target.value)} placeholder="e.g. Anjali R." className="h-9" /><FieldError message={errors.name} /></label><label className="block space-y-1.5 text-xs font-medium text-slate-700">Email <span className="font-normal text-slate-400">(optional)</span><Input type="email" value={email} aria-invalid={Boolean(errors.email)} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="h-9" /><FieldError message={errors.email} /></label><div className="space-y-1.5"><p className="text-xs font-medium text-slate-700">Role</p><Select value={memberRole} onValueChange={(value) => { if (typeof value === "string") setMemberRole(value as TeamMember["role"]) }}><SelectTrigger className="h-9 w-full bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Project Manager">Project Manager</SelectItem><SelectItem value="Engineer">Engineer</SelectItem><SelectItem value="Supervisor">Supervisor</SelectItem><SelectItem value="Technician">Technician</SelectItem></SelectContent></Select></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Add to directory</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={Boolean(selectedMember)} onOpenChange={(open) => { if (!open) setSelectedMember(null) }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><div className="flex items-center gap-3"><Avatar className="size-11"><AvatarFallback className="bg-teal-50 font-semibold text-teal-800">{selectedMember?.initials}</AvatarFallback></Avatar><div><DialogTitle>{selectedMember?.name}</DialogTitle><DialogDescription>{selectedMember?.role}{selectedMember?.email ? ` · ${selectedMember.email}` : ""}</DialogDescription></div></div></DialogHeader><div className="space-y-4"><div><p className="mb-2 text-xs font-semibold text-slate-700">Assigned projects</p>{selectedProjects.length ? <div className="space-y-2">{selectedProjects.map((project) => <div key={project.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><span><span className="block text-xs font-semibold text-slate-700">{project.name}</span><span className="mt-1 block text-[10px] text-slate-400">{project.code} · {project.location}</span></span><Badge variant="outline" className="text-[10px]">{project.health}</Badge></div>)}</div> : <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No project assignment yet.</p>}</div><div><p className="mb-2 text-xs font-semibold text-slate-700">Current work assignments</p>{selectedAssignments.length ? <div className="space-y-2">{selectedAssignments.map((assignment) => <div key={assignment.id} className="rounded-lg border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-700">{assignment.activity}</p><p className="mt-1 text-[10px] text-slate-500">{assignment.project} · {assignment.completedQty}/{assignment.target} {assignment.unit} complete</p></div>)}</div> : <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No current day assignments.</p>}</div></div><DialogFooter><Button variant="outline" onClick={() => setSelectedMember(null)}>Close</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}

function TeamMetric({ label, value }: { label: string; value: number }) {
  return <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><Users2 className="size-4" /></span><span><span className="block text-[10px] font-medium text-slate-500">{label}</span><span className="mt-0.5 block text-xl font-semibold tabular-nums text-slate-900">{value}</span></span></CardContent></Card>
}
