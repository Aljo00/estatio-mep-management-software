# Estatio MEP Operations

Frontend prototype for Estatio's project workflow. It uses Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## Run locally

```bash
pnpm dev
```

Open <http://localhost:3000>.

## Prototype behavior

- Switch between Super Admin, Project Manager, Engineer, Supervisor, and Purchase Team.
- Create projects with client details, budget allocation, and assigned Project Manager.
- Open each project workspace to access its BOQ, work packages, costs, and finalization checklist; these project sections are not global navigation items.
- Review portfolio costs across projects, then open a project's cost ledger for its BOQ estimate, approved spend, pending bills, budget health, and site output.
- Submit the BOQ for PM approval before High Side materials reach the Purchase Team.
- Group approved materials into supplier orders, record ordered and received dates, attach one bill and invoice total, and submit it to Super Admin.
- Open a page per Low Side work package for daily photo/audio progress updates and package-specific questions or clearance requests.
- Review daily progress and Supervisor local purchase bills as an Engineer.
- Complete the closeout checklist and approve project handover.

The SHOBHA BOQ row descriptions are based on the Estatio BOQ shared for workflow discussion. The three seeded projects include illustrative quantities, rates, budgets, invoices, and progress so the portfolio and project cost screens are populated; these figures are labeled as demo data and are not client-approved values. Newly created projects use the entered project setup values and start without seeded financial records. All prototype actions stay in local state and reset on reload; there is no live database connection or production access control.

See [FRONTEND_PLAN.md](./FRONTEND_PLAN.md) for the current workflow scope.
