import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function MultiSelectDropdown({ options, selected, onChange, placeholder }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.value));
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen]);

  const toggleAll = () => {
    if (allSelected) onChange([]);
    else onChange(options.map((o) => o.value));
  };

  const toggleOption = (val) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: selected.length > 0 ? 'var(--foreground)' : '#64748B', cursor: 'pointer', minHeight: 32, maxWidth: 200, overflow: 'hidden', textAlign: 'left' }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected.length === 0 ? (placeholder || t('common.all')) : t('multiSelect.selected', { n: selected.length })}
        </span>
        <ChevronDown size={12} />
      </button>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 220, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #F1F5F9' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('multiSelect.search')} style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, outline: 'none', background: '#F8FAFC' }} />
          </div>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={toggleAll}>
            <input type="checkbox" checked={allSelected} readOnly style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{t('multiSelect.selectAll')}</span>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            {filtered.map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#334155' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggleOption(opt.value)} style={{ cursor: 'pointer' }} />
                {opt.label}
              </label>
            ))}
            {filtered.length === 0 && <div style={{ padding: '8px', fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>{t('multiSelect.noResults')}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
