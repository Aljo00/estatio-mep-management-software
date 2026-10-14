export type AppRole = "superadmin" | "pm" | "engineer" | "supervisor"

export type ProjectHealth = "On track" | "At risk" | "Needs attention"

export type ProjectMilestone = {
  title: string
  dueDate: string
}

export type Project = {
  id: string
  name: string
  code: string
  client: string
  location: string
  discipline: string
  progress: number
  plannedProgress: number
  health: ProjectHealth
  startDate: string
  dueDate: string
  manager: string
  engineer: string
  supervisor: string
  managers?: string[]
  engineers?: string[]
  supervisors?: string[]
  teamSize: number
  nextMilestone: string
  milestones?: ProjectMilestone[]
  blocker: string
  budget: number
  forecast: number
  spent: number
  contractValue?: number
}

export type EvidencePhoto = {
  name: string
  url: string
}

export type WorkAssignment = {
  id: string
  project: string
  activity: string
  target: number
  unit: string
  engineer: string
  supervisor: string
  assignedTeam: string
  teamSize: number
  due: string
  instruction: string
  completedQty: number
  materialsUsed?: { materialId: string; item: string; quantity: number; unit: string }[]
  status: "Assigned" | "Submitted for PM review" | "Reviewed" | "Returned"
  referencePhotos: EvidencePhoto[]
  referenceAudioUrl?: string
}

export type WorkDoubtMessage = {
  id: string
  author: string
  role: "engineer" | "supervisor"
  sentAt: string
  text: string
  photos?: EvidencePhoto[]
  audioUrl?: string
}

export type WorkDoubtThread = {
  id: string
  assignmentId: string
  status: "Open" | "Resolved"
  messages: WorkDoubtMessage[]
}

export type IssueCategory = "Material shortage" | "Client dependency" | "Site access" | "Drawings / design" | "Manpower" | "Equipment" | "Rework / quality" | "Internal planning" | "Other"
export type IssueStatus = "Open" | "Action planned" | "Resolved"
export type MaterialStatus = "Requested" | "Approved" | "Ordered" | "Received" | "Rejected"
export type QualityStatus = "Pending inspection" | "Passed" | "Rework required" | "Rework submitted" | "Closed"
export type ExpenseCategory = "Labour" | "Materials" | "Other"

export type OperationsIssue = {
  id: string
  project: string
  title: string
  category: IssueCategory
  details: string
  impactDays: number
  owner: string
  reportedBy: string
  reportedAt: string
  status: IssueStatus
  correctiveAction: string
}

export type MaterialRequest = {
  id: string
  project: string
  item: string
  quantity: number
  unit: string
  requiredBy: string
  priority: "Normal" | "High" | "Urgent"
  estimatedUnitCost?: number
  estimatedTotal?: number
  allottedQuantity?: number
  usedQuantity?: number
  requestedBy: string
  requestedAt: string
  status: MaterialStatus
  note: string
}

export type QualityCheck = {
  id: string
  project: string
  activity: string
  location: string
  requestedBy: string
  requestedAt: string
  status: QualityStatus
  note: string
  reworkNote: string
}

export type ExpenseRecord = {
  id: string
  project: string
  category: ExpenseCategory
  amount: number
  description: string
  recordedBy: string
  recordedAt: string
}

export type TeamMember = {
  name: string
  role: "Project Manager" | "Engineer" | "Supervisor" | "Technician"
  projects: number
  status: "Available" | "On site" | "On leave"
  initials: string
  email?: string
}

export type DailyUpdate = {
  id: string
  project: string
  activity: string
  quantity: number
  unit: string
  people: number
  hoursWorked?: number
  submittedBy: string
  date: string
  status: "Submitted for PM review" | "Reviewed" | "Returned by PM"
  note: string
  assignmentId?: string
  photos?: EvidencePhoto[]
  audioUrl?: string
}

export const roleLabels: Record<AppRole, string> = {
  superadmin: "Superadmin",
  pm: "Project Manager",
  engineer: "Engineer",
  supervisor: "Supervisor",
}

export const rolePeople: Record<AppRole, { name: string; initials: string; title: string }> = {
  superadmin: { name: "Arun Menon", initials: "AM", title: "Superadmin" },
  pm: { name: "Rahul Nair", initials: "RN", title: "Project Manager" },
  engineer: { name: "Nikhil S.", initials: "NS", title: "Site Engineer" },
  supervisor: { name: "Shameer K.", initials: "SK", title: "Site Supervisor" },
}

