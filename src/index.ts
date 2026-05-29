/**
 * @fileoverview Public exports for config-driven platform log UI and command planning helpers.
 *
 * Keep project-specific source ids, log directories, npm aliases, and labels in
 * `platform-logs.config.ts`; this package owns reusable plan validation, argv building, preview
 * formatting, history file resolution, snapshot reading, and line inspection.
 *
 * @example
 * ```typescript
 * import { logTailUiResolveRepoRootFromModuleUrl } from "@gg-utils/platform-logs-kit";
 *
 * const repoRoot = logTailUiResolveRepoRootFromModuleUrl({
 *   moduleUrl: import.meta.url,
 *   relativePathFromModuleDir: "../..",
 * });
 * ```
 *
 * @testing Node test runner (tsx --test): npm run platform-logs-kit:test
 *
 * @see platform-logs.config.ts - Root log source matrix and npm aliases that wire wizard and menu surfaces through imports from this package barrel.
 * @see packages/platform-logs-kit/src/types.ts - Shared config and plan contracts re-exported here for callers orchestrating log tail UIs.
 * @see packages/platform-logs-kit/src/validate-plan.ts - Plan validation helper implementing the kit validation surface alongside argv and preview exports.
 *
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

export * from "./build-argv.js";
export * from "./format-command.js";
export * from "./ink-app.js";
export * from "./inspect.js";
export * from "./interactive-menu.js";
export * from "./opentui-app.js";
export * from "./preview-plain.js";
export * from "./repo-root.js";
export * from "./resolve-log-targets.js";
export * from "./snapshot.js";
export * from "./types.js";
export * from "./ui-entrypoint.js";
export * from "./ui-launcher.js";
export * from "./validate-plan.js";
export * from "./wizard-model.js";
