/**
 * @fileoverview Node `tsx --test` regression coverage for `PlatformLogsKit_resolveUiEntrypointAction`
 * help, preview, render, and parser-failure fast exits.
 *
 * This file owns assertions that the log UI entrypoint resolver returns the expected action shapes
 * without bootstrapping Ink or mutating process exit codes.
 * Flow: argv plus fixed unit-test config -> `PlatformLogsKit_resolveUiEntrypointAction` -> assert
 * kind-specific fields.
 *
 * @example
 * ```typescript
 * test("returns help fast-exit", () => {
 *   assert.deepEqual(resolve(["--help"]), { exitCode: 0, kind: "help", text: "Help text\n" });
 * });
 * ```
 *
 * @testing Node test runner (tsx): npm run platform-logs-kit:test from the repository root runs tsx --test over every packages/platform-logs-kit/src/*.unit.test.ts module (package test script glob), re-executing the resolver cases asserted here.
 *
 * @see packages/platform-logs-kit/src/ui-entrypoint.ts - Resolver implementation whose help, preview, render, and parser-error action mappings this suite locks.
 * @see packages/platform-logs-kit/src/test-config.unit.ts - Deterministic `PlatformLogsKit_Config` fixture injected into each resolver call so preview and render assertions stay stable.
 * @see scripts/log-tail/ui/cli-ink/index.ts - Root Ink launcher that applies the same resolver contract after argv parsing, exercising the `render` branch only when this module returns `kind: "render"`.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { platformLogsKitTestConfig } from "./test-config.unit.js";
import { PlatformLogsKit_resolveUiEntrypointAction } from "./ui-entrypoint.js";

function resolve(argv: readonly string[]) {
  return PlatformLogsKit_resolveUiEntrypointAction({
    argv,
    config: platformLogsKitTestConfig,
    cwd: "/workspace",
    errorPrefix: "[logs:cli:test]",
    helpText: "Help text\n",
  });
}

test("PlatformLogsKit_resolveUiEntrypointAction returns help fast-exit", () => {
  assert.deepEqual(resolve(["--help"]), {
    exitCode: 0,
    kind: "help",
    text: "Help text\n",
  });
});

test("PlatformLogsKit_resolveUiEntrypointAction builds default preview", () => {
  const action = resolve(["--print-preview"]);
  assert.equal(action.kind, "preview");
  if (action.kind !== "preview") {
    throw new Error("expected preview action");
  }
  assert.equal(action.exitCode, 0);
  assert.match(action.text, /Log tail UI — preview/u);
  assert.match(action.text, /npm run logs/u);
});

test("PlatformLogsKit_resolveUiEntrypointAction returns render action", () => {
  assert.deepEqual(resolve(["--project-root", "/tmp/project"]), {
    kind: "render",
    projectRoot: "/tmp/project",
  });
});

test("PlatformLogsKit_resolveUiEntrypointAction converts parser failures to error actions", () => {
  const action = resolve(["--unknown"]);
  assert.equal(action.kind, "error");
  if (action.kind !== "error") {
    throw new Error("expected error action");
  }
  assert.equal(action.exitCode, 1);
  assert.match(action.message, /Unknown option/u);
});
