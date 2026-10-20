"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  HardHat,
  Activity,
  AlertCircle,
  Search,
  UsersRound,
  Trash2,
  MessageCircle,
  Mic,
  PackageCheck,
  Plus,
  Send,
  ShieldCheck,
  ShoppingCart,
  Square,
  RotateCcw,
  WalletCards,
  Users,
  Wrench,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  WorkflowCosts,
  type WorkflowCostLine,
  type WorkflowProgressRecord,
  type WorkflowSpendRecord,
} from "@/components/workflow-costs";
import { ProjectReports } from "@/components/project-reports";

type Role = "superadmin" | "pm" | "engineer" | "supervisor" | "purchase";
type Page = "overview" | "projects" | "people" | "boq" | "work" | "additional-materials" | "additional-works" | "procurement" | "engineer-review" | "purchase-approval" | "local-purchases" | "costs" | "project-costs" | "handover" | "reports";
type BoqSection = "High Side" | "Low Side" | "Finalization & Handover";
type BoqLine = {
  id: string;
  projectId: string;
  section: BoqSection;
  item: string;
  quantity: string;
  unit: string;
  unitCost: string;
  workEstimate: string;
  duration: string;
  startDate: string;
  endDate: string;
  status: string;
};
type Project = {
  id: string;
  name: string;
  client: string;
  contactName: string;
  email: string;
  phone: string;
  budget: number;
  pm: string;
  isDemo?: boolean;
  boqStatus: "Draft" | "Pending PM approval" | "Approved";
  handoverStatus: "In progress" | "Ready for handover" | "Handed over";
  progress?: number;
  plannedProgress?: number;
  dueDate?: string;
  health?: "On track" | "At risk" | "Needs attention";
  forecast?: number;
};
type TeamMember = { id: string; name: string; email: string; role: Role; project: string };
type WorkPackage = {
  id: string;
  projectId: string;
  lineId: string;
  supervisor: string;
  engineer: string;
};
type MaterialRequestLine = {
  id: string;
  source: "BOQ" | "Additional";
  boqLineId?: string;
  material: string;
  unit: string;
  quantity: string;
  approvedQuantity?: string;
  wantedDate: string;
  reason: string;
  removed?: boolean;
};
type MaterialRequestGroup = {
  id: string;
  projectId: string;
  source: "BOQ" | "Additional";
  requestedBy: string;
  requestedDate: string;
  items: MaterialRequestLine[];
  status: "Pending PM review" | "Approved for purchase" | "Returned" | "Ordered" | "Received";
  reviewNote?: string;
};
type MaterialRequestDraftLine = Omit<MaterialRequestLine, "id" | "source" | "approvedQuantity" | "removed"> & { key: string };
type AdditionalWork = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  supervisor: string;
  quantity: string;
  unit: string;
  startDate: string;
  endDate: string;
  status: "Assigned" | "In progress" | "Complete";
};
type DailyReport = {
  id: string;
  projectId: string;
  packageId: string;
  date: string;
  progress: string;
  quantity: string;
  photos: string[];
  audio?: string;
  audioDuration?: number;
  status: "Pending engineer review" | "Verified" | "Returned";
  reviewNote?: string;
};
type ChatMessage = {
  id: string;
  projectId: string;
  packageId: string;
  author: string;
  role: Role;
  message: string;
  kind: "Message" | "Clearance request";
  resolved: boolean;
};
type LocalPurchase = {
  id: string;
  projectId: string;
  packageId: string;
  category: string;
  reason: string;
  amount: number;
  bill?: string;
  status: "Pending engineer approval" | "Approved" | "Returned";
};
type PurchaseOrder = {
  id: string;
  projectId: string;
  itemIds: string[];
  supplier: string;
  orderDate: string;
  expectedDate: string;
  receivedDate: string;
  bill?: string;
  amount: number;
  status: "Draft" | "Ordered" | "Received" | "Pending Super Admin approval" | "Approved" | "Returned";
  returnNote?: string;
};

const roleLabels: Record<Role, string> = {
  superadmin: "Super Admin",
  pm: "Project Manager",
  engineer: "Engineer",
  supervisor: "Supervisor",
  purchase: "Purchase Team",
};
const roleNames: Record<Role, string> = {
  superadmin: "Arun Menon",
  pm: "Rahul Nair",
  engineer: "Nikhil S.",
  supervisor: "Shameer K.",
  purchase: "Priya Menon",
};
const pageLabels: Record<Page, string> = {
  overview: "Overview",
  projects: "Projects",
  boq: "BOQ workspace",
  work: "Work packages",
  "additional-materials": "Materials",
  "additional-works": "Additional works",
  procurement: "Group orders",
  "engineer-review": "Engineer review",
  "purchase-approval": "Purchase approval",
  "local-purchases": "Local purchases",
  costs: "Portfolio costs",
  "project-costs": "Costs & productivity",
  handover: "Finalization & handover",
  reports: "Reports",
  people: "People & teams",
};

const mainProjectId = "EST-SHOBHA";
const secondProjectId = "EST-CALICUT";
const thirdProjectId = "EST-TRIVANDRUM";
const seedProjects: Project[] = [
  {
    id: mainProjectId,
    name: "SHOBHA 1152-1142",
    client: "sasikumar",
    contactName: "",
    email: "",
    phone: "",
    budget: 7_500_000,
    pm: roleNames.pm,
    isDemo: true,
    boqStatus: "Approved",
    handoverStatus: "In progress",
    progress: 68, plannedProgress: 72, dueDate: "2026-11-18", health: "On track", forecast: 7250000,
  },
  {
    id: secondProjectId,
    name: "Calicut Business Centre · HVAC Package",
    client: "CBC Properties",
    contactName: "Project Desk",
    email: "demo@cbc-properties.example",
    phone: "00000 00000",
    budget: 12_000_000,
    pm: "Meera Thomas",
    isDemo: true,
    boqStatus: "Approved",
    handoverStatus: "In progress",
    progress: 42, plannedProgress: 58, dueDate: "2026-12-02", health: "At risk", forecast: 11300000,
  },
  {
    id: thirdProjectId,
    name: "Trivandrum City Hospital · MEP Upgrade",
    client: "TCH Infrastructure",
    contactName: "Project Desk",
    email: "demo@tch-infrastructure.example",
    phone: "00000 00000",
    budget: 9_200_000,
    pm: roleNames.pm,
    isDemo: true,
    boqStatus: "Pending PM approval",
    handoverStatus: "In progress",
    progress: 81, plannedProgress: 78, dueDate: "2026-10-28", health: "On track", forecast: 8800000,
  },
];

const demoCostValues: Record<string, { quantity: number; unitCost?: number; workEstimate?: number }> = {
  H01: { quantity: 3, unitCost: 480000 },
  H02: { quantity: 18, unitCost: 8500 },
  H03: { quantity: 24, unitCost: 62000 },
  H04: { quantity: 24, unitCost: 1200 },
  H05: { quantity: 8, unitCost: 5600 },
  H06: { quantity: 40, unitCost: 850 },
  H07: { quantity: 15, unitCost: 5400 },
  H08: { quantity: 120, unitCost: 150 },
  H09: { quantity: 220, unitCost: 780 },
  H10: { quantity: 350, unitCost: 210 },
  H11: { quantity: 28, unitCost: 6500 },
  H12: { quantity: 25, unitCost: 2400 },
  L01: { quantity: 12, workEstimate: 36000 },
  L02: { quantity: 60, workEstimate: 180000 },
  L03: { quantity: 180, workEstimate: 234000 },
  L04: { quantity: 130, workEstimate: 84500 },
  L05: { quantity: 180, workEstimate: 288000 },
  L06: { quantity: 24, workEstimate: 36000 },
  L07: { quantity: 160, workEstimate: 144000 },
  L08: { quantity: 140, workEstimate: 112000 },
  L09: { quantity: 3, workEstimate: 45000 },
  L10: { quantity: 16, workEstimate: 96000 },
  L11: { quantity: 14, workEstimate: 98000 },
  L12: { quantity: 3, workEstimate: 135000 },
  L13: { quantity: 3, workEstimate: 84000 },
  L14: { quantity: 3, workEstimate: 72000 },
};

const mainProjectBoq: BoqLine[] = [
  ["H01", "High Side", "Procurement & delivery of VRF outdoor units", "", "units", "", "", "", "Awaiting supplier date"],
  ["H02", "High Side", "Acoustic insulation (open cell nitrile rubber)", "", "rolls", "", "2026-10-29", "2026-10-31", "Not ordered"],
  ["H03", "High Side", "Procurement & delivery of indoor units", "", "units", "", "2026-10-22", "2026-10-26", "Not ordered"],
  ["H04", "High Side", "Canvas connections", "", "pcs", "", "2026-10-26", "2026-10-30", "Not ordered"],
  ["H05", "High Side", "Wired remotes", "", "pcs", "", "2026-10-24", "2026-10-26", "Not ordered"],
  ["H06", "High Side", "Ruffnet joints (indoor)", "", "pcs", "", "2026-10-20", "2026-10-26", "Not ordered"],
  ["H07", "High Side", "Thermal insulation (9mm nitrile foam)", "", "rolls", "", "2026-10-17", "2026-10-19", "Not ordered"],
  ["H08", "High Side", "Drain pipe", "", "m", "", "2026-10-18", "2026-10-20", "Not ordered"],
  ["H09", "High Side", "VRF copper pipe", "", "m", "", "2026-10-17", "2026-10-19", "Not ordered"],
  ["H10", "High Side", "Electrical cable", "", "m", "", "2026-10-31", "2026-11-02", "Not ordered"],
  ["H11", "High Side", "Grilles & diffusers (linear / slotted)", "", "sets", "", "", "", "Awaiting supplier date"],
  ["H12", "High Side", "GI ducting sheet", "", "sheets", "", "2026-10-29", "2026-10-31", "Not ordered"],
  ["L01", "Low Side", "Core cutting", "", "locations", "3", "2026-10-14", "2026-10-17", "Not started"],
  ["L02", "Low Side", "Supports installation (threaded rods & slotted channels)", "", "supports", "17", "2026-10-18", "2026-11-04", "Not started"],
  ["L03", "Low Side", "Installation of refrigerant piping (copper)", "", "m", "23", "2026-10-20", "2026-11-12", "Not started"],
  ["L04", "Low Side", "Condensate drain piping (25/32/40mm)", "", "m", "16", "2026-10-29", "2026-11-14", "Not started"],
  ["L05", "Low Side", "GI ducting fabrication & installation (0.8mm)", "", "m²", "11", "2026-11-02", "2026-11-12", "Not started"],
  ["L06", "Low Side", "Canvas connections installation", "", "pcs", "11", "2026-11-03", "2026-11-13", "Not started"],
  ["L07", "Low Side", "Acoustic insulation (open cell nitrile rubber)", "", "m²", "11", "2026-11-04", "2026-11-14", "Not started"],
  ["L08", "Low Side", "Thermal insulation (9mm nitrile foam)", "", "m²", "11", "2026-11-05", "2026-11-15", "Not started"],
  ["L09", "Low Side", "Pressure testing", "", "systems", "3", "2026-11-10", "2026-11-12", "Not started"],
  ["L10", "Low Side", "Electrical & control cabling", "", "runs", "2", "2026-11-06", "2026-11-07", "Not started"],
  ["L11", "Low Side", "Grilles & diffusers (linear / slotted)", "", "sets", "", "", "", "Clearance required"],
  ["L12", "Low Side", "Testing & commissioning (complete system)", "", "systems", "", "", "", "Clearance required"],
  ["L13", "Low Side", "Refrigerant gas charging (R410A)", "", "systems", "", "", "", "Clearance required"],
  ["L14", "Low Side", "Outdoor unit installation", "", "units", "", "", "", "Clearance required"],
  ["F01", "Finalization & Handover", "System performance testing", "", "milestone", "", "", "", "Not started"],
  ["F02", "Finalization & Handover", "Client inspection & snag rectification", "", "milestone", "", "", "", "Not started"],
  ["F03", "Finalization & Handover", "Final commissioning & documentation", "", "milestone", "", "", "", "Not started"],
  ["F04", "Finalization & Handover", "Project handover", "", "milestone", "", "", "", "Not started"],
].map(([id, section, item, quantity, unit, duration, startDate, endDate, status]) => ({
  id,
  projectId: mainProjectId,
  section: section as BoqSection,
  item,
  quantity: demoCostValues[id]?.quantity ? String(demoCostValues[id].quantity) : quantity,
  unit,
  unitCost: demoCostValues[id]?.unitCost ? String(demoCostValues[id].unitCost) : "",
  workEstimate: demoCostValues[id]?.workEstimate ? String(demoCostValues[id].workEstimate) : "",
  duration,
  startDate,
  endDate,
  status: section === "High Side" ? "Not requested" : status,
}));

function cloneDemoBoq(projectId: string, idPrefix: string, costFactor: number): BoqLine[] {
  return mainProjectBoq.map((line) => ({
    ...line,
    id: `${idPrefix}-${line.id}`,
    projectId,
    status: line.section === "High Side" ? "Not requested" : line.status,
    unitCost: line.unitCost ? String(Math.round(Number(line.unitCost) * costFactor)) : "",
    workEstimate: line.workEstimate ? String(Math.round(Number(line.workEstimate) * costFactor)) : "",
  }));
}

