import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

async function main() {
  const tabsSource = await readFile(
    new URL("../src/components/ui/tabs.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    tabsSource,
    /orientation === "horizontal"\s*\?\s*"flex-col"\s*:\s*"flex-row"/,
  );
  assert.doesNotMatch(
    tabsSource,
    /data-\[orientation=horizontal\]:flex-col/,
  );
  assert.doesNotMatch(
    tabsSource,
    /group-data-\[orientation=horizontal\]\/tabs/,
  );

  const scrollAreaSource = await readFile(
    new URL("../src/components/ui/scroll-area.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    scrollAreaSource,
    /orientation === "horizontal"/,
  );
  assert.doesNotMatch(
    scrollAreaSource,
    /data-\[orientation=horizontal\]:flex-col/,
  );
  assert.doesNotMatch(scrollAreaSource, /\bdata-horizontal:flex-col\b/);

  const homePageSource = await readFile(
    new URL("../src/app/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(homePageSource, /md:grid-cols-3/);
  assert.doesNotMatch(homePageSource, /grid grid-cols-3 gap-3/);

  await access(
    new URL("../start-app.ps1", import.meta.url),
    constants.F_OK,
  );
  await access(
    new URL("../cleanup-project.ps1", import.meta.url),
    constants.F_OK,
  );

  const launcherSource = await readFile(
    new URL("../start-app.ps1", import.meta.url),
    "utf8",
  );
  assert.match(launcherSource, /\$appDir = \$repoRoot/);
  assert.match(launcherSource, /npm\.cmd run dev/);
  assert.match(launcherSource, /\[string\]\$BindHost/);
  assert.match(launcherSource, /http:\/\/\$\{BindHost\}:\$Port/);
  assert.doesNotMatch(launcherSource, /\[string\]\$Host/);
  assert.doesNotMatch(launcherSource, /\.worktrees\\knowledge-ingest-mvp/);

  const cleanupSource = await readFile(
    new URL("../cleanup-project.ps1", import.meta.url),
    "utf8",
  );
  assert.match(cleanupSource, /\$appDir = \$repoRoot/);
  assert.match(cleanupSource, /\.superpowers/);
  assert.match(cleanupSource, /start-app-\*\.out\.log/);
  assert.match(cleanupSource, /tsconfig\.tsbuildinfo/);
  assert.doesNotMatch(cleanupSource, /\.worktrees\\knowledge-ingest-mvp/);

  console.log("ui-shell.check: ok");
}

main().catch((error) => {
  console.error("ui-shell.check: failed");
  console.error(error);
  process.exitCode = 1;
});