export const initialProjects: Project[] = [
  {
    id: "EST-2408",
    code: "EST-2408",
    name: "Greenfield Heights",
    client: "Greenfield Developers",
    location: "Kakkanad, Kochi",
    discipline: "HVAC · Plumbing",
    progress: 68,
    plannedProgress: 72,
    health: "On track",
    startDate: "12 Jun 2026",
    dueDate: "18 Nov 2026",
    manager: "Rahul Nair",
    engineer: "Nikhil S.",
    supervisor: "Shameer K.",
    teamSize: 18,
    nextMilestone: "Level 8 duct installation",
    blocker: "No active blockers",
    budget: 14200000,
    forecast: 13850000,
    spent: 9650000,
    contractValue: 16500000,
  },
  {
    id: "EST-2411",
    code: "EST-2411",
    name: "Aster Medcity Expansion",
    client: "Aster DM Healthcare",
    location: "Cheranelloor, Kochi",
    discipline: "Electrical · ELV",
    progress: 42,
    plannedProgress: 58,
    health: "At risk",
    startDate: "03 May 2026",
    dueDate: "02 Dec 2026",
    manager: "Rahul Nair",
    engineer: "Nikhil S.",
    supervisor: "Shameer K.",
    teamSize: 26,
    nextMilestone: "Main riser cable pulling",
    blocker: "Two-floor access approval pending",
    budget: 21800000,
    forecast: 22600000,
    spent: 10450000,
    contractValue: 25600000,
  },
  {
    id: "EST-2415",
    code: "EST-2415",
    name: "Marina Convention Centre",
    client: "Marina Group",
    location: "Kovalam, Thiruvananthapuram",
    discipline: "HVAC · Fire Fighting",
    progress: 81,
    plannedProgress: 78,
    health: "On track",
    startDate: "17 Mar 2026",
    dueDate: "28 Oct 2026",
    manager: "Meera Thomas",
    engineer: "Arjun P.",
    supervisor: "Faisal M.",
    teamSize: 31,
    nextMilestone: "Integrated system testing",
    blocker: "No active blockers",
    budget: 30400000,
    forecast: 29800000,
    spent: 23900000,
    contractValue: 36000000,
  },
  {
    id: "EST-2420",
    code: "EST-2420",
    name: "SkyPark IT Campus",
    client: "SkyPark Infrastructure",
    location: "Kozhikode",
    discipline: "Plumbing · Fire Fighting",
    progress: 34,
    plannedProgress: 40,
    health: "Needs attention",
    startDate: "01 Aug 2026",
    dueDate: "14 Feb 2027",
    manager: "Rahul Nair",
    engineer: "Nikhil S.",
    supervisor: "Shameer K.",
    teamSize: 14,
    nextMilestone: "Basement pump room works",
    blocker: "Fire-rated pipe fittings delayed",
    budget: 17600000,
    forecast: 18100000,
    spent: 5200000,
    contractValue: 21200000,
  },
  {
    id: "EST-2422",
    code: "EST-2422",
    name: "Co-op Bank HQ Renovation",
    client: "Kerala Co-operative Bank",
    location: "Vazhuthacaud, Thiruvananthapuram",
    discipline: "Electrical · HVAC · ELV",
    progress: 57,
    plannedProgress: 54,
    health: "On track",
    startDate: "21 Apr 2026",
    dueDate: "30 Nov 2026",
    manager: "Meera Thomas",
    engineer: "Arjun P.",
    supervisor: "Faisal M.",
    teamSize: 22,
    nextMilestone: "Floor 4 commissioning",
    blocker: "No active blockers",
    budget: 12800000,
    forecast: 12400000,
    spent: 7300000,
    contractValue: 15500000,
  },
]

export const initialDailyUpdates: DailyUpdate[] = [
  {
    id: "UPD-1108",
    assignmentId: "TASK-1108",
    project: "Greenfield Heights",
    activity: "Level 8 duct installation",
    quantity: 186,
    unit: "sq.ft.",
    people: 6,
    hoursWorked: 48,
    submittedBy: "Shameer K.",
    date: "Today, 4:12 PM",
    status: "Submitted for PM review",
    note: "Completed east wing. West corridor access opens tomorrow.",
    photos: [],
  },
  {
    id: "UPD-1107",
    assignmentId: "TASK-1107",
    project: "Aster Medcity Expansion",
    activity: "Cable tray installation",
    quantity: 42,
    unit: "m",
    people: 5,
    hoursWorked: 40,
    submittedBy: "Shameer K.",
    date: "Today, 3:46 PM",
    status: "Submitted for PM review",
    note: "South riser not accessible; team continued in the east corridor.",
  },
  {
    id: "UPD-1106",
    assignmentId: "TASK-1106",
    project: "SkyPark IT Campus",
    activity: "Fire line pipe installation",
    quantity: 28,
    unit: "m",
    people: 4,
    hoursWorked: 32,
    submittedBy: "Shameer K.",
    date: "Today, 2:58 PM",
    status: "Reviewed",
    note: "Pressure test passed for the completed section.",
  },
]

