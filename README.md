# JSON Compare

Compare two JSON documents and download a plain-English PDF report.

Everything runs locally in your browser. No server, no login, no uploads — your data never leaves your machine.

## Features

- **Two-pane editor** with Monaco (VSCode-style) — syntax highlighting, inline validation, file drop, format button
- **Plain-English diff** — instead of cryptic paths like `users[3].billing.zip`, you see _"users → item #4 → billing → zip changed from 12345 to 67890"_
- **Top findings** — the 5 most impactful changes surfaced first
- **Summary card** with totals and a color-coded pie chart
- **Side-by-side tree view** powered by jsondiffpatch
- **Download PDF report** — clean, paginated, searchable PDF with cover page, summary, top findings, and detailed grouped changes
- **Advanced options** — ignore key order, treat null as missing, ignore whitespace/case, ignore specific paths (like `updatedAt`)
- **Light theme** tuned for eye comfort (warm white, soft blue, warm yellow)

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Build

```bash
npm run build
npm run preview
```

## Tech

React 19 · TypeScript · Vite · Tailwind · Monaco · microdiff · jsondiffpatch · @react-pdf/renderer · Zustand · Recharts · sonner

## Privacy

Every comparison — parsing, diffing, humanizing, PDF generation — runs entirely client-side. No network calls are made with your JSON data.
