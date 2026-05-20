import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const inputHtml = path.join(repoRoot, "index.html");
const outputArg = process.argv[2];
const outputPdf = path.resolve(repoRoot, outputArg || "export/vibe-resume-demo.pdf");
const exportWidth = 1080;

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "/home/lmx/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable"
].filter(Boolean);

const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  throw new Error(
    "No Chromium executable found. Set CHROME_PATH to a Chrome/Chromium binary and rerun ./export-pdf.sh."
  );
}

await mkdir(path.dirname(outputPdf), { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true
});

try {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: {
      width: exportWidth,
      height: 2200
    }
  });

  await page.emulateMedia({ media: "screen" });
  await page.goto(pathToFileURL(inputHtml).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);

  await page.addStyleTag({
    content: `
      html, body {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .toolbar {
        display: none !important;
      }

      .page {
        border: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        min-height: 0 !important;
        overflow: visible !important;
        width: ${exportWidth}px !important;
      }
    `
  });

  const pageSize = await page.evaluate(() => {
    const pageEl = document.querySelector(".page");
    if (!pageEl) {
      throw new Error("Could not find .page element.");
    }
    const rect = pageEl.getBoundingClientRect();
    const lastChild = pageEl.lastElementChild;
    const lastRect = lastChild?.getBoundingClientRect();
    const contentBottom = lastRect ? lastRect.bottom - rect.top : pageEl.scrollHeight;
    const paddingBottom = Number.parseFloat(getComputedStyle(pageEl).paddingBottom) || 0;
    return {
      width: Math.ceil(rect.width),
      height: Math.ceil(Math.max(pageEl.scrollHeight, contentBottom + paddingBottom))
    };
  });

  const pdfHeight = pageSize.height + 35;

  await page.addStyleTag({
    content: `
      @page {
        margin: 0;
        size: ${pageSize.width}px ${pdfHeight}px;
      }
    `
  });

  await page.setViewportSize({
    width: pageSize.width,
    height: pdfHeight
  });

  await page.pdf({
    path: outputPdf,
    width: `${pageSize.width}px`,
    height: `${pdfHeight}px`,
    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0"
    },
    preferCSSPageSize: true,
    printBackground: true,
    scale: 1
  });

  console.log(`PDF exported: ${path.relative(repoRoot, outputPdf)}`);
  console.log(`Rendered content size: ${pageSize.width}px x ${pageSize.height}px`);
  console.log(`PDF page size: ${pageSize.width}px x ${pdfHeight}px`);
  console.log(`Chromium: ${executablePath}`);
} finally {
  await browser.close();
}
