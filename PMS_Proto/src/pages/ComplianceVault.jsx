import { useState, useMemo } from 'react';
import { COMPLIANCE_CATEGORIES, PROPERTIES, CATEGORY_CONFIG, formatCycle } from '../data/constants';
import { useCompliance } from '../context/ComplianceContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  Search, AlertTriangle, CheckCircle, Clock, Bell, X, Eye, Pencil, Trash2,
  ChevronDown, ChevronUp, Flame, Zap, Droplets, ArrowUp, Building2, Shield,
  Leaf, HardHat, TriangleAlert,
} from 'lucide-react';

const STATUS_OPTIONS = ['Valid', 'Expiring', 'Expired'];

const CATEGORY_KEY_MAP = {
  'Fire Safety': 'compliance.cat.FireSafety',
  'Electrical': 'compliance.cat.Electrical',
  'Gas': 'compliance.cat.Gas',
  'Water Hygiene': 'compliance.cat.WaterHygiene',
  'Lifts': 'compliance.cat.Lifts',
  'Structural': 'compliance.cat.Structural',
  'Insurance': 'compliance.cat.Insurance',
  'Environmental': 'compliance.cat.Environmental',
  'Occupational Safety': 'compliance.cat.OccupationalSafety',
  'Asbestos': 'compliance.cat.Asbestos',
};

const CATEGORY_ICON = {
  'Fire Safety': Flame, 'Electrical': Zap, 'Gas': Droplets, 'Water Hygiene': Droplets,
  'Lifts': ArrowUp, 'Structural': Building2, 'Insurance': Shield,
  'Environmental': Leaf, 'Occupational Safety': HardHat, 'Asbestos': TriangleAlert,
};

const EMPTY_FORM = { name: '', category: '', center: '', documentRef: '', issuedBy: '', inspectionDate: '', nextInspection: '', expiry: '', cycleMonths: 12, responsible: '', notes: '', status: 'Valid' };

