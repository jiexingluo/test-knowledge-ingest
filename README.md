# Test Knowledge Ingest

This repository's runnable web app lives in `.worktrees/knowledge-ingest-mvp`.

## Start the app

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1
```

Optional host and port:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1 -BindHost 127.0.0.1 -Port 3000
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

## Layout

- `.worktrees/knowledge-ingest-mvp` - active Next.js application
- `docs/` - planning and reference notes
- `references/` - supporting material
