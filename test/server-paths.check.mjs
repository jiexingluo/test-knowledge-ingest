import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const originalCwd = process.cwd();
  const originalDataDir = process.env.DATA_DIR;
  const tempRoot = await mkdtemp(join(tmpdir(), "knowledge-ingest-"));

  try {
    process.chdir(tempRoot);
    process.env.DATA_DIR = "custom-data";

    const {
      getDataDir,
      getWorkspacesDir,
      getWorkspaceDir,
      getReferenceShelfDir,
    } = await import("../src/lib/server-paths.ts");

    assert.equal(getDataDir(), join(tempRoot, "custom-data"));
    assert.equal(
      getWorkspacesDir(),
      join(tempRoot, "custom-data", "workspaces"),
    );
    assert.equal(
      getWorkspaceDir("ws-123"),
      join(tempRoot, "custom-data", "workspaces", "ws-123"),
    );
    assert.equal(
      getReferenceShelfDir(),
      join(tempRoot, "custom-data", "reference-shelf"),
    );

    const source = await readFile(new URL("../src/lib/utils.ts", import.meta.url), "utf8");
    assert.match(source, /export function cn\(/);
    assert.doesNotMatch(source, /\bfrom\s+["']path["']/);
    assert.doesNotMatch(source, /\bprocess\.cwd\b/);
    assert.doesNotMatch(source, /\bgetWorkspaceDir\b/);

    console.log("server-paths.check: ok");
  } finally {
    process.chdir(originalCwd);

    if (originalDataDir === undefined) {
      delete process.env.DATA_DIR;
    } else {
      process.env.DATA_DIR = originalDataDir;
    }
  }
}

main().catch((error) => {
  console.error("server-paths.check: failed");
  console.error(error);
  process.exitCode = 1;
});
