import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { copyFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const data = join(root, "data", "workspace.json");
const backup = join(root, "data", "workspace.test.backup.json");
const base = "http://127.0.0.1:8788";
const server = spawn(process.execPath, [join(root, "server.mjs")], { env: { ...process.env, PORT: "8788" }, stdio: "ignore" });

async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  const body = await response.json();
  return { response, body };
}
async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { const result = await request("/healthz"); if (result.body.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("standalone server did not start");
}

await copyFile(data, backup);
try {
  await waitForHealth();
  const initial = await request("/api/workspace");
  assert.equal(initial.body.settings.guideMode, "local");
  assert.equal(initial.body.event.teams.length, 3);
  assert.ok(initial.body.learning.length >= 4);

  const locale = await request("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: "es" }) });
  assert.equal(locale.body.locale, "es");

  const toggle = await request("/api/tools/toggle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "asset-inventory", enabled: false }) });
  assert.equal(toggle.body.enabled, false);

  const custom = await request("/api/tools/custom", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Evidence normalizer", category: "Reporting", description: "Normalize a scoped evidence record", fields: "source, timestamp", runbook: "Confirm scope" }) });
  assert.equal(custom.response.status, 201);
  assert.equal(custom.body.kind, "custom");

  const guide = await request("/api/guide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: "How should I plan a Red Blue event?" }) });
  assert.match(guide.body.content, /White Cell/);
  assert.equal(guide.body.mode, "local");

  const blocked = await request("/api/scenarios/scenario-1/status", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Live" }) });
  assert.equal(blocked.response.status, 409);

  const progress = await request("/api/learning/blue-telemetry/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ progress: 80 }) });
  assert.equal(progress.body.progress, 80);
  console.log("standalone integration tests passed");
} finally {
  await copyFile(backup, data);
  server.kill();
  await readFile(data, "utf8");
}
