# VibeResumePDF

VibeResumePDF, also called Vibe 简历, is a web-first resume template designed for vibe coding with AI. The webpage is the source of truth, and the export script turns the same screen layout into a one-page PDF.

The project is designed for people who want to maintain a resume through natural-language editing instead of repeatedly adjusting Word, LaTeX, or browser print output. Tell an AI coding assistant what role you are targeting, what experience you want to emphasize, and what style you prefer; let it edit `index.html` and `styles.css`; preview the webpage; then run one script to generate a PDF that closely matches the page.

## Demo Content Notice

Most resume information in this repository is mock data for template demonstration. Names, schools, phone numbers, email addresses, awards, internship roles, project descriptions, dates, and skills are fictional.

The profile photo at `assets/avatar.png` is AI-generated and does not depict a real person.

The Huawei and Bilibili company names are intentionally kept as easter eggs. In the demo resume they are marked with `（仅为示例演示）`; all internship details below them are mock and do not describe real work experience. Company names and trademarks belong to their respective owners.

The MiniCode item is also kept as an open-source easter egg and integration example. It points to the real project `https://github.com/LiuMengxuan04/MiniCode`; replace it with your own project if you want a fully fictional demo.

## Features

- Vibe coding friendly: ask an AI agent to update content, layout, tone, icons, and PDF output for you.
- Web-first resume: maintain content directly in HTML and CSS.
- One-page PDF export: Chromium renders the screen layout and exports a single long-page PDF.
- Print mismatch avoidance: the export script does not rely on manual browser print layout.
- Static and portable: no frontend build step is required.
- Customizable: replace text, avatar, colors, spacing, modules, and project links.
- Open-source ready: includes README, `.gitignore`, package metadata, export script, and MIT license.

## Project Structure

```text
.
├── assets/
│   ├── logos/
│   │   ├── bilibili-color.svg
│   │   └── huawei-color.svg
│   ├── avatar.png
│   └── minicode-logo.svg
├── skills/
│   └── vibe-resume-editor/
│       └── SKILL.md
├── scripts/
│   └── export-pdf.mjs
├── export-pdf.sh
├── index.html
├── styles.css
├── package.json
└── README.md
```

## Recommended Vibe Coding Workflow

This template is intentionally easy for an AI coding assistant to edit. A practical workflow is:

1. Describe the target position, company type, and resume language.
2. Ask the AI to rewrite the mock content into your real resume while keeping the existing HTML structure.
3. Ask the AI to tune density, spacing, section order, and wording for one-page PDF output.
4. Preview the webpage and point out visual issues with screenshots.
5. Run `npm run export:pdf`, inspect the PDF, then ask the AI to fix any remaining layout details.

Example prompt:

```text
请基于这个模板帮我制作后端开发实习简历。保持一页 PDF，突出分布式系统、开源项目和工程能力，语气正式但不要堆关键词。
```

## AI Skill

This repository includes a plug-and-play Codex-style skill at `skills/vibe-resume-editor/SKILL.md`. It tells an AI coding agent how to edit this template, preserve the web-to-PDF export path, keep demo/easter-egg content honest, and validate the generated PDF.

To install it locally for Codex:

```bash
mkdir -p ~/.codex/skills
cp -R skills/vibe-resume-editor ~/.codex/skills/
```

Then start a new Codex session and ask:

```text
使用 vibe-resume-editor skill，把这份 Vibe 简历改成我的真实后端开发实习简历，并导出一页 PDF。
```

If your AI tool does not support Codex skills, you can still paste the content of `skills/vibe-resume-editor/SKILL.md` into the conversation as project instructions.

## Icons

This template ships with simple inline icons, local SVG company logos, and a MiniCode logo easter egg.

Company logos are optional. If a company logo is not available or you do not want to handle trademark assets, keep the company name as plain text. The resume should still look complete without a logo.

If you choose to use a vector logo, prefer one of these paths:

- Upload your own SVG to `assets/logos/` and reference it from `index.html`.
- Provide a direct SVG link to your AI coding agent and ask it to download the file into `assets/logos/`.
- Ask your agent to search https://lobehub.com/icons for the company or project icon, then use the SVG/PNG/WebP asset if available.

The demo Bilibili and Huawei SVG files were sourced from LobeHub Icons' static SVG package. Company names, logos, and trademarks belong to their respective owners.

## Preview

Open `index.html` directly, or start a small static server:

```bash
npm run preview
```

Then open:

```text
http://localhost:4173
```

If this repository is on a remote server, `localhost` means the server itself. Use your IDE's port forwarding panel or SSH forwarding:

```bash
ssh -L 4173:localhost:4173 user@server
```

Then open `http://localhost:4173` on your own computer.

## Export PDF

Install dependencies:

```bash
npm install
```

Export the default demo PDF:

```bash
npm run export:pdf
```

or:

```bash
./export-pdf.sh
```

Default output:

```text
export/vibe-resume-pdf-demo.pdf
```

This demo PDF is intentionally committed to the repository as a preview artifact, so people can inspect the expected export result without running the script first. Other files under `export/` remain ignored by default.

You can also choose a path:

```bash
./export-pdf.sh export/my-resume.pdf
```

The script uses `playwright-core` with a local Chrome/Chromium executable. It checks these locations in order:

- `CHROME_PATH`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
- common system Chromium/Chrome paths

If auto-detection fails, run:

```bash
CHROME_PATH=/path/to/chrome ./export-pdf.sh
```

## Why Not Browser Print?

Manual browser printing often switches from `screen` media to `print` media. That can trigger different page sizes, margins, pagination, font rendering, scaling, and `@media print` rules, so the PDF may not match what you saw on the webpage.

This template exports through a script instead. It opens `index.html` with Chromium, forces `screen` media, hides the toolbar, measures the `.page` element, and creates a one-page PDF with the same pixel width and measured height.

## Customization Checklist

- Replace the mock profile in `index.html`.
- Replace `assets/avatar.png` with your own photo or illustration.
- Update education, internships, projects, and skills.
- Change CSS variables in `styles.css` for width, typography, colors, and spacing.
- Decide whether each company/project should use a logo. If yes, place SVG files under `assets/logos/`; if no, keep text-only company names.
- Replace the MiniCode easter egg with your own open-source project.
- Use vibe coding with an AI assistant to iterate on wording, layout, and PDF density.
- Run `npm run export:pdf` and inspect `export/vibe-resume-pdf-demo.pdf`.

## License

MIT
