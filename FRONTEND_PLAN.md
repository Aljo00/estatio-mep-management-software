# Estatio frontend plan

## Product direction

Build the first Estatio MEP Operations frontend in Next.js and TypeScript, using shadcn/ui components and realistic demo data. Keep the interface role-aware and responsive. Connect Supabase after the main workflows and permissions are reviewed.

## Current first slice

- Shared responsive workspace shell with role switcher and role-based navigation.
- Portfolio overview with project counts, measured progress, weekly planned-versus-completed output, attention items, and project health.
- Searchable and filterable project table, project detail dialog, and sample cost outlook visible to Superadmin and PM.
- Engineer flow to assign daily work, target quantities, a Supervisor and team, site instructions, and reference photos/audio.
- Supervisor flow to view assigned work and record completed quantities, site notes, photos, and audio against each assignment.
- PM/Superadmin review queue with completion evidence and accept/return actions linked to the assignment and daily report.
- People and teams view for Superadmin/PM.
- Demo-only project creation and local status changes.

## Build phases

1. **Frontend foundation — complete:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Estatio shell, typed demo data, and responsive role-based screens.
2. **Operations workflows — in progress:** Engineer assignments flow to the selected Supervisor and team; Supervisors record quantity and media evidence; PM actions update linked report and assignment statuses. Continue refining project health, delay, material, and quality interactions.
3. **Backend connection:** Design the schema and role permissions, connect authentication and data through Supabase, and enforce access with database policies.
4. **Production readiness:** Add validation, error and loading states, audit history, reporting, and deployment configuration after the workflows are agreed.

## Current role assumptions

- Superadmin can see the full portfolio and financial information.
- PM sees assigned projects, financial information, and the completion review queue.
- Engineer creates daily work assignments with targets, team, instructions, and optional reference media.
- Supervisor sees only assignments addressed to them and records completed quantities with optional photos, audio, and notes for PM review.
- Engineer and Supervisor can attach photos and audio to work records; PM review displays submitted completion evidence.
- Financial information is hidden from Engineer and Supervisor in the prototype.

These are demonstration rules only. Confirm the final permission matrix before connecting real users and data. Supabase Row Level Security must enforce production access; hiding interface elements is not sufficient.

## Demo data note

Every name, client, project, quantity, date, and financial figure is illustrative. Prototype actions change local page state only and are not saved to a server.
