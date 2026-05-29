/**
 * @fileoverview Unit tests for package-owned platform log wizard option and transition models.
 *
 * @testing Package: `npm run platform-logs-kit:test`.
 * @see packages/platform-logs-kit/src/wizard-model.ts - State transition helpers under test.
 * @documentation reviewed=2026-05-21 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import { platformLogsKitTestConfig } from "./test-config.unit.js";
import type { PlatformLogsKit_WizardConfig } from "./wizard-model.js";
import {
  logTailUiWizardAppendBoundedLine,
  logTailUiWizardAppendBoundedText,
  logTailUiWizardBudgetOptions,
  logTailUiWizardEntryOptions,
  logTailUiWizardModeBackScreen,
  logTailUiWizardResolveBudgetSelection,
  logTailUiWizardResolveEntrySelection,
  logTailUiWizardResolveInspectSelection,
  logTailUiWizardResolveModeSelection,
  logTailUiWizardResolvePreviewSelection,
  logTailUiWizardResolveScopeSelection,
  logTailUiWizardScopeOptions,
  logTailUiWizardSplitBufferedText,
} from "./wizard-model.js";

const wizardConfig: PlatformLogsKit_WizardConfig = {
  scopedSourceId: "runtime",
  entryOptions: [
    {
      description: "Default runtime logs",
      includeInInkMenu: true,
      kind: "view",
      name: "Runtime",
      nextScreen: "mode",
      source: "runtime",
      value: "runtime",
    },
    {
      description: "Scoped runtime logs",
      includeInInkMenu: true,
      kind: "view",
      name: "Runtime scoped",
      nextScreen: "scope",
      source: "runtime",
      value: "runtime-scoped",
    },
    {
      description: "Dev logs",
      includeInInkMenu: true,
      kind: "view",
      name: "Dev",
      nextScreen: "mode",
      scope: "default",
      source: "dev",
      value: "dev",
    },
    {
      description: "List runs",
      includeInInkMenu: true,
      kind: "list-runs",
      name: "List",
      nextScreen: "preview",
      value: "list",
    },
    {
      description: "Exit",
      includeInInkMenu: false,
      kind: "exit",
      name: "Quit",
      value: "quit",
    },
  ],
};

test("logTailUiWizardEntryOptions filters Ink-hidden entry options", () => {
  assert.equal(
    logTailUiWizardEntryOptions(wizardConfig, {
      includeInkHiddenOptions: false,
    }).length,
    4,
  );
  assert.equal(
    logTailUiWizardEntryOptions(wizardConfig, { includeInkHiddenOptions: true })
      .length,
    5,
  );
});

test("logTailUiWizardResolveEntrySelection resolves plans and routes", () => {
  const runtime = logTailUiWizardResolveEntrySelection(
    platformLogsKitTestConfig,
    wizardConfig,
    "runtime",
  );
  assert.equal(runtime.action, "navigate");
  assert.equal(runtime.nextScreen, "mode");
  assert.equal(runtime.nextRoute, "/mode");
  assert.equal(runtime.plan.kind, "view");
  if (runtime.plan.kind === "view") {
    assert.equal(runtime.plan.source, "runtime");
    assert.equal(runtime.plan.scope, "run");
  }

  const listRuns = logTailUiWizardResolveEntrySelection(
    platformLogsKitTestConfig,
    wizardConfig,
    "list",
  );
  assert.equal(listRuns.action, "navigate");
  assert.equal(listRuns.nextScreen, "preview");
  assert.equal(listRuns.plan.kind, "list-runs");

  assert.deepEqual(
    logTailUiWizardResolveEntrySelection(
      platformLogsKitTestConfig,
      wizardConfig,
      "quit",
    ),
    { action: "exit" },
  );
});

test("logTailUiWizard rows derive from config", () => {
  assert.deepEqual(
    logTailUiWizardScopeOptions(platformLogsKitTestConfig, wizardConfig, {
      includeBackOption: true,
    }).map((option) => option.value),
    ["run", "all", "worker", "back"],
  );

  assert.deepEqual(
    logTailUiWizardBudgetOptions(platformLogsKitTestConfig, {
      includeBackOption: false,
    }).map((option) => option.value),
    ["lines", "chars", "tokens"],
  );
});

test("logTailUiWizard transitions update plan and screen", () => {
  const entry = logTailUiWizardResolveEntrySelection(
    platformLogsKitTestConfig,
    wizardConfig,
    "runtime-scoped",
  );
  assert.equal(entry.action, "navigate");
  const scoped = logTailUiWizardResolveScopeSelection(entry.plan, "worker");
  assert.equal(scoped.action, "navigate");
  assert.equal(scoped.nextScreen, "mode");
  assert.equal(
    logTailUiWizardModeBackScreen(wizardConfig, scoped.plan),
    "scope",
  );

  const mode = logTailUiWizardResolveModeSelection(
    wizardConfig,
    scoped.plan,
    "history",
  );
  assert.equal(mode.action, "navigate");
  const budget = logTailUiWizardResolveBudgetSelection(
    platformLogsKitTestConfig,
    mode.plan,
    "tokens",
  );
  assert.equal(budget.action, "navigate");
  assert.equal(budget.nextScreen, "inspect");
  if (budget.plan.kind === "view") {
    assert.equal(budget.plan.selectorKind, "tokens");
    assert.equal(budget.plan.selectorValue, "5000");
  }

  const inspected = logTailUiWizardResolveInspectSelection(
    budget.plan,
    "errors",
  );
  assert.equal(inspected.action, "navigate");
  if (inspected.plan.kind === "view") {
    assert.equal(inspected.plan.inspection.errorsOnly, true);
  }

  const preview = logTailUiWizardResolvePreviewSelection(
    inspected.plan,
    "run",
    [],
  );
  assert.equal(preview.action, "navigate");
  assert.equal(preview.nextScreen, "history");
});

test("logTailUiWizard preview and buffers handle edge states", () => {
  const listRuns = logTailUiWizardResolvePreviewSelection(
    { kind: "list-runs" },
    "run",
    [],
  );
  assert.equal(listRuns.action, "navigate");
  assert.equal(listRuns.nextScreen, "list");

  const invalid = logTailUiWizardResolveEntrySelection(
    platformLogsKitTestConfig,
    wizardConfig,
    "dev",
  );
  assert.equal(invalid.action, "navigate");
  assert.deepEqual(
    logTailUiWizardResolvePreviewSelection(invalid.plan, "run", ["bad"]),
    {
      action: "none",
    },
  );

  assert.deepEqual(logTailUiWizardAppendBoundedLine(["a", "b"], "c", 2), [
    "b",
    "c",
  ]);
  assert.equal(logTailUiWizardAppendBoundedText("abcdef", "gh", 4), "efgh");
  assert.deepEqual(logTailUiWizardSplitBufferedText("a\n\nb\nc\n", 2), [
    "b",
    "c",
  ]);
});
