import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLobeIconCDN } from "@lobehub/icons/es/features/getLobeIconCDN/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "assets", "logos");
const toc = JSON.parse(
  await readFile(new URL("../node_modules/@lobehub/icons/es/toc.json", import.meta.url), "utf8")
);

const requestedIcons = [
  { id: "Bilibili", file: "bilibili-color.svg" }
];

await mkdir(outputDir, { recursive: true });

for (const requested of requestedIcons) {
  const metadata = toc.find((item) => item.id === requested.id);
  if (!metadata) {
    throw new Error(`@lobehub/icons toc does not contain ${requested.id}.`);
  }
  if (!metadata.param.hasColor) {
    throw new Error(`${requested.id} has no color SVG variant in @lobehub/icons.`);
  }

  const url = getLobeIconCDN(requested.id.toLowerCase(), {
    cdn: "unpkg",
    format: "svg",
    type: "color"
  });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${requested.id} from ${url}: ${response.status}`);
  }

  const svg = await response.text();
  if (!svg.trimStart().startsWith("<svg")) {
    throw new Error(`${requested.id} did not return an SVG document.`);
  }

  await writeFile(path.join(outputDir, requested.file), svg);
  console.log(`${requested.id} (${metadata.fullTitle}) -> assets/logos/${requested.file}`);
}
