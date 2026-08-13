import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";

import {
  analyzePdfTextOperators,
  assertPdfContainsRenderedText
} from "../scripts/pdf-text-check.mjs";

function pdfWithStream(contents, compressed = false) {
  const body = compressed ? deflateSync(Buffer.from(contents)) : Buffer.from(contents);
  return Buffer.concat([
    Buffer.from("%PDF-1.4\n1 0 obj\n<< >>\nstream\n"),
    body,
    Buffer.from("\nendstream\nendobj\n%%EOF")
  ]);
}

test("counts text operators in uncompressed PDF streams", () => {
  const pdf = pdfWithStream("BT (one) Tj ET\nBT [(two)] TJ ET\nBT (three) Tj ET");
  assert.deepEqual(analyzePdfTextOperators(pdf), {
    streams: 1,
    textBlocks: 3,
    textShows: 3
  });
  assert.doesNotThrow(() => assertPdfContainsRenderedText(pdf, 500));
});

test("counts text operators in Flate-compressed PDF streams", () => {
  const pdf = pdfWithStream("BT (one) Tj ET\nBT (two) Tj ET\nBT (three) Tj ET", true);
  assert.equal(analyzePdfTextOperators(pdf).textShows, 3);
});

test("rejects a mostly blank PDF for a text-heavy HTML document", () => {
  const pdf = pdfWithStream("BT (|) Tj ET");
  assert.throws(
    () => assertPdfContainsRenderedText(pdf, 2000),
    /rendered text layer is empty or incomplete/
  );
});

test("does not reject intentionally text-free documents", () => {
  const pdf = pdfWithStream("q 0 0 100 100 re f Q");
  assert.doesNotThrow(() => assertPdfContainsRenderedText(pdf, 0));
});
