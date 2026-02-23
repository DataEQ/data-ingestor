# ⚡ Data Ingestor

A client-side data import, mapping, and export tool with built-in PII cleansing. Upload CSV or JSON, inspect your data, map and transform fields, then export in your desired format — all without leaving the browser.

**Zero server. Zero data leaves your machine.**

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-0.1.0-blue)

---

## Features

### 📄 Import
- Drag & drop or file picker
- Supports **CSV** and **JSON** (including nested arrays)
- Auto-detects encoding and delimiters (via Papa Parse)

### 🔍 Inspect
- Auto-detects field types: `string`, `number`, `boolean`, `date`, `null`, `array`, `object`
- Color-coded type badges
- Data preview table (first 50 rows)
- File stats: row count, field count, file size

### 🔀 Map
- Rename fields (source → target)
- Reorder fields with up/down controls
- Toggle fields on/off
- Apply transforms per field
- **Live preview** — see mapped output update in real-time

### 🛡 PII Cleansing

Built-in transforms for privacy-sensitive data:

| Transform | Example Input | Example Output |
|-----------|--------------|----------------|
| Mask email | `sarah.thompson@barclays.co.uk` | `s***@b***.uk` |
| Mask phone | `+44 7911 234567` | `44*******67` |
| Mask name | `Sarah Thompson` | `S**** T*******` |
| Mask card number | `4111111111111111` | `****-****-****-1111` |
| Mask SSN/ID | `123-45-6789` | `***-**-6789` |
| Mask IP address | `192.168.45.102` | `192.168.xxx.xxx` |
| Mask DOB | `1985-06-14` | `1985-XX-XX` |
| Initials only | `Sarah Thompson` | `S.T` |
| Hash (pseudonymise) | `sarah.thompson@barclays.co.uk` | `hash_k8f2m1` |
| Redact (full) | `anything` | `██REDACTED██` |

PII transforms are visually highlighted with amber badges in the UI.

### 📤 Export
- Export as **CSV** or **JSON**
- Download mapped file
- **Copy schema as JSON** — save your mapping configuration for reuse
- Output preview before download
- Stats: row count, field count, output size

---

## Getting Started

```bash
# Clone
git clone git@github.com:DataEQ/data-ingestor.git
cd data-ingestor

# Install
npm install

# Run
npm run dev
```

Open **http://localhost:8950** in your browser.

### Sample Data

A sample Qualtrics-style CSV is included at `public/sample-qualtrics.csv` — modelled on UK financial services CSAT/NPS survey data with realistic PII fields.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [React 18](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [Papa Parse](https://www.papaparse.com) | CSV parsing |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | Data display font |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | UI font |

No backend. No external API calls. Everything runs in the browser.

---

## Schema Reuse

When you export, you can copy the mapping schema as JSON:

```json
[
  { "source": "RecipientEmail", "target": "email_masked", "transform": "mask_email" },
  { "source": "RecipientFirstName", "target": "first_name", "transform": "initials" },
  { "source": "Q1_NPS", "target": "nps_score", "transform": "number" },
  { "source": "Q4_OpenFeedback", "target": "feedback", "transform": "none" },
  { "source": "IPAddress", "target": "ip", "transform": "mask_ip" }
]
```

This schema is designed for future CLI integration:

```bash
# Future CLI usage
datamapper input.csv --schema mapping.json --out output.json
datamapper input.json --schema mapping.json --out output.csv --format csv
```

---

## Roadmap

- [ ] **CLI mode** — `npx data-ingestor` as a command-line tool for agent/pipeline use
- [ ] **Schema save/load** — import saved mapping schemas in the UI
- [ ] **Streaming** — handle large files (100MB+) without loading into memory
- [ ] **Custom transforms** — user-defined regex, JavaScript expressions
- [ ] **Auto-detect PII** — suggest PII transforms based on field names and content patterns
- [ ] **Batch processing** — drag multiple files, apply the same schema
- [ ] **Agent skill** — expose as an OpenClaw / MCP tool for automated data pipelines
- [ ] **Validation rules** — flag rows that fail type or format constraints
- [ ] **Column splitting/merging** — combine or split fields (e.g. full name → first + last)

---

## Project Structure

```
data-ingestor/
├── public/
│   └── sample-qualtrics.csv    # Sample data
├── src/
│   ├── App.jsx                 # Main app — Upload, Inspect, Map, Export steps
│   ├── utils.js                # Parsing, type detection, transforms, PII functions
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind + custom styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── BRIEF.md                    # Original design brief
```

---

## License

MIT

---

Built with 🦡 by [DataEQ](https://github.com/DataEQ)