export default function ComplianceVault({ selectedCenter }) {
  const { t } = useTranslation();
  const { docs, addDoc, updateDoc, removeDoc } = useCompliance();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortCol, setSortCol] = useState('nextInspection');
  const [sortDir, setSortDir] = useState('asc');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const isGlobalCentre = selectedCenter && selectedCenter !== 'All';
  const effectiveCenter = selectedCenter || 'All';

  const toggleCategory = (cat) => setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  const clearCategories = () => setSelectedCategories([]);

  const activeDocs = useMemo(() => docs.filter((d) => !d.removed), [docs]);

  // Summary docs: status/center/search only (no category filter)
  // Used by categoryCoverage grid so all categories always remain visible
  const summaryDocs = useMemo(() => {
    return activeDocs.filter((d) => {
      if (statusFilter !== 'All' && d.status !== statusFilter) return false;
      if (effectiveCenter !== 'All' && d.center !== effectiveCenter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.center.toLowerCase().includes(q) || d.documentRef.toLowerCase().includes(q) || (d.responsible && d.responsible.toLowerCase().includes(q));
      }
      return true;
    });
  }, [activeDocs, statusFilter, effectiveCenter, search]);

  // Table: applies ALL filters including category
  const filtered = useMemo(() => {
    let list = summaryDocs.filter((d) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(d.category)) return false;
      return true;
    });
    list.sort((a, b) => { const va = a[sortCol] ?? ''; const vb = b[sortCol] ?? ''; const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb; return sortDir === 'asc' ? cmp : -cmp; });
    return list;
  }, [summaryDocs, selectedCategories, sortCol, sortDir]);

  // Summary bar counts: from filtered so they match the table when categories are selected
  const validCount = filtered.filter((d) => d.status === 'Valid').length;
  const expiringCount = filtered.filter((d) => d.status === 'Expiring').length;
  const expiredCount = filtered.filter((d) => d.status === 'Expired').length;
  const totalFiltered = filtered.length;
  const complianceRate = totalFiltered > 0 ? Math.round((validCount / totalFiltered) * 100) : 0;

  // Coverage grid: from summaryDocs (ignores category filter so all categories always show)
  const categoryCoverage = useMemo(() => {
    return COMPLIANCE_CATEGORIES.map((cat) => {
      const catDocs = summaryDocs.filter((d) => d.category === cat);
      const catValid = catDocs.filter((d) => d.status === 'Valid').length;
      const pct = catDocs.length > 0 ? Math.round((catValid / catDocs.length) * 100) : 0;
      return { cat, total: catDocs.length, valid: catValid, pct };
    }).filter((c) => c.total > 0);
  }, [summaryDocs]);

  const handleSort = (col) => { if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };

  const openAdd = () => { setForm({ ...EMPTY_FORM, cycleMonths: 12 }); setModal('add'); };
  const openView = (doc) => { setModal({ type: 'view', doc }); };
  const openEdit = (doc) => { setForm({ name: doc.name, category: doc.category, center: doc.center, documentRef: doc.documentRef, issuedBy: doc.issuedBy, inspectionDate: doc.inspectionDate, nextInspection: doc.nextInspection, expiry: doc.expiry, cycleMonths: doc.cycleMonths || 12, responsible: doc.responsible || '', notes: doc.notes || '', status: doc.status }); setModal({ type: 'edit', doc }); };
  const openDelete = (doc) => { setModal({ type: 'delete', doc }); };

  const handleSave = () => {
    if (modal.type === 'edit') {
      updateDoc(modal.doc.id, form);
    } else {
      addDoc(form);
    }
    setModal(null);
  };
  const handleDelete = () => { removeDoc(modal.doc.id); setModal(null); };

  const statusColors = { Valid: { bg: 'var(--success-bg)', color: 'var(--success)' }, Expiring: { bg: '#FEF3C7', color: '#B45309' }, Expired: { bg: '#FEE2E2', color: '#DC2626' } };

  const activeFilterPills = [];
  selectedCategories.forEach((cat) => activeFilterPills.push({ key: `cat-${cat}`, label: `${t('compliance.col.category')}: ${t(CATEGORY_KEY_MAP[cat] || cat)}`, clear: () => toggleCategory(cat) }));
  if (statusFilter !== 'All') activeFilterPills.push({ key: 'status', label: `Status: ${statusFilter}`, clear: () => setStatusFilter('All') });
  const hasFilters = activeFilterPills.length > 0;
  const clearAllFilters = () => { clearCategories(); setStatusFilter('All'); setSearch(''); };

  const formUpdate = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('compliance.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{t('compliance.subtitle')}</p>
        </div>
        <button onClick={openAdd} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={16} /> {t('compliance.addAlert')}
        </button>
      </div>

      {/* ── Summary Bar: Rate + Status Counts ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
        {/* Compliance Rate — compact */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, minWidth: 200 }}>
          <ComplianceRateBar rate={complianceRate} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{t('compliance.complianceRate')}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{totalFiltered} {t('compliance.documents')}</div>
          </div>
        </div>
        {/* Status counts — inline */}
        <StatusCount icon={<CheckCircle size={16} color="var(--success)" />} value={validCount} label={t('compliance.valid')} color="var(--success)" bg="var(--success-bg)" />
        <StatusCount icon={<AlertTriangle size={16} color="#B45309" />} value={expiringCount} label={t('compliance.expiringSoon')} color="#B45309" bg="#FEF3C7" />
        <StatusCount icon={<Clock size={16} color="#DC2626" />} value={expiredCount} label={t('compliance.expired')} color="#DC2626" bg="#FEE2E2" />
      </div>

      {/* Coverage by Category */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.coverageCategory')}</div>
          <button onClick={clearCategories} style={{ fontSize: 12, fontWeight: 600, color: selectedCategories.length > 0 ? 'var(--primary)' : '#CBD5E1', background: selectedCategories.length > 0 ? 'var(--info-bg)' : '#F1F5F9', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
            <X size={12} /> {t('compliance.clearAll')}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {categoryCoverage.map(({ cat, total, valid, pct }) => {
            const isActive = selectedCategories.includes(cat);
            const cfg = CATEGORY_CONFIG[cat] || {};
            const IconComp = CATEGORY_ICON[cat];
            return (
              <div key={cat} onClick={() => toggleCategory(cat)} style={{ padding: '14px 16px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${isActive ? cfg.color || 'var(--info)' : 'var(--border)'}`, background: isActive ? (cfg.bg || 'var(--info-bg)') : '#FAFBFC', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = cfg.color || 'var(--info)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {IconComp && <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.bg || '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconComp size={14} color={cfg.color || '#64748B'} /></div>}
                    <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? (cfg.color || 'var(--info)') : 'var(--foreground)' }}>{t(CATEGORY_KEY_MAP[cat] || cat)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: pct === 100 ? 'var(--success-bg)' : pct >= 80 ? '#FEF3C7' : '#FEE2E2', color: pct === 100 ? 'var(--success)' : pct >= 80 ? '#B45309' : '#DC2626' }}>{pct}%</span>
                    {isActive && <div style={{ width: 18, height: 18, borderRadius: 4, background: cfg.color || 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>}
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#E2E8F0', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: pct === 100 ? 'var(--success)' : pct >= 80 ? '#F59E0B' : '#EF4444', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{t('compliance.validCount', { valid, total })}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('compliance.searchPlaceholder')} style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }} />
        </div>
        <MultiDropdown label="Status" options={STATUS_OPTIONS} selected={statusFilter} onSelect={setStatusFilter} />
      </div>

      {/* Active Filter Pills */}
      {hasFilters && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {activeFilterPills.map((f) => (
            <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--info-bg)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>
              {f.label}
              <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
            </span>
          ))}
          <button onClick={clearAllFilters} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>{t('compliance.clearAll')}</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'category', label: t('compliance.col.category'), width: 160 },
                  { key: 'name', label: t('compliance.col.certificate') },
                  ...(!isGlobalCentre ? [{ key: 'center', label: t('compliance.col.property'), width: 200 }] : []),
                  { key: 'nextInspection', label: t('compliance.col.nextDue'), width: 110 },
                  { key: 'cycleMonths', label: t('compliance.col.cycle'), width: 80 },
                  { key: 'responsible', label: t('compliance.col.responsible'), width: 130 },
                  { key: 'status', label: t('compliance.col.status'), width: 100 },
                  { key: '_actions', label: t('compliance.col.actions'), width: 90 },
                ].map((col) => (
                  <th key={col.key} onClick={() => col.key !== '_actions' && handleSort(col.key)} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: col.key === '_actions' ? 'default' : 'pointer', userSelect: 'none', whiteSpace: 'nowrap', width: col.width, background: sortCol === col.key ? '#F1F5F9' : undefined }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.key !== '_actions' && (sortCol === col.key ? (sortDir === 'asc' ? <ChevronDown size={11} color="var(--info)" /> : <ChevronUp size={11} color="var(--info)" />) : <span style={{ fontSize: 10, color: '#CBD5E1' }}>&#8597;</span>)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const cfg = CATEGORY_CONFIG[doc.category] || {};
                const IconComp = CATEGORY_ICON[doc.category];
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: cfg.bg || '#F1F5F9', fontSize: 12, fontWeight: 600, color: cfg.color || '#475569' }}>
                        {IconComp && <IconComp size={13} color={cfg.color || '#64748B'} />}
                        {t(CATEGORY_KEY_MAP[doc.category] || doc.category)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{doc.name}</td>
                    {!isGlobalCentre && <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.center}</td>}
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{doc.nextInspection}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{formatCycle(doc.cycleMonths || 12)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{doc.responsible || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: statusColors[doc.status]?.bg, color: statusColors[doc.status]?.color }}>{doc.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <ActionBtn icon={<Eye size={14} />} color="var(--info)" onClick={() => openView(doc)} />
                        <ActionBtn icon={<Pencil size={14} />} color="#64748B" onClick={() => openEdit(doc)} />
                        <ActionBtn icon={<Trash2 size={14} />} color="#DC2626" danger onClick={() => openDelete(doc)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={isGlobalCentre ? 7 : 8} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                  <div style={{ fontSize: 16, marginBottom: 8, color: '#CBD5E1' }}>{t('compliance.noDocs')}</div>
                  <div>{t('compliance.tryAdjusting')}</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────── */}
      {modal === 'add' && <DocModal title={t('compliance.addTitle')} form={form} formUpdate={formUpdate} onSave={handleSave} onCancel={() => setModal(null)} t={t} isNew />}
      {modal?.type === 'view' && <ViewModal doc={modal.doc} onClose={() => setModal(null)} t={t} />}
      {modal?.type === 'edit' && <DocModal title={t('compliance.editTitle')} form={form} formUpdate={formUpdate} onSave={handleSave} onCancel={() => setModal(null)} t={t} />}
      {modal?.type === 'delete' && <DeleteModal doc={modal.doc} onConfirm={handleDelete} onCancel={() => setModal(null)} t={t} />}
    </div>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────

function ComplianceRateBar({ rate }) {
  const color = rate >= 90 ? 'var(--success)' : rate >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={22} cy={22} r={18} fill="none" stroke="#E2E8F0" strokeWidth={4} />
        <circle cx={22} cy={22} r={18} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={2 * Math.PI * 18}
          strokeDashoffset={2 * Math.PI * 18 - (rate / 100) * 2 * Math.PI * 18}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color }}>{rate}%</div>
    </div>
  );
}

function StatusCount({ icon, value, label, bg }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, color, danger, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}
      style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hovered ? (danger ? '#FEE2E2' : '#F1F5F9') : 'transparent', color: hovered ? color : '#94A3B8', transition: 'all 0.15s' }}>
      {icon}
    </button>
  );
}


