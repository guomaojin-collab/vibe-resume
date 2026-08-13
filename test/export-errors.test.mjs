import assert from "node:assert/strict";
import { test } from "node:test";

import { createBrowserLaunchError } from "../scripts/export-errors.mjs";

test("returns actionable guidance for restricted browser environments", () => {
  const error = createBrowserLaunchError(
    new Error("MachPortRendezvousServer: Permission denied"),
    "/path/to/chrome"
  );

  assert.match(error.message, /restricted environment/);
  assert.match(error.message, /local terminal/);
  assert.match(error.message, /does not bypass sandbox permissions/);
});

test("keeps generic launch errors concise", () => {
  const error = createBrowserLaunchError(
    new Error("Executable is damaged\nvery long browser logs"),
    "/path/to/chrome"
  );

  assert.equal(
    error.message,
    "Chromium failed to start: /path/to/chrome. Executable is damaged"
  );
});