export const reviewQueue = [
  {
    id: "REV-083",
    assignmentId: "TASK-1108",
    updateId: "UPD-1108",
    project: "Greenfield Heights",
    activity: "Level 8 duct installation",
    submitted: "Today, 4:12 PM",
    quantity: "186 sq.ft.",
    supervisor: "Shameer K.",
    status: "Pending review",
    note: "Completed east wing. West corridor access opens tomorrow.",
  },
  {
    id: "REV-081",
    assignmentId: "TASK-1107",
    updateId: "UPD-1107",
    project: "Aster Medcity Expansion",
    activity: "Cable tray installation · Floor 3",
    submitted: "Today, 1:35 PM",
    quantity: "42 m",
    supervisor: "Shameer K.",
    status: "Pending review",
    note: "South riser remains inaccessible; work continued in east corridor.",
  },
  {
    id: "REV-079",
    project: "Co-op Bank HQ Renovation",
    activity: "Floor 4 panel termination",
    submitted: "Yesterday, 5:02 PM",
    quantity: "18 points",
    supervisor: "Faisal M.",
    status: "Pending review",
    note: "All terminations tagged and recorded in the site log.",
  },
]

export const initialWorkAssignments: WorkAssignment[] = [
  {
    id: "TASK-1108",
    project: "Greenfield Heights",
    activity: "Level 8 duct installation",
    target: 220,
    unit: "sq.ft.",
    engineer: "Nikhil S.",
    supervisor: "Shameer K.",
    assignedTeam: "Duct Crew A",
    teamSize: 6,
    due: "Today",
    instruction: "Complete the east wing first. Keep the service corridor clear for other trades.",
    completedQty: 186,
    status: "Submitted for PM review",
    referencePhotos: [],
  },
  {
    id: "TASK-1107",
    project: "Aster Medcity Expansion",
    activity: "Cable tray installation · Floor 3",
    target: 55,
    unit: "m",
    engineer: "Nikhil S.",
    supervisor: "Shameer K.",
    assignedTeam: "Electrical Crew B",
    teamSize: 5,
    due: "Today",
    instruction: "Coordinate access with the site team before entering the south riser.",
    completedQty: 42,
    status: "Submitted for PM review",
    referencePhotos: [],
  },
  {
    id: "TASK-1106",
    project: "SkyPark IT Campus",
    activity: "Basement fire line pipework",
    target: 36,
    unit: "m",
    engineer: "Nikhil S.",
    supervisor: "Shameer K.",
    assignedTeam: "Fire Crew A",
    teamSize: 4,
    due: "Today",
    instruction: "Record the pressure test result with the completed pipe section.",
    completedQty: 28,
    status: "Reviewed",
    referencePhotos: [],
  },
]

export const initialWorkDoubtThreads: WorkDoubtThread[] = [
  {
    id: "DOU-301",
    assignmentId: "TASK-1108",
    status: "Open",
    messages: [
      {
        id: "DMSG-504",
        author: "Shameer K.",
        role: "supervisor",
        sentAt: "Today, 9:12 AM",
        text: "The east-wing ceiling sleeve is about 50 mm off the duct centerline. Should we shift the duct or ask the civil team to correct the opening?",
      },
    ],
  },
  {
    id: "DOU-300",
    assignmentId: "TASK-1107",
    status: "Resolved",
    messages: [
      {
        id: "DMSG-502",
        author: "Shameer K.",
        role: "supervisor",
        sentAt: "Today, 8:26 AM",
        text: "The cable tray route meets a sprinkler branch near the south riser. Can we step around it and maintain the required clearance?",
      },
      {
        id: "DMSG-503",
        author: "Nikhil S.",
        role: "engineer",
        sentAt: "Today, 8:41 AM",
        text: "Yes. Hold the current section, keep at least 150 mm clearance, and follow the revised route on coordination drawing E-17. Please share a photo after the offset is installed.",
      },
    ],
  },
]

