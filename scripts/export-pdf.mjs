import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const outputArg = process.argv[2];
const inputArg = process.argv[3] || process.env.RESUME_HTML;
const inputHtml = inputArg
  ? path.resolve(repoRoot, inputArg)
  : path.join(repoRoot, "index.html");
const outputPdf = path.resolve(repoRoot, outputArg || "export/vibe-resume-demo.pdf");
const defaultExportWidth = 1080;

function findPlaywrightHeadlessShell() {
  const cacheRoot = path.join(process.env.HOME || "", "Library", "Caches", "ms-playwright");
  if (!existsSync(cacheRoot)) return undefined;

  const versions = readdirSync(cacheRoot)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort()
    .reverse();

  for (const version of versions) {
    const candidate = path.join(
      cacheRoot,
      version,
      "chrome-headless-shell-mac-arm64",
      "chrome-headless-shell"
    );
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const chromeCandidates = [
  process.env.CHROME_PATH,
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  findPlaywrightHeadlessShell(),
  chromium.executablePath(),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
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
      width: 1200,
      height: 2200
    }
  });

  await page.emulateMedia({ media: "screen" });
  await page.goto(pathToFileURL(inputHtml).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);

  const requestedExportWidth = await page.evaluate(() =>
    Number.parseFloat(document.documentElement.dataset.exportWidth || document.body.dataset.exportWidth)
  );
  const exportWidth = Number.isFinite(requestedExportWidth)
    ? requestedExportWidth
    : defaultExportWidth;

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

      .resume-book {
        margin: 0 !important;
        width: ${exportWidth}px !important;
      }

      .resume-page {
        border: 0 !important;
        box-shadow: none !important;
        height: var(--page-height) !important;
        margin: 0 !important;
        min-height: var(--page-height) !important;
        overflow: hidden !important;
        width: ${exportWidth}px !important;
      }
    `
  });

  const pageSize = await page.evaluate(() => {
    const resumePages = [...document.querySelectorAll(".resume-page")];
    if (resumePages.length > 0) {
      const firstRect = resumePages[0].getBoundingClientRect();
      const heights = resumePages.map((pageEl) => Math.ceil(pageEl.getBoundingClientRect().height));
      const pageHeight = Math.max(...heights);

      const overflowingPages = resumePages
        .map((pageEl, index) => ({
          page: index + 1,
          available: pageEl.clientHeight,
          required: pageEl.scrollHeight
        }))
        .filter(({ available, required }) => required > available + 2);

      if (overflowingPages.length > 0) {
        const details = overflowingPages
          .map(({ page, available, required }) => `page ${page}: ${required}px required, ${available}px available`)
          .join("; ");
        throw new Error(`Resume content overflows its fixed page: ${details}`);
      }

      for (const pageEl of resumePages) {
        pageEl.style.height = `${pageHeight}px`;
        pageEl.style.minHeight = `${pageHeight}px`;
      }

      return {
        mode: "paged",
        pages: resumePages.length,
        width: Math.ceil(firstRect.width),
        height: pageHeight
      };
    }

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
      mode: "continuous",
      pages: 1,
      width: Math.ceil(rect.width),
      height: Math.ceil(Math.max(pageEl.scrollHeight, contentBottom + paddingBottom))
    };
  });

  const pdfHeight = pageSize.mode === "paged" ? pageSize.height : pageSize.height + 35;

  await page.addStyleTag({
    content: `
      @page {
        margin: 0;
        size: ${pageSize.width}px ${pdfHeight}px;
      }

      .resume-page {
        break-after: page;
        page-break-after: always;
      }

      .resume-page:last-child {
        break-after: auto;
        page-break-after: auto;
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
  console.log(`Input HTML: ${path.relative(repoRoot, inputHtml)}`);
  console.log(`Layout: ${pageSize.mode} (${pageSize.pages} page${pageSize.pages === 1 ? "" : "s"})`);
  console.log(`Rendered page size: ${pageSize.width}px x ${pageSize.height}px`);
  console.log(`PDF page size: ${pageSize.width}px x ${pdfHeight}px`);
  console.log(`Chromium: ${executablePath}`);
} finally {
  await browser.close();
}
