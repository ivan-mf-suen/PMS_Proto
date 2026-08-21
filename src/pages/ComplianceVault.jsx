import { useState, useMemo } from 'react';
import { COMPLIANCE_DOCS, COMPLIANCE_CATEGORIES, PROPERTIES } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { Search, AlertTriangle, CheckCircle, Clock, Bell, X, Eye, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Valid', 'Expiring', 'Expired'];

export default function ComplianceVault({ selectedCenter }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [centerFilter, setCenterFilter] = useState('All');
  const [sortCol, setSortCol] = useState('nextInspection');
  const [sortDir, setSortDir] = useState('asc');

  const isGlobalCentre = selectedCenter && selectedCenter !== 'All';
  const effectiveCenter = isGlobalCentre ? selectedCenter : centerFilter;

  const filtered = useMemo(() => {
    let list = COMPLIANCE_DOCS.filter((d) => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && d.status !== statusFilter) return false;
      if (effectiveCenter !== 'All' && d.center !== effectiveCenter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.center.toLowerCase().includes(q) || d.documentRef.toLowerCase().includes(q) || d.issuedBy.toLowerCase().includes(q);
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
  }, [search, categoryFilter, statusFilter, effectiveCenter, sortCol, sortDir]);

  const totalDocs = filtered.length;
  const validCount = filtered.filter((d) => d.status === 'Valid').length;
  const expiringCount = filtered.filter((d) => d.status === 'Expiring').length;
  const expiredCount = filtered.filter((d) => d.status === 'Expired').length;
  const complianceRate = totalDocs > 0 ? Math.round((validCount / totalDocs) * 100) : 0;

  const categoryCoverage = useMemo(() => {
    return COMPLIANCE_CATEGORIES.map((cat) => {
      const catDocs = filtered.filter((d) => d.category === cat);
      const catValid = catDocs.filter((d) => d.status === 'Valid').length;
      const pct = catDocs.length > 0 ? Math.round((catValid / catDocs.length) * 100) : 0;
      return { cat, total: catDocs.length, valid: catValid, pct };
    }).filter((c) => c.total > 0);
  }, [filtered]);

  const centerOptions = useMemo(() => ['All', ...PROPERTIES.map((p) => p.name)], []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const statusColors = {
    Valid: { bg: 'var(--success-bg)', color: 'var(--success)' },
    Expiring: { bg: '#FEF3C7', color: '#B45309' },
    Expired: { bg: '#FEE2E2', color: '#DC2626' },
  };

  const activeFilters = [];
  if (categoryFilter !== 'All') activeFilters.push({ key: 'cat', label: `Category: ${categoryFilter}`, clear: () => setCategoryFilter('All') });
  if (statusFilter !== 'All') activeFilters.push({ key: 'status', label: `Status: ${statusFilter}`, clear: () => setStatusFilter('All') });
  if (!isGlobalCentre && centerFilter !== 'All') activeFilters.push({ key: 'center', label: centerFilter, clear: () => setCenterFilter('All') });

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('compliance.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{t('compliance.subtitle')}</p>
        </div>
        <button style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={16} /> {t('compliance.addAlert')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <SummaryCard icon={<CheckCircle size={20} color="var(--success)" />} iconBg="var(--success-bg)" value={validCount} label={t('compliance.valid')} desc={t('compliance.validDesc')} />
        <SummaryCard icon={<AlertTriangle size={20} color="#B45309" />} iconBg="#FEF3C7" value={expiringCount} label={t('compliance.expiringSoon')} desc={t('compliance.expiringDesc')} />
        <SummaryCard icon={<Clock size={20} color="#DC2626" />} iconBg="#FEE2E2" value={expiredCount} label={t('compliance.expired')} desc={t('compliance.expiredDesc')} />
        <ComplianceRateCard rate={complianceRate} t={t} desc={t('compliance.complianceDesc')} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('compliance.coverageCategory')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {categoryCoverage.map(({ cat, total, valid, pct }) => (
            <div key={cat} style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', background: '#FAFBFC', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--info)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{cat}</span>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: pct === 100 ? 'var(--success-bg)' : pct >= 80 ? '#FEF3C7' : '#FEE2E2', color: pct === 100 ? 'var(--success)' : pct >= 80 ? '#B45309' : '#DC2626' }}>{pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#E2E8F0', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: pct === 100 ? 'var(--success)' : pct >= 80 ? '#F59E0B' : '#EF4444', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{t('compliance.validCount', { valid, total })}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('compliance.searchPlaceholder')} style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }} />
        </div>
        <FilterDropdown label="Category" options={['All', ...COMPLIANCE_CATEGORIES]} selected={categoryFilter} onSelect={setCategoryFilter} />
        <FilterDropdown label="Status" options={STATUS_OPTIONS} selected={statusFilter} onSelect={setStatusFilter} />
        {!isGlobalCentre && <FilterDropdown label="Property" options={centerOptions} selected={centerFilter} onSelect={setCenterFilter} />}
      </div>

      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {activeFilters.map((f) => (
            <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--info-bg)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>
              {f.label}
              <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
            </span>
          ))}
          <button onClick={() => { setCategoryFilter('All'); setStatusFilter('All'); if (!isGlobalCentre) setCenterFilter('All'); }} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>{t('compliance.clearAll')}</button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'name', label: t('compliance.col.certificate'), width: undefined },
                  { key: 'category', label: t('compliance.col.category'), width: 130 },
                  ...(!isGlobalCentre ? [{ key: 'center', label: t('compliance.col.property'), width: 200 }] : []),
                  { key: 'documentRef', label: t('compliance.col.ref'), width: 120 },
                  { key: 'inspectionDate', label: t('compliance.col.inspected'), width: 110 },
                  { key: 'nextInspection', label: t('compliance.col.nextDue'), width: 110 },
                  { key: 'status', label: t('compliance.col.status'), width: 100 },
                  { key: 'issuedBy', label: t('compliance.col.issuedBy'), width: 150 },
                  { key: '_actions', label: t('compliance.col.actions'), width: 100 },
                ].map((col) => (
                  <th key={col.key}
                    onClick={() => col.key !== '_actions' && handleSort(col.key)}
                    style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: col.key === '_actions' ? 'default' : 'pointer', userSelect: 'none', whiteSpace: 'nowrap', width: col.width, background: sortCol === col.key ? '#F1F5F9' : undefined }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.key !== '_actions' && (sortCol === col.key ? (sortDir === 'asc' ? <ChevronDown size={11} color="var(--info)" /> : <ChevronUp size={11} color="var(--info)" />) : <span style={{ fontSize: 10, color: '#CBD5E1' }}>&#8597;</span>)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{doc.name}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{doc.category}</span></td>
                  {!isGlobalCentre && <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.center}</td>}
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{doc.documentRef}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{doc.inspectionDate}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{doc.nextInspection}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: statusColors[doc.status]?.bg, color: statusColors[doc.status]?.color }}>{doc.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748B' }}>{doc.issuedBy}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <ActionBtn icon={<Eye size={14} />} color="var(--info)" />
                      <ActionBtn icon={<Pencil size={14} />} color="#64748B" />
                      <ActionBtn icon={<Trash2 size={14} />} color="#DC2626" danger />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isGlobalCentre ? 8 : 9} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                  <div style={{ fontSize: 16, marginBottom: 8, color: '#CBD5E1' }}>{t('compliance.noDocs')}</div>
                  <div>{t('compliance.tryAdjusting')}</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, iconBg, value, label, desc }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{desc}</div>
      </div>
    </div>
  );
}

function ComplianceRateCard({ rate, t, desc }) {
  const size = 44;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (rate / 100) * circ;
  const ringColor = rate >= 90 ? 'var(--success)' : rate >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={ringColor} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: ringColor }}>{rate}%</div>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{rate}%</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 2 }}>{t('compliance.complianceRate')}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{desc}</div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, color, danger }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hovered ? (danger ? '#FEE2E2' : '#F1F5F9') : 'transparent', color: hovered ? color : '#94A3B8', transition: 'all 0.15s' }}
    >{icon}</button>
  );
}

function FilterDropdown({ label, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: selected !== 'All' ? 'var(--info-bg)' : '#fff', color: selected !== 'All' ? 'var(--info)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}: {selected}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 220, maxHeight: 300, overflowY: 'auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, padding: 4 }}>
            {options.map((opt) => (
              <button key={opt} onClick={() => { onSelect(opt); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '7px 10px', fontSize: 12, border: 'none', background: selected === opt ? 'var(--info-bg)' : 'transparent', color: selected === opt ? 'var(--info)' : '#475569', cursor: 'pointer', borderRadius: 4, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
