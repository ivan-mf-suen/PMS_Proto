import { useRef, useState } from 'react';
import { X, Download, Upload, FileUp } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = String(text).replace(/\uFEFF/g, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function downloadText(filename, text) {
  const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function ImportModal({ entityLabel, fields, criticalFields, exampleRow, existingRecords, onImport, onClose }) {
  const { t } = useTranslation();
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  const headerLabels = fields.map((f) => f.label);

  const downloadTemplate = () => {
    const headers = headerLabels;
    const line = headers.map((h) => h).join(',');
    const example = fields.map((f) => exampleRow[f.key] ?? '').join(',');
    downloadText(`${entityLabel.toLowerCase()}_import_template.csv`, `${line}\r\n${example}\r\n`);
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target.result || '');
      const rows = parseCSV(text);
      const headerRow = rows[0]?.map((h) => h.trim().toLowerCase()) || [];
      const dataRows = rows.slice(1);
      const records = dataRows.map((cells) => {
        const rec = {};
        fields.forEach((f, idx) => { rec[f.key] = (cells[idx] || '').trim(); });
        return rec;
      });
      setParsed({ headerRow, records, fileName: file.name });
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const validated = useMemoParsed(parsed, fields);
  const valid = validated.valid;
  const failed = validated.failed;

  const duplicateIndices = new Set();
  if (criticalFields && criticalFields.length && existingRecords) {
    valid.forEach((row, idx) => {
      const keys = criticalFields.map((k) => String(row.record[k] ?? '').trim().toLowerCase()).join('|');
      const exists = existingRecords.some((r) => criticalFields.every((k) => String(r[k] ?? '').trim().toLowerCase() === String(row.record[k] ?? '').trim().toLowerCase()));
      if (exists && keys) duplicateIndices.add(idx);
    });
  }

  const confirmed = valid.filter((_, idx) => !duplicateIndices.has(idx));
  const duplicates = valid.filter((_, idx) => duplicateIndices.has(idx));

  const [dupChoice, setDupChoice] = useState('create');
  const [confirmPreview, setConfirmPreview] = useState(false);

  const finalRecords = confirmed.map((r) => r.record);

  const proceed = () => {
    if (duplicates.length > 0 && !confirmPreview) {
      setConfirmPreview(true);
      return;
    }
    onImport({
      records: valid.map((r) => r.record),
      duplicates: duplicates.map((r) => r.record),
      confirmed: finalRecords,
      action: dupChoice,
      criticalFields,
    });
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '88vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Upload size={18} color="var(--info)" /> {t('import.title', { entity: entityLabel })}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="#64748B" /></button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {!parsed ? (
            <div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                {t('import.intro')}
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button onClick={downloadTemplate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <Download size={14} /> {t('import.downloadTemplate')}
                </button>
              </div>
              <div
                onClick={() => fileRef.current && fileRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                style={{ border: '2px dashed #CBD5E1', borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer' }}
              >
                <FileUp size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{t('import.dropHint')}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{t('import.dropFormat')}</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
                <strong>{fileName}</strong> — {valid.length} valid, {failed.length} failed, {duplicates.length} duplicates.
              </div>

              {duplicates.length > 0 && !confirmPreview && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                    {t('import.duplicatesFound', { count: duplicates.length, fields: criticalFields.map((k) => fields.find((f) => f.key === k)?.label).join(' / ') })}
                  </div>
                  <div style={{ fontSize: 12, color: '#78350F', marginBottom: 8 }}>{t('import.duplicatesQuestion')}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['create', t('import.dupCreate')], ['overwrite', t('import.dupOverwrite')], ['skip', t('import.dupSkip')]].map(([val, label]) => (
                      <label key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#92400E' }}>
                        <input type="radio" name="dup" checked={dupChoice === val} onChange={() => setDupChoice(val)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {confirmPreview && duplicates.length > 0 && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                    {t(`import.dupConfirm.${dupChoice}`)}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--success)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{valid.length}</span>
                    {t('import.validRecords')}
                  </div>
                </div>
                <RecordTable records={valid.map((r) => r.record)} fields={fields} emptyText={t('import.validEmpty')} />
              </div>

              {failed.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--critical)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 9, background: '#DC2626', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{failed.length}</span>
                      {t('import.failedRecords')}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #FECACA', borderRadius: 10, overflow: 'hidden', fontSize: 12, color: '#991B1B', background: '#FEF7F7' }}>
                    {failed.map((f, i) => (
                      <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'monospace' }}>Row {f.rowNumber}</span>
                        <span>{f.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={() => { if (parsed) { setParsed(null); setConfirmPreview(false); } else onClose(); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            {parsed ? t('import.reset') : t('import.cancel')}
          </button>
          {parsed && (
            <button onClick={proceed} disabled={valid.length === 0} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: valid.length > 0 ? 'var(--primary)' : '#CBD5E1', fontSize: 13, fontWeight: 600, color: '#fff', cursor: valid.length > 0 ? 'pointer' : 'not-allowed' }}>
              {duplicates.length > 0 && !confirmPreview ? t('import.reviewDuplicates') : t('import.proceed', { count: finalRecords.length + (dupChoice === 'create' ? duplicates.length : 0) })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function useMemoParsed(parsed, fields) {
  if (!parsed) return { valid: [], failed: [] };
  const valid = [];
  const failed = [];
  parsed.records.forEach((rec, idx) => {
    const rowNumber = idx + 2;
    const problems = [];
    fields.forEach((f) => {
      const val = String(rec[f.key] ?? '').trim();
      if (f.required && !val) problems.push(`${f.label} is required`);
      if (val && f.options && !f.options.includes(val)) problems.push(`Invalid ${f.label}: "${val}"`);
    });
    if (problems.length > 0) {
      failed.push({ rowNumber, message: problems.join('; ') });
    } else {
      valid.push({ record: rec });
    }
  });
  return { valid, failed };
}

function RecordTable({ records, fields, emptyText }) {
  if (records.length === 0) {
    return <div style={{ padding: 14, fontSize: 12, color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: 8, textAlign: 'center' }}>{emptyText}</div>;
  }
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8FAFC' }}>
            {fields.map((f) => <th key={f.key} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{f.label}{f.required ? ' *' : ''}</th>)}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
              {fields.map((f) => <td key={f.key} style={{ padding: '8px 10px', fontSize: 12, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{String(r[f.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
