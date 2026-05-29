/**
 * @fileoverview Verifies shared log-tail UI launcher argv parsing and stable help-text formatting
 * used by Ink and OpenTUI script entrypoints.
 *
 * This file owns Node `node:test` regression coverage for `PlatformLogsKit_parseUiLaunchOptions`
 * and `PlatformLogsKit_formatUiHelpText`, including resolved `--project-root`, unknown-flag
 * errors, and rendered invocation plus fallback lines in help output.
 * Flow: argv slice + cwd + error prefix -> parse helper -> assert parsed flags or thrown error;
 * fixed help config -> format helper -> assert substring matches.
 *
 * @example
 * ```typescript
 * test("parses preview flag", () => {
 *   assert.deepEqual(
 *     PlatformLogsKit_parseUiLaunchOptions({
 *       argv: ["--print-preview"],
 *       cwd: "/cwd",
 *       errorPrefix: "[logs:cli:test]",
 *     }),
 *     { helpRequested: false, printPreviewRequested: true, projectRoot: "/cwd" },
 *   );
 * });
 * ```
 *
 * @testing Node test runner (tsx): npm run platform-logs-kit:test from the repository root runs tsx --test over every packages/platform-logs-kit/src/*.unit.test.ts module (package test script glob), re-executing the launcher cases asserted here.
 * @testing Node test (tsx): cd packages/platform-logs-kit && node ../../node_modules/tsx/dist/cli.mjs --test src/ui-launcher.unit.test.ts
 *
 * @see packages/platform-logs-kit/src/ui-launcher.ts - Launcher argv parser and help formatter implementation whose flag wiring, path resolution, and error prefixes are asserted here.
 * @see packages/platform-logs-kit/src/ui-entrypoint.ts - UI entrypoint resolver that calls `PlatformLogsKit_parseUiLaunchOptions` while resolving help, preview, and render actions for log UIs.
 * @see scripts/log-tail/ui/cli-ink/launch-options.ts - Root Ink argv adapter that imports the same parse and format helpers so CLI behavior stays aligned with this suite.
 * @documentation reviewed=2026-05-23 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  PlatformLogsKit_formatUiHelpText,
  PlatformLogsKit_parseUiLaunchOptions,
} from "./ui-launcher.js";

test("PlatformLogsKit_parseUiLaunchOptions parses preview and project root", () => {
  assert.deepEqual(
    PlatformLogsKit_parseUiLaunchOptions({
      argv: ["--print-preview", "--project-root", "/tmp/repo"],
      cwd: "/cwd",
      errorPrefix: "[logs:cli:test]",
    }),
    {
      helpRequested: false,
      printPreviewRequested: true,
      projectRoot: "/tmp/repo",
    },
  );
});

test("PlatformLogsKit_parseUiLaunchOptions rejects unknown flags", () => {
  assert.throws(
    () =>
      PlatformLogsKit_parseUiLaunchOptions({
        argv: ["--nope"],
        cwd: "/cwd",
        errorPrefix: "[logs:cli:test]",
      }),
    /Unknown option/u,
  );
});

test("PlatformLogsKit_formatUiHelpText includes invocations and fallback commands", () => {
  const helpText = PlatformLogsKit_formatUiHelpText({
    entryLabel: "Fallback:",
    fallbackLines: ["npm run logs*"],
    invocationLines: ["npm run logs:cli:test"],
    title: "Log tail — test",
  });
  assert.match(helpText, /logs:cli:test/u);
  assert.match(helpText, /npm run logs\*/u);
  assert.match(helpText, /--print-preview/u);
});
