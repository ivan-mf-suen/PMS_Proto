import { useState, useMemo } from 'react';
import { PROPERTIES, COMPLIANCE_DOCS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { Plus, Search, Eye, Pencil, X, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Building2, Phone, Mail, User } from 'lucide-react';

const ALL_LSG = ['All', 'LSG', 'NLSG', 'Contract Home'];

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ArrowUpDown size={11} color="#CBD5E1" />;
  return sortDir === 'asc' ? <ArrowUp size={11} color="var(--info)" /> : <ArrowDown size={11} color="var(--info)" />;
}

function FilterDropdown({ label, options, selected, onSelect, counts }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: selected !== 'All' ? 'var(--info-bg)' : '#fff', color: selected !== 'All' ? 'var(--info)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        {label}: {selected}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, padding: 4 }}>
            {options.map((opt) => (
              <button key={opt} onClick={() => { onSelect(opt); setOpen(false); }} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '7px 10px', fontSize: 12, border: 'none', background: selected === opt ? 'var(--info-bg)' : 'transparent', color: selected === opt ? 'var(--info)' : '#475569', cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}>
                <span>{opt}</span>
                {counts && <span style={{ fontSize: 11, color: '#94A3B8' }}>{counts[opt] || 0}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TypeBadge({ lsgNlsg }) {
  const config = {
    LSG: { color: '#1E40AF', bg: '#EFF6FF' },
    NLSG: { color: '#0D9488', bg: '#F0FDFA' },
    'Contract Home': { color: '#EA580C', bg: '#FFF7ED' },
  };
  const cfg = config[lsgNlsg] || { color: '#64748B', bg: '#F1F5F9' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {lsgNlsg}
    </span>
  );
}

export default function Properties({ onViewProperty, selectedCenter }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [lsgFilter, setLsgFilter] = useState('All');
  const [sortCol, setSortCol] = useState('unitCode');
  const [sortDir, setSortDir] = useState('asc');
  const [previewProp, setPreviewProp] = useState(null);

  const baseProperties = selectedCenter && selectedCenter !== 'All'
    ? PROPERTIES.filter((p) => p.name === selectedCenter)
    : PROPERTIES;

  const lsgCounts = useMemo(() => {
    const c = { All: baseProperties.length };
    baseProperties.forEach((p) => { c[p.lsgNlsg] = (c[p.lsgNlsg] || 0) + 1; });
    return c;
  }, [baseProperties]);

  const filtered = useMemo(() => {
    let list = baseProperties.filter((p) => {
      if (lsgFilter !== 'All' && p.lsgNlsg !== lsgFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.unitCode.toLowerCase().includes(q) || p.contact.toLowerCase().includes(q) || p.service.toLowerCase().includes(q);
      }
      return true;
    });
    list.sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [baseProperties, search, lsgFilter, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const activeFilters = [];
  if (lsgFilter !== 'All') activeFilters.push({ key: 'lsg', label: `LSG: ${lsgFilter}`, clear: () => setLsgFilter('All') });

  const getPropDocs = (propName) => COMPLIANCE_DOCS.filter((d) => d.center === propName);

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('properties.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{baseProperties.length} {t('properties.managed')}</p>
        </div>
        <button style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> {t('properties.add')}
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('properties.searchPlaceholder')} style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }} />
        </div>
        <FilterDropdown label="LSG" options={ALL_LSG} selected={lsgFilter} onSelect={setLsgFilter} counts={lsgCounts} />
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {activeFilters.map((f) => (
            <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--info-bg)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>
              {f.label}
              <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
            </span>
          ))}
          <button onClick={() => setLsgFilter('All')} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>{t('compliance.clearAll')}</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'service', label: t('properties.col.service') || 'Service' },
                  { key: 'unitCode', label: t('properties.col.unitCode') || 'Unit Code' },
                  { key: 'name', label: t('properties.col.name') },
                  { key: 'unit', label: t('properties.col.unit') || 'Unit' },
                  { key: 'lsgNlsg', label: 'LSG/NLSG' },
                  { key: 'contact', label: t('properties.col.contact') || 'Contact' },
                ].map((col) => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', background: sortCol === col.key ? '#F1F5F9' : undefined }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{col.label} <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} /></span>
                  </th>
                ))}
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>{t('properties.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prop) => (
                <tr key={prop.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{prop.service}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)', fontFamily: 'monospace' }}>{prop.unitCode}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{prop.name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><MapPin size={10} />{prop.address}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{prop.unit}</td>
                  <td style={{ padding: '12px 16px' }}><TypeBadge lsgNlsg={prop.lsgNlsg} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{prop.contact}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{prop.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setPreviewProp(prop)} title={t('common.view')} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} color="#64748B" /></button>
                      <button onClick={() => onViewProperty(prop.id)} title={t('common.edit')} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} color="#64748B" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
            <div style={{ fontSize: 16, marginBottom: 8, color: '#CBD5E1' }}>{t('properties.noResults')}</div>
            <div>{t('properties.tryAdjusting')}</div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewProp && (
        <div onClick={() => setPreviewProp(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '80vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={18} color="var(--info)" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{previewProp.name}</span>
              </div>
              <button onClick={() => setPreviewProp(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="#64748B" /></button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TypeBadge lsgNlsg={previewProp.lsgNlsg} />
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{previewProp.service}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: 'var(--info-bg)', color: 'var(--info)', fontFamily: 'monospace' }}>{previewProp.unitCode}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 20 }}>
                <PreviewField icon={<MapPin size={13} />} label="Address" value={previewProp.address} />
                <PreviewField icon={<Building2 size={13} />} label="Unit" value={previewProp.unit} />
              </div>

              <div style={{ padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Contact</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><User size={13} color="#64748B" /><span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{previewProp.contact}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Phone size={13} color="#64748B" /><a href={`tel:${previewProp.phone}`} style={{ fontSize: 13, color: 'var(--info)', textDecoration: 'none' }}>{previewProp.phone}</a></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={13} color="#64748B" /><a href={`mailto:${previewProp.email}`} style={{ fontSize: 13, color: 'var(--info)', textDecoration: 'none' }}>{previewProp.email}</a></div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Compliance</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(() => {
                    const docs = getPropDocs(previewProp.name);
                    const valid = docs.filter((d) => d.status === 'Valid').length;
                    const expiring = docs.filter((d) => d.status === 'Expiring').length;
                    const expired = docs.filter((d) => d.status === 'Expired').length;
                    return (
                      <>
                        <div style={{ flex: 1, padding: 10, background: '#F0FDF4', borderRadius: 8, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{valid}</div><div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{t('compliance.valid')}</div></div>
                        <div style={{ flex: 1, padding: 10, background: expiring > 0 ? '#FEF3C7' : '#F8FAFC', borderRadius: 8, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: expiring > 0 ? '#B45309' : '#94A3B8' }}>{expiring}</div><div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{t('compliance.expiringSoon')}</div></div>
                        <div style={{ flex: 1, padding: 10, background: expired > 0 ? '#FEE2E2' : '#F8FAFC', borderRadius: 8, textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: expired > 0 ? '#DC2626' : '#94A3B8' }}>{expired}</div><div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{t('compliance.expired')}</div></div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button onClick={() => { setPreviewProp(null); onViewProperty(previewProp.id); }} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={13} /> {t('common.viewDetails')}
              </button>
              <button onClick={() => setPreviewProp(null)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#0F172A', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewField({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ marginTop: 2, color: '#94A3B8' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