function MultiDropdown({ label, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const isActive = selected !== 'All';
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: `1px solid ${isActive ? 'var(--info)' : 'var(--border)'}`, background: isActive ? 'var(--info-bg)' : '#fff', color: isActive ? 'var(--info)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        {label}: {isActive ? selected : 'All'} <ChevronDown size={12} />
      </button>
      {open && (<><div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 160, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, padding: 4 }}>
          <button onClick={() => { onSelect('All'); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '7px 10px', fontSize: 12, border: 'none', background: selected === 'All' ? 'var(--info-bg)' : 'transparent', color: selected === 'All' ? 'var(--info)' : '#475569', cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}>All</button>
          {options.map((opt) => (<button key={opt} onClick={() => { onSelect(opt); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '7px 10px', fontSize: 12, border: 'none', background: selected === opt ? 'var(--info-bg)' : 'transparent', color: selected === opt ? 'var(--info)' : '#475569', cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}>{opt}</button>))}
        </div></>)}
    </div>
  );
}

// ── MODALS ──────────────────────────────────────────────

function ModalShell({ children, width }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: width || 520, maxHeight: '85vh', overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

function ViewModal({ doc, onClose, t }) {
  const cfg = CATEGORY_CONFIG[doc.category] || {};
  const IconComp = CATEGORY_ICON[doc.category];
  const fields = [
    { label: t('compliance.detail.name'), value: doc.name },
    { label: t('compliance.detail.category'), value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 6, background: cfg.bg, fontSize: 12, fontWeight: 600, color: cfg.color }}>{IconComp && <IconComp size={12} />}{t(CATEGORY_KEY_MAP[doc.category])}</span> },
    { label: t('compliance.detail.property'), value: doc.center },
    { label: t('compliance.detail.ref'), value: <span style={{ fontFamily: 'monospace' }}>{doc.documentRef}</span> },
    { label: t('compliance.detail.issuedBy'), value: doc.issuedBy },
    { label: t('compliance.detail.inspectionDate'), value: doc.inspectionDate },
    { label: t('compliance.detail.nextInspection'), value: doc.nextInspection },
    { label: t('compliance.detail.expiry'), value: doc.expiry },
    { label: t('compliance.detail.cycle'), value: formatCycle(doc.cycleMonths || 12) },
    { label: t('compliance.detail.responsible'), value: doc.responsible || '—' },
    { label: t('compliance.detail.status'), value: <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: STATUS_BG[doc.status], color: STATUS_CLR[doc.status] }}>{doc.status}</span> },
    ...(doc.notes ? [{ label: t('compliance.detail.notes'), value: doc.notes }] : []),
  ];
  return (
    <ModalShell>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{t('compliance.viewTitle')}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
      </div>
      <div style={{ padding: 24 }}>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', padding: '8px 0', borderBottom: i < fields.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ width: 140, fontSize: 12, color: '#94A3B8', fontWeight: 500, flexShrink: 0 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 500 }}>{f.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
      </div>
    </ModalShell>
  );
}

