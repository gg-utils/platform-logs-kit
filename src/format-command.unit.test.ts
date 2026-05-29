/**
 * @fileoverview Verifies `logTailUiFormatNpmRunShortcut` and `logTailUiFormatTsxCommand` for the platform log UI command helpers.
 *
 * This file owns Node test regression coverage for npm-run shortcut strings and tsx argv shell-quoting used by log-tail UI flows.
 * Flow: build view plan fixtures -> assert shortcut strings and formatted tsx argv.
 *
 * @testing Node.js test (tsx): from the repository root, npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/format-command.ts - Implementation under test that formats npm shortcuts and tsx argv for log-tail UI plans.
 * @see packages/platform-logs-kit/src/test-config.unit.ts - Shared unit-test config fixture merged into view plans exercised by these assertions.
 * @see packages/platform-logs-kit/src/types.ts - `LogTailUiPlan` view-plan types used when constructing fixtures for shortcut formatting tests.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  logTailUiFormatNpmRunShortcut,
  logTailUiFormatTsxCommand,
} from "./format-command.js";
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

test("logTailUiFormatNpmRunShortcut matches configured defaults", () => {
  assert.equal(
    logTailUiFormatNpmRunShortcut(
      platformLogsKitTestConfig,
      view({ mode: "tail" }),
    ),
    "npm run logs",
  );
  assert.equal(
    logTailUiFormatNpmRunShortcut(
      platformLogsKitTestConfig,
      view({ timeoutSeconds: "5" }),
    ),
    null,
  );
  assert.equal(
    logTailUiFormatNpmRunShortcut(platformLogsKitTestConfig, {
      kind: "list-runs",
    }),
    "npm run logs:list:runs",
  );
});

test("logTailUiFormatTsxCommand shell-quotes argv tokens", () => {
  assert.equal(
    logTailUiFormatTsxCommand("scripts/x.ts", ["--scope", "a b"]),
    "npx tsx scripts/x.ts '--scope' 'a b'",
  );
});
