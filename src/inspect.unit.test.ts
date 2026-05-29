/**
 * @fileoverview Verifies log-tail line inspection helpers for error-ish tokens, inspection-driven matching, and list filtering.
 *
 * This file owns Node `node:test` regression coverage for `logTailUiLineLooksLikeError`, `logTailUiLineMatchesInspection`, and `logTailUiFilterLines` against `LogTailUiInspection` snapshot flags.
 * Flow: build sample lines plus inspection options -> assert per-line classification and filtered line lists.
 *
 * @testing Node test (tsx --test): npm run platform-logs-kit:test
 *
 * @see packages/platform-logs-kit/src/inspect.ts - Pure helpers under test that classify tail lines and filter snapshots using the same inspection contract the log UIs consume.
 * @see packages/platform-logs-kit/src/types.ts - Declares `LogTailUiInspection` (errors-only, substring, JSON-lines) whose fields these tests exercise end to end.
 * @documentation reviewed=2026-05-22 standard=FILE_OVERVIEW_STANDARDS_TYPESCRIPT@3
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  logTailUiFilterLines,
  logTailUiLineLooksLikeError,
  logTailUiLineMatchesInspection,
} from "./inspect.js";

test("logTailUiLineLooksLikeError detects error tokens", () => {
  assert.equal(logTailUiLineLooksLikeError("[APP] ERROR: boom"), true);
  assert.equal(logTailUiLineLooksLikeError("listening on 3000"), false);
});

test("logTailUiLineMatchesInspection applies filters", () => {
  assert.equal(
    logTailUiLineMatchesInspection("ok", {
      errorsOnly: true,
      substring: "",
      jsonLines: false,
    }),
    false,
  );
  assert.equal(
    logTailUiLineMatchesInspection("x foo y", {
      errorsOnly: false,
      substring: "Foo",
      jsonLines: false,
    }),
    true,
  );
});

test("logTailUiFilterLines filters by inspection", () => {
  assert.deepEqual(
    logTailUiFilterLines(["a", "ERROR b", "c"], {
      errorsOnly: true,
      substring: "",
      jsonLines: false,
    }),
    ["ERROR b"],
  );
});