const STATUS_BG = { Valid: 'var(--success-bg)', Expiring: '#FEF3C7', Expired: '#FEE2E2' };
const STATUS_CLR = { Valid: 'var(--success)', Expiring: '#B45309', Expired: '#DC2626' };

function DocModal({ title, form, formUpdate, onSave, onCancel, t, isNew }) {
  const fieldStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };
  return (
    <ModalShell width={560}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('compliance.form.name')} *</label>
            <input value={form.name} onChange={(e) => formUpdate('name', e.target.value)} placeholder={t('compliance.form.namePlaceholder')} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.category')} *</label>
            <select value={form.category} onChange={(e) => formUpdate('category', e.target.value)} style={{ ...fieldStyle, appearance: 'auto' }}>
              <option value="">{t('compliance.form.selectCategory')}</option>
              {COMPLIANCE_CATEGORIES.map((c) => <option key={c} value={c}>{t(CATEGORY_KEY_MAP[c])}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.property')} *</label>
            <select value={form.center} onChange={(e) => formUpdate('center', e.target.value)} style={{ ...fieldStyle, appearance: 'auto' }}>
              <option value="">{t('compliance.form.selectProperty')}</option>
              {PROPERTIES.map((p) => <option key={p.name} value={p.name}>{p.name.replace('PLK ', '')}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.ref')}</label>
            <input value={form.documentRef} onChange={(e) => formUpdate('documentRef', e.target.value)} placeholder={t('compliance.form.refPlaceholder')} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.issuedBy')}</label>
            <input value={form.issuedBy} onChange={(e) => formUpdate('issuedBy', e.target.value)} placeholder={t('compliance.form.issuedByPlaceholder')} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.inspectionDate')} *</label>
            <input type="date" value={form.inspectionDate} onChange={(e) => formUpdate('inspectionDate', e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.nextInspection')} *</label>
            <input type="date" value={form.nextInspection} onChange={(e) => formUpdate('nextInspection', e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.expiry')}</label>
            <input type="date" value={form.expiry} onChange={(e) => formUpdate('expiry', e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.cycle')} (months)</label>
            <input type="number" value={form.cycleMonths} onChange={(e) => formUpdate('cycleMonths', parseInt(e.target.value) || 12)} min="1" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.responsible')}</label>
            <input value={form.responsible} onChange={(e) => formUpdate('responsible', e.target.value)} placeholder={t('compliance.form.responsiblePlaceholder')} style={fieldStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('compliance.form.notes')}</label>
            <textarea value={form.notes} onChange={(e) => formUpdate('notes', e.target.value)} placeholder={t('compliance.form.notesPlaceholder')} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
        <button onClick={onSave} disabled={!form.name || !form.category || !form.center || !form.inspectionDate || !form.nextInspection} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!form.name || !form.category || !form.center || !form.inspectionDate || !form.nextInspection) ? 0.5 : 1 }}>{isNew ? t('compliance.form.create') : t('compliance.form.update')}</button>
      </div>
    </ModalShell>
  );
}

function DeleteModal({ doc, onConfirm, onCancel, t }) {
  return (
    <ModalShell width={400}>
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Trash2 size={24} color="#DC2626" /></div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>{t('compliance.confirmDelete')}</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>{doc.name}</div>
        <div style={{ fontSize: 12, color: '#94A3B8' }}>{doc.documentRef}</div>
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
        <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.remove')}</button>
      </div>
    </ModalShell>
  );
}
