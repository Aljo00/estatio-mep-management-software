"use client";

import { useMemo, useState } from "react";
import { Activity, BadgeCheck, Building2, Check, ClipboardList, FileDown, FileText, PackageCheck, Printer, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";

type ReportSection = "summary" | "progress" | "schedule" | "boq" | "materials" | "updates" | "additionalWorks" | "financials";
type ProjectReportProject = {
  id: string;
  name: string;
  client: string;
  contactName: string;
  email: string;
  phone: string;
  budget: number;
  pm: string;
  progress?: number;
  plannedProgress?: number;
  dueDate?: string;
  health?: string;
  isDemo?: boolean;
  boqStatus: string;
  handoverStatus: string;
};
type ProjectReportBoqLine = {
  id: string;
  item: string;
  section: string;
  quantity: string;
  unit: string;
  unitCost: string;
  workEstimate: string;
  status: string;
  startDate: string;
  endDate: string;
};
type ProjectReportMaterial = {
  id: string;
  source: string;
  requestedDate: string;
  status: string;
  items: { material: string; unit: string; quantity: string; approvedQuantity?: string; wantedDate: string }[];
};
type ProjectReportDaily = { id: string; date: string; progress: string; quantity: string; status: string };
type ProjectReportAdditionalWork = { id: string; title: string; supervisor: string; quantity: string; unit: string; startDate: string; endDate: string; status: string; description: string };
type ProjectReportFinance = { estimate: number; approved: number; pending: number };

type ProjectReportsProps = {
  project: ProjectReportProject;
  preparedBy: string;
  today: string;
  boqLines: ProjectReportBoqLine[];
  materialRequests: ProjectReportMaterial[];
  dailyReports: ProjectReportDaily[];
  additionalWorks: ProjectReportAdditionalWork[];
  finance: ProjectReportFinance;
};

const reportSections: { id: ReportSection; title: string; detail: string; icon: typeof FileText; clientSafe: boolean }[] = [
  { id: "summary", title: "Project & customer details", detail: "Project identity, customer contact, and report period", icon: Building2, clientSafe: true },
  { id: "progress", title: "Work progress", detail: "Reported completion compared with plan", icon: Activity, clientSafe: true },
  { id: "schedule", title: "Schedule & milestones", detail: "Planned dates and current work status", icon: ClipboardList, clientSafe: true },
  { id: "boq", title: "BOQ quantities", detail: "Approved scope and quantity baseline", icon: FileText, clientSafe: true },
  { id: "materials", title: "Materials", detail: "Requested quantities and procurement progress", icon: PackageCheck, clientSafe: true },
  { id: "updates", title: "Site updates", detail: "Daily notes, quantities, and review state", icon: BadgeCheck, clientSafe: true },
  { id: "additionalWorks", title: "Additional works", detail: "Out of BOQ activities and assignments", icon: ClipboardList, clientSafe: true },
  { id: "financials", title: "Financial summary", detail: "Budget, estimate, and approved spend", icon: WalletCards, clientSafe: false },
];

function formatDate(value: string) {
  if (!value) return "Not set";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? "Not set" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>;
}

export function ProjectReports({ project, preparedBy, today, boqLines, materialRequests, dailyReports, additionalWorks, finance }: ProjectReportsProps) {
  const [audience, setAudience] = useState<"internal" | "client">("internal");
  const [fromDate, setFromDate] = useState(`${today.slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(today);
  const [selected, setSelected] = useState<ReportSection[]>(reportSections.map(({ id }) => id));
  const validRange = Boolean(fromDate && toDate && fromDate <= toDate);
  const sections = reportSections.filter((section) => selected.includes(section.id) && (audience === "internal" || section.clientSafe));
  const selectedDates = useMemo(() => ({
    daily: dailyReports.filter((report) => report.date >= fromDate && report.date <= toDate).sort((a, b) => b.date.localeCompare(a.date)),
    materials: materialRequests.filter((request) => request.requestedDate >= fromDate && request.requestedDate <= toDate),
  }), [dailyReports, fromDate, materialRequests, toDate]);
  const selectedWorks = additionalWorks.filter((work) => (!work.startDate || work.startDate <= toDate) && (!work.endDate || work.endDate >= fromDate));
  const lowSide = boqLines.filter((line) => line.section === "Low Side");
  const requestedMaterials = selectedDates.materials.flatMap((request) => request.items.map((item) => ({ ...item, group: request.id, status: request.status, source: request.source })));
  const completedLines = lowSide.filter((line) => line.status === "Complete").length;
  const planned = project.plannedProgress ?? 0;
  const progress = project.progress ?? 0;
  const isAhead = progress >= planned;

  function toggleSection(id: ReportSection) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function selectAll() {
    setSelected(reportSections.filter((section) => audience === "internal" || section.clientSafe).map(({ id }) => id));
  }

  function changeAudience(value: "internal" | "client") {
    setAudience(value);
    if (value === "client") setSelected((current) => current.filter((id) => reportSections.find((section) => section.id === id)?.clientSafe));
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800">Project reporting</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Build a project report</h2><p className="mt-1 text-xs text-slate-500">Choose the audience and sections. The preview updates as you make changes.</p></div>
      <Button type="button" onClick={() => window.print()} disabled={!validRange || sections.length === 0} className="bg-teal-800 text-white hover:bg-teal-700"><FileDown className="size-4" />Download PDF</Button>
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(310px,0.78fr)_minmax(500px,1.22fr)]">
      <div className="space-y-4">
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
          <CardHeader className="border-b border-slate-100 pb-3"><CardTitle className="text-sm">Report setup</CardTitle><p className="text-[10px] text-slate-500">Start with the audience and reporting period.</p></CardHeader>
          <CardContent className="space-y-4 p-4">
            <div><p className="mb-2 text-[10px] font-semibold text-slate-700">Report audience</p><div className="grid grid-cols-2 gap-2" role="group" aria-label="Report audience">{(["internal", "client"] as const).map((item) => <button key={item} type="button" aria-pressed={audience === item} onClick={() => changeAudience(item)} className={`rounded-lg border px-3 py-2.5 text-left transition ${audience === item ? "border-teal-700 bg-teal-50 text-teal-950 ring-1 ring-teal-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><span className="block text-xs font-semibold">{item === "internal" ? "Internal" : "Client update"}</span><span className="mt-1 block text-[9px] text-slate-500">{item === "internal" ? "Includes selected financial details" : "Client-safe project information"}</span></button>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-2"><div><p className="mb-1.5 text-[10px] font-semibold text-slate-700">From</p><DatePicker value={fromDate} onValueChange={setFromDate} ariaLabel="Report start date" /></div><div><p className="mb-1.5 text-[10px] font-semibold text-slate-700">To</p><DatePicker value={toDate} onValueChange={setToDate} ariaLabel="Report end date" /></div></div>
            {!validRange && <p role="alert" className="text-[10px] font-medium text-rose-700">Choose a valid date range. The start date must be before the end date.</p>}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
          <CardHeader className="flex flex-row items-start justify-between border-b border-slate-100 pb-3"><div><CardTitle className="text-sm">Report contents</CardTitle><p className="mt-1 text-[10px] text-slate-500">Select only the sections you need.</p></div><Button type="button" size="sm" variant="outline" onClick={selectAll}>Select all</Button></CardHeader>
          <CardContent className="space-y-1 p-2">{reportSections.map(({ id, title, detail, icon: Icon, clientSafe }) => {
            const checked = selected.includes(id) && (audience === "internal" || clientSafe);
            const disabled = audience === "client" && !clientSafe;
            return <button key={id} type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={() => toggleSection(id)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition ${checked ? "bg-teal-50/70" : "hover:bg-slate-50"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}><span className={`grid size-5 shrink-0 place-items-center rounded border ${checked ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-transparent"}`}><Check className="size-3.5" /></span><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold text-slate-800">{title}{!clientSafe && <span className="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-slate-600">Internal</span>}</span><span className="mt-0.5 block text-[9px] text-slate-500">{detail}</span></span></button>;
          })}</CardContent>
        </Card>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[10px] text-slate-600"><span>{sections.length} sections selected</span><Button type="button" variant="outline" size="sm" disabled={!validRange || sections.length === 0} onClick={() => window.print()}><Printer className="size-3.5" />Print / Save PDF</Button></div>
      </div>

      <section aria-label="Live report preview" className="min-w-0">
        <div className="mb-2 flex items-center justify-between px-1"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Live preview</p><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-500" />Ready to export</span></div>
        <article id="report-preview" className="report-preview min-h-[680px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-6 py-6 text-white sm:px-8 sm:py-8">
            <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-lg bg-teal-700"><Building2 className="size-5" /></span><span><b className="block text-sm tracking-tight">estatio<span className="text-teal-300">.</span></b><small className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">MEP operations</small></span></div><span className="rounded-full border border-white/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-200">{audience === "internal" ? "Internal report" : "Client update"}</span></div>
            <p className="mt-8 text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-300">Project report</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1><p className="mt-2 text-xs text-slate-300">{project.client} <span className="mx-1.5 text-slate-500">·</span>{project.id}</p>
            <div className="mt-6 grid gap-3 border-t border-white/15 pt-4 text-[10px] sm:grid-cols-3"><div><p className="text-slate-400">Reporting period</p><p className="mt-1 font-medium text-white">{formatDate(fromDate)} — {formatDate(toDate)}</p></div><div><p className="text-slate-400">Prepared by</p><p className="mt-1 font-medium text-white">{preparedBy} · Super Admin</p></div><div><p className="text-slate-400">Generated</p><p className="mt-1 font-medium text-white">{formatDate(today)}</p></div></div>
          </div>
          <div className="space-y-6 px-5 py-5 sm:px-8 sm:py-7">
            {sections.length === 0 && <div className="grid min-h-56 place-items-center text-center"><div><ClipboardList className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Choose report sections</p><p className="mt-1 text-xs text-slate-500">Your selected project information will appear here.</p></div></div>}
            {sections.map(({ id, title }) => <section key={id} className="report-section break-inside-avoid">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">{title}</h2><span className="h-px flex-1" /></div>
              {id === "summary" && <div className="grid gap-2 sm:grid-cols-2">{[["Customer", project.client], ["Customer contact", project.contactName || "Not provided"], ["Email", project.email || "Not provided"], ["Phone", project.phone || "Not provided"], ["Project Manager", project.pm], ["Project status", project.handoverStatus], ["BOQ status", project.boqStatus], ["Report period", `${formatDate(fromDate)} — ${formatDate(toDate)}`]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-[9px] text-slate-500">{label}</p><p className="mt-1 text-[10px] font-semibold text-slate-800">{value}</p></div>)}</div>}
              {id === "progress" && <div className="grid gap-3 sm:grid-cols-3"><Metric label="Measured progress" value={`${progress}%`} detail={`${isAhead ? "At or ahead of" : "Behind"} plan`} /><Metric label="Planned progress" value={`${planned}%`} detail="Project plan" /><Metric label="Work lines complete" value={`${completedLines} / ${lowSide.length}`} detail="Low Side BOQ" /></div>}
              {id === "schedule" && <div className="space-y-2">{lowSide.map((line) => <div key={line.id} className="grid gap-2 rounded-lg border border-slate-100 px-3 py-2 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center"><div><p className="text-[10px] font-semibold text-slate-800">{line.item}</p><p className="mt-0.5 text-[9px] text-slate-500">{line.quantity || "Qty pending"} {line.unit}</p></div><p className="text-[9px] text-slate-500">{formatDate(line.startDate)} — {formatDate(line.endDate)}</p><span className="w-fit rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">{line.status}</span></div>)}{project.dueDate && <p className="pt-1 text-[10px] text-slate-500">Project due date: <b className="text-slate-700">{formatDate(project.dueDate)}</b></p>}</div>}
              {id === "boq" && <div className="overflow-x-auto"><table className="w-full min-w-[400px] text-left"><thead><tr className="border-b border-slate-200 text-[8px] uppercase tracking-wide text-slate-500"><th className="py-2 pr-2">Scope item</th><th className="px-2 py-2 text-right">Quantity</th><th className="px-2 py-2 text-right">Unit</th><th className="px-2 py-2 text-right">Status</th></tr></thead><tbody>{boqLines.filter((line) => line.section !== "Finalization & Handover").map((line) => <tr key={line.id} className="border-b border-slate-100 text-[9px]"><td className="py-2 pr-2 font-medium text-slate-800">{line.item}<span className="ml-1.5 text-slate-400">{line.section}</span></td><td className="px-2 py-2 text-right tabular-nums">{line.quantity || "—"}</td><td className="px-2 py-2 text-right">{line.unit || "—"}</td><td className="px-2 py-2 text-right">{line.status}</td></tr>)}</tbody></table></div>}
              {id === "materials" && <div className="space-y-2">{requestedMaterials.map((item, index) => <div key={`${item.group}-${index}`} className="grid gap-2 rounded-lg bg-slate-50 px-3 py-2 sm:grid-cols-[1.5fr_0.7fr_0.7fr_1fr] sm:items-center"><div><p className="text-[10px] font-semibold text-slate-800">{item.material}</p><p className="text-[8px] text-slate-500">{item.source} · {item.group}</p></div><p className="text-[9px] text-slate-600">Requested <b>{item.quantity} {item.unit}</b>{audience === "internal" && item.approvedQuantity ? ` · Approved ${item.approvedQuantity}` : ""}</p><p className="text-[9px] text-slate-600">Needed {formatDate(item.wantedDate)}</p><span className={`w-fit rounded-full px-2 py-1 text-[8px] font-semibold ${audience === "client" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"}`}>{audience === "client" ? (item.status === "Received" ? "Received" : "In procurement") : item.status}</span></div>)}{requestedMaterials.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500">No material requests were submitted during this reporting period.</p>}</div>}
              {id === "updates" && <div className="space-y-2">{selectedDates.daily.map((report) => <div key={report.id} className="rounded-lg border border-slate-100 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[9px] font-semibold text-slate-700">{formatDate(report.date)}{report.quantity ? ` · ${report.quantity}` : ""}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-600">{audience === "client" ? (report.status === "Verified" ? "Verified" : "Under review") : report.status}</span></div><p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">{report.progress}</p></div>)}{selectedDates.daily.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500">No site updates were recorded during this reporting period.</p>}</div>}
              {id === "additionalWorks" && <div className="space-y-2">{selectedWorks.map((work) => <div key={work.id} className="rounded-lg bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-semibold text-slate-800">{work.title}</p><span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold text-slate-600">{work.status}</span></div><p className="mt-1 text-[9px] text-slate-500">Supervisor {work.supervisor}{work.quantity ? ` · ${work.quantity} ${work.unit}` : ""} · {formatDate(work.startDate)} — {formatDate(work.endDate)}</p>{work.description && <p className="mt-1.5 text-[9px] leading-relaxed text-slate-600">{work.description}</p>}</div>)}{selectedWorks.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500">No additional works fall within this reporting period.</p>}</div>}
              {id === "financials" && audience === "internal" && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Budget" value={money(project.budget)} detail="Approved allocation" /><Metric label="BOQ estimate" value={money(finance.estimate)} detail="Priced scope lines" /><Metric label="Approved spend" value={money(finance.approved)} detail="Approved purchases" /><Metric label="Pending bills" value={money(finance.pending)} detail="Awaiting review" /></div>}
            </section>)}
            {sections.length > 0 && <footer className="border-t border-slate-200 pt-3 text-[8px] text-slate-400"><div className="flex items-center justify-between gap-3"><span>Prepared by {preparedBy} · Estatio MEP Operations</span><span>{project.isDemo ? "Illustrative demo data" : "Project report"}</span></div><p className="mt-1">This report reflects project records available as of {formatDate(today)}.</p></footer>}
          </div>
        </article>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[9px] text-slate-400"><Printer className="size-3" />Download opens your print dialog. Choose “Save as PDF” to save or share a PDF copy.</p>
      </section>
    </div>
  </div>;
}
