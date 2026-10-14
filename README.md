# Estatio MEP Operations

Frontend prototype for Estatio's project operations workflow. It uses Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## Run locally

```bash
pnpm dev
```

Open <http://localhost:3000>.

## Prototype behavior

- Switch between Superadmin, Project Manager, Engineer, and Supervisor from the profile selector.
- Browse demo projects, progress, schedule health, teams, and site notes.
- PM and Superadmin views include sample cost and forecast information; Engineer and Supervisor views do not.
- Engineers can assign daily work, targets, teams, instructions, and optional photo/audio references to a Supervisor.
- Supervisors see their assignments and record the completed quantity with optional photos, audio, and a site note.
- PM and Superadmin can review the submitted evidence and accept or return each completion report.
- Creating projects and changing report statuses update local prototype state only.

All names, projects, quantities, and finances are illustrative demo data. Role visibility in this prototype is a UI demonstration only. Production access control must be enforced in Supabase with database policies.

See [FRONTEND_PLAN.md](./FRONTEND_PLAN.md) for the planned build phases and current scope.
