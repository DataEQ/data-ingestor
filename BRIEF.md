# Data Mapper — Prototype Brief

## What
A standalone web app (React + Vite) that lets users:
1. **Upload** a CSV or JSON file (drag & drop or file picker)
2. **Inspect** — auto-detect fields, types, show a data preview table
3. **Map** — define an export schema: rename fields, reorder, transform (e.g. split name → first/last), exclude fields, add computed fields
4. **Export** — download the mapped data as CSV or JSON

## Future
- CLI mode: `datamapper input.csv --schema mapping.json --out output.json`
- Agent-callable: an agent can invoke it as a skill/tool
- Streaming for large files

## Design Direction
- Clean, utility-focused, slightly editorial — like a well-designed dev tool
- Dark theme, monospace data views, accent color for actions
- Drag-and-drop field reordering in the mapper
- Live preview: as you map, see the output update in real-time
- No backend — everything runs client-side in the browser

## Tech
- React 18 + Vite
- Tailwind CSS
- Papa Parse (CSV parsing)
- No other deps — keep it lean

## Pages / Flow
1. **Upload** — centered dropzone, accepts .csv / .json
2. **Inspect** — left panel: field list with detected types (string, number, date, boolean, array, object). Right panel: data preview table (first 50 rows)
3. **Map** — left: source fields (draggable). Center: mapping rules (source → target name, optional transform). Right: live output preview
4. **Export** — format picker (CSV/JSON), download button, copy schema as JSON for CLI reuse

## Key Interactions
- Drag source field into mapper to add it
- Click field in mapper to rename/transform
- Toggle fields on/off
- Transform options: rename, split, join, format date, uppercase/lowercase, regex extract, default value
- Schema save/load (JSON) for reuse
- Live row count, field count, error count
