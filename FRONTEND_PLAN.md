# Estatio workflow prototype

## Product direction

Build an Estatio MEP workflow prototype in Next.js and TypeScript. Keep role-specific screens and approval paths visible in a local demo before connecting a backend.

## Current scope

- Super Admin project creation with client details, budget allocation, and assigned PM.
- Project workspaces that contain that project's BOQ, work packages, cost ledger, and Finalization & Handover checklist; these aren't global sections.
- BOQ cost estimates: High Side quantity × unit rate, and a work estimate for each Low Side package.
- Portfolio cost summary for PM and Super Admin plus a per-project cost ledger with budget health, approved spend, pending bills, BOQ estimates, and daily site output.
- Engineer and PM BOQ preparation, with PM release of High Side to Purchase.
- Purchase Team grouped orders with item selection, order and delivery dates, one bill and invoice total per group, and Super Admin approval.
- Individual work package pages with dated Supervisor updates, photo/audio attachments, package chat, and clearance requests.
- Engineer review of daily updates and Supervisor local purchase bills.
- PM closeout checklist and Super Admin handover approval.
- Demo role switcher including Purchase Team.

## Next phases

1. Review the prototype workflow and confirm edge cases and role permissions.
2. Design database tables, authentication, file storage, and approval audit history.
3. Connect the approved workflow to the backend and enforce permissions server-side.
4. Add production validation, loading/error states, reporting, and deployment configuration.

## Role and approval assumptions

- Super Admin creates projects and approves Purchase Team grouped-order bills and final handover.
- PM and Engineer prepare BOQ lines; PM approves the BOQ before material purchasing begins.
- Purchase Team groups multiple High Side items into one order and submits one bill for Super Admin approval.
- Supervisors post daily updates and local purchase bills for their assigned work packages.
- Engineers verify daily progress and approve or return Supervisor local purchase bills.
- Clearance requests are recorded in each work package discussion.

These are prototype behaviors only. Confirm the complete permission matrix and use server-enforced access control before connecting real users and project records.

## Demo data note

The SHOBHA BOQ row descriptions are based on the supplied Estatio BOQ. Seeded project quantities, rates, budgets, invoices, and progress are illustrative demo figures, clearly labeled in the UI and not client-approved. Newly created projects do not inherit the demo financial records. Prototype actions change local page state only and are not saved to a server.