export const initialIssues: OperationsIssue[] = [
  { id: "ISS-204", project: "SkyPark IT Campus", title: "Fire-rated fittings not delivered", category: "Material shortage", details: "The basement fire line crew has fittings for only one more section.", impactDays: 3, owner: "Rahul Nair", reportedBy: "Shameer K.", reportedAt: "Today, 9:18 AM", status: "Action planned", correctiveAction: "Supplier follow-up due before 2:00 PM; alternate stock check in progress." },
  { id: "ISS-203", project: "Aster Medcity Expansion", title: "South riser access approval pending", category: "Client dependency", details: "Cable tray installation cannot proceed through the south riser until the client clears access.", impactDays: 2, owner: "Rahul Nair", reportedBy: "Shameer K.", reportedAt: "Today, 8:42 AM", status: "Open", correctiveAction: "" },
  { id: "ISS-199", project: "Greenfield Heights", title: "West corridor ceiling coordination", category: "Site access", details: "Coordinate duct work sequence with the ceiling contractor.", impactDays: 1, owner: "Nikhil S.", reportedBy: "Shameer K.", reportedAt: "Yesterday, 3:15 PM", status: "Resolved", correctiveAction: "Sequence agreed with the ceiling team." },
]

export const initialMaterialRequests: MaterialRequest[] = [
  { id: "MAT-118", project: "SkyPark IT Campus", item: "Fire-rated pipe fittings", quantity: 24, unit: "pcs", requiredBy: "12 Oct 2026", priority: "Urgent", requestedBy: "Shameer K.", requestedAt: "Today, 9:22 AM", status: "Requested", note: "Needed to continue the basement fire line." },
  { id: "MAT-117", project: "Greenfield Heights", item: "GI duct sheet, 24 gauge", quantity: 18, unit: "sheets", requiredBy: "10 Oct 2026", priority: "High", requestedBy: "Nikhil S.", requestedAt: "Yesterday, 4:40 PM", status: "Received", allottedQuantity: 18, usedQuantity: 6, note: "For the Level 8 east wing." },
  { id: "MAT-116", project: "Greenfield Heights", item: "Copper pipe, Type L, 25 mm", quantity: 40, unit: "m", requiredBy: "09 Oct 2026", priority: "High", requestedBy: "Nikhil S.", requestedAt: "08 Oct 2026", status: "Received", allottedQuantity: 40, usedQuantity: 12, note: "Chilled water branch installation." },
  { id: "MAT-115", project: "Greenfield Heights", item: "uPVC drainage pipe, 110 mm", quantity: 32, unit: "m", requiredBy: "10 Oct 2026", priority: "Normal", requestedBy: "Nikhil S.", requestedAt: "08 Oct 2026", status: "Received", allottedQuantity: 32, usedQuantity: 10, note: "Level 6 toilet drainage runs." },
  { id: "MAT-113", project: "Greenfield Heights", item: "HVAC flexible duct, 200 mm", quantity: 24, unit: "m", requiredBy: "10 Oct 2026", priority: "Normal", requestedBy: "Rahul Nair", requestedAt: "07 Oct 2026", status: "Received", allottedQuantity: 24, usedQuantity: 8, note: "Final connections at east wing diffusers." },
  { id: "MAT-112", project: "Greenfield Heights", item: "Elastomeric pipe insulation, 25 mm", quantity: 60, unit: "m", requiredBy: "11 Oct 2026", priority: "Normal", requestedBy: "Nikhil S.", requestedAt: "07 Oct 2026", status: "Received", allottedQuantity: 60, usedQuantity: 24, note: "Insulation for installed copper pipe." },
  { id: "MAT-111", project: "Greenfield Heights", item: "GI duct support channel", quantity: 48, unit: "pcs", requiredBy: "10 Oct 2026", priority: "Normal", requestedBy: "Nikhil S.", requestedAt: "07 Oct 2026", status: "Received", allottedQuantity: 48, usedQuantity: 16, note: "Supports for Level 8 duct sections." },
  { id: "MAT-110", project: "Greenfield Heights", item: "M8 threaded rod", quantity: 80, unit: "pcs", requiredBy: "10 Oct 2026", priority: "Normal", requestedBy: "Nikhil S.", requestedAt: "07 Oct 2026", status: "Received", allottedQuantity: 80, usedQuantity: 25, note: "Hanger assembly stock for HVAC supports." },
  { id: "MAT-109", project: "Greenfield Heights", item: "Flexible duct connectors", quantity: 20, unit: "pcs", requiredBy: "11 Oct 2026", priority: "Normal", requestedBy: "Nikhil S.", requestedAt: "06 Oct 2026", status: "Received", allottedQuantity: 20, usedQuantity: 5, note: "Vibration isolation at fan coil units." },
  { id: "MAT-108", project: "Greenfield Heights", item: "Copper elbows, 25 mm", quantity: 30, unit: "pcs", requiredBy: "10 Oct 2026", priority: "Normal", requestedBy: "Nikhil S.", requestedAt: "06 Oct 2026", status: "Received", allottedQuantity: 30, usedQuantity: 8, note: "Branch and riser pipe fittings." },
  { id: "MAT-107", project: "Greenfield Heights", item: "Duct sealant cartridges", quantity: 36, unit: "pcs", requiredBy: "10 Oct 2026", priority: "Normal", requestedBy: "Nikhil S.", requestedAt: "06 Oct 2026", status: "Received", allottedQuantity: 36, usedQuantity: 12, note: "Joint sealing for current duct installation." },
  { id: "MAT-114", project: "Aster Medcity Expansion", item: "Cable tray couplers", quantity: 60, unit: "pcs", requiredBy: "11 Oct 2026", priority: "Normal", requestedBy: "Shameer K.", requestedAt: "Yesterday, 2:10 PM", status: "Approved", note: "Floor 3 cable tray installation." },
]

