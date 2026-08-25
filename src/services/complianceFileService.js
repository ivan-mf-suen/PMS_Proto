const store = new Map();

export const DOC_TYPES = ['Certificate', 'Inspection Report', 'Site Photo', 'Checklist', 'Other'];

const SEED_UPLOADERS = ['Chan Siu Ming', 'Leung Chi Fai', 'Wong Pik Shan', 'Ip Suet Ying'];

const SEED_TEMPLATES = [
  { makeName: (doc, yr) => `${doc.name} ${yr}.pdf`, mimeType: 'application/pdf', docType: 'Certificate', expireYears: 1 },
  { makeName: (doc, yr) => `${doc.name} Certificate ${yr}.pdf`, mimeType: 'application/pdf', docType: 'Certificate', expireYears: null },
  { makeName: (doc) => `${doc.name} Site Photo.jpg`, mimeType: 'image/jpeg', docType: 'Site Photo', expireYears: null },
  { makeName: (doc, yr) => `${doc.name} Checklist ${yr}.xlsx`, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docType: 'Checklist', expireYears: -1 },
];

function seedAttachments(docId, doc) {
  const count = (docId % 3) + 1;
  const entries = [];
  for (let i = 0; i < count; i++) {
    const tpl = SEED_TEMPLATES[(docId + i) % SEED_TEMPLATES.length];
    const year = 2026 - ((docId + i) % 2);
    const baseDate = doc.inspectionDate || doc.nextInspection || '2026-01-15';
    const day = String(((docId * 7 + i * 11) % 27) + 1).padStart(2, '0');
    const hour = String(9 + ((docId + i) % 8)).padStart(2, '0');
    const minute = String((docId * 13 + i * 17) % 60).padStart(2, '0');
    const docDate = `${baseDate.slice(0, 4)}-${baseDate.slice(5, 7)}-${day}`;
    const expiryDate = tpl.expireYears === null ? null : `${parseInt(baseDate.slice(0, 4), 10) + tpl.expireYears}${baseDate.slice(4)}`;
    entries.push({
      id: `seed-${docId}-${i}`,
      name: tpl.makeName(doc, year),
      size: 180000 + ((docId * 977 + i * 613) % 2400000),
      mimeType: tpl.mimeType,
      docType: tpl.docType,
      docDate,
      expiryDate,
      uploader: SEED_UPLOADERS[(docId + i) % SEED_UPLOADERS.length],
      uploadedAt: `${docDate}T${hour}:${minute}:00`,
      file: null,
    });
  }
  return entries;
}

export function listAttachments(docId, docMeta) {
  if (!store.has(docId)) {
    store.set(docId, seedAttachments(docId, docMeta || {}));
  }
  return [...store.get(docId)];
}

export function uploadAttachment(docId, payload, uploaderName) {
  if (!store.has(docId)) store.set(docId, []);
  const entry = {
    id: `up-${docId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: payload.name || payload.file.name,
    size: payload.file.size,
    mimeType: payload.file.type || guessMimeType(payload.file.name),
    docType: payload.docType || 'Other',
    docDate: payload.docDate || new Date().toISOString().slice(0, 10),
    expiryDate: payload.expiryDate || null,
    uploader: uploaderName,
    uploadedAt: new Date().toISOString(),
    file: payload.file,
  };
  store.get(docId).unshift(entry);
  return { ...entry };
}

export function isAttachmentActive(att) {
  if (!att.expiryDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${att.expiryDate}T23:59:59`) >= today;
}

export function getAttachmentUrl(entry) {
  if (!entry._url) {
    let blob;
    try {
      blob = entry.file instanceof Blob ? entry.file : buildPlaceholderBlob(entry);
      entry._url = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : `blob:demo/${entry.id}`;
    } catch {
      entry._url = `blob:demo/${entry.id}`;
    }
  }
  return entry._url;
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateOnly(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function guessMimeType(name) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'application/pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image/*';
  if (['xls', 'xlsx'].includes(ext)) return 'application/vnd.ms-excel';
  if (['doc', 'docx'].includes(ext)) return 'application/msword';
  return 'application/octet-stream';
}

function buildPlaceholderBlob(entry) {
  const ext = entry.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') {
    return new Blob([buildDemoPdf(entry)], { type: 'application/pdf' });
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="100%" height="100%" fill="#F1F5F9"/><rect x="24" y="24" width="592" height="372" fill="#fff" stroke="#CBD5E1" rx="12"/><text x="320" y="200" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#334155">${escapeXml(entry.name)}</text><text x="320" y="236" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#94A3B8">Demo preview image</text></svg>`;
    return new Blob([svg], { type: 'image/svg+xml' });
  }
  const text = `${entry.name}\nUploaded by: ${entry.uploader}\nUploaded at: ${entry.uploadedAt}\n\nThis is a demo placeholder generated for the prototype record.`;
  return new Blob([text], { type: 'text/plain' });
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function buildDemoPdf(entry) {
  const lines = [
    'BT /F1 18 Tf 60 770 Td (' + escapePdf(entry.name) + ') Tj ET',
    'BT /F1 11 Tf 60 740 Td (Uploader: ' + escapePdf(entry.uploader) + ') Tj ET',
    'BT /F1 11 Tf 60 722 Td (Uploaded at: ' + escapePdf(formatTimestamp(entry.uploadedAt)) + ') Tj ET',
    'BT /F1 10 Tf 60 680 Td (Prototype placeholder document.) Tj ET',
  ];
  const content = lines.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
}

function escapePdf(s) {
  return s.replace(/([\\()])/g, '\\$1').replace(/[^\x20-\x7E]/g, '?');
}
