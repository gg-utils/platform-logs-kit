/**
 * @fileoverview Regression coverage for log-tail UI argv builders that translate view plans and
 * list-runs selections into argv arrays and canonical script-relative invocations.
 *
 * This file owns Node `node:test` assertions for single-file tail, scoped runtime-run tail, and
 * canonical argv routing against shared package fixtures.
 * Flow: `platformLogsKitTestConfig` + `view(...)` plan -> argv builder under test -> expected argv
 * or `{ scriptRelative, argv }` shape.
 *
 * @example
 * ```typescript
 * test("history mode requests recent-only lines", () => {
 *   assert.deepEqual(
 *     logTailUiBuildSingleFileSourceArgv(
 *       platformLogsKitTestConfig,
 *       view({ source: "dev", scope: "default", mode: "history" }),
 *     ),
 *     ["--lines", "1000", "--recent-only"],
 *   );
 * });
 * ```
 *
 * @testing Node test (tsx): cd packages/platform-logs-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/build-argv.unit.test.ts
 * @testing CLI: npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/build-argv.ts - argv builder module whose script paths and flag wiring for log-tail plans are asserted here.
 * @see packages/platform-logs-kit/src/test-config.unit.ts - shared fixture `PlatformLogsKit_Config` and sources used so argv expectations stay aligned across kit tests.
 * @see packages/platform-logs-kit/src/types.ts - `LogTailUiPlan` and default view-plan helpers referenced when constructing inputs to the builders under test.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  logTailUiBuildCanonicalArgv,
  logTailUiBuildScopedRunSourceArgv,
  logTailUiBuildSingleFileSourceArgv,
} from "./build-argv.js";
import { logTailUiDefaultViewPlan, type LogTailUiPlan } from "./types.js";
import { platformLogsKitTestConfig } from "./test-config.unit.js";

function view(
  overrides: Partial<Extract<LogTailUiPlan, { kind: "view" }>>,
): Extract<LogTailUiPlan, { kind: "view" }> {
  return {
    ...logTailUiDefaultViewPlan(platformLogsKitTestConfig),
    ...overrides,
  };
}

test("logTailUiBuildSingleFileSourceArgv builds history argv", () => {
  assert.deepEqual(
    logTailUiBuildSingleFileSourceArgv(
      platformLogsKitTestConfig,
      view({ source: "dev", scope: "default", mode: "history" }),
    ),
    ["--lines", "1000", "--recent-only"],
  );
});

test("logTailUiBuildScopedRunSourceArgv builds scoped run argv", () => {
  const source = platformLogsKitTestConfig.sources[0];
  if (source === undefined) {
    throw new Error("missing source fixture");
  }
  assert.deepEqual(
    logTailUiBuildScopedRunSourceArgv(
      platformLogsKitTestConfig,
      view({ source: "runtime", scope: "run", mode: "tail" }),
      source,
    ),
    ["tail", "--scope", "run", "--run-index", "1", "--lines", "1000"],
  );
});

test("logTailUiBuildCanonicalArgv routes list-runs and configured sources", () => {
  assert.deepEqual(
    logTailUiBuildCanonicalArgv(platformLogsKitTestConfig, {
      kind: "list-runs",
    }),
    {
      scriptRelative: "scripts/runtime/logs.ts",
      argv: ["list-runs"],
    },
  );
  assert.deepEqual(
    logTailUiBuildCanonicalArgv(
      platformLogsKitTestConfig,
      view({ source: "dev", scope: "default" }),
    ),
    { scriptRelative: "scripts/dev-tail.ts", argv: ["--lines", "1000"] },
  );
});