export const initialQualityChecks: QualityCheck[] = [
  { id: "QLT-052", project: "Greenfield Heights", activity: "Level 8 duct installation", location: "East wing, Level 8", requestedBy: "Shameer K.", requestedAt: "Today, 10:15 AM", status: "Pending inspection", note: "Duct supports and joint sealing are ready for inspection.", reworkNote: "" },
  { id: "QLT-051", project: "Aster Medcity Expansion", activity: "Cable tray installation", location: "Floor 3, east corridor", requestedBy: "Shameer K.", requestedAt: "Yesterday, 4:05 PM", status: "Rework required", note: "Inspection found two unbonded joints.", reworkNote: "Bond and retest the two joints, then submit for verification." },
  { id: "QLT-048", project: "SkyPark IT Campus", activity: "Fire line pressure test", location: "Basement B1", requestedBy: "Faisal M.", requestedAt: "Yesterday, 12:25 PM", status: "Closed", note: "Pressure test passed and recorded.", reworkNote: "" },
]

export const initialExpenses: ExpenseRecord[] = [
  { id: "EXP-660", project: "Greenfield Heights", category: "Labour", amount: 3800000, description: "Site crew payroll and overtime, Week 40", recordedBy: "Rahul Nair", recordedAt: "Today, 8:30 AM" },
  { id: "EXP-659", project: "Greenfield Heights", category: "Materials", amount: 2200000, description: "GI duct sheets and HVAC fittings", recordedBy: "Rahul Nair", recordedAt: "Yesterday, 2:15 PM" },
  { id: "EXP-658", project: "Greenfield Heights", category: "Labour", amount: 2650000, description: "Installation crew costs to date", recordedBy: "Rahul Nair", recordedAt: "08 Oct 2026" },
  { id: "EXP-657", project: "Greenfield Heights", category: "Other", amount: 1000000, description: "Equipment hire and site logistics", recordedBy: "Rahul Nair", recordedAt: "07 Oct 2026" },
  { id: "EXP-656", project: "Aster Medcity Expansion", category: "Other", amount: 18500, description: "Access equipment rental", recordedBy: "Rahul Nair", recordedAt: "Yesterday, 11:50 AM" },
  { id: "EXP-652", project: "SkyPark IT Campus", category: "Labour", amount: 128000, description: "Fire line installation crew", recordedBy: "Rahul Nair", recordedAt: "08 Oct 2026" },
]

export const teamMembers: TeamMember[] = [
  { name: "Rahul Nair", role: "Project Manager", projects: 3, status: "Available", initials: "RN" },
  { name: "Meera Thomas", role: "Project Manager", projects: 2, status: "On site", initials: "MT" },
  { name: "Nikhil S.", role: "Engineer", projects: 3, status: "On site", initials: "NS" },
  { name: "Arjun P.", role: "Engineer", projects: 2, status: "Available", initials: "AP" },
  { name: "Shameer K.", role: "Supervisor", projects: 3, status: "On site", initials: "SK" },
  { name: "Faisal M.", role: "Supervisor", projects: 2, status: "On site", initials: "FM" },
]
