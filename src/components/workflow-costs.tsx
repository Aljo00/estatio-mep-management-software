"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleHelp, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export type WorkflowCostLine = {
  id: string;
  item: string;
  section: "High Side" | "Low Side";
  quantity: string;
  unit: string;
  estimate: number | null;
};

export type WorkflowSpendRecord = {
  id: string;
  source: "Group order" | "Local purchase";
  category: string;
  description: string;
  amount: number;
  status: string;
  bill?: string;
};

export type WorkflowProgressRecord = {
  id: string;
  date: string;
  work: string;
  quantity: string;
  progress: string;
  status: string;
};

type WorkflowCostsProps = {
  projectName: string;
  budget: number;
  lines: WorkflowCostLine[];
  spendRecords: WorkflowSpendRecord[];
  progressRecords: WorkflowProgressRecord[];
  canEditBudget: boolean;
  onSaveBudget: (amount: number) => void;
};

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
      <CardContent className="p-4">
        <span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-800">
          {icon}
        </span>
        <p className="mt-3 text-[10px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold text-slate-900">{value}</p>
        <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function statusClass(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status.startsWith("Pending")) return "bg-amber-50 text-amber-800";
  if (status === "Returned") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export function WorkflowCosts({
  projectName,
  budget,
  lines,
  spendRecords,
  progressRecords,
  canEditBudget,
  onSaveBudget,
}: WorkflowCostsProps) {
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetError, setBudgetError] = useState("");

  const estimates = lines.reduce(
    (sum, line) => sum + (line.estimate ?? 0),
    0,
  );
  const pricedLineCount = lines.filter((line) => line.estimate !== null).length;
  const approvedSpend = spendRecords
    .filter((record) => record.status === "Approved")
    .reduce((sum, record) => sum + record.amount, 0);
  const pendingSpend = spendRecords
    .filter((record) => record.status.startsWith("Pending"))
    .reduce((sum, record) => sum + record.amount, 0);
  const budgetRemaining = budget - approvedSpend;
  const spendPercent = budget > 0
    ? Math.min(100, Math.round((approvedSpend / budget) * 100))
    : 0;
  const categoryTotals = ["Materials", "Labour", "Other"].map((category) => ({
    category,
    amount: spendRecords
      .filter((record) => record.status === "Approved" && record.category === category)
      .reduce((sum, record) => sum + record.amount, 0),
  }));

  function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(budgetInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setBudgetError("Enter a budget greater than zero.");
      return;
    }
    onSaveBudget(amount);
    setBudgetDialogOpen(false);
    setBudgetInput("");
    setBudgetError("");
  }

  return (
    <div className="space-y-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">
            Project financial control
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Costs &amp; productivity
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Track the project budget, priced BOQ lines, approved bills, and daily site output for {projectName}.
          </p>
        </div>
        {canEditBudget && (
          <Button
            variant="outline"
            onClick={() => {
              setBudgetInput(budget ? String(budget) : "");
              setBudgetError("");
              setBudgetDialogOpen(true);
            }}
          >
            <WalletCards className="size-4" />
            {budget ? "Update budget" : "Allocate budget"}
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Budget allocation"
          value={budget > 0 ? money(budget) : "Not allocated"}
          detail="Project budget entered at setup"
          icon={<WalletCards className="size-4" />}
        />
        <Metric
          label="Priced BOQ estimate"
          value={pricedLineCount > 0 ? money(estimates) : "Not priced"}
          detail={`${pricedLineCount} of ${lines.length} work/material lines priced`}
          icon={<CircleHelp className="size-4" />}
        />
        <Metric
          label="Approved spend"
          value={money(approvedSpend)}
          detail="Approved group bills and local purchases"
          icon={<ArrowDownRight className="size-4" />}
        />
        <Metric
          label="Bills awaiting approval"
          value={money(pendingSpend)}
          detail={`${spendRecords.filter((record) => record.status.startsWith("Pending")).length} pending bill(s)`}
          icon={<ArrowUpRight className="size-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">Budget health</CardTitle>
            <CardDescription className="text-xs">
              Approved spend compared with the project allocation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budget > 0 ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700">{spendPercent}% used</span>
                  <span className="text-slate-500">{money(approvedSpend)} of {money(budget)}</span>
                </div>
                <Progress
                  value={spendPercent}
                  className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-teal-700"
                />
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-medium text-slate-500">Budget remaining after approved spend</p>
                  <p className={`mt-1 text-xl font-semibold ${budgetRemaining < 0 ? "text-rose-700" : "text-slate-900"}`}>
                    {money(budgetRemaining)}
                  </p>
                  {estimates > 0 && (
                    <p className="mt-1 text-[10px] text-slate-500">Current BOQ estimate: {money(estimates)}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5">
                <p className="text-sm font-semibold text-slate-800">No project budget allocated</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {canEditBudget
                    ? "Allocate a budget to see the project spend and budget health here."
                    : "Ask the Super Admin to add the project budget."}
                </p>
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {categoryTotals.map(({ category, amount }) => (
                <div key={category} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-[10px] text-slate-400">{category}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-700">{money(amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px]">Cost workflow</CardTitle>
            <CardDescription className="text-xs">
              Costs enter the project ledger after the assigned approver accepts the bill.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["BOQ estimate", "Engineer + PM enter material rates and work estimates."],
              ["Grouped material orders", "Purchase Team records one invoice amount for each grouped order."],
              ["Local work purchases", "Engineer approves or returns each Supervisor bill."],
              ["Approved spend", "Approved bills count against the project budget."],
            ].map(([title, detail], index) => (
              <div key={title} className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-teal-50 text-[10px] font-bold text-teal-800">0{index + 1}</span>
                <span>
                  <span className="block text-xs font-semibold text-slate-700">{title}</span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">{detail}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-[15px]">Cost plan from BOQ</CardTitle>
          <CardDescription className="text-xs">
            High Side totals use quantity × unit cost. Low Side estimates are entered per work package.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3">BOQ item</th>
                  <th className="px-3 py-3">Section</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-5 py-3 text-right">Estimate</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-700">{line.item || "Unnamed BOQ row"}</td>
                    <td className="px-3 py-3 text-slate-500">{line.section}</td>
                    <td className="px-3 py-3 text-slate-500">{line.quantity || "—"} {line.unit}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">{line.estimate === null ? "Not estimated" : money(line.estimate)}</td>
                  </tr>
                ))}
                {lines.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Add High Side materials or Low Side work lines to build the cost plan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-[15px]">Purchase and local cost ledger</CardTitle>
          <CardDescription className="text-xs">
            Group bills and Supervisor local purchases stay visible with their approval status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3">Cost item</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {spendRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-700">{record.description}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{record.category}{record.bill ? ` · ${record.bill}` : " · Bill not attached"}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{record.source}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(record.status)}`}>{record.status}</span></td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">{money(record.amount)}</td>
                  </tr>
                ))}
                {spendRecords.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Approved purchase and local bills will appear here.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px]">Daily site output</CardTitle>
          <CardDescription className="text-xs">
            Supervisor quantities and daily notes, with Engineer review status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {progressRecords.slice(0, 6).map((record) => (
            <div key={record.id} className="grid gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-[110px_1fr_auto] sm:items-start">
              <span className="text-[10px] text-slate-500">{record.date}</span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-700">{record.work} · {record.quantity || "Quantity not entered"}</span>
                <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{record.progress}</span>
              </span>
              <span className={`w-fit rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(record.status)}`}>{record.status}</span>
            </div>
          ))}
          {progressRecords.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-500">Daily work reports will appear here as supervisors submit progress.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{budget ? "Update project budget" : "Allocate project budget"}</DialogTitle>
            <DialogDescription>Set the approved cost allocation for {projectName}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveBudget} className="space-y-3">
            <label className="block space-y-1.5 text-xs font-medium text-slate-700" htmlFor="workflow-project-budget">
              Budget allocation (₹)
              <Input
                id="workflow-project-budget"
                type="number"
                min="1"
                step="1"
                value={budgetInput}
                onChange={(event) => setBudgetInput(event.target.value)}
                aria-invalid={Boolean(budgetError)}
                placeholder="Enter approved budget"
              />
            </label>
            {budgetError && <p role="alert" className="text-[11px] font-medium text-rose-700">{budgetError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBudgetDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save budget</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
