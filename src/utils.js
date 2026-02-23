import Papa from 'papaparse';

// ─── Type Detection ──────────────────────────────
export function detectType(value) {
  if (value === null || value === undefined || value === '') return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  const s = String(value).trim();
  if (s === 'true' || s === 'false') return 'boolean';
  if (/^-?\d+(\.\d+)?$/.test(s)) return 'number';
  if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{2}\/\d{2}\/\d{4}/.test(s)) return 'date';
  return 'string';
}

export function detectFieldTypes(rows) {
  if (!rows.length) return {};
  const types = {};
  const sample = rows.slice(0, 100);
  const keys = Object.keys(rows[0]);
  for (const key of keys) {
    const counts = {};
    for (const row of sample) {
      const t = detectType(row[key]);
      counts[t] = (counts[t] || 0) + 1;
    }
    // Pick most common non-null type
    delete counts.null;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    types[key] = sorted.length ? sorted[0][0] : 'string';
  }
  return types;
}

// ─── File Parsing ────────────────────────────────
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) {
            // Try to find an array in the top-level keys
            const arrKey = Object.keys(data).find(k => Array.isArray(data[k]));
            data = arrKey ? data[arrKey] : [data];
          }
          resolve({ rows: data, fields: Object.keys(data[0] || {}) });
        } catch (err) { reject(new Error('Invalid JSON: ' + err.message)); }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (result) => {
          if (result.errors.length && !result.data.length) {
            reject(new Error(result.errors[0].message));
          } else {
            resolve({ rows: result.data, fields: result.meta.fields || [] });
          }
        },
        error: (err) => reject(err),
      });
    }
  });
}

// ─── Transforms ──────────────────────────────────
// ─── PII Helpers ─────────────────────────────────
function maskEmail(v) {
  const s = String(v ?? '');
  return s.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (_, local, domain) => {
    return local[0] + '***@' + domain[0] + '***.' + domain.split('.').pop();
  });
}

function maskPhone(v) {
  const s = String(v ?? '');
  return s.replace(/(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length < 7) return match; // too short to be a phone
    return digits.slice(0, 2) + '*'.repeat(digits.length - 4) + digits.slice(-2);
  });
}

function redactFull(v) { return '██REDACTED██'; }

function hashValue(v) {
  const s = String(v ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return 'hash_' + Math.abs(h).toString(36);
}

function maskName(v) {
  const s = String(v ?? '').trim();
  const parts = s.split(/\s+/);
  return parts.map(p => p[0] + '*'.repeat(Math.max(p.length - 1, 0))).join(' ');
}

function maskCard(v) {
  const s = String(v ?? '').replace(/\D/g, '');
  if (s.length < 8) return v;
  return '****-****-****-' + s.slice(-4);
}

function maskSSN(v) {
  const s = String(v ?? '').replace(/\D/g, '');
  if (s.length < 5) return v;
  return '***-**-' + s.slice(-4);
}

function maskIP(v) {
  const s = String(v ?? '');
  return s.replace(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/g, '$1.$2.xxx.xxx');
}

function maskDOB(v) {
  const s = String(v ?? '');
  // Keep just the year
  const match = s.match(/(\d{4})/);
  return match ? match[1] + '-XX-XX' : '****-XX-XX';
}

function initialsOnly(v) {
  const s = String(v ?? '').trim();
  return s.split(/\s+/).map(p => p[0]?.toUpperCase()).filter(Boolean).join('.');
}

export const TRANSFORMS = {
  none: { label: 'No transform', fn: (v) => v, group: 'basic' },
  uppercase: { label: 'UPPERCASE', fn: (v) => String(v ?? '').toUpperCase(), group: 'basic' },
  lowercase: { label: 'lowercase', fn: (v) => String(v ?? '').toLowerCase(), group: 'basic' },
  trim: { label: 'Trim whitespace', fn: (v) => String(v ?? '').trim(), group: 'basic' },
  number: { label: 'To number', fn: (v) => Number(v) || 0, group: 'basic' },
  boolean: { label: 'To boolean', fn: (v) => Boolean(v), group: 'basic' },
  string: { label: 'To string', fn: (v) => String(v ?? ''), group: 'basic' },
  split_first: { label: 'First word', fn: (v) => String(v ?? '').split(/\s+/)[0], group: 'basic' },
  split_last: { label: 'Last word', fn: (v) => { const p = String(v ?? '').split(/\s+/); return p[p.length - 1]; }, group: 'basic' },
  date_iso: { label: 'ISO date', fn: (v) => { try { return new Date(v).toISOString(); } catch { return v; } }, group: 'basic' },
  default_empty: { label: 'Default if empty', fn: (v, def = '') => (v === null || v === undefined || v === '') ? def : v, group: 'basic' },
  // PII Cleansing
  mask_email: { label: '🛡 Mask email', fn: maskEmail, group: 'pii' },
  mask_phone: { label: '🛡 Mask phone', fn: maskPhone, group: 'pii' },
  mask_name: { label: '🛡 Mask name', fn: maskName, group: 'pii' },
  mask_card: { label: '🛡 Mask card number', fn: maskCard, group: 'pii' },
  mask_ssn: { label: '🛡 Mask SSN/ID', fn: maskSSN, group: 'pii' },
  mask_ip: { label: '🛡 Mask IP address', fn: maskIP, group: 'pii' },
  mask_dob: { label: '🛡 Mask DOB (keep year)', fn: maskDOB, group: 'pii' },
  initials: { label: '🛡 Initials only', fn: initialsOnly, group: 'pii' },
  hash: { label: '🛡 Hash (pseudonymise)', fn: hashValue, group: 'pii' },
  redact: { label: '🛡 Redact (full)', fn: redactFull, group: 'pii' },
};

// ─── Apply Mapping ───────────────────────────────
export function applyMapping(rows, mappings) {
  return rows.map(row => {
    const out = {};
    for (const m of mappings) {
      if (!m.enabled) continue;
      const raw = row[m.source];
      const transform = TRANSFORMS[m.transform] || TRANSFORMS.none;
      out[m.target] = transform.fn(raw, m.defaultValue);
    }
    return out;
  });
}

// ─── Export ──────────────────────────────────────
export function exportData(rows, format) {
  if (format === 'json') {
    return JSON.stringify(rows, null, 2);
  }
  return Papa.unparse(rows);
}

export function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