function dateFromISO(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function addDaysToISO(value: string, days: number): string {
  const date = dateFromISO(value);
  if (!date || !Number.isInteger(days) || days < 1) return "";
  date.setDate(date.getDate() + days - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inclusiveDaysBetween(start: string, end: string): number | null {
  const startDate = dateFromISO(start);
  const endDate = dateFromISO(end);
  if (!startDate || !endDate || endDate < startDate) return null;
  return Math.round((Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) - Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) / 86400000) + 1;
}

const seedBoq: BoqLine[] = [
  ...mainProjectBoq,
  ...cloneDemoBoq(secondProjectId, "CBC", 1.12),
  ...cloneDemoBoq(thirdProjectId, "TCH", 0.94),
];

const seedPackages: WorkPackage[] = seedBoq
  .filter((line) => line.section === "Low Side")
  .map((line) => ({
    id: `WP-${line.id}`,
    projectId: line.projectId,
    lineId: line.id,
    supervisor: roleNames.supervisor,
    engineer: roleNames.engineer,
  }));

const seedMaterialRequests: MaterialRequestGroup[] = [
  { id: "MRG-SHB-BOQ-014", projectId: mainProjectId, source: "BOQ", requestedBy: roleNames.engineer, requestedDate: "2026-10-18", status: "Pending PM review", items: [
    { id: "SHB-014-1", source: "BOQ", boqLineId: "H01", material: "Procurement & delivery of VRF outdoor units", unit: "units", quantity: "3", wantedDate: "2026-10-25", reason: "Release the approved BOQ quantity for the next installation phase." },
    { id: "SHB-014-2", source: "BOQ", boqLineId: "H03", material: "Procurement & delivery of indoor units", unit: "units", quantity: "24", wantedDate: "2026-10-26", reason: "Needed for the first installation zone." },
  ] },
  { id: "MRG-SHB-BOQ-013", projectId: mainProjectId, source: "BOQ", requestedBy: roleNames.engineer, requestedDate: "2026-10-17", status: "Approved for purchase", items: [
    { id: "SHB-013-1", source: "BOQ", boqLineId: "H04", material: "Canvas connections", unit: "pcs", quantity: "24", approvedQuantity: "20", wantedDate: "2026-10-30", reason: "Required for the first duct connection works." },
    { id: "SHB-013-2", source: "BOQ", boqLineId: "H05", material: "Wired remotes", unit: "pcs", quantity: "8", approvedQuantity: "8", wantedDate: "2026-10-26", reason: "Required for the first batch of indoor units." },
  ] },
  { id: "MRG-SHB-BOQ-012", projectId: mainProjectId, source: "BOQ", requestedBy: roleNames.engineer, requestedDate: "2026-10-15", status: "Ordered", items: [
    { id: "SHB-012-1", source: "BOQ", boqLineId: "H08", material: "Drain pipe", unit: "m", quantity: "120", approvedQuantity: "120", wantedDate: "2026-10-20", reason: "Drain runs are ready for installation on site." },
  ] },
  { id: "MRG-SHB-ADD-006", projectId: mainProjectId, source: "Additional", requestedBy: roleNames.engineer, requestedDate: "2026-10-18", status: "Pending PM review", items: [
    { id: "SHB-006-1", source: "Additional", material: "Copper pipe fittings", unit: "pcs", quantity: "36", wantedDate: "2026-10-28", reason: "Extra elbows and reducers are needed for an as-built route change outside the BOQ." },
    { id: "SHB-006-2", source: "Additional", material: "Refrigerant gas R410A", unit: "cylinders", quantity: "4", wantedDate: "2026-11-04", reason: "A top-up is needed after the approved pressure test." },
  ] },
  { id: "MRG-SHB-ADD-005", projectId: mainProjectId, source: "Additional", requestedBy: roleNames.engineer, requestedDate: "2026-10-16", status: "Approved for purchase", items: [
    { id: "SHB-005-1", source: "Additional", material: "Fire-rated sealant", unit: "tubes", quantity: "18", approvedQuantity: "15", wantedDate: "2026-10-30", reason: "Extra sealing is required around service penetrations." },
  ] },
  { id: "MRG-CBC-BOQ-008", projectId: secondProjectId, source: "BOQ", requestedBy: "Akhil P.", requestedDate: "2026-10-18", status: "Pending PM review", items: [
    { id: "CBC-008-1", source: "BOQ", boqLineId: "CBC-H02", material: "Acoustic insulation (open cell nitrile rubber)", unit: "rolls", quantity: "20", wantedDate: "2026-10-31", reason: "Release the first floor material lot against the approved BOQ." },
    { id: "CBC-008-2", source: "BOQ", boqLineId: "CBC-H04", material: "Canvas connections", unit: "pcs", quantity: "30", wantedDate: "2026-10-30", reason: "Required for the first duct connection batch." },
  ] },
  { id: "MRG-CBC-BOQ-007", projectId: secondProjectId, source: "BOQ", requestedBy: "Akhil P.", requestedDate: "2026-10-16", status: "Approved for purchase", items: [
    { id: "CBC-007-1", source: "BOQ", boqLineId: "CBC-H05", material: "Wired remotes", unit: "pcs", quantity: "10", approvedQuantity: "10", wantedDate: "2026-10-29", reason: "Needed before indoor-unit commissioning." },
  ] },
  { id: "MRG-CBC-ADD-004", projectId: secondProjectId, source: "Additional", requestedBy: "Akhil P.", requestedDate: "2026-10-15", status: "Ordered", items: [
    { id: "CBC-004-1", source: "Additional", material: "Flexible duct connectors", unit: "pcs", quantity: "12", approvedQuantity: "12", wantedDate: "2026-10-27", reason: "Site measurement found four additional branch connections." },
  ] },
  { id: "MRG-TCH-ADD-003", projectId: thirdProjectId, source: "Additional", requestedBy: "Sana K.", requestedDate: "2026-10-18", status: "Pending PM review", items: [
    { id: "TCH-003-1", source: "Additional", material: "Fire-rated sealant", unit: "tubes", quantity: "18", wantedDate: "2026-10-30", reason: "Additional sealing is required around penetrations in the occupied ward area." },
    { id: "TCH-003-2", source: "Additional", material: "Access panel 450 × 450 mm", unit: "pcs", quantity: "6", wantedDate: "2026-11-01", reason: "Required at service points identified during the ceiling coordination walk." },
  ] },
];

const seedOrders: PurchaseOrder[] = [
  {
    id: "PO-SHB-024",
    projectId: mainProjectId,
    itemIds: ["H02", "H03", "H07"],
    supplier: "CoolAir MEP Supplies",
    orderDate: "2026-10-10",
    expectedDate: "2026-10-19",
    receivedDate: "2026-10-17",
    bill: "shobha-group-bill-024.pdf",
    amount: 1240000,
    status: "Approved",
  },
  {
    id: "PO-CBC-118",
    projectId: secondProjectId,
    itemIds: ["CBC-H01", "CBC-H03"],
    supplier: "AeroTech HVAC",
    orderDate: "2026-10-12",
    expectedDate: "2026-10-22",
    receivedDate: "2026-10-17",
    bill: "cbc-invoice-118.pdf",
    amount: 860000,
    status: "Pending Super Admin approval",
  },
  {
    id: "PO-TCH-070",
    projectId: thirdProjectId,
    itemIds: ["TCH-H02", "TCH-H09"],
    supplier: "Southern Pipe & Insulation Co.",
    orderDate: "2026-10-14",
    expectedDate: "2026-10-24",
    receivedDate: "2026-10-17",
    bill: "tch-invoice-070.pdf",
    amount: 530000,
    status: "Received",
  },
];

const seedLocalPurchases: LocalPurchase[] = [
  { id: "LOCAL-SHB-041", projectId: mainProjectId, packageId: "WP-L02", category: "Labour", reason: "Short-term scaffold hire for ceiling-level supports", amount: 36000, bill: "scaffold-hire-041.pdf", status: "Approved" },
  { id: "LOCAL-CBC-016", projectId: secondProjectId, packageId: "WP-CBC-L03", category: "Materials", reason: "Copper pipe fittings required to keep the active work front moving", amount: 48200, bill: "copper-fittings-016.pdf", status: "Pending engineer approval" },
  { id: "LOCAL-TCH-009", projectId: thirdProjectId, packageId: "WP-TCH-L04", category: "Other", reason: "Temporary protection and consumables for occupied hospital areas", amount: 18500, bill: "site-consumables-009.pdf", status: "Approved" },
];

const seedDailyReports: DailyReport[] = [
  { id: "DAY-SHB-20261016", projectId: mainProjectId, packageId: "WP-L03", date: "2026-10-16", progress: "Installed the first pipe run and completed pressure-joint checks on the east wing.", quantity: "42 m completed", photos: ["east-wing-pipe-run.jpg", "joint-check.jpg"], audio: "demo-recording", audioDuration: 46, status: "Verified" },
  { id: "DAY-CBC-20261017", projectId: secondProjectId, packageId: "WP-CBC-L02", date: "2026-10-17", progress: "Fixed threaded supports on grid lines C to F; north corridor remains clear for ceiling works.", quantity: "18 supports completed", photos: ["cbc-supports-grid-c.jpg"], audio: "demo-recording", audioDuration: 38, status: "Pending engineer review" },
  { id: "DAY-TCH-20261017", projectId: thirdProjectId, packageId: "WP-TCH-L01", date: "2026-10-17", progress: "Completed core cutting in the service zone after clearance from the hospital facilities team.", quantity: "4 locations completed", photos: ["tch-service-zone.jpg"], audio: "demo-recording", audioDuration: 52, status: "Verified" },
];

const rolesPages: Record<Role, Page[]> = {
  superadmin: ["overview", "projects", "people", "purchase-approval", "costs"],
  pm: ["overview", "projects", "costs"],
  engineer: ["overview", "projects"],
  supervisor: ["overview", "projects"],
  purchase: ["overview", "projects"],
};

const projectPages: Record<Role, Page[]> = {
  superadmin: ["boq", "work", "additional-materials", "additional-works", "project-costs", "handover", "reports"],
  pm: ["boq", "work", "additional-materials", "additional-works", "project-costs", "handover"],
  engineer: ["boq", "work", "additional-materials", "additional-works", "engineer-review", "local-purchases", "project-costs", "handover"],
  supervisor: ["work", "additional-works", "local-purchases"],
  purchase: ["additional-materials"],
};

function formatDate(date: string) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function todayInIndiaISO() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function lowSideStatus(line: BoqLine) {
  if (line.status === "Clearance required" || line.status === "Complete") return line.status;
  return line.startDate && line.startDate <= todayInIndiaISO() ? "In progress" : "Not started";
}

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function boqEstimate(line: BoqLine): number | null {
  if (line.section === "High Side") {
    if (!line.quantity || !line.unitCost) return null;
    const estimate = Number(line.quantity) * Number(line.unitCost);
    return Number.isFinite(estimate) ? estimate : null;
  }
  if (line.section === "Low Side" && line.workEstimate.trim()) {
    const estimate = Number(line.workEstimate);
    return Number.isFinite(estimate) ? estimate : null;
  }
  return null;
}

function statusStyle(status: string) {
  if (["Verified", "Approved", "Approved for purchase", "Handed over", "Received"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["Pending engineer review", "Pending engineer approval", "Pending PM approval", "Pending PM review", "Pending Super Admin approval", "Clearance required"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-800";
  if (["Returned", "Removed"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function Status({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyle(value)}`}>{value}</span>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-[11px] font-semibold text-slate-600">{label}{children}</label>;
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  if (props.type === "date" && typeof props.value === "string") {
    return (
      <DatePicker
        value={props.value}
        disabled={props.disabled}
        onValueChange={(value) => props.onChange?.({ target: { value } } as ChangeEvent<HTMLInputElement>)}
        className={props.className}
      />
    );
  }
  return <Input {...props} className={`h-9 min-w-0 bg-white text-xs ${props.className ?? ""}`} />;
}

type WorkflowSelectProps = {
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
};

function WorkflowSelect({ options, value, defaultValue, onValueChange, disabled, name, placeholder = "Select an option", ariaLabel, className }: WorkflowSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = value ?? internalValue;
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label;
  return (
    <Select
      value={selectedValue}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") {
          setInternalValue(nextValue);
          onValueChange?.(nextValue);
        }
      }}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger aria-label={ariaLabel} className={`h-9 w-full min-w-0 bg-white text-xs ${className ?? ""}`}>
        <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1><p className="mt-1 max-w-2xl text-xs text-slate-500">{description}</p></div>{action}</div>;
}

export function WorkflowApp() {
  const [role, setRole] = useState<Role>("pm");
  const [page, setPage] = useState<Page>("overview");
  const [todayLabel, setTodayLabel] = useState("Today");
  const [projects, setProjects] = useState(seedProjects);
  const [boqLines, setBoqLines] = useState(seedBoq);
  const [packages, setPackages] = useState(seedPackages);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestGroup[]>(seedMaterialRequests);
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWork[]>([]);
  const [dailyReports, setDailyReports] = useState(seedDailyReports);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localPurchases, setLocalPurchases] = useState(seedLocalPurchases);
  const [orders, setOrders] = useState(seedOrders);
  const [selectedProjectId, setSelectedProjectId] = useState(mainProjectId);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedBoqSection, setSelectedBoqSection] = useState<BoqSection>("High Side");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "U-001", name: "Arun Menon", email: "arun.menon@estatio.example", role: "superadmin", project: "All projects" },
    { id: "U-002", name: "Rahul Nair", email: "rahul.nair@estatio.example", role: "pm", project: "SHOBHA 1152-1142" },
    { id: "U-003", name: "Meera Thomas", email: "meera.thomas@estatio.example", role: "pm", project: "Calicut Business Centre" },
    { id: "U-004", name: "Nikhil S.", email: "nikhil@estatio.example", role: "engineer", project: "All projects" },
    { id: "U-005", name: "Shameer K.", email: "shameer@estatio.example", role: "supervisor", project: "SHOBHA 1152-1142" },
    { id: "U-006", name: "Priya Menon", email: "priya.menon@estatio.example", role: "purchase", project: "All projects" },
  ]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [boqAddOpen, setBoqAddOpen] = useState(false);
  const [boqStartDraft, setBoqStartDraft] = useState("");
  const [boqEndDraft, setBoqEndDraft] = useState("");
  const [boqDurationDraft, setBoqDurationDraft] = useState("");
  const [boqMaterialWantedDates, setBoqMaterialWantedDates] = useState<Record<string, string>>({});
  const [additionalMaterialSearch, setAdditionalMaterialSearch] = useState("");
  const [additionalMaterialStatusFilter, setAdditionalMaterialStatusFilter] = useState("All requests");
  const [materialSourceTab, setMaterialSourceTab] = useState<"BOQ materials" | "Additional materials">("BOQ materials");
  const [materialRequestModalOpen, setMaterialRequestModalOpen] = useState(false);
  const [materialDraftSource, setMaterialDraftSource] = useState<"BOQ" | "Additional">("BOQ");
  const [materialDraftLines, setMaterialDraftLines] = useState<MaterialRequestDraftLine[]>([]);
  const [additionalWorkStartDate, setAdditionalWorkStartDate] = useState("");
  const [additionalWorkEndDate, setAdditionalWorkEndDate] = useState("");
  const [boqRequiresClearance, setBoqRequiresClearance] = useState(false);
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [notice, setNoticeText] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [clearanceMessage, setClearanceMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [dailyDate, setDailyDate] = useState("2026-10-17");
  const [dailyProgress, setDailyProgress] = useState("");
  const [dailyQuantity, setDailyQuantity] = useState("");
  const [dailyPhotos, setDailyPhotos] = useState<string[]>([]);
  const [dailyAudio, setDailyAudio] = useState<{ url: string; duration: number } | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStartedAtRef = useRef(0);
  const audioTimerRef = useRef<number | null>(null);
  const discardAudioRef = useRef(false);
  const previousAudioProjectRef = useRef(selectedProjectId);
  const [purchaseCategory, setPurchaseCategory] = useState("Materials");
  const [purchaseReason, setPurchaseReason] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseBill, setPurchaseBill] = useState("");
  const [orderSupplier, setOrderSupplier] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [orderExpectedDate, setOrderExpectedDate] = useState("");
  const [orderReceivedDate, setOrderReceivedDate] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderBill, setOrderBill] = useState("");
  const [orderReturnNote, setOrderReturnNote] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTodayLabel(new Intl.DateTimeFormat("en-IN", {
        dateStyle: "full",
        timeZone: "Asia/Kolkata",
      }).format(new Date()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (previousAudioProjectRef.current === selectedProjectId) return;
    previousAudioProjectRef.current = selectedProjectId;
    const activeRecorder = recorderRef.current;
    discardAudioRef.current = activeRecorder?.state === "recording";
    if (discardAudioRef.current) activeRecorder?.stop();
    if (audioTimerRef.current !== null) window.clearInterval(audioTimerRef.current);
    audioTimerRef.current = null;
    setIsRecordingAudio(false);
    setDailyAudio((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setAudioSeconds(0);
  }, [selectedProjectId]);

  useEffect(() => {
    const syncScheduledWork = () => {
      const today = todayInIndiaISO();
      setBoqLines((current) => {
        let changed = false;
        const next = current.map((line) => {
          if (line.section !== "Low Side" || line.status === "Clearance required" || line.status === "Complete") return line;
          const scheduledStatus = line.startDate && line.startDate <= today ? "In progress" : "Not started";
          if (line.status === scheduledStatus) return line;
          changed = true;
          return { ...line, status: scheduledStatus };
        });
        return changed ? next : current;
      });
    };
    syncScheduledWork();
    const timer = window.setInterval(syncScheduledWork, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const personName = roleNames[role];
  const project = projects.find((item) => item.id === selectedProjectId) ?? projects[0];
  const projectLines = boqLines.filter((line) => line.projectId === project?.id);
  const projectPackages = packages.filter((workPackage) => workPackage.projectId === project?.id);
  const selectedPackage = projectPackages.find((workPackage) => workPackage.id === selectedPackageId);
  const selectedPackageLine = projectLines.find((line) => line.id === selectedPackage?.lineId);
  const selectedPackageReports = dailyReports.filter((report) => report.packageId === selectedPackageId).sort((a, b) => b.date.localeCompare(a.date));
  const selectedPackageMessages = messages.filter((message) => message.packageId === selectedPackageId);
  const visiblePages = rolesPages[role];
  const isProjectPage = projectPages[role].includes(page);
  const currentOrders = orders.filter((order) => order.projectId === project?.id);
  const selectedOrder = currentOrders.find((order) => order.id === selectedOrderId) ?? currentOrders[0];
  const openUpdateCount = dailyReports.filter((report) => report.status === "Pending engineer review").length;
  const openBillCount = localPurchases.filter((purchase) => purchase.status === "Pending engineer approval").length;
  const openOrderCount = orders.filter((order) => order.status === "Pending Super Admin approval").length;
  const projectOpenUpdateCount = dailyReports.filter((report) => report.projectId === project?.id && report.status === "Pending engineer review").length;
  const projectOpenBillCount = localPurchases.filter((purchase) => purchase.projectId === project?.id && purchase.status === "Pending engineer approval").length;

  function setNotice(message: string) {
    setNoticeError(false);
    setNoticeText(message);
  }

  function setValidationError(message: string) {
    setNoticeError(true);
    setNoticeText(message);
  }

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setSelectedPackageId(null);
    setNotice("");
  }

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setSelectedPackageId(null);
    setSelectedOrderId(null);
    setOrderSupplier("");
    setOrderDate("");
    setOrderExpectedDate("");
    setOrderReceivedDate("");
    setOrderAmount("");
    setOrderBill("");
    setPurchaseReason("");
    setPurchaseAmount("");
    setPurchaseBill("");
    setDailyProgress("");
    setDailyQuantity("");
    setDailyPhotos([]);
  }

  function openProject(projectId: string, initialPage?: Page) {
    selectProject(projectId);
    navigate(initialPage ?? projectPages[role][0]);
  }

  function getProjectCostData(targetProject: Project) {
    const lines = boqLines
      .filter((line) => line.projectId === targetProject.id && line.section !== "Finalization & Handover")
      .map((line): WorkflowCostLine => ({
        id: line.id,
        item: line.item,
        section: line.section as "High Side" | "Low Side",
        quantity: line.quantity,
        unit: line.unit,
        estimate: boqEstimate(line),
      }));
    const lineById = new Map(boqLines.filter((line) => line.projectId === targetProject.id).map((line) => [line.id, line]));
    const spendRecords: WorkflowSpendRecord[] = [
      ...orders.filter((order) => order.projectId === targetProject.id).map((order) => ({
        id: order.id,
        source: "Group order" as const,
        category: "Materials",
        description: `${order.id} · ${order.itemIds.map((id) => lineById.get(id)?.item).filter(Boolean).join(", ")}`,
        amount: order.amount,
        status: order.status,
        bill: order.bill,
      })),
      ...localPurchases.filter((purchase) => purchase.projectId === targetProject.id).map((purchase) => ({
        id: purchase.id,
        source: "Local purchase" as const,
        category: ["Materials", "Labour", "Other"].includes(purchase.category) ? purchase.category : "Other",
        description: purchase.reason,
        amount: purchase.amount,
        status: purchase.status,
        bill: purchase.bill,
      })),
    ];
    const progressRecords: WorkflowProgressRecord[] = dailyReports
      .filter((report) => report.projectId === targetProject.id)
      .map((report) => {
        const workPackage = packages.find((item) => item.id === report.packageId);
        return {
          id: report.id,
          date: formatDate(report.date),
          work: lineById.get(workPackage?.lineId ?? "")?.item ?? "Work package",
          quantity: report.quantity,
          progress: report.progress,
          status: report.status,
        };
      });
    return { lines, spendRecords, progressRecords };
  }

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    const nextPage = rolesPages[nextRole][0];
    setPage(nextPage);
    setSelectedPackageId(null);
    setSelectedOrderId(null);
    setSelectedBoqSection("High Side");
    setOrderSupplier("");
    setOrderDate("");
    setOrderExpectedDate("");
    setOrderReceivedDate("");
    setOrderAmount("");
    setOrderBill("");
    setNotice("");
  }

  function updateLine(id: string, key: keyof BoqLine, value: string) {
    setBoqLines((current) => current.map((line) => {
      if (line.id !== id) return line;
      const updated = { ...line, [key]: value };
      if (key === "duration") {
        const duration = Number(value);
        updated.endDate = updated.startDate && Number.isInteger(duration) && duration > 0 ? addDaysToISO(updated.startDate, duration) : "";
      } else if (key === "startDate") {
        const duration = Number(updated.duration);
        updated.endDate = value && Number.isInteger(duration) && duration > 0 ? addDaysToISO(value, duration) : "";
      } else if (key === "endDate") {
        const duration = inclusiveDaysBetween(updated.startDate, value);
        updated.duration = duration === null ? "" : String(duration);
      }
      if (updated.section === "Low Side" && key === "startDate" && updated.status !== "Clearance required" && updated.status !== "Complete") {
        const today = todayInIndiaISO();
        updated.status = value && value <= today ? "In progress" : "Not started";
      }
      return updated;
    }));
  }

  function openMaterialRequest(source: "BOQ" | "Additional") {
    setMaterialDraftSource(source);
    setMaterialDraftLines([{ key: `draft-${Date.now()}`, material: "", unit: source === "BOQ" ? "" : "pcs", quantity: "", wantedDate: "", reason: "" }]);
    setMaterialRequestModalOpen(true);
  }

  function addMaterialDraftLine() {
    setMaterialDraftLines((current) => [...current, { key: `draft-${Date.now()}-${current.length}`, material: "", unit: materialDraftSource === "BOQ" ? "" : "pcs", quantity: "", wantedDate: "", reason: "" }]);
  }

  function updateMaterialDraftLine(key: string, patch: Partial<MaterialRequestDraftLine>) {
    setMaterialDraftLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));
  }

  function selectBoqMaterial(key: string, boqLineId: string) {
    const boqLine = projectLines.find((line) => line.id === boqLineId);
    if (!boqLine) return;
    updateMaterialDraftLine(key, {
      boqLineId,
      material: boqLine.item,
      unit: boqLine.unit,
      quantity: boqLine.quantity,
      wantedDate: boqMaterialWantedDates[boqLine.id] ?? (boqLine.endDate >= todayInIndiaISO() ? boqLine.endDate : boqLine.startDate >= todayInIndiaISO() ? boqLine.startDate : ""),
    });
  }

  function submitMaterialRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    if (materialDraftSource === "BOQ" && project.boqStatus !== "Approved") {
      setValidationError("The BOQ must be approved before requesting its materials for purchase.");
      return;
    }
    if (!materialDraftLines.length) {
      setValidationError("Add at least one material to this request.");
      return;
    }
    for (const line of materialDraftLines) {
      if (!line.material.trim() || !line.unit.trim()) {
        setValidationError("Complete the material name and unit on every request line.");
        return;
      }
      if (!Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0) {
        setValidationError(`Enter a quantity greater than 0 for ${line.material}.`);
        return;
      }
      if (!line.wantedDate) {
        setValidationError(`Choose when ${line.material} is needed on site.`);
        return;
      }
      if (!line.reason.trim()) {
        setValidationError(`Explain why ${line.material} is needed.`);
        return;
      }
      if (materialDraftSource === "BOQ" && materialRequests.some((request) => request.projectId === project.id && request.source === "BOQ" && !["Returned", "Received"].includes(request.status) && request.items.some((item) => item.boqLineId === line.boqLineId && !item.removed))) {
        setValidationError(`${line.material} already appears in an active BOQ request.`);
        return;
      }
      if (materialDraftSource === "BOQ" && materialDraftLines.some((other) => other.key !== line.key && other.boqLineId === line.boqLineId)) {
        setValidationError(`${line.material} appears more than once in this request group.`);
        return;
      }
    }
    const id = `MRG-${Date.now()}`;
    const request: MaterialRequestGroup = {
      id,
      projectId: project.id,
      source: materialDraftSource,
      requestedBy: personName,
      requestedDate: todayInIndiaISO(),
      status: "Pending PM review",
      items: materialDraftLines.map((line, index) => ({
        id: `${id}-${index + 1}`,
        source: materialDraftSource,
        boqLineId: line.boqLineId,
        material: line.material,
        unit: line.unit,
        quantity: String(Number(line.quantity)),
        wantedDate: line.wantedDate,
        reason: line.reason,
        removed: false,
      })),
    };
    setMaterialRequests((current) => [request, ...current]);
    setMaterialRequestModalOpen(false);
    setMaterialDraftLines([]);
    setNotice(`Grouped ${materialDraftSource === "BOQ" ? "BOQ" : "additional material"} request sent to the Project Manager.`);
  }

  function updateMaterialRequestLine(groupId: string, lineId: string, patch: Partial<MaterialRequestLine>) {
    setMaterialRequests((current) => current.map((request) => request.id === groupId ? { ...request, items: request.items.map((line) => line.id === lineId ? { ...line, ...patch } : line) } : request));
  }

  function approveMaterialRequest(id: string) {
    const request = materialRequests.find((item) => item.id === id);
    if (!request) return;
    const activeItems = request.items.filter((line) => !line.removed);
    if (!activeItems.length) {
      setValidationError("Keep at least one material in the request before approving it.");
      return;
    }
    const invalidItem = activeItems.find((line) => !Number.isFinite(Number(line.approvedQuantity ?? line.quantity)) || Number(line.approvedQuantity ?? line.quantity) <= 0);
    if (invalidItem) {
      setValidationError(`Enter an approved quantity greater than 0 for ${invalidItem.material}.`);
      return;
    }
    setMaterialRequests((current) => current.map((item) => item.id === id ? { ...item, items: item.items.map((line) => line.removed ? line : { ...line, approvedQuantity: line.approvedQuantity ?? line.quantity }), status: "Approved for purchase" } : item));
    setNotice("Approved material group sent to the Purchase Team.");
  }

  function reviewMaterialRequest(id: string, status: MaterialRequestGroup["status"]) {
    setMaterialRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    setNotice(status === "Returned" ? "Material request group returned to the Engineer." : status === "Ordered" ? "Material request group marked as ordered." : "Material request group marked as received.");
  }

  function submitAdditionalWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    const data = new FormData(event.currentTarget);
    if (!String(data.get("title") ?? "").trim()) {
      setValidationError("Enter the additional work activity.");
      return;
    }
    const requestedQuantity = String(data.get("quantity") ?? "");
    if (requestedQuantity && (!Number.isFinite(Number(requestedQuantity)) || Number(requestedQuantity) < 0)) {
      setValidationError("Enter a valid work quantity of 0 or more, or leave it empty.");
      return;
    }
    if (additionalWorkStartDate && additionalWorkEndDate && additionalWorkEndDate < additionalWorkStartDate) {
      setValidationError("Planned finish must be on or after planned start.");
      return;
    }
    const work: AdditionalWork = {
      id: `AW-${Date.now()}`,
      projectId: project.id,
      title: String(data.get("title") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      supervisor: String(data.get("supervisor") ?? roleNames.supervisor),
      quantity: String(data.get("quantity") ?? ""),
      unit: String(data.get("unit") ?? "").trim(),
      startDate: additionalWorkStartDate,
      endDate: additionalWorkEndDate,
      status: "Assigned",
    };
    setAdditionalWorks((current) => [work, ...current]);
    event.currentTarget.reset();
    setAdditionalWorkStartDate("");
    setAdditionalWorkEndDate("");
    setNotice("Additional work assigned to the Supervisor. It is tracked separately from the BOQ.");
  }

  function updateAdditionalWorkStatus(id: string, status: AdditionalWork["status"]) {
    setAdditionalWorks((current) => current.map((work) => work.id === id ? { ...work, status } : work));
  }

  function updateProjectBudget(amount: number) {
    if (!project) return;
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, budget: amount } : item));
    setNotice("Project budget allocation updated.");
  }

  function addBoqLine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!String(data.get("item") ?? "").trim()) {
      setValidationError("Enter a name or description for this BOQ item.");
      return;
    }
    if (selectedBoqSection === "High Side" && String(data.get("quantity") ?? "") === "") {
      setValidationError("Enter the material quantity.");
      return;
    }
    if (selectedBoqSection === "High Side" && (!Number.isFinite(Number(data.get("quantity"))) || Number(data.get("quantity")) < 0)) {
      setValidationError("Enter a valid material quantity of 0 or more.");
      return;
    }
    const unitCost = String(data.get("unitCost") ?? "");
    const workEstimate = String(data.get("workEstimate") ?? "");
    if ((unitCost && (!Number.isFinite(Number(unitCost)) || Number(unitCost) < 0)) || (workEstimate && (!Number.isFinite(Number(workEstimate)) || Number(workEstimate) < 0))) {
      setValidationError("Costs must be valid amounts of ₹0 or more.");
      return;
    }
    const id = `NEW-${Date.now()}`;
    const requiresClearance = selectedBoqSection === "Low Side" && data.get("clearance") === "required";
    const startDate = String(data.get("startDate") ?? "");
    const today = todayInIndiaISO();
    let endDate = String(data.get("endDate") ?? "");
    let duration = String(data.get("duration") ?? "");
    if (startDate && duration && Number.isInteger(Number(duration)) && Number(duration) > 0) {
      endDate = addDaysToISO(startDate, Number(duration));
    } else if (startDate && endDate) {
      const calculatedDuration = inclusiveDaysBetween(startDate, endDate);
      duration = calculatedDuration === null ? duration : String(calculatedDuration);
    }
    if (selectedBoqSection === "Low Side" && !requiresClearance) {
      if (!duration || !startDate || !endDate) {
        setNotice("Add the work duration and both planned dates, or mark the work as requiring internal clearance.");
        return;
      }
      if (endDate < startDate) {
        setValidationError("The planned end date must be on or after the start date.");
        return;
      }
    }
    const newLine: BoqLine = {
      id,
      projectId: project.id,
      section: selectedBoqSection,
      item: String(data.get("item") ?? "").trim(),
      quantity: String(data.get("quantity") ?? ""),
      unit: String(data.get("unit") ?? ""),
      unitCost: String(data.get("unitCost") ?? ""),
      workEstimate: String(data.get("workEstimate") ?? ""),
      duration,
      startDate,
      endDate,
      status: requiresClearance ? "Clearance required" : selectedBoqSection === "Low Side" ? (startDate && startDate <= today ? "In progress" : "Not started") : selectedBoqSection === "High Side" ? "Not ordered" : String(data.get("status") ?? "Not started"),
    };
    setBoqLines((current) => [...current, newLine]);
    if (selectedBoqSection === "Low Side") setPackages((current) => [...current, { id: `WP-${id}`, projectId: project.id, lineId: id, supervisor: roleNames.supervisor, engineer: roleNames.engineer }]);
    setBoqAddOpen(false);
    setNotice(`${newLine.item} added to ${selectedBoqSection}.`);
  }

  function removeBoqLine(id: string) {
    if (orders.some((order) => order.projectId === project.id && order.itemIds.includes(id))) {
      setNotice("This material is already part of a group order. Keep its BOQ row so the order and invoice history stay linked.");
      return;
    }
    const packageIds = packages.filter((workPackage) => workPackage.lineId === id).map((workPackage) => workPackage.id);
    setBoqLines((current) => current.filter((line) => line.id !== id));
    setPackages((current) => current.filter((workPackage) => workPackage.lineId !== id));
    setDailyReports((current) => current.filter((report) => !packageIds.includes(report.packageId)));
    setMessages((current) => current.filter((message) => !packageIds.includes(message.packageId)));
    setLocalPurchases((current) => current.filter((purchase) => !packageIds.includes(purchase.packageId)));
    setNotice("BOQ row removed.");
  }

  function submitBoq() {
    const emptyRow = projectLines.find((line) => !line.item.trim());
    if (emptyRow) {
      setNotice("Complete or remove the empty BOQ row before submitting.");
      return;
    }
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, boqStatus: "Pending PM approval" } : item));
    setNotice("BOQ submitted to the Project Manager for approval.");
  }

  function approveBoq() {
    if (project?.boqStatus !== "Pending PM approval") {
      setNotice("The Engineer must submit the BOQ before PM approval.");
      return;
    }
    if (projectLines.some((line) => !line.item.trim())) {
      setNotice("Complete or remove the empty BOQ row before approving.");
      return;
    }
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, boqStatus: "Approved" } : item));
    setNotice("BOQ approved. Request High Side quantities from the Materials tab for quantity review before Purchase.");
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!String(data.get("name") ?? "").trim()) {
      setValidationError("Enter a project name.");
      return;
    }
    if (!String(data.get("client") ?? "").trim()) {
      setValidationError("Enter the client or owner name.");
      return;
    }
    if (!(Number(data.get("budget")) > 0)) {
      setValidationError("Enter a budget greater than ₹0.");
      return;
    }
    const email = String(data.get("email") ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Enter a valid client email address or leave the field empty.");
      return;
    }
    const id = `EST-${Date.now().toString().slice(-5)}`;
    const nextProject: Project = {
      id,
      name: String(data.get("name") ?? "").trim(),
      client: String(data.get("client") ?? "").trim(),
      contactName: String(data.get("contactName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      budget: Number(data.get("budget") ?? 0),
      pm: String(data.get("pm") ?? roleNames.pm),
      boqStatus: "Draft",
      handoverStatus: "In progress",
      progress: 0,
      plannedProgress: 0,
      health: "On track",
      forecast: Number(data.get("budget") ?? 0),
    };
    setProjects((current) => [nextProject, ...current]);
    setSelectedProjectId(id);
    setCreateProjectOpen(false);
    setPage("projects");
    setNotice(`${nextProject.name} created. Its assigned Project Manager and Engineer can now prepare the BOQ.`);
  }

  function addTeamMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!name) {
      setValidationError("Enter the team member’s name.");
      return;
    }
    if (!email) {
      setValidationError("Enter the team member’s work email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Enter a valid work email address.");
      return;
    }
    const member: TeamMember = {
      id: `U-${String(Date.now()).slice(-5)}`,
      name,
      email,
      role: String(data.get("role") ?? "engineer") as Role,
      project: String(data.get("project") ?? "All projects"),
    };
    setTeamMembers((current) => [member, ...current]);
    setAddMemberOpen(false);
    setNotice(`${member.name} added to the team directory. Account access is not connected in this prototype.`);
  }

  function updatePackageSupervisor(packageId: string, supervisor: string) {
    setPackages((current) => current.map((workPackage) => workPackage.id === packageId ? { ...workPackage, supervisor } : workPackage));
  }

  function submitDailyReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dailyDate) {
      setValidationError("Choose the work date for this progress update.");
      return;
    }
    if (!dailyProgress.trim()) {
      setValidationError("Describe the work completed today.");
      return;
    }
    if (!selectedPackage) return;
    if (dailyPhotos.length === 0 || !dailyAudio) {
      setValidationError("Add at least one progress photo and record an audio update before submitting.");
      return;
    }
    const report: DailyReport = {
      id: `DAY-${dailyDate}-${dailyReports.length + 1}`,
      projectId: selectedPackage.projectId,
      packageId: selectedPackage.id,
      date: dailyDate,
      progress: dailyProgress.trim(),
      quantity: dailyQuantity.trim(),
      photos: dailyPhotos,
      audio: dailyAudio.url,
      audioDuration: dailyAudio.duration,
      status: "Pending engineer review",
    };
    setDailyReports((current) => [report, ...current]);
    setBoqLines((current) => current.map((line) => line.id === selectedPackage.lineId && line.status === "Not started" ? { ...line, status: "In progress" } : line));
    setDailyProgress("");
    setDailyQuantity("");
    setDailyPhotos([]);
    setDailyAudio(null);
    setAudioSeconds(0);
    setNotice("Daily progress sent to the Engineer for review.");
  }

  async function startAudioRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("This browser does not support voice recording. Try a recent version of Chrome or Edge.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      audioStartedAtRef.current = Date.now();
      setAudioSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (discardAudioRef.current) {
          discardAudioRef.current = false;
          setIsRecordingAudio(false);
          if (audioTimerRef.current !== null) window.clearInterval(audioTimerRef.current);
          audioTimerRef.current = null;
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const duration = Math.max(1, Math.round((Date.now() - audioStartedAtRef.current) / 1000));
        if (blob.size > 0) setDailyAudio({ url: URL.createObjectURL(blob), duration });
        setIsRecordingAudio(false);
        if (audioTimerRef.current !== null) window.clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);
      audioTimerRef.current = window.setInterval(() => setAudioSeconds((seconds) => seconds + 1), 1000);
    } catch {
      setNotice("Microphone access was not available. Allow microphone access in your browser, then try recording again.");
    }
  }

  function stopAudioRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecordingAudio(false);
    if (audioTimerRef.current !== null) window.clearInterval(audioTimerRef.current);
    audioTimerRef.current = null;
  }

  function retakeAudioRecording() {
    if (dailyAudio) URL.revokeObjectURL(dailyAudio.url);
    setDailyAudio(null);
    setAudioSeconds(0);
  }

  function decideDailyReport(reportId: string, status: "Verified" | "Returned") {
    setDailyReports((current) => current.map((report) => report.id === reportId ? { ...report, status, reviewNote: reviewNote.trim() || undefined } : report));
    setReviewNote("");
    setNotice(status === "Verified" ? "Daily update verified." : "Daily update returned to the Supervisor.");
  }

  function sendChat(event: FormEvent<HTMLFormElement>, kind: ChatMessage["kind"]) {
    event.preventDefault();
    const text = (kind === "Clearance request" ? clearanceMessage : chatMessage).trim();
    if (!selectedPackage || !text) return;
    setMessages((current) => [...current, { id: `CHAT-${Date.now()}`, projectId: selectedPackage.projectId, packageId: selectedPackage.id, author: personName, role, message: text, kind, resolved: false }]);
    if (kind === "Clearance request") setClearanceMessage("");
    else setChatMessage("");
  }

  function resolveClearance(messageId: string) {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, resolved: true } : message));
    if (!selectedPackage) return;
    setBoqLines((current) => current.map((line) => line.id === selectedPackage.lineId && line.status === "Clearance required" ? { ...line, status: line.startDate && line.startDate <= todayInIndiaISO() ? "In progress" : "Not started" } : line));
    setNotice("Clearance recorded. Set the work duration and dates in the BOQ before scheduling progress.");
  }

  function submitLocalPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const packageId = selectedPackageId ?? projectPackages[0]?.id;
    const packageForPurchase = packages.find((workPackage) => workPackage.id === packageId);
    if (!packageForPurchase) {
      setValidationError("Choose a work package before submitting the purchase.");
      return;
    }
    if (!(Number(purchaseAmount) > 0)) {
      setValidationError("Enter a purchase amount greater than ₹0.");
      return;
    }
    if (!purchaseBill) {
      setValidationError("Attach the bill or invoice before submitting.");
      return;
    }
    if (!purchaseReason.trim()) {
      setValidationError("Explain why this purchase was needed.");
      return;
    }
    setLocalPurchases((current) => [{ id: `LOCAL-${Date.now()}`, projectId: packageForPurchase.projectId, packageId: packageForPurchase.id, category: purchaseCategory, reason: purchaseReason.trim(), amount: Number(purchaseAmount), bill: purchaseBill || undefined, status: "Pending engineer approval" }, ...current]);
    setPurchaseReason("");
    setPurchaseAmount("");
    setPurchaseBill("");
    setNotice("Local purchase bill submitted to the Engineer.");
  }

  function decideLocalPurchase(id: string, status: "Approved" | "Returned") {
    setLocalPurchases((current) => current.map((purchase) => purchase.id === id ? { ...purchase, status } : purchase));
    setNotice(status === "Approved" ? "Local purchase bill approved." : "Local purchase bill returned to the Supervisor.");
  }

  function saveOrder(patch: Partial<PurchaseOrder>) {
    if (!selectedOrder) return;
    setOrders((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, ...patch } : order));
  }

  function saveOrderDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder) return;
    saveOrder({ supplier: orderSupplier, orderDate, expectedDate: orderExpectedDate, receivedDate: orderReceivedDate, amount: Number(orderAmount) || selectedOrder.amount, bill: orderBill || selectedOrder.bill });
    setNotice("Group order details saved.");
  }

  function submitOrderBill() {
    if (!selectedOrder || !orderBill && !selectedOrder.bill) {
      setValidationError("Attach the group bill before sending it for approval.");
      return;
    }
    const billAmount = Number(orderAmount) || selectedOrder.amount;
    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      setValidationError("Enter the total amount shown on the group bill before sending it for approval.");
      return;
    }
    saveOrder({ supplier: orderSupplier || selectedOrder.supplier, orderDate: orderDate || selectedOrder.orderDate, expectedDate: orderExpectedDate || selectedOrder.expectedDate, receivedDate: orderReceivedDate || selectedOrder.receivedDate, amount: billAmount, bill: orderBill || selectedOrder.bill, status: "Pending Super Admin approval" });
    setNotice("Group order bill sent to the Super Admin for approval.");
  }

  function decideOrder(id: string, status: "Approved" | "Returned") {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status, returnNote: status === "Returned" ? orderReturnNote.trim() || "Please review the bill details." : undefined } : order));
    setOrderReturnNote("");
    setNotice(status === "Approved" ? "Group order bill approved." : "Bill returned to the Purchase team for correction.");
  }

  function markHandoverReady() {
    const incomplete = projectLines.filter((line) => line.section === "Finalization & Handover" && line.status !== "Complete");
    if (incomplete.length) {
      setNotice("Complete all finalization checklist items before handing over the project.");
      return;
    }
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, handoverStatus: "Ready for handover" } : item));
    setNotice("Project is ready for Super Admin handover approval.");
  }

  function approveHandover() {
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, handoverStatus: "Handed over" } : item));
    setNotice("Project handover approved and recorded.");
  }

  const renderOverview = () => role === "superadmin" ? (() => {
    const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0);
    const totalForecast = projects.reduce((sum, item) => sum + (item.forecast ?? item.budget), 0);
    const measuredProgress = projects.length ? Math.round(projects.reduce((sum, item) => sum + (item.progress ?? 0), 0) / projects.length) : 0;
    const pendingItems = openOrderCount + openBillCount + dailyReports.filter((report) => report.status === "Pending engineer review").length;
    const attentionProjects = projects.filter((item) => item.health === "At risk" || item.health === "Needs attention");
    const visiblePortfolio = projects.filter((item) => `${item.name} ${item.client} ${item.pm}`.toLowerCase().includes(portfolioSearch.toLowerCase()));
    const weekly = [{ day: "Mon", plan: 76, done: 62 }, { day: "Tue", plan: 86, done: 71 }, { day: "Wed", plan: 81, done: 75 }, { day: "Thu", plan: 92, done: 75 }, { day: "Fri", plan: 88, done: 70 }, { day: "Sat", plan: 58, done: 53 }];
    const cr = (amount: number) => `₹${(amount / 10000000).toFixed(2)} Cr`;
    return <>
      <SectionTitle eyebrow="Portfolio overview" title="Good morning, Arun" description="A clear view of project delivery, pending decisions, and cost forecast." action={<Button onClick={() => { navigate("projects"); setCreateProjectOpen(true); }} className="bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />Create project</Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active projects", value: String(projects.length), detail: "Across your current portfolio", icon: <Building2 className="size-4" />, color: "bg-teal-50 text-teal-700" },
          { label: "Measured progress", value: `${measuredProgress}%`, detail: "Average reported completion", icon: <Activity className="size-4" />, color: "bg-sky-50 text-sky-700" },
          { label: "Pending reviews", value: String(pendingItems), detail: "Bills, orders, and site updates", icon: <ClipboardCheck className="size-4" />, color: "bg-amber-50 text-amber-700" },
          { label: "Forecast at completion", value: cr(totalForecast), detail: `Portfolio budget · ${cr(totalBudget)}`, icon: <WalletCards className="size-4" />, color: "bg-emerald-50 text-emerald-700" },
        ].map((item) => <Card key={item.label} className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="p-4"><span className={`grid size-9 place-items-center rounded-xl ${item.color}`}>{item.icon}</span><p className="mt-3 text-[10px] font-medium text-slate-500">{item.label}</p><p className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900">{item.value}</p><p className="mt-1 truncate text-[10px] text-slate-500">{item.detail}</p></CardContent></Card>)}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="pb-2"><CardTitle className="text-sm">Weekly work output</CardTitle><p className="text-[11px] text-slate-500">Planned and completed progress across active sites</p></CardHeader><CardContent><div className="mb-3 flex items-center gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-slate-300" />Planned</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-teal-600" />Completed</span><span className="ml-auto text-slate-400">Illustrative weekly view</span></div><div className="relative flex h-48 items-end justify-around border-b border-slate-200 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_46px,#e9eef0_47px)] px-2">{weekly.map((day) => <div key={day.day} className="flex h-full w-12 flex-col items-center justify-end"><div className="flex h-[calc(100%-22px)] items-end gap-1"><div className="w-3.5 rounded-t-md bg-slate-300" style={{ height: `${day.plan}%` }} /><div className="w-3.5 rounded-t-md bg-teal-600" style={{ height: `${day.done}%` }} /></div><span className="mt-1 text-[10px] text-slate-500">{day.day}</span></div>)}</div><div className="mt-2 flex justify-between text-[9px] text-slate-400"><span>0%</span><span>50%</span><span>100%</span></div></CardContent></Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="flex flex-row items-start justify-between"><div><CardTitle className="text-sm">Needs attention</CardTitle><p className="mt-1 text-[11px] text-slate-500">Items that may need action</p></div><span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-700"><AlertCircle className="size-4" /></span></CardHeader><CardContent className="space-y-2">{attentionProjects.length ? attentionProjects.map((item) => <button key={item.id} onClick={() => openProject(item.id)} className="flex w-full items-start gap-3 rounded-xl bg-amber-50/70 p-3 text-left hover:bg-amber-50"><AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700" /><span className="min-w-0 flex-1"><b className="block truncate text-[11px] text-slate-800">{item.name}</b><span className="mt-1 block text-[10px] text-slate-500">{item.health === "At risk" ? "Progress is behind the planned schedule" : "Project needs an operational review"}</span></span><span className="text-[9px] font-semibold text-amber-700">{item.health}</span></button>) : <div className="rounded-xl bg-emerald-50 p-3 text-[11px] text-emerald-800">No projects currently flagged for attention.</div>}{openOrderCount > 0 && <button onClick={() => navigate("purchase-approval")} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50"><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><ClipboardCheck className="size-4" /></span><span className="flex-1"><b className="block text-[11px] text-slate-800">Purchase bills for approval</b><span className="mt-1 block text-[10px] text-slate-500">{openOrderCount} group order(s) waiting</span></span><ArrowRight className="size-4 text-slate-400" /></button>}</CardContent></Card>
      </div>
      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="text-sm font-semibold text-slate-900">Portfolio snapshot</h2><p className="mt-1 text-[11px] text-slate-500">Live work, progress, budget, and delivery health</p></div><Button variant="outline" size="sm" onClick={() => navigate("projects")}>All projects<ArrowRight className="size-3.5" /></Button></div><div className="flex flex-wrap gap-2 border-b border-slate-100 p-3"><div className="relative min-w-52 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" /><Input value={portfolioSearch} onChange={(event) => setPortfolioSearch(event.target.value)} placeholder="Search projects..." className="h-9 pl-9 text-xs" aria-label="Search projects" /></div><span className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[10px] text-slate-500"><UsersRound className="size-3.5" />{teamMembers.length} team members</span></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-[9px] font-semibold uppercase tracking-wider text-slate-500"><tr>{["Project", "Progress", "Project health", "Team", "Due date", "Forecast"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visiblePortfolio.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-4 py-3"><button onClick={() => openProject(item.id)} className="text-left"><b className="block max-w-64 truncate text-xs text-slate-800">{item.name}</b><span className="mt-1 block text-[10px] text-slate-500">{item.id} · {item.client}</span></button></td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${item.progress ?? 0}%` }} /></div><b className="text-[10px] text-slate-700">{item.progress ?? 0}%</b></div><span className="mt-1 block text-[9px] text-slate-400">Plan {item.plannedProgress ?? 0}%</span></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${item.health === "At risk" ? "bg-amber-50 text-amber-800" : item.health === "Needs attention" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{item.health ?? "On track"}</span></td><td className="px-4 py-3 text-[10px] text-slate-600">{item.pm} <span className="text-slate-400">+ team</span></td><td className="px-4 py-3 text-[10px] text-slate-600">{item.dueDate ? formatDate(item.dueDate) : "Not set"}</td><td className="px-4 py-3 text-[10px] font-semibold text-slate-800">{cr(item.forecast ?? item.budget)}</td></tr>)}</tbody></table></div><div className="border-t border-slate-100 px-4 py-3 text-[10px] text-slate-400">Showing {visiblePortfolio.length} of {projects.length} projects · Demo portfolio figures</div></section>
    </>;
  })() : <>
    <SectionTitle eyebrow="Project control" title={`Welcome, ${personName.split(" ")[0]}`} description="Follow the approved project workflow from BOQ preparation through site progress and handover." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Active projects" value={String(projects.length)} detail="Projects in this workspace" icon={<Building2 className="size-4" />} /><Metric label="BOQ status" value={project?.boqStatus ?? "Draft"} detail={`${projectLines.filter((line) => line.section === "High Side").length} material lines`} icon={<FileSpreadsheet className="size-4" />} /><Metric label="Work packages" value={String(projectPackages.length)} detail={`${projectOpenUpdateCount} daily updates awaiting review`} icon={<HardHat className="size-4" />} /><Metric label="Bills for approval" value={String(openOrderCount + openBillCount)} detail="Group orders and local purchases" icon={<ClipboardCheck className="size-4" />} /></div>
    <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]"><Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="flex flex-row items-start justify-between border-b border-slate-100"><div><CardTitle className="text-sm">Current project</CardTitle><p className="mt-1 text-[11px] text-slate-500">Project workspace</p></div><Status value={project?.boqStatus ?? "Draft"} /></CardHeader><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-slate-900">{project?.name}</h3>{project?.isDemo && <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800">Demo data</span>}</div><p className="-mt-3 text-xs text-slate-500">Client {project?.client} · PM {project?.pm}</p><div className="grid gap-2 sm:grid-cols-3"><Info label="High Side" value={`${projectLines.filter((line) => line.section === "High Side").length} material lines`} /><Info label="Low Side" value={`${projectPackages.length} work packages`} /><Info label="Budget allocation" value={project?.budget ? money(project.budget) : "Not allocated"} /></div><div className="flex flex-wrap gap-2"><Button onClick={() => project && openProject(project.id)} className="bg-teal-800 text-white hover:bg-teal-700"><ArrowRight className="size-4" />Open project workspace</Button>{role === "pm" && <Button variant="outline" onClick={() => navigate("costs")}><WalletCards className="size-4" />Portfolio costs</Button>}</div></CardContent></Card></div>
  </>;

  const renderProjects = () => <>
    <SectionTitle eyebrow="Portfolio" title="Projects" description="Open a project to work in its BOQ, work packages, costs, and closeout. Each project keeps its own schedule and records." action={role === "superadmin" ? <Button onClick={() => setCreateProjectOpen(true)} className="bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />New project</Button> : undefined} />
    <div className="grid gap-3 lg:grid-cols-2">{projects.map((item) => {
      const finance = getProjectCostData(item);
      const estimate = finance.lines.reduce((sum, line) => sum + (line.estimate ?? 0), 0);
      const pricedCount = finance.lines.filter((line) => line.estimate !== null).length;
      const approved = finance.spendRecords.filter((record) => record.status === "Approved").reduce((sum, record) => sum + record.amount, 0);
      return <Card key={item.id} className={`border-0 shadow-sm ring-1 ${item.id === project?.id ? "ring-teal-300" : "ring-slate-200/70"}`}><CardContent className="space-y-4 p-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800"><Building2 className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-800">{item.name}</p>{item.isDemo && <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800">Demo</span>}</div><p className="mt-1 text-[11px] text-slate-500">{item.client} · PM {item.pm}</p></div><Status value={item.boqStatus} /></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Info label="Budget" value={item.budget ? money(item.budget) : "Not allocated"} /><Info label="BOQ estimate" value={pricedCount ? money(estimate) : "Not priced"} /><Info label="Approved spend" value={money(approved)} /><Info label="Work packages" value={String(packages.filter((workPackage) => workPackage.projectId === item.id).length)} /></div><div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => openProject(item.id)}>Open project<ArrowRight className="size-3.5" /></Button></div></CardContent></Card>;
    })}</div>
    <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Capture the client, budget allocation, and Project Manager. The BOQ and work schedule are prepared after setup.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={createProject} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project name"><TextInput name="name" placeholder="Project name" /></Field>
            <Field label="Client / owner name"><TextInput name="client" placeholder="Client or owner" /></Field>
            <Field label="Client contact person"><TextInput name="contactName" placeholder="Contact person" /></Field>
            <Field label="Client email"><TextInput name="email" type="email" placeholder="name@company.com" /></Field>
            <Field label="Client phone"><TextInput name="phone" type="tel" placeholder="Phone number" /></Field>
            <Field label="Budget allocation (₹)"><TextInput name="budget" type="number" min="1" step="1" placeholder="Enter approved budget" /></Field>
            <Field label="Assign Project Manager">
              <WorkflowSelect
                name="pm"
                defaultValue={teamMembers.find((member) => member.role === "pm")?.name ?? roleNames.pm}
                options={teamMembers.filter((member) => member.role === "pm").map((member) => ({ value: member.name, label: member.name }))}
                ariaLabel="Assign Project Manager"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateProjectOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;

  const renderPeople = () => <>
    <SectionTitle eyebrow="Administration" title="People & teams" description="Manage the people who work across Estatio projects and assign each person a role." action={<Button onClick={() => setAddMemberOpen(true)} className="bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-4" />Add person</Button>} />
    <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100"><CardTitle className="text-sm">Team directory</CardTitle><p className="text-[11px] text-slate-500">{teamMembers.length} people · local prototype directory</p></CardHeader><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-slate-50 text-[9px] font-semibold uppercase tracking-wider text-slate-500"><tr>{["Person", "Role", "Project assignment", "Access"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{teamMembers.map((member) => <tr key={member.id}><td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar className="size-8"><AvatarFallback className="bg-teal-50 text-[10px] font-bold text-teal-800">{member.name.split(" ").map((part) => part[0]).join("")}</AvatarFallback></Avatar><div><b className="block text-xs text-slate-800">{member.name}</b><span className="text-[10px] text-slate-500">{member.email}</span></div></div></td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-700">{roleLabels[member.role]}</span></td><td className="px-4 py-3 text-[10px] text-slate-600">{member.project}</td><td className="px-4 py-3"><span className="text-[10px] font-medium text-emerald-700">Directory only</span></td></tr>)}</tbody></table></div></Card>
    <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Add person</DialogTitle><DialogDescription>Add a person to this prototype team directory. Login invitations are not connected yet.</DialogDescription></DialogHeader><form noValidate onSubmit={addTeamMember} className="space-y-4"><Field label="Full name"><TextInput name="name" placeholder="Name" /></Field><Field label="Work email"><TextInput name="email" type="email" placeholder="name@company.com" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Role"><WorkflowSelect name="role" ariaLabel="Role" defaultValue="engineer" options={(["superadmin", "pm", "engineer", "supervisor", "purchase"] as Role[]).map((value) => ({ value, label: roleLabels[value] }))} /></Field><Field label="Project"><WorkflowSelect name="project" ariaLabel="Project" defaultValue="All projects" options={[{ value: "All projects", label: "All projects" }, ...projects.map((item) => ({ value: item.name, label: item.name }))]} /></Field></div><DialogFooter><Button type="button" variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700">Add to directory</Button></DialogFooter></form></DialogContent></Dialog>
  </>;

  const renderBoq = () => {
    const editable = role === "superadmin" || (role === "pm" ? project?.boqStatus !== "Approved" : role === "engineer" && project?.boqStatus === "Draft");
    const rows = projectLines.filter((line) => line.section === selectedBoqSection);
    const sectionEstimate = rows.reduce((sum, line) => sum + (boqEstimate(line) ?? 0), 0);
    const pricedRowCount = rows.filter((line) => boqEstimate(line) !== null).length;
    const headers = selectedBoqSection === "High Side"
      ? ["Material / specification", "Qty", "Unit", "Delivery duration", "Expected delivery", "Unit cost (₹)", "Line estimate", "Status", ""]
      : selectedBoqSection === "Low Side"
        ? ["Work activity", "Duration", "Start", "End", "Status", "Work estimate (₹)", ""]
        : ["Finalization item", "Duration", "Start", "End", "Status", ""];
    return <>
      <SectionTitle eyebrow={role === "superadmin" ? "Super Admin access · Engineer + PM prepared" : "Engineer + Project Manager"} title="BOQ workspace" description="Prepare and review the BOQ in a spreadsheet-style grid. High Side covers materials; Low Side covers scheduled work; the last section tracks closeout." action={<div className="flex items-center gap-2"><Status value={project?.boqStatus ?? "Draft"} />{role === "engineer" && project?.boqStatus === "Draft" && <Button onClick={submitBoq} className="bg-teal-800 text-white hover:bg-teal-700"><Send className="size-3.5" />Submit to PM</Button>}{role === "pm" && project?.boqStatus === "Pending PM approval" && <Button onClick={approveBoq} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Approve BOQ</Button>}</div>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"><div><p className="text-sm font-semibold text-slate-800">{project?.name}</p><p className="mt-1 text-[10px] text-slate-500">Prepared by Engineer {roleNames.engineer} and PM {project?.pm}</p></div><div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">{(["High Side", "Low Side", "Finalization & Handover"] as BoqSection[]).map((section) => <button key={section} onClick={() => setSelectedBoqSection(section)} className={`rounded-md px-3 py-2 text-[10px] font-semibold ${selectedBoqSection === section ? "bg-white text-teal-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{section}</button>)}</div></div>
      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <div>
            <CardTitle className="text-sm">{selectedBoqSection}</CardTitle>
            <p className="mt-1 text-[10px] text-slate-500">
              {selectedBoqSection === "High Side" ? "BOQ material baseline and estimates. Request quantities and track purchasing from the Materials tab." : selectedBoqSection === "Low Side" ? "Status starts automatically on the planned start date; an Engineer can complete work after verifying a daily update. Clearance remains manual." : "Testing, documentation, snag closure, and client handover"}
            </p>
          </div>
          {editable && <Button variant="outline" size="sm" onClick={() => { setBoqStartDraft(""); setBoqEndDraft(""); setBoqDurationDraft(""); setBoqRequiresClearance(false); setBoqAddOpen(true); }}><Plus className="size-3.5" />Add {selectedBoqSection === "High Side" ? "material" : selectedBoqSection === "Low Side" ? "work" : "item"}</Button>}
        </CardHeader>
        <p className="px-3 pt-2 text-right text-[10px] text-slate-400 2xl:hidden">Scroll horizontally to view all columns →</p>
        <div className="overflow-x-auto" role="region" aria-label={`${selectedBoqSection} BOQ table`} tabIndex={0}>
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead><tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-400">{headers.map((title) => <th key={title || "actions"} className={`border-b border-slate-100 px-3 py-3 ${title === "" ? "sticky right-0 z-20 min-w-16 bg-slate-50 text-right" : ""}`}>{title || (editable ? "Actions" : "")}</th>)}</tr></thead>
            <tbody>
              {rows.map((line) => (
                <tr key={line.id} className="border-b border-slate-100 last:border-0 hover:bg-teal-50/30">
                  <td className="min-w-52 px-3 py-2"><BoqText ariaLabel={`${line.item || selectedBoqSection} item / specification`} value={line.item} disabled={!editable} onChange={(value) => updateLine(line.id, "item", value)} /></td>
                  {selectedBoqSection === "High Side" ? <>
                    <td className="w-24 px-2 py-2"><BoqText ariaLabel={`${line.item || "Material"} quantity`} type="number" value={line.quantity} disabled={!editable} onChange={(value) => updateLine(line.id, "quantity", value)} /></td>
                    <td className="w-24 px-2 py-2"><BoqText ariaLabel={`${line.item || "Material"} unit`} value={line.unit} disabled={!editable} onChange={(value) => updateLine(line.id, "unit", value)} /></td>
                    <td className="w-28 px-2 py-2"><BoqText ariaLabel={`${line.item || "Material"} delivery duration in days`} type="number" value={line.duration} disabled={!editable} placeholder="days" onChange={(value) => updateLine(line.id, "duration", value)} /></td>
                    <td className="w-[300px] min-w-[300px] px-2 py-2"><div className="flex items-center gap-1"><DatePicker ariaLabel={`${line.item || "Material"} expected start date`} value={line.startDate} disabled={!editable} onValueChange={(value) => updateLine(line.id, "startDate", value)} className="w-[136px] min-w-[136px] shrink-0" /><span className="shrink-0 text-slate-400">–</span><DatePicker ariaLabel={`${line.item || "Material"} expected delivery date`} value={line.endDate} disabled={!editable} onValueChange={(value) => updateLine(line.id, "endDate", value)} className="w-[136px] min-w-[136px] shrink-0" /></div></td>
                    <td className="w-36 px-2 py-2"><BoqText ariaLabel={`${line.item || "Material"} unit cost in rupees`} type="number" value={line.unitCost} disabled={!editable} placeholder="Unit rate" onChange={(value) => updateLine(line.id, "unitCost", value)} /></td>
                    <td className="w-36 px-3 py-2 text-xs font-semibold tabular-nums text-slate-700">{boqEstimate(line) === null ? "Not estimated" : money(boqEstimate(line) ?? 0)}</td>
                    <td className="min-w-40 px-3 py-2"><Status value={line.status} /></td>
                  </> : selectedBoqSection === "Low Side" ? <>
                    <td className="w-28 px-2 py-2"><BoqText ariaLabel={`${line.item || "Work"} duration in days`} type="number" value={line.duration} disabled={!editable || line.status === "Clearance required"} placeholder={line.status === "Clearance required" ? "After clearance" : "days"} onChange={(value) => updateLine(line.id, "duration", value)} /></td>
                    <td className="w-40 px-2 py-2"><DatePicker ariaLabel={`${line.item || "Work"} planned start date`} value={line.startDate} disabled={!editable || line.status === "Clearance required"} onValueChange={(value) => updateLine(line.id, "startDate", value)} className="min-w-[132px]" /></td>
                    <td className="w-40 px-2 py-2"><DatePicker ariaLabel={`${line.item || "Work"} planned end date`} value={line.endDate} disabled={!editable || line.status === "Clearance required"} onValueChange={(value) => updateLine(line.id, "endDate", value)} className="min-w-[132px]" /></td>
                    <td className="min-w-48 px-2 py-2"><div className="flex flex-wrap items-center gap-2"><Status value={lowSideStatus(line)} />{["superadmin", "pm", "engineer"].includes(role) && line.status === "In progress" && dailyReports.some((report) => report.status === "Verified" && packages.some((workPackage) => workPackage.lineId === line.id && workPackage.id === report.packageId)) && <Button type="button" size="xs" variant="outline" onClick={() => updateLine(line.id, "status", "Complete")}>Mark complete</Button>}</div></td>
                    <td className="w-40 px-2 py-2"><BoqText ariaLabel={`${line.item || "Work"} estimated cost in rupees`} type="number" value={line.workEstimate} disabled={!editable} placeholder="Work cost" onChange={(value) => updateLine(line.id, "workEstimate", value)} /></td>
                  </> : <>
                    <td className="w-28 px-2 py-2"><BoqText ariaLabel={`${line.item || "Closeout item"} duration in days`} type="number" value={line.duration} disabled={!editable} placeholder="days" onChange={(value) => updateLine(line.id, "duration", value)} /></td>
                    <td className="w-40 px-2 py-2"><DatePicker ariaLabel={`${line.item || "Closeout item"} planned start date`} value={line.startDate} disabled={!editable} onValueChange={(value) => updateLine(line.id, "startDate", value)} className="min-w-[132px]" /></td>
                    <td className="w-40 px-2 py-2"><DatePicker ariaLabel={`${line.item || "Closeout item"} planned end date`} value={line.endDate} disabled={!editable} onValueChange={(value) => updateLine(line.id, "endDate", value)} className="min-w-[132px]" /></td>
                    <td className="min-w-48 px-2 py-2"><WorkflowSelect ariaLabel={`${line.item || "Closeout item"} status`} disabled={!editable} value={line.status} onValueChange={(value) => updateLine(line.id, "status", value)} options={["Not started", "In progress", "Complete"].map((value) => ({ value, label: value }))} /></td>
                  </>}
                  {editable && <td className="sticky right-0 z-10 w-16 bg-white px-2 py-2 text-right"><Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${line.item || "BOQ row"}`} title="Delete row" onClick={() => removeBoqLine(line.id)} className="text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></Button></td>}
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={headers.length} className="px-5 py-12 text-center"><p className="text-sm font-semibold text-slate-700">No {selectedBoqSection === "High Side" ? "materials" : selectedBoqSection === "Low Side" ? "work activities" : "closeout items"} yet</p><p className="mt-1 text-xs text-slate-500">Add your first row to start building this section.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 py-3">
          <span className="text-[10px] text-slate-500">{rows.length} rows · {role === "superadmin" ? "Super Admin can edit this BOQ at any stage." : role === "pm" ? "Editable until PM approval." : editable ? "Editable while BOQ is in Draft." : "Read only after PM approval."}</span>
          {selectedBoqSection !== "Finalization & Handover" && <span className="text-[10px] font-semibold text-slate-600">Estimated section total: {pricedRowCount ? money(sectionEstimate) : "Not priced"}</span>}
          {selectedBoqSection === "High Side" && <span className="text-[10px] font-medium text-slate-500">Enter quantity and unit cost to calculate each material estimate.</span>}
        </CardContent>
      </Card>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[11px] leading-relaxed text-slate-500"><b className="text-slate-700">Approval route:</b> Engineer submits the BOQ → PM approves the BOQ baseline → Engineer requests High Side quantities in Materials → PM adjusts or removes items and approves → Purchase receives only approved quantities. Clearance-gated Low Side rows retain duration and dates until clearance is recorded.</div>
      <Dialog open={boqAddOpen} onOpenChange={setBoqAddOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Add {selectedBoqSection === "High Side" ? "material" : selectedBoqSection === "Low Side" ? "work activity" : "closeout item"}</DialogTitle><DialogDescription>Enter the essentials here; the row will be added to the {selectedBoqSection} sheet.</DialogDescription></DialogHeader><form noValidate onSubmit={addBoqLine} className="space-y-4"><Field label={selectedBoqSection === "High Side" ? "Material / specification" : selectedBoqSection === "Low Side" ? "Work activity" : "Closeout item"}><TextInput name="item" autoFocus placeholder={selectedBoqSection === "High Side" ? "e.g. Copper pipe, 25 mm" : selectedBoqSection === "Low Side" ? "e.g. Install chilled water pipes, Level 2" : "e.g. Client inspection"} className="w-full" /></Field>{selectedBoqSection === "High Side" && <div className="grid gap-3 sm:grid-cols-3"><Field label="Quantity"><TextInput name="quantity" type="number" min="0" step="any" placeholder="0" className="w-full" /></Field><Field label="Unit"><WorkflowSelect name="unit" ariaLabel="Unit" defaultValue="pcs" className="w-full" options={["pcs", "units", "m", "m²", "kg", "sets", "rolls", "boxes", "lot"].map((unit) => ({ value: unit, label: unit }))} /></Field><Field label="Delivery duration (days)"><TextInput name="duration" type="number" min="0" step="1" value={boqDurationDraft} onChange={(event) => { const value = event.target.value; setBoqDurationDraft(value); const days = Number(value); if (boqStartDraft && Number.isInteger(days) && days > 0) setBoqEndDraft(addDaysToISO(boqStartDraft, days)); }} placeholder="Days" className="w-full" /></Field></div>}{selectedBoqSection === "High Side" && <><div className="grid gap-3 sm:grid-cols-2"><Field label="Expected delivery start"><DatePicker value={boqStartDraft} onValueChange={(value) => { setBoqStartDraft(value); const days = Number(boqDurationDraft); if (value && Number.isInteger(days) && days > 0) setBoqEndDraft(addDaysToISO(value, days)); }} ariaLabel="Expected delivery start" className="w-full" /></Field><Field label="Expected delivery by"><DatePicker value={boqEndDraft} onValueChange={(value) => { setBoqEndDraft(value); const days = inclusiveDaysBetween(boqStartDraft, value); if (days !== null) setBoqDurationDraft(String(days)); }} ariaLabel="Expected delivery by" className="w-full" /></Field></div><div className="max-w-xs"><Field label="Unit cost (₹), if known"><TextInput name="unitCost" type="number" min="0" step="any" placeholder="Optional" className="w-full" /></Field></div></>}{selectedBoqSection === "Low Side" && <><Field label="Internal team clearance"><WorkflowSelect ariaLabel="Internal team clearance" value={boqRequiresClearance ? "required" : "not-required"} onValueChange={(value) => setBoqRequiresClearance(value === "required")} options={[{ value: "not-required", label: "Not required — schedule this work" }, { value: "required", label: "Required — dates set after clearance" }]} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Duration (days)"><TextInput name="duration" type="number" min="1" step="1" value={boqDurationDraft} onChange={(event) => { const value = event.target.value; setBoqDurationDraft(value); const days = Number(value); if (boqStartDraft && Number.isInteger(days) && days > 0) setBoqEndDraft(addDaysToISO(boqStartDraft, days)); }} disabled={boqRequiresClearance} placeholder={boqRequiresClearance ? "Set after clearance" : "e.g. 5"} className="w-full" /></Field><Field label="Work estimate (₹), if known"><TextInput name="workEstimate" type="number" min="0" step="any" placeholder="Optional" className="w-full" /></Field></div>{!boqRequiresClearance && <div className="grid gap-3 sm:grid-cols-2"><Field label="Planned start date"><DatePicker value={boqStartDraft} onValueChange={(value) => { setBoqStartDraft(value); const days = Number(boqDurationDraft); if (Number.isInteger(days) && days > 0) setBoqEndDraft(addDaysToISO(value, days)); }} ariaLabel="Planned start date" className="w-full" /></Field><Field label="Planned end date"><DatePicker value={boqEndDraft} onValueChange={(value) => { setBoqEndDraft(value); const days = inclusiveDaysBetween(boqStartDraft, value); if (days !== null) setBoqDurationDraft(String(days)); }} ariaLabel="Planned end date" className="w-full" /></Field></div>}<input type="hidden" name="clearance" value={boqRequiresClearance ? "required" : "not-required"} /></>}{selectedBoqSection === "Finalization & Handover" && <><div className="grid gap-3 sm:grid-cols-3"><Field label="Duration (days)"><TextInput name="duration" type="number" min="0" step="1" value={boqDurationDraft} onChange={(event) => { const value = event.target.value; setBoqDurationDraft(value); const days = Number(value); if (boqStartDraft && Number.isInteger(days) && days > 0) setBoqEndDraft(addDaysToISO(boqStartDraft, days)); }} placeholder="Optional" className="w-full" /></Field><Field label="Planned start"><DatePicker value={boqStartDraft} onValueChange={(value) => { setBoqStartDraft(value); const days = Number(boqDurationDraft); if (Number.isInteger(days) && days > 0) setBoqEndDraft(addDaysToISO(value, days)); }} ariaLabel="Planned start" className="w-full" /></Field><Field label="Planned end"><DatePicker value={boqEndDraft} onValueChange={(value) => { setBoqEndDraft(value); const days = inclusiveDaysBetween(boqStartDraft, value); if (days !== null) setBoqDurationDraft(String(days)); }} ariaLabel="Planned end" className="w-full" /></Field></div><Field label="Initial status"><WorkflowSelect name="status" ariaLabel="Initial status" defaultValue="Not started" options={["Not started", "In progress", "Complete"].map((value) => ({ value, label: value }))} /></Field></>}{selectedBoqSection === "High Side" && <input type="hidden" name="duration" value={boqDurationDraft} />}<input type="hidden" name="startDate" value={boqStartDraft} /><input type="hidden" name="endDate" value={boqEndDraft} /><DialogFooter><Button type="button" variant="outline" onClick={() => setBoqAddOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-3.5" />Add to BOQ</Button></DialogFooter></form></DialogContent></Dialog>
    </>;
  };

  const renderWork = () => {
    if (selectedPackage && selectedPackageLine) {
      return <>
        <button onClick={() => setSelectedPackageId(null)} className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-800 hover:text-teal-950"><ArrowLeft className="size-4" />All work packages</button>
        <SectionTitle eyebrow="Work package page" title={selectedPackageLine.item} description={`${project?.name} · ${selectedPackageLine.duration || "Duration after clearance"} ${selectedPackageLine.duration ? "days" : "· Internal clearance required"} · ${formatDate(selectedPackageLine.startDate)} to ${formatDate(selectedPackageLine.endDate)}`} action={<Status value={selectedPackageLine.status} />} />
        <div className="mb-4 grid gap-3 sm:grid-cols-3"><Info label="Engineer" value={selectedPackage.engineer} /><Info label="Supervisor" value={selectedPackage.supervisor} /><Info label="Planned duration" value={selectedPackageLine.duration ? `${selectedPackageLine.duration} days` : "Set after clearance"} /></div>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100"><CardTitle className="text-sm">Daily progress log</CardTitle><p className="text-[10px] text-slate-500">One dated entry per work day. Each submission goes to the assigned Engineer.</p></CardHeader><CardContent className="space-y-4 p-4">
            {role === "supervisor" && selectedPackageLine.status === "Clearance required" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Daily progress starts after internal clearance is recorded and the work duration is scheduled.</div>}{role === "supervisor" && selectedPackageLine.status !== "Clearance required" && <form noValidate onSubmit={submitDailyReport} className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/40 p-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Work date"><TextInput type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} /></Field><Field label="Completed quantity"><TextInput type="text" value={dailyQuantity} onChange={(event) => setDailyQuantity(event.target.value)} placeholder="Optional, with unit" /></Field></div><Field label="Today’s work progress"><Textarea value={dailyProgress} onChange={(event) => setDailyProgress(event.target.value)} rows={3} placeholder="Describe work completed, area covered, and blockers..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-700" /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Progress photos"><TextInput type="file" accept="image/*" multiple onChange={(event) => setDailyPhotos(Array.from(event.target.files ?? []).map((file) => file.name))} className="h-auto py-2" /></Field><Field label="Voice update"><div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3"><div className="flex flex-wrap items-center gap-2">{isRecordingAudio ? <Button type="button" size="sm" onClick={stopAudioRecording} className="bg-rose-700 text-white hover:bg-rose-800"><Square className="size-3.5 fill-current" />Stop recording</Button> : dailyAudio ? <><audio controls src={dailyAudio.url} className="h-9 min-w-48 flex-1" aria-label="Recorded voice update playback" /><Button type="button" size="sm" variant="outline" onClick={retakeAudioRecording}><RotateCcw className="size-3.5" />Record again</Button></> : <Button type="button" size="sm" variant="outline" onClick={startAudioRecording}><Mic className="size-3.5" />Record voice update</Button>}<span aria-live="polite" className={`text-[10px] ${isRecordingAudio ? "font-semibold text-rose-700" : "text-slate-500"}`}>{isRecordingAudio ? `Recording · ${formatDuration(audioSeconds)}` : dailyAudio ? `Recorded · ${formatDuration(dailyAudio.duration)}` : "Speak into your device microphone"}</span></div></div></Field></div><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] text-slate-500">{dailyPhotos.length} photo(s) · {dailyAudio ? `voice recorded ${formatDuration(dailyAudio.duration)}` : isRecordingAudio ? "recording in progress" : "voice recording required"}</span><Button type="submit" size="sm" disabled={isRecordingAudio} className="bg-teal-800 text-white hover:bg-teal-700 disabled:opacity-50"><Send className="size-3.5" />Submit daily update</Button></div></form>}
            <div className="space-y-3">{selectedPackageReports.map((report) => <article key={report.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-800">{formatDate(report.date)}{report.quantity && <span className="font-normal text-slate-500"> · {report.quantity}</span>}</p><Status value={report.status} /></div><p className="mt-2 text-xs leading-relaxed text-slate-600">{report.progress}</p>{(report.photos.length > 0 || report.audio) && <div className="mt-2 flex flex-wrap items-center gap-2">{report.photos.map((photo) => <span key={photo} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[9px] text-slate-600"><FileText className="size-3" />{photo}</span>)}{report.audio && (report.audio.startsWith("blob:") ? <audio controls src={report.audio} className="h-9 max-w-full" aria-label={`Voice update from ${formatDate(report.date)}`} /> : <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[9px] text-blue-700"><Mic className="size-3" />Demo voice recording{report.audioDuration ? ` · ${formatDuration(report.audioDuration)}` : ""}</span>)}</div>}{report.reviewNote && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-[10px] text-rose-700">Engineer note: {report.reviewNote}</p>}{role === "engineer" && report.status === "Pending engineer review" && <div className="mt-3 space-y-2"><TextInput aria-label="Review note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Review note (required if returning)" className="w-full" /><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => decideDailyReport(report.id, "Returned")}>Return</Button><Button size="sm" onClick={() => decideDailyReport(report.id, "Verified")} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Verify</Button></div></div>}</article>)}{selectedPackageReports.length === 0 && <Empty title="No daily updates yet" detail="The Supervisor’s day-by-day reports will appear here with attached photo and audio evidence." />}</div>
          </CardContent></Card>
          <div className="space-y-4"><Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-sm"><MessageCircle className="size-4 text-teal-700" />Work package chat</CardTitle><p className="text-[10px] text-slate-500">Questions and clearance requests stay with this package.</p></CardHeader><CardContent className="space-y-3 p-4"><form noValidate onSubmit={(event) => sendChat(event, "Message")} className="flex gap-2"><TextInput value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Ask or reply..." className="flex-1" /><Button type="submit" size="icon-sm" aria-label="Send message"><Send className="size-3.5" /></Button></form><form noValidate onSubmit={(event) => sendChat(event, "Clearance request")} className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3"><p className="text-[10px] font-semibold text-amber-900">Request internal clearance</p><div className="flex gap-2"><TextInput value={clearanceMessage} onChange={(event) => setClearanceMessage(event.target.value)} placeholder="What approval is needed?" className="flex-1" /><Button type="submit" size="sm" variant="outline" className="border-amber-300 bg-white">Send</Button></div></form><div className="max-h-[430px] space-y-2 overflow-y-auto">{selectedPackageMessages.map((message) => <article key={message.id} className={`rounded-lg border p-3 ${message.kind === "Clearance request" ? "border-amber-200 bg-amber-50/60" : "border-slate-100 bg-slate-50"}`}><div className="flex flex-wrap items-center gap-2"><b className="text-[10px] text-slate-700">{message.author}</b><span className="text-[9px] text-slate-400">{roleLabels[message.role]}</span>{message.kind === "Clearance request" && <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-amber-800">Clearance {message.resolved ? "resolved" : "open"}</span>}</div><p className="mt-2 text-xs leading-relaxed text-slate-600">{message.message}</p>{message.kind === "Clearance request" && role === "engineer" && !message.resolved && <Button size="xs" variant="outline" className="mt-2" onClick={() => resolveClearance(message.id)}><Check className="size-3" />Mark resolved</Button>}</article>)}{selectedPackageMessages.length === 0 && <p className="py-4 text-center text-[10px] text-slate-400">No messages for this work package.</p>}</div></CardContent></Card>
          </div>
        </div>
      </>;
    }

    return <>
      <SectionTitle eyebrow="Low Side" title="Work packages" description="Each BOQ work item opens its own daily progress page and discussion thread. Assign a dedicated Supervisor or share one across packages." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"><div><p className="text-xs font-semibold text-slate-800">{project?.name}</p><p className="mt-1 text-[10px] text-slate-500">Engineer {roleNames.engineer} reviews every daily submission.</p></div><span className="text-[10px] text-slate-500">{projectPackages.length} work packages</span></div>
      <div className="grid gap-3 lg:grid-cols-2">{projectPackages.map((workPackage) => {
        const line = projectLines.find((item) => item.id === workPackage.lineId);
        if (!line) return null;
        const reports = dailyReports.filter((report) => report.packageId === workPackage.id);
        return <Card key={workPackage.id} className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{line.item}</p><p className="mt-1 text-[10px] text-slate-500">{line.duration ? `${line.duration} days` : "Duration after clearance"} · {formatDate(line.startDate)} – {formatDate(line.endDate)}</p></div><Status value={line.status} /></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Info label="Supervisor" value={workPackage.supervisor} />{role === "pm" || role === "engineer" ? <Field label="Assign Supervisor"><WorkflowSelect value={workPackage.supervisor} onValueChange={(value) => updatePackageSupervisor(workPackage.id, value)} className="w-full" options={[roleNames.supervisor, "Faisal M."].map((name) => ({ value: name, label: name }))} /></Field> : <Info label="Engineer" value={workPackage.engineer} />}</div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-slate-500">{reports.length} daily update(s) · {reports.filter((report) => report.status === "Pending engineer review").length} awaiting review</span><Button size="sm" variant="outline" onClick={() => setSelectedPackageId(workPackage.id)}>Open package<ArrowRight className="size-3.5" /></Button></div></CardContent></Card>;
      })}</div>
    </>;
  };

  const renderLocalPurchases = () => <>
    <SectionTitle eyebrow="Supervisor purchases" title="Local purchases" description="Record a site purchase with its category, reason, amount, and bill. The assigned Engineer reviews and approves it." />
    {role === "supervisor" && <Card className="mb-4 border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100"><CardTitle className="text-sm">Submit a local purchase</CardTitle></CardHeader><CardContent className="p-4"><form noValidate onSubmit={submitLocalPurchase} className="grid gap-3 md:grid-cols-2"><Field label="Work package"><WorkflowSelect value={selectedPackageId ?? projectPackages[0]?.id ?? ""} onValueChange={setSelectedPackageId} className="w-full" options={projectPackages.map((workPackage) => ({ value: workPackage.id, label: projectLines.find((line) => line.id === workPackage.lineId)?.item ?? "Work package" }))} /></Field><Field label="Category"><WorkflowSelect value={purchaseCategory} onValueChange={setPurchaseCategory} className="w-full" options={["Materials", "Tools", "Consumables", "Transport", "Other"].map((category) => ({ value: category, label: category }))} /></Field><Field label="Amount (₹)"><TextInput type="number" min="1" step="0.01" value={purchaseAmount} onChange={(event) => setPurchaseAmount(event.target.value)} placeholder="0" className="w-full" /></Field><Field label="Bill / invoice"><TextInput type="file" accept="image/*,.pdf" onChange={(event) => setPurchaseBill(event.target.files?.[0]?.name ?? "")} className="h-auto w-full py-2" /></Field><div className="md:col-span-2"><Field label="Why was this purchased?"><Textarea value={purchaseReason} onChange={(event) => setPurchaseReason(event.target.value)} rows={2} placeholder="Explain the site need and how it supports the work package..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-700" /></Field></div><div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2"><span className="text-[10px] text-slate-500">{purchaseBill || "No bill attached yet"}</span><Button type="submit" className="bg-teal-800 text-white hover:bg-teal-700"><Send className="size-3.5" />Send to Engineer</Button></div></form></CardContent></Card>}
    <div className="space-y-3">{localPurchases.filter((purchase) => purchase.projectId === project?.id).map((purchase) => <Card key={purchase.id} className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-800"><FileText className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-xs text-slate-800">{purchase.category} · {money(purchase.amount)}</b><Status value={purchase.status} /></div><p className="mt-1 text-xs text-slate-600">{purchase.reason}</p><p className="mt-1 text-[10px] text-slate-400">{projectLines.find((line) => line.id === packages.find((workPackage) => workPackage.id === purchase.packageId)?.lineId)?.item} · Bill {purchase.bill || "not attached"}</p></div>{role === "engineer" && purchase.status === "Pending engineer approval" && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => decideLocalPurchase(purchase.id, "Returned")}>Return</Button><Button size="sm" onClick={() => decideLocalPurchase(purchase.id, "Approved")} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Approve</Button></div>}</CardContent></Card>)}{localPurchases.filter((purchase) => purchase.projectId === project?.id).length === 0 && <Empty title="No local purchase bills" detail="Supervisor-submitted site purchases will appear here for Engineer approval." />}</div>
  </>;

  const renderEngineerReview = () => {
    const pendingReports = dailyReports.filter((report) => report.projectId === project?.id && report.status === "Pending engineer review");
    const pendingPurchases = localPurchases.filter((purchase) => purchase.projectId === project?.id && purchase.status === "Pending engineer approval");
    return <>
      <SectionTitle eyebrow="Engineer" title="Review & verify" description="Review daily work evidence for each work package and approve Supervisor local purchase bills." />
      <div className="grid gap-4 xl:grid-cols-2"><Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100"><CardTitle className="text-sm">Daily progress · {pendingReports.length} pending</CardTitle></CardHeader><CardContent className="space-y-3 p-4">{pendingReports.map((report) => <article key={report.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><b className="text-xs text-slate-800">{projectLines.find((line) => line.id === packages.find((workPackage) => workPackage.id === report.packageId)?.lineId)?.item}</b><Status value={report.status} /></div><p className="mt-2 text-xs text-slate-600">{report.progress}</p><p className="mt-1 text-[10px] text-slate-400">{formatDate(report.date)}{report.quantity ? ` · ${report.quantity}` : ""} · {report.photos.length} photos{report.audio ? " · audio attached" : ""}</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => decideDailyReport(report.id, "Returned")}>Return</Button><Button size="sm" onClick={() => decideDailyReport(report.id, "Verified")} className="bg-teal-800 text-white hover:bg-teal-700"><BadgeCheck className="size-3.5" />Verify</Button></div></article>)}{pendingReports.length === 0 && <Empty title="No daily updates awaiting review" detail="New daily reports will appear here when Supervisors submit them." />}</CardContent></Card><Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100"><CardTitle className="text-sm">Local purchase bills · {pendingPurchases.length} pending</CardTitle></CardHeader><CardContent className="space-y-3 p-4">{pendingPurchases.map((purchase) => <article key={purchase.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><b className="text-xs text-slate-800">{purchase.category} · {money(purchase.amount)}</b><Status value={purchase.status} /></div><p className="mt-2 text-xs text-slate-600">{purchase.reason}</p><p className="mt-1 text-[10px] text-slate-400">Bill: {purchase.bill || "not attached"}</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => decideLocalPurchase(purchase.id, "Returned")}>Return bill</Button><Button size="sm" onClick={() => decideLocalPurchase(purchase.id, "Approved")} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Approve bill</Button></div></article>)}{pendingPurchases.length === 0 && <Empty title="No local purchase bills awaiting approval" detail="Bills submitted by Supervisors will appear here." />}</CardContent></Card></div>
    </>;
  };

  const renderAdditionalMaterials = () => {
    const requests = materialRequests.filter((request) => request.projectId === project?.id);
    const canReview = role === "pm";
    const canPurchase = role === "purchase";
    const source = materialSourceTab === "BOQ materials" ? "BOQ" : "Additional";
    const sourceRequests = requests.filter((request) => request.source === source);
    const roleRequests = canPurchase ? sourceRequests.filter((request) => ["Approved for purchase", "Ordered", "Received"].includes(request.status)) : sourceRequests;
    const visibleRequests = roleRequests.filter((request) => {
      const matchesSearch = `${request.id} ${request.requestedBy} ${request.items.map((line) => `${line.material} ${line.reason}`).join(" ")}`.toLowerCase().includes(additionalMaterialSearch.toLowerCase());
      const matchesStatus = additionalMaterialStatusFilter === "All requests" || request.status === additionalMaterialStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const pendingCount = sourceRequests.filter((request) => request.status === "Pending PM review").length;
    const approvedCount = sourceRequests.filter((request) => request.status === "Approved for purchase").length;
    const orderedCount = sourceRequests.filter((request) => request.status === "Ordered").length;
    const receivedCount = sourceRequests.filter((request) => request.status === "Received").length;
    const units = ["pcs", "units", "m", "m²", "kg", "sets", "rolls", "boxes", "lot"];
    const activeItemCount = (request: MaterialRequestGroup) => request.items.filter((line) => !line.removed).length;
    const sourceRequestCount = (tab: "BOQ materials" | "Additional materials") => requests.filter((request) => request.source === (tab === "BOQ materials" ? "BOQ" : "Additional") && (!canPurchase || ["Approved for purchase", "Ordered", "Received"].includes(request.status))).length;
    return <>
      <SectionTitle eyebrow="Material requests" title="Materials" description={role === "engineer" ? "Create one request group with several materials. The PM reviews the complete group before Purchase receives it." : canReview ? "Review each request group, adjust quantities or remove lines, then approve the group for Purchase." : canPurchase ? "Work from PM-approved material groups and update each group through ordering and delivery." : "Follow grouped material requests from Engineer submission through Purchase."} action={role === "engineer" ? <Button onClick={() => openMaterialRequest(source)} disabled={source === "BOQ" && project?.boqStatus !== "Approved"} className="bg-teal-800 text-white hover:bg-teal-700"><Plus className="size-3.5" />New {source === "BOQ" ? "BOQ" : "additional"} request group</Button> : undefined} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Material source">
          {(["BOQ materials", "Additional materials"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={materialSourceTab === tab} onClick={() => { setMaterialSourceTab(tab); setAdditionalMaterialStatusFilter("All requests"); }} className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${materialSourceTab === tab ? "bg-white text-teal-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{tab}<span className="ml-2 rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[9px]">{sourceRequestCount(tab)}</span></button>)}
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[9px] font-semibold text-teal-800">One request group · multiple material lines</span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: canPurchase ? "In purchase queue" : canReview ? "Needs your review" : "Awaiting PM review", value: canPurchase ? approvedCount + orderedCount : pendingCount, hint: canPurchase ? "Approved or ordering" : "Request groups", tone: "amber" },
          { label: "Ready for purchase", value: approvedCount, hint: "PM approved groups", tone: "blue" },
          { label: "On order", value: orderedCount, hint: "Purchase in progress", tone: "violet" },
          { label: "Received", value: receivedCount, hint: "Delivered groups", tone: "teal" },
        ].map((item) => <Card key={item.label} className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="flex items-center gap-3 p-4"><span className={`grid size-10 place-items-center rounded-xl ${item.tone === "amber" ? "bg-amber-50 text-amber-700" : item.tone === "blue" ? "bg-blue-50 text-blue-700" : item.tone === "violet" ? "bg-violet-50 text-violet-700" : "bg-teal-50 text-teal-700"}`}><PackageCheck className="size-4" /></span><span className="min-w-0"><span className="block text-[10px] font-medium text-slate-500">{item.label}</span><b className="mt-0.5 block text-xl leading-none text-slate-900">{item.value}</b><span className="mt-1 block text-[9px] text-slate-400">{item.hint}</span></span></CardContent></Card>)}
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
        <CardHeader className="border-b border-slate-100 pb-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-sm">{canPurchase ? "Approved purchase groups" : canReview ? "PM review queue" : "Request groups"}</CardTitle><p className="mt-1 text-[10px] text-slate-500">{roleRequests.length} {materialSourceTab.toLowerCase()} group(s) · {project?.name}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-medium text-slate-600">{materialSourceTab}</span></div></CardHeader>
        <div className="grid gap-2 border-b border-slate-100 p-3 sm:grid-cols-[minmax(0,1fr)_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" /><TextInput value={additionalMaterialSearch} onChange={(event) => setAdditionalMaterialSearch(event.target.value)} placeholder="Search request ID or material" aria-label="Search material request groups" className="pl-9" /></div><WorkflowSelect value={additionalMaterialStatusFilter} onValueChange={setAdditionalMaterialStatusFilter} ariaLabel="Filter material request groups by status" options={["All requests", "Pending PM review", "Approved for purchase", "Returned", "Ordered", "Received"].map((status) => ({ value: status, label: status }))} /></div>
        <CardContent className="space-y-3 p-3 sm:p-4">
          {visibleRequests.map((request) => <article key={request.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700"><PackageCheck className="size-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-bold text-slate-900">{request.id}</h3><Status value={request.status} /><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${request.source === "BOQ" ? "bg-indigo-50 text-indigo-700" : "bg-slate-200 text-slate-700"}`}>{request.source === "BOQ" ? "BOQ materials" : "Additional materials"}</span></div><p className="mt-1 text-[9px] text-slate-500">Requested by {request.requestedBy} · {formatDate(request.requestedDate)} · {activeItemCount(request)} item(s)</p></div></div>{canReview && request.status === "Pending PM review" && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => reviewMaterialRequest(request.id, "Returned")}>Return group</Button><Button size="sm" onClick={() => approveMaterialRequest(request.id)} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Approve group</Button></div>}{canPurchase && request.status === "Approved for purchase" && <Button size="sm" onClick={() => reviewMaterialRequest(request.id, "Ordered")} className="bg-teal-800 text-white hover:bg-teal-700"><ShoppingCart className="size-3.5" />Mark group ordered</Button>}{canPurchase && request.status === "Ordered" && <Button size="sm" onClick={() => reviewMaterialRequest(request.id, "Received")} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Mark group received</Button>}</header>
            <div className="divide-y divide-slate-100">{request.items.map((line) => <div key={line.id} className={`grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(120px,0.55fr)_minmax(145px,0.65fr)_minmax(160px,0.9fr)_auto] ${line.removed ? "bg-slate-50 opacity-60" : ""}`}><div className="min-w-0"><p className={`text-[11px] font-semibold text-slate-800 ${line.removed ? "line-through" : ""}`}>{line.material}</p><p className="mt-1 text-[9px] text-slate-500">{line.quantity} {line.unit} requested <span className="mx-1 text-slate-300">·</span> Needed by {formatDate(line.wantedDate)}</p>{line.reason && <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{line.reason}</p>}</div><div className="text-[10px] text-slate-600"><span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">BOQ / requested</span>{line.source === "BOQ" ? line.boqLineId : "Additional"}</div><div>{canReview && request.status === "Pending PM review" && !line.removed ? <Field label="Approved quantity"><TextInput type="number" min="0.01" step="any" value={line.approvedQuantity ?? line.quantity} onChange={(event) => updateMaterialRequestLine(request.id, line.id, { approvedQuantity: event.target.value })} aria-label={`Approved quantity for ${line.material}`} /></Field> : line.removed ? <span className="text-[10px] font-semibold text-rose-700">Removed by PM</span> : <><span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">PM approved</span><span className="text-[11px] font-semibold text-slate-800">{line.approvedQuantity ?? (request.status === "Pending PM review" ? "Awaiting review" : line.quantity)} {line.approvedQuantity ? line.unit : ""}</span></>}</div><div><span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">Wanted date</span><span className="text-[10px] text-slate-700">{formatDate(line.wantedDate)}</span></div><div className="flex items-center justify-end">{canReview && request.status === "Pending PM review" && !line.removed && <Button size="icon-sm" variant="ghost" aria-label={`Remove ${line.material} from request`} title="Remove item from request" onClick={() => updateMaterialRequestLine(request.id, line.id, { removed: true })} className="text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></Button>}</div></div>)}</div>
            {request.reviewNote && <p className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-[10px] text-rose-700">PM note: {request.reviewNote}</p>}
          </article>)}
          {visibleRequests.length === 0 && <Empty title={roleRequests.length === 0 ? (canPurchase ? "Purchase queue is clear" : canReview ? "No requests need review" : "No material request groups yet") : "No matching request groups"} detail={roleRequests.length === 0 ? (canPurchase ? "PM-approved groups will appear here ready for ordering." : canReview ? "Engineer request groups for this source will appear here." : "Create a request group to send several material lines to the PM together.") : "Try a different search term or status filter."} />}
        </CardContent>
      </Card>

      <Dialog open={materialRequestModalOpen} onOpenChange={setMaterialRequestModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>New {materialDraftSource === "BOQ" ? "BOQ" : "additional materials"} request group</DialogTitle><DialogDescription>Add several lines to one request. The PM will review the quantities and approve the group before it reaches Purchase.</DialogDescription></DialogHeader>
          {materialDraftSource === "BOQ" && project?.boqStatus !== "Approved" && <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">The BOQ must be approved before requesting High Side materials.</div>}
          <form noValidate onSubmit={submitMaterialRequest} className="space-y-3">
            {materialDraftLines.map((line, index) => <div key={line.key} className="rounded-xl border border-slate-200 p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Material {index + 1}</p>{materialDraftLines.length > 1 && <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove material row ${index + 1}`} onClick={() => setMaterialDraftLines((current) => current.filter((item) => item.key !== line.key))} className="text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></Button>}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {materialDraftSource === "BOQ" ? <Field label="Select BOQ material"><WorkflowSelect value={line.boqLineId ?? "choose-material"} onValueChange={(value) => value === "choose-material" ? updateMaterialDraftLine(line.key, { boqLineId: undefined, material: "", unit: "", quantity: "", wantedDate: "", reason: "" }) : selectBoqMaterial(line.key, value)} ariaLabel={`BOQ material ${index + 1}`} options={[{ value: "choose-material", label: "Choose a High Side item" }, ...projectLines.filter((boqLine) => boqLine.section === "High Side").map((boqLine) => ({ value: boqLine.id, label: `${boqLine.item} · ${boqLine.quantity} ${boqLine.unit}` }))]} /></Field> : <Field label="Material / specification"><TextInput value={line.material} onChange={(event) => updateMaterialDraftLine(line.key, { material: event.target.value })} placeholder="e.g. Copper pipe fittings" aria-label={`Additional material ${index + 1}`} /></Field>}
                {materialDraftSource === "BOQ" ? <Field label="Unit"><TextInput value={line.unit} readOnly placeholder="Set from BOQ" aria-label={`Unit for material ${index + 1}`} /></Field> : <Field label="Unit"><WorkflowSelect value={line.unit || "pcs"} onValueChange={(value) => updateMaterialDraftLine(line.key, { unit: value })} ariaLabel={`Unit for material ${index + 1}`} options={[...units, "cylinders", "tubes"].map((unit) => ({ value: unit, label: unit }))} /></Field>}
                <Field label="Requested quantity"><TextInput type="number" min="0.01" step="any" value={line.quantity} onChange={(event) => updateMaterialDraftLine(line.key, { quantity: event.target.value })} placeholder="0" aria-label={`Quantity for material ${index + 1}`} /></Field>
                <Field label="Needed on site by"><DatePicker value={line.wantedDate} minDate={todayInIndiaISO()} onValueChange={(value) => updateMaterialDraftLine(line.key, { wantedDate: value })} ariaLabel={`Wanted date for material ${index + 1}`} /></Field>
                <div className="sm:col-span-2"><Field label="Why is this material needed?"><Textarea value={line.reason} onChange={(event) => updateMaterialDraftLine(line.key, { reason: event.target.value })} rows={2} placeholder={materialDraftSource === "BOQ" ? "What site need should this material support?" : "Why is this extra material needed outside the BOQ?"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-700" /></Field></div>
              </div>
            </div>)}
            <Button type="button" variant="outline" onClick={addMaterialDraftLine}><Plus className="size-3.5" />Add another material</Button>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setMaterialRequestModalOpen(false)}>Cancel</Button><Button type="submit" disabled={materialDraftSource === "BOQ" && project?.boqStatus !== "Approved"} className="bg-teal-800 text-white hover:bg-teal-700"><Send className="size-3.5" />Send request group to PM</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>;
  };

  const renderAdditionalWorks = () => {
    const allWork = additionalWorks.filter((work) => work.projectId === project?.id);
    const works = role === "supervisor" ? allWork.filter((work) => work.supervisor === personName) : allWork;
    const units = ["pcs", "units", "m", "m²", "kg", "sets", "hours", "days", "locations", "lot"];
    return <>
      <SectionTitle eyebrow="Out of BOQ" title="Additional works" description={role === "engineer" ? "Assign extra site work directly to a Supervisor. These activities are tracked here and do not alter the BOQ." : role === "supervisor" ? "Extra site activities assigned to you by the Engineer." : "Review extra site activities and their assigned Supervisors."} action={role === "engineer" ? <span className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-medium text-slate-600">Separate from BOQ</span> : undefined} />
      {role === "engineer" && <Card className="mb-4 border-0 shadow-sm ring-1 ring-slate-200/70">
        <CardHeader className="border-b border-slate-100"><CardTitle className="text-sm">Assign additional work</CardTitle><p className="text-[10px] text-slate-500">Create a direct work assignment for a Supervisor without adding a BOQ line.</p></CardHeader>
        <CardContent className="p-4"><form noValidate onSubmit={submitAdditionalWork} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Work activity"><TextInput name="title" placeholder="e.g. Temporary pipe rerouting" /></Field>
          <Field label="Assign Supervisor"><WorkflowSelect name="supervisor" ariaLabel="Assign Supervisor" defaultValue={roleNames.supervisor} options={[roleNames.supervisor, "Faisal M."].map((name) => ({ value: name, label: name }))} /></Field>
          <Field label="Quantity"><TextInput name="quantity" type="number" min="0" step="any" placeholder="Optional" /></Field>
          <Field label="Unit"><WorkflowSelect name="unit" ariaLabel="Work unit" defaultValue="pcs" options={units.map((unit) => ({ value: unit, label: unit }))} /></Field>
          <Field label="Planned start"><DatePicker value={additionalWorkStartDate} onValueChange={setAdditionalWorkStartDate} ariaLabel="Planned start" /><input type="hidden" name="startDate" value={additionalWorkStartDate} /></Field>
          <Field label="Planned finish"><DatePicker value={additionalWorkEndDate} onValueChange={setAdditionalWorkEndDate} minDate={additionalWorkStartDate} ariaLabel="Planned finish" /><input type="hidden" name="endDate" value={additionalWorkEndDate} /></Field>
          <div className="sm:col-span-2"><Field label="Work details / site instruction"><Textarea name="description" rows={2} placeholder="Describe the extra work and location." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-700" /></Field></div>
          <div className="flex items-end"><Button type="submit" className="w-full bg-teal-800 text-white hover:bg-teal-700"><HardHat className="size-3.5" />Assign work</Button></div>
        </form></CardContent>
      </Card>}
      <div className="space-y-3">{works.map((work) => <Card key={work.id} className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800"><HardHat className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-slate-800">{work.title}</b><Status value={work.status} /><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">Additional · outside BOQ</span></div><p className="mt-1 text-[10px] text-slate-500">Supervisor: {work.supervisor}{work.quantity ? ` · ${work.quantity} ${work.unit}` : ""}{work.startDate || work.endDate ? ` · ${formatDate(work.startDate)} – ${formatDate(work.endDate)}` : ""}</p>{work.description && <p className="mt-2 text-xs leading-relaxed text-slate-600">{work.description}</p>}</div>{role === "supervisor" && work.status !== "Complete" && <div className="flex shrink-0 gap-2">{work.status === "Assigned" && <Button size="sm" variant="outline" onClick={() => updateAdditionalWorkStatus(work.id, "In progress")}>Start work</Button>}<Button size="sm" onClick={() => updateAdditionalWorkStatus(work.id, "Complete")} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Mark complete</Button></div>}</CardContent></Card>)}{works.length === 0 && <Empty title={role === "supervisor" ? "No additional work assigned to you" : "No additional work yet"} detail={role === "supervisor" ? "The Engineer’s extra work assignments will appear here." : "Add work that needs to be assigned to a Supervisor without changing the BOQ."} />}</div>
    </>;
  };

  const renderProcurement = () => {
    const orderLines = projectLines.filter((line) => selectedOrder?.itemIds.includes(line.id));
    return <>
      <SectionTitle eyebrow="Purchase team" title="Order history" description="Historical group orders and invoices remain available here. New BOQ and additional material requests are managed from Materials after PM approval." />
      <Card className="mb-4 border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="flex flex-row items-center justify-between border-b border-slate-100"><div><CardTitle className="text-sm">Approved materials</CardTitle><p className="mt-1 text-[10px] text-slate-500">Purchase requests are managed from the Materials tab after PM quantity approval.</p></div></CardHeader><CardContent className="space-y-2 p-4"><div className="rounded-lg bg-teal-50 p-3 text-xs leading-relaxed text-teal-900">High Side BOQ lines no longer release directly to Purchase. Open Materials to see approved request quantities, place orders, and confirm delivery.</div>{currentOrders.length > 0 && <p className="text-[10px] text-slate-500">{currentOrders.length} historical group order(s) remain available below for bill and approval tracking.</p>}</CardContent></Card>
      {selectedOrder && <Card className="mb-4 border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="flex flex-row items-start justify-between border-b border-slate-100"><div><CardTitle className="text-sm">Order group {selectedOrder.id}</CardTitle><p className="mt-1 text-[10px] text-slate-500">{orderLines.length} BOQ item(s) · single supplier bill</p></div><Status value={selectedOrder.status} /></CardHeader><CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr]"><div className="space-y-2">{orderLines.map((line) => <div key={line.id} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-800">{line.item}</p><p className="mt-1 text-[10px] text-slate-500">{line.quantity || "Qty pending"} {line.unit}</p></div>)}<p className="text-[10px] text-slate-500">Bill attached: {selectedOrder.bill || "No bill attached"}</p></div><form noValidate onSubmit={saveOrderDetails} className="space-y-3"><Field label="Supplier"><TextInput value={orderSupplier || selectedOrder.supplier} onChange={(event) => setOrderSupplier(event.target.value)} placeholder="Supplier name" className="w-full" /></Field><div className="grid gap-2 sm:grid-cols-2"><Field label="Order date"><TextInput type="date" value={orderDate || selectedOrder.orderDate} onChange={(event) => setOrderDate(event.target.value)} className="w-full" /></Field><Field label="Expected delivery"><TextInput type="date" value={orderExpectedDate || selectedOrder.expectedDate} onChange={(event) => setOrderExpectedDate(event.target.value)} className="w-full" /></Field></div><Field label="Received date"><TextInput type="date" value={orderReceivedDate || selectedOrder.receivedDate} onChange={(event) => setOrderReceivedDate(event.target.value)} className="w-full" /></Field><Field label="Total bill amount (₹)"><TextInput type="number" min="1" step="0.01" value={orderAmount || String(selectedOrder.amount || "")} onChange={(event) => setOrderAmount(event.target.value)} placeholder="Enter invoice total" className="w-full" /></Field><Field label="Group bill"><TextInput type="file" accept="image/*,.pdf" onChange={(event) => setOrderBill(event.target.files?.[0]?.name ?? "")} className="h-auto w-full py-2" /></Field><div className="flex flex-wrap gap-2"><Button type="submit" size="sm" variant="outline">Save details</Button>{selectedOrder.status === "Draft" && <Button type="button" size="sm" onClick={() => { if (!(orderSupplier || selectedOrder.supplier).trim() || !(orderDate || selectedOrder.orderDate) || !(orderExpectedDate || selectedOrder.expectedDate)) { setValidationError("Enter a supplier and order and expected delivery dates before marking this group ordered."); return; } saveOrder({ supplier: orderSupplier || selectedOrder.supplier, orderDate: orderDate || selectedOrder.orderDate, expectedDate: orderExpectedDate || selectedOrder.expectedDate, status: "Ordered" }); setNotice("Group order marked as ordered."); }}>Mark ordered</Button>}{selectedOrder.status === "Ordered" && <Button type="button" size="sm" onClick={() => { saveOrder({ receivedDate: orderReceivedDate || new Date().toISOString().slice(0, 10), status: "Received" }); setNotice("Group order marked received."); }}>Mark received</Button>}{["Ordered", "Received", "Returned"].includes(selectedOrder.status) && <Button type="button" size="sm" className="bg-teal-800 text-white hover:bg-teal-700" onClick={submitOrderBill}><Send className="size-3.5" />Send bill to Super Admin</Button>}</div></form></CardContent></Card>}
      <div className="space-y-2">{currentOrders.map((order) => <button key={order.id} onClick={() => { setSelectedOrderId(order.id); setOrderSupplier(order.supplier); setOrderDate(order.orderDate); setOrderExpectedDate(order.expectedDate); setOrderReceivedDate(order.receivedDate); setOrderAmount(String(order.amount || "")); setOrderBill(""); }} className={`flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left ${selectedOrder?.id === order.id ? "border-teal-300" : "border-slate-200"}`}><span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-700"><PackageCheck className="size-4" /></span><span className="flex-1"><b className="block text-xs text-slate-800">{order.id} · {order.itemIds.length} BOQ items</b><span className="text-[10px] text-slate-500">{order.supplier || "Supplier pending"} · {order.bill || "Bill pending"}</span></span><Status value={order.status} /></button>)}</div>
    </>;
  };

  const renderPurchaseApproval = () => {
    const pendingOrders = orders.filter((order) => order.status === "Pending Super Admin approval");
    return <>
      <SectionTitle eyebrow="Super Admin" title="Purchase approval" description="Review grouped order invoices across the portfolio. Approvals update the correct project cost ledger." />
      <div className="space-y-3">{pendingOrders.map((order) => {
        const orderProject = projects.find((item) => item.id === order.projectId);
        const orderItems = boqLines.filter((line) => line.projectId === order.projectId && order.itemIds.includes(line.id));
        return <Card key={order.id} className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-slate-800">{order.id} · {order.itemIds.length} items</b><Status value={order.status} /></div><p className="mt-1 text-[11px] font-semibold text-teal-800">{orderProject?.name ?? "Project"}</p><p className="mt-1 text-[10px] text-slate-500">{order.supplier || "Supplier not set"} · Ordered {formatDate(order.orderDate)} · Received {formatDate(order.receivedDate)}</p><div className="mt-3 flex flex-wrap gap-2">{orderItems.map((line) => <span key={line.id} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-600">{line.item}</span>)}</div><div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600"><span>Bill: <b>{order.bill || "No bill attached"}</b></span><span>Invoice amount: <b>{money(order.amount)}</b></span></div>{order.returnNote && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-[10px] text-rose-700">Returned note: {order.returnNote}</p>}</div><div className="min-w-48 space-y-2"><TextInput value={orderReturnNote} onChange={(event) => setOrderReturnNote(event.target.value)} placeholder="Return note (optional)" className="w-full" /><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => decideOrder(order.id, "Returned")}>Return</Button><Button size="sm" onClick={() => decideOrder(order.id, "Approved")} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Approve</Button></div></div></CardContent></Card>;
      })}{pendingOrders.length === 0 && <Empty title="No group order bills awaiting approval" detail="Purchase will send group bills here once an order is placed and the invoice is attached." />}</div>
    </>;
  };

  const renderCosts = () => {
    const portfolio = projects.map((item) => {
      const finance = getProjectCostData(item);
      return {
        project: item,
        estimate: finance.lines.reduce((sum, line) => sum + (line.estimate ?? 0), 0),
        pricedCount: finance.lines.filter((line) => line.estimate !== null).length,
        approved: finance.spendRecords.filter((record) => record.status === "Approved").reduce((sum, record) => sum + record.amount, 0),
        pending: finance.spendRecords.filter((record) => record.status.startsWith("Pending")).reduce((sum, record) => sum + record.amount, 0),
      };
    });
    const totals = portfolio.reduce((sum, row) => ({
      budget: sum.budget + row.project.budget,
      estimate: sum.estimate + row.estimate,
      approved: sum.approved + row.approved,
      pending: sum.pending + row.pending,
    }), { budget: 0, estimate: 0, approved: 0, pending: 0 });
    return <>
      <SectionTitle eyebrow="Financial control" title="Portfolio costs" description="Compare approved budgets, BOQ estimates, approved spend, and pending bills across projects." action={<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-800">Illustrative demo figures</span>} />
      <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-900">Sample budgets, rates, invoices, and progress are included so the ERP screens can be reviewed end to end. Replace them with client-approved project figures before operational use.</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Portfolio budget" value={money(totals.budget)} detail={`${projects.length} demo projects`} icon={<WalletCards className="size-4" />} />
        <Metric label="BOQ estimate" value={money(totals.estimate)} detail="Priced High Side + Low Side lines" icon={<FileSpreadsheet className="size-4" />} />
        <Metric label="Approved spend" value={money(totals.approved)} detail="Approved group and local bills" icon={<CheckCircle2 className="size-4" />} />
        <Metric label="Awaiting approval" value={money(totals.pending)} detail="Pending group and local bills" icon={<ClipboardCheck className="size-4" />} />
      </div>
      <Card className="mt-4 border-0 shadow-sm ring-1 ring-slate-200/70">
        <CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="text-[15px]">Project financial summary</CardTitle><p className="text-xs text-slate-500">Open a project to review its BOQ cost plan, invoice ledger, and daily output.</p></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Project</th><th className="px-3 py-3">BOQ status</th><th className="px-3 py-3 text-right">Budget</th><th className="px-3 py-3 text-right">BOQ estimate</th><th className="px-3 py-3 text-right">Approved spend</th><th className="px-3 py-3 text-right">Pending bills</th><th className="px-5 py-3"></th></tr></thead><tbody>{portfolio.map((row) => <tr key={row.project.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-3"><p className="font-semibold text-slate-800">{row.project.name}</p><p className="mt-1 text-[10px] text-slate-400">{row.project.client} · PM {row.project.pm}{row.project.isDemo ? " · Demo" : ""}</p></td><td className="px-3 py-3"><Status value={row.project.boqStatus} /></td><td className="px-3 py-3 text-right font-medium tabular-nums">{money(row.project.budget)}</td><td className="px-3 py-3 text-right font-medium tabular-nums">{row.pricedCount ? money(row.estimate) : "Not priced"}</td><td className="px-3 py-3 text-right font-medium tabular-nums">{money(row.approved)}</td><td className="px-3 py-3 text-right font-medium tabular-nums">{money(row.pending)}</td><td className="px-5 py-3 text-right"><Button variant="outline" size="sm" onClick={() => openProject(row.project.id, "project-costs")}>Open costs</Button></td></tr>)}</tbody></table></div></CardContent>
      </Card>
    </>;
  };

  const renderProjectCosts = () => {
    if (!project) return null;
    const finance = getProjectCostData(project);
    return <>
      {project.isDemo && <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-900">Illustrative demo budget, BOQ rates, and bills are shown for this seeded project. Replace them with approved project figures before operational use.</div>}
      <WorkflowCosts
        projectName={project.name}
        budget={project.budget}
        lines={finance.lines}
        spendRecords={finance.spendRecords}
        progressRecords={finance.progressRecords}
        canEditBudget={role === "superadmin"}
        onSaveBudget={updateProjectBudget}
      />
    </>;
  };

  const renderProjectReports = () => {
    if (!project || role !== "superadmin") return null;
    const finance = getProjectCostData(project);
    return <ProjectReports
      project={project}
      preparedBy={personName}
      today={todayInIndiaISO()}
      boqLines={projectLines}
      materialRequests={materialRequests.filter((request) => request.projectId === project.id)}
      dailyReports={dailyReports.filter((report) => report.projectId === project.id)}
      additionalWorks={additionalWorks.filter((work) => work.projectId === project.id)}
      finance={{
        estimate: finance.lines.reduce((sum, line) => sum + (line.estimate ?? 0), 0),
        approved: finance.spendRecords.filter((record) => record.status === "Approved").reduce((sum, record) => sum + record.amount, 0),
        pending: finance.spendRecords.filter((record) => record.status.startsWith("Pending")).reduce((sum, record) => sum + record.amount, 0),
      }}
    />;
  };

  const renderHandover = () => {
    const items = projectLines.filter((line) => line.section === "Finalization & Handover");
    return <>
      <SectionTitle eyebrow="Project closeout" title="Finalization & handover" description="Track final performance checks, client inspection, documentation, and the final project handover." action={<Status value={project?.handoverStatus ?? "In progress"} />} />
      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardHeader className="border-b border-slate-100"><CardTitle className="text-sm">Closeout checklist</CardTitle></CardHeader><CardContent className="divide-y divide-slate-100 p-0">{items.map((line) => <div key={line.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-800"><ClipboardCheck className="size-4" /></span><div className="flex-1"><p className="text-xs font-semibold text-slate-800">{line.item}</p><p className="mt-1 text-[10px] text-slate-500">Duration and dates can be set when the closeout plan is confirmed.</p></div><WorkflowSelect ariaLabel={`${line.item} status`} disabled={role === "superadmin"} value={line.status} onValueChange={(value) => updateLine(line.id, "status", value)} className="w-full sm:w-40" options={["Not started", "In progress", "Complete"].map((value) => ({ value, label: value }))} /></div>)}</CardContent></Card>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><p className="max-w-2xl text-xs leading-relaxed text-slate-500">The Project Manager marks each closeout item complete. Once the full checklist is complete, submit the project for Super Admin handover approval.</p>{role === "pm" && <Button onClick={markHandoverReady} className="bg-teal-800 text-white hover:bg-teal-700">Ready for handover<ArrowRight className="size-3.5" /></Button>}{role === "superadmin" && project?.handoverStatus === "Ready for handover" && <Button onClick={approveHandover} className="bg-teal-800 text-white hover:bg-teal-700"><Check className="size-3.5" />Approve handover</Button>}</div>
    </>;
  };

  const renderProjectWorkspaceHeader = () => (
    <Card className="mb-5 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/70">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 h-7 px-2 text-[10px] text-slate-500" onClick={() => navigate("projects")}><ArrowLeft className="size-3.5" />All projects</Button>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight text-slate-900">{project?.name}</h1>{project?.isDemo && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-800">Demo project</span>}</div>
            <p className="mt-1 text-xs text-slate-500">{project?.client} · Project Manager {project?.pm} · Budget {project?.budget ? money(project.budget) : "Not allocated"}</p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-64"><Field label="Switch project"><WorkflowSelect ariaLabel="Switch project" value={selectedProjectId} onValueChange={selectProject} options={projects.map((item) => ({ value: item.id, label: item.name }))} /></Field></div>
        </div>
        <nav aria-label="Project workspace" className="flex gap-1 overflow-x-auto border-t border-slate-100 pt-3">
          {projectPages[role].map((item) => <button key={item} onClick={() => navigate(item)} aria-current={page === item ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${page === item ? "bg-teal-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><NavIcon page={item} />{pageLabels[item]}{item === "engineer-review" && projectOpenUpdateCount + projectOpenBillCount > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${page === item ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>{projectOpenUpdateCount + projectOpenBillCount}</span>}</button>)}
        </nav>
      </CardContent>
    </Card>
  );

  const content: Partial<Record<Page, ReactNode>> = {
    overview: renderOverview(),
    projects: renderProjects(),
    people: renderPeople(),
    boq: renderBoq(),
    work: renderWork(),
    "additional-materials": renderAdditionalMaterials(),
    "additional-works": renderAdditionalWorks(),
    procurement: renderProcurement(),
    "engineer-review": renderEngineerReview(),
    "purchase-approval": renderPurchaseApproval(),
    "local-purchases": renderLocalPurchases(),
    costs: renderCosts(),
    "project-costs": renderProjectCosts(),
    handover: renderHandover(),
    reports: renderProjectReports(),
  };

  return <div className="min-h-screen bg-[#f5f7f8] text-slate-900">
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 self-start flex-col overflow-y-auto border-r border-slate-200 bg-white xl:flex"><div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-100 px-4"><span className="grid size-9 place-items-center rounded-xl bg-teal-800 text-white"><Wrench className="size-[18px]" /></span><span><b className="block text-[17px] tracking-tight">estatio<span className="text-teal-700">.</span></b><small className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">MEP operations</small></span></div><div className="px-4 pt-5"><p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Workspace</p><nav className="space-y-1">{visiblePages.map((item) => <button key={item} onClick={() => navigate(item)} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-semibold transition ${page === item ? "bg-teal-50 text-teal-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><NavIcon page={item} />{pageLabels[item]}{item === "engineer-review" && openUpdateCount + openBillCount > 0 && <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">{openUpdateCount + openBillCount}</span>}{item === "purchase-approval" && openOrderCount > 0 && <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">{openOrderCount}</span>}</button>)}</nav></div><div className="mt-auto p-4"><div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3"><p className="flex items-center gap-2 text-[10px] font-bold text-teal-900"><ShieldCheck className="size-3.5" />Prototype workspace</p><p className="mt-1 text-[10px] leading-relaxed text-slate-500">Demo actions stay in local page state. No production data is connected.</p></div></div></aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-[68px] flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6 xl:px-8"><div className="flex items-center gap-2 xl:hidden"><span className="grid size-8 place-items-center rounded-lg bg-teal-800 text-white"><Wrench className="size-4" /></span><b className="text-sm">estatio<span className="text-teal-700">.</span></b></div><div className="hidden max-w-[55%] truncate text-[11px] text-slate-400 xl:block">Workspace <span className="mx-2">/</span>{isProjectPage && <><span>{project?.name}</span><span className="mx-2">/</span></>}<b className="text-slate-700">{pageLabels[page]}</b></div><div className="ml-auto flex items-center gap-2"><button className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-50" aria-label="Notifications"><Bell className="size-4" />{(openUpdateCount + openBillCount + openOrderCount) > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-amber-500" />}</button><WorkflowSelect ariaLabel="Switch role" value={role} onValueChange={(value) => changeRole(value as Role)} className="w-36 text-[11px] font-semibold" options={[{ value: "superadmin", label: "Super Admin" }, { value: "pm", label: "Project Manager" }, { value: "engineer", label: "Engineer" }, { value: "supervisor", label: "Supervisor" }, { value: "purchase", label: "Purchase Team" }]} /><div className="hidden items-center gap-2 sm:flex"><Avatar className="size-7"><AvatarFallback className="bg-teal-100 text-[9px] font-bold text-teal-800">{personName.split(" ").map((part) => part[0]).join("")}</AvatarFallback></Avatar><span className="max-w-32 truncate text-[10px] font-semibold text-slate-700">{personName}</span></div></div></header>
        <div className="sticky top-[68px] z-20 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 xl:hidden">{visiblePages.map((item) => <button key={item} onClick={() => navigate(item)} className={`shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${page === item ? "bg-teal-50 text-teal-900" : "text-slate-500"}`}>{pageLabels[item]}</button>)}</div>
        <div className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <div className="mb-5"><p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400"><CalendarDays className="size-3" />{todayLabel} <span>· Kerala, India</span></p></div>
          {notice && <div role={noticeError ? "alert" : "status"} className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${noticeError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-teal-200 bg-teal-50 text-teal-900"}`}>{noticeError ? <AlertCircle className="size-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="size-4 shrink-0 text-teal-700" />}{notice}<button onClick={() => setNotice("")} className={`ml-auto ${noticeError ? "text-rose-700" : "text-teal-700"}`} aria-label="Dismiss notice">×</button></div>}
          {isProjectPage && renderProjectWorkspaceHeader()}
          {content[page]}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-[10px] text-slate-400"><span>Estatio MEP Operations · Workflow prototype</span><span>Demo mode · Changes reset when the page reloads</span></footer>
        </div>
      </main>
    </div>
  </div>;
}

function BoqText({ value, onChange, disabled, type = "text", placeholder, ariaLabel }: { value: string; onChange: (value: string) => void; disabled: boolean; type?: InputHTMLAttributes<HTMLInputElement>["type"]; placeholder?: string; ariaLabel?: string }) {
  if (type === "date") {
    return <DatePicker value={value} disabled={disabled} ariaLabel={ariaLabel} placeholder={placeholder ?? "Pick a date"} onValueChange={onChange} className="h-8 min-w-[132px] px-2 text-[10px]" />;
  }
  return <Input aria-label={ariaLabel} type={type} step={type === "number" ? "any" : undefined} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`h-8 w-full min-w-[92px] border-transparent bg-transparent px-2 text-[11px] text-slate-700 shadow-none hover:border-slate-200 focus-visible:bg-white disabled:cursor-default disabled:opacity-100 ${type === "number" ? "boq-number-input" : ""}`} />;
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <Card className="border-0 shadow-sm ring-1 ring-slate-200/70"><CardContent className="p-4"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-800">{icon}</span><p className="mt-3 text-[10px] font-medium text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-semibold text-slate-900">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></CardContent></Card>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-[9px] font-medium text-slate-400">{label}</p><p className="mt-1 truncate text-[11px] font-semibold text-slate-700">{value}</p></div>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="grid justify-items-center rounded-xl border border-dashed border-slate-200 px-5 py-9 text-center"><span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-400"><FileText className="size-4" /></span><p className="mt-2 text-xs font-semibold text-slate-700">{title}</p><p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-500">{detail}</p></div>;
}

function NavIcon({ page }: { page: Page }) {
  const className = "size-4 text-current";
  switch (page) {
    case "overview": return <Building2 className={className} />;
    case "projects": return <Users className={className} />;
    case "people": return <UsersRound className={className} />;
    case "boq": return <FileSpreadsheet className={className} />;
    case "work": return <HardHat className={className} />;
    case "additional-materials": return <PackageCheck className={className} />;
    case "additional-works": return <Wrench className={className} />;
    case "procurement": return <ShoppingCart className={className} />;
    case "engineer-review": return <ClipboardCheck className={className} />;
    case "purchase-approval": return <BadgeCheck className={className} />;
    case "local-purchases": return <FileText className={className} />;
    case "costs": return <WalletCards className={className} />;
    case "project-costs": return <WalletCards className={className} />;
    case "handover": return <ArrowRight className={className} />;
    case "reports": return <FileText className={className} />;
  }
}

