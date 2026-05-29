/**
 * @fileoverview Verifies `logTailUiBuildPreviewPlainText` output for default view plans and list-runs plans in the platform log UI plain-text preview composer.
 *
 * This file owns Node test regression coverage for operator-facing preview strings that surface npm shortcuts, direct `tsx` argv, and list-runs command hints.
 * Flow: apply shared test config and view plans -> call preview composer -> assert expected substrings in rendered text.
 *
 * @testing Node.js test (tsx): from the repository root, npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/preview-plain.ts - Plain-text preview composer whose `logTailUiBuildPreviewPlainText` output is asserted here.
 * @see packages/platform-logs-kit/src/test-config.unit.ts - Shared unit-test config fixture and default view-plan inputs merged into the preview strings under test.
 * @see packages/platform-logs-kit/src/types.ts - `LogTailUiPlan` shapes (default view and list-runs) passed into the preview composer exercised by these assertions.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { logTailUiBuildPreviewPlainText } from "./preview-plain.js";
import { logTailUiDefaultViewPlan } from "./types.js";
import { platformLogsKitTestConfig } from "./test-config.unit.js";

test("logTailUiBuildPreviewPlainText includes shortcut and direct command", () => {
  const text = logTailUiBuildPreviewPlainText(
    platformLogsKitTestConfig,
    logTailUiDefaultViewPlan(platformLogsKitTestConfig),
  );
  assert.match(text, /npm run logs/u);
  assert.match(text, /npx tsx scripts\/runtime\/logs\.ts/u);
  assert.match(text, /--lines/u);
  assert.match(text, /1000/u);
});

test("logTailUiBuildPreviewPlainText covers list-runs", () => {
  const text = logTailUiBuildPreviewPlainText(platformLogsKitTestConfig, {
    kind: "list-runs",
  });
  assert.match(text, /logs:list:runs/u);
  assert.match(text, /list-runs/u);
});
