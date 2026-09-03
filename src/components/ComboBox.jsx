import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

export default function ComboBox({ value, onChange, options, placeholder, renderOption }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={isOpen ? search : value}
        onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); }}
        onFocus={() => { setSearch(''); setIsOpen(true); }}
        placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
      />
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
          {filtered.length === 0 && <div style={{ padding: '8px 12px', fontSize: 11, color: '#94A3B8' }}>{t('comboBox.typeCustom')}</div>}
          {filtered.map((o) => (
            <div key={o.value} onClick={() => { onChange(o.value); setSearch(''); setIsOpen(false); }}
              style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: o.value === value ? 'var(--primary)' : '#334155', fontWeight: o.value === value ? 600 : 400, background: o.value === value ? 'var(--info-bg)' : 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = o.value === value ? 'var(--info-bg)' : 'transparent'; }}>
              {renderOption ? renderOption(o) : o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
