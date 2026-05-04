# Test Knowledge Ingest

Next.js 16 app for building workspace-scoped ATE test knowledge bases from uploaded project files and reference material.

## Start the app

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1
```

Optional host and port:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1 -BindHost 127.0.0.1 -Port 3000
```

Directly from the repository root:

```powershell
npm run dev
```

## Clean generated clutter

Remove transient logs:

```powershell
powershell -ExecutionPolicy Bypass -File .\cleanup-project.ps1
```

Also remove build artifacts:

```powershell
powershell -ExecutionPolicy Bypass -File .\cleanup-project.ps1 -IncludeBuildArtifacts
```

## Verification

```powershell
node test\server-paths.check.mjs
node test\ui-shell.check.mjs
npm run lint
npm run build
```

## Layout

- `src/app` - routes and page shells
- `src/components` - UI and workflow components
- `src/lib` - storage, ingest, and utility code
- `data/` - runtime workspace and reference-shelf storage
- `test` - lightweight regression checks
