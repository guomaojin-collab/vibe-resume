import { inflateSync } from "node:zlib";

function decodePdfStreams(pdfBuffer) {
  const binary = pdfBuffer.toString("latin1");
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const decoded = [];

  for (const match of binary.matchAll(streamPattern)) {
    const raw = Buffer.from(match[1], "latin1");
    try {
      decoded.push(inflateSync(raw).toString("latin1"));
    } catch {
      decoded.push(match[1]);
    }
  }

  return decoded;
}

export function analyzePdfTextOperators(pdfBuffer) {
  const streams = decodePdfStreams(pdfBuffer);
  let textBlocks = 0;
  let textShows = 0;

  for (const stream of streams) {
    textBlocks += stream.match(/\bBT\b/g)?.length || 0;
    textShows += stream.match(/(?<![A-Za-z])T[Jj](?![A-Za-z])/g)?.length || 0;
  }

  return { streams: streams.length, textBlocks, textShows };
}

export function assertPdfContainsRenderedText(pdfBuffer, expectedTextLength) {
  if (expectedTextLength < 100) return;

  const analysis = analyzePdfTextOperators(pdfBuffer);
  if (analysis.textBlocks >= 3 && analysis.textShows >= 3) return;

  throw new Error(
    [
      "The PDF was created, but its rendered text layer is empty or incomplete.",
      `HTML text length: ${expectedTextLength}; PDF text blocks: ${analysis.textBlocks}; PDF text-show operations: ${analysis.textShows}.`,
      "This can happen when CHROME_PATH points to a system Chrome version that is incompatible with the installed playwright-core version.",
      "Unset CHROME_PATH to let VibeResume select Playwright's bundled Chromium, or set it to a matching Playwright Chromium executable."
    ].join(" ")
  );
}
