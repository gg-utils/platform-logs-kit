/**
 * @fileoverview Owns the shared canned `PlatformLogsKit_Config` fixture that platform-logs-kit Jest
 * suites import when exercising argv builders, preview text, and wizard menus without touching
 * real log artifacts.
 *
 * This file keeps one stable config object aligned with the package contract so multiple unit
 * tests assert consistent source ids, scopes, shortcuts, and default view-plan defaults.
 * Flow: import `platformLogsKitTestConfig` -> pass into UI helpers -> assert formatted argv or
 * preview output.
 *
 * @testing Jest unit: npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/types.ts - Declares `PlatformLogsKit_Config`, the compile-time contract every field in this canned fixture must satisfy.
 * @see packages/platform-logs-kit/src/build-argv.unit.test.ts - Imports this fixture to regression-test argv construction against the stable runtime and dev source definitions encoded here.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */
import type { PlatformLogsKit_Config } from "./types.js";
/**
 * Canned platform logs kit configuration shared across unit tests.
 *
 * @remarks
 * Test-only fixture: update alongside `PlatformLogsKit_Config` when new required config keys land
 * so dependent Jest suites keep compiling.
 */
export declare const platformLogsKitTestConfig: PlatformLogsKit_Config;
//# sourceMappingURL=test-config.unit.d.ts.map