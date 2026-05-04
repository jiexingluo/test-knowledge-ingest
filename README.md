# Knowledge Ingest MVP

Next.js 16 app for building workspace-scoped ATE test knowledge bases from uploaded project files and reference material.

## Preferred startup

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1
```

Directly from this app folder:

```powershell
npm run dev
```

## Verification commands

```powershell
node test\server-paths.check.mjs
node test\ui-shell.check.mjs
npm run lint
npm run build
```

## Key folders

- `src/app` - routes and page shells
- `src/components` - UI and workflow components
- `src/lib` - storage, ingest, and utility code
- `test` - lightweight regression checks
