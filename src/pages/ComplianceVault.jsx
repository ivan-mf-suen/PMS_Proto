import { useState, useMemo, useEffect, useRef } from 'react';
import { COMPLIANCE_CATEGORIES, PROPERTIES, CATEGORY_CONFIG, CATEGORY_ICON, formatCycle, getDocStatus } from '../data/constants';
import { useCompliance } from '../context/ComplianceContext';
import { useTranslation } from '../i18n/LanguageContext';
import { listAttachments, getAttachmentUrl, isAttachmentActive } from '../services/complianceFileService';
import ComboBox from '../components/ComboBox';
import {
  Search, CheckCircle, Clock, Bell, X, Eye, Trash2,
  ChevronDown, ChevronUp,
  FileText, AlertTriangle, Filter,
  Download,
} from 'lucide-react';

const CATEGORY_KEY_MAP = {
  '年檢項目 通風系統': 'compliance.cat.Ventilation',
  '定期檢測項目 電力檢查WR2': 'compliance.cat.ElectricalWR2',
  '年檢項目 消防': 'compliance.cat.FireSafety',
  '年檢項目 升降機/餐𨋢': 'compliance.cat.Lifts',
  '年檢項目 水務': 'compliance.cat.WaterHygiene',
  '年檢項目 環境': 'compliance.cat.Environmental',
  '年檢項目 煤氣': 'compliance.cat.Gas',
  '年檢項目 其他': 'compliance.cat.Other',
  '年檢項目 租約': 'compliance.cat.Lease',
};

const EMPTY_FORM = { name: '', category: '', center: '', documentRef: '', issuedBy: '', inspectionDate: '', nextInspection: '', expiry: '', cycleMonths: 12, responsible: '', notes: '', status: 'Valid' };

export default function ComplianceVault({ selectedCenter, onViewDoc, onCreateDoc }) {
  const { t } = useTranslation();
  const { docs, addDoc, updateDoc, removeDoc } = useCompliance();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');
  const [sortCol, setSortCol] = useState('nextInspection');
  const [sortDir, setSortDir] = useState('asc');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [downloadMenu, setDownloadMenu] = useState(null);
  const [cycleFilter, setCycleFilter] = useState([]);
  const [propertyFilter, setPropertyFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    if (downloadMenu === null) return;
    const close = () => setDownloadMenu(null);
    const handler = (e) => { if (!e.target.closest('[data-download-menu]')) close(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadMenu]);

  const isGlobalCentre = selectedCenter && selectedCenter !== 'All';
  const effectiveCenter = selectedCenter || 'All';

  const toggleCategory = (cat) => { setPage(1); setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]); };
  const clearCategories = () => { setPage(1); setSelectedCategories([]); };
  const toggleStatusFilter = (status) => { setPage(1); setStatusFilter((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]); };

  const activeDocs = useMemo(() => docs.filter((d) => !d.removed), [docs]);

  const docsWithStatus = useMemo(() => activeDocs.map((d) => ({ ...d, status: getDocStatus(d.nextInspection, d.inspectionDate, d.cycleMonths) })), [activeDocs]);

  // Summary docs: status/center/search only (no category filter)
  // Used by categoryCoverage grid so all categories always remain visible
  const summaryDocs = useMemo(() => {
    return docsWithStatus.filter((d) => {
      if (statusFilter.length > 0 && !statusFilter.includes(d.status)) return false;
      if (effectiveCenter !== 'All' && d.center !== effectiveCenter) return false;
      if (expiryFrom && d.nextInspection < expiryFrom) return false;
      if (expiryTo && d.nextInspection > expiryTo) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.center.toLowerCase().includes(q) || d.documentRef.toLowerCase().includes(q) || (d.responsible && d.responsible.toLowerCase().includes(q));
      }
      return true;
    });
  }, [docsWithStatus, statusFilter, effectiveCenter, search, expiryFrom, expiryTo]);

  // Table: applies ALL filters including category, cycle, property
  const filtered = useMemo(() => {
    let list = summaryDocs.filter((d) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(d.category)) return false;
      if (cycleFilter.length > 0 && !cycleFilter.includes(d.cycleMonths)) return false;
      if (propertyFilter.length > 0 && !propertyFilter.includes(d.center)) return false;
      return true;
    });
    list.sort((a, b) => { const va = a[sortCol] ?? ''; const vb = b[sortCol] ?? ''; const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb; return sortDir === 'asc' ? cmp : -cmp; });
    return list;
  }, [summaryDocs, selectedCategories, cycleFilter, propertyFilter, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedDocs = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  // Summary bar counts: from filtered so they match the table when categories are selected test
  const validCount = filtered.filter((d) => d.status === 'Valid').length;
  const expiringCount = filtered.filter((d) => d.status === 'Expiring').length;
  const expiredCount = filtered.filter((d) => d.status === 'Expired').length;
  const totalFiltered = filtered.length;
  const complianceRate = totalFiltered > 0 ? Math.round((validCount / totalFiltered) * 100) : 0;
  const validPct = totalFiltered > 0 ? Math.round((validCount / totalFiltered) * 100) : 0;
  const expiringPct = totalFiltered > 0 ? Math.round((expiringCount / totalFiltered) * 100) : 0;
  const expiredPct = totalFiltered > 0 ? Math.round((expiredCount / totalFiltered) * 100) : 0;

  const uniqueCycles = useMemo(() => [...new Set(docsWithStatus.map((d) => d.cycleMonths))].sort((a, b) => a - b), [docsWithStatus]);
  const uniqueProperties = useMemo(() => [...new Set(docsWithStatus.map((d) => d.center))].sort(), [docsWithStatus]);

  // Coverage grid: from summaryDocs — only categories with docs matching the active status filter
  // Expiring docs count as valid (not yet expired)
  const categoryCoverage = useMemo(() => {
    return COMPLIANCE_CATEGORIES.map((cat) => {
      const catDocs = summaryDocs.filter((d) => d.category === cat);
      const catValid = catDocs.filter((d) => d.status !== 'Expired').length;
      const pct = catDocs.length > 0 ? Math.round((catValid / catDocs.length) * 100) : 0;
      return { cat, total: catDocs.length, valid: catValid, pct };
    }).filter((c) => c.total > 0);
  }, [summaryDocs]);

  const handleSort = (col) => { if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };

  const openAdd = () => { if (onCreateDoc) { onCreateDoc(); } else { setForm({ ...EMPTY_FORM, cycleMonths: 12 }); setModal('add'); } };
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
  selectedCategories.forEach((cat) => activeFilterPills.push({ key: `cat-${cat}`, label: `${t('compliance.filter.category')}: ${t(CATEGORY_KEY_MAP[cat] || cat)}`, clear: () => toggleCategory(cat) }));
  statusFilter.forEach((s) => activeFilterPills.push({ key: `status-${s}`, label: `Status: ${s}`, clear: () => toggleStatusFilter(s) }));
  cycleFilter.forEach((c) => activeFilterPills.push({ key: `cycle-${c}`, label: `${t('compliance.filter.cycle')}: ${formatCycle(c)}`, clear: () => setCycleFilter((prev) => prev.filter((v) => v !== c)) }));
  propertyFilter.forEach((p) => activeFilterPills.push({ key: `property-${p}`, label: `${t('compliance.filter.property')}: ${p.replace('PLK ', '')}`, clear: () => setPropertyFilter((prev) => prev.filter((v) => v !== p)) }));
  if (expiryFrom) activeFilterPills.push({ key: 'expiryFrom', label: `${t('compliance.filter.expiryFrom')}: ${expiryFrom}`, clear: () => setExpiryFrom('') });
  if (expiryTo) activeFilterPills.push({ key: 'expiryTo', label: `${t('compliance.filter.expiryTo')}: ${expiryTo}`, clear: () => setExpiryTo('') });
  const hasFilters = activeFilterPills.length > 0;
  const clearAllFilters = () => { clearCategories(); setStatusFilter([]); setCycleFilter([]); setPropertyFilter([]); setSearch(''); setExpiryFrom(''); setExpiryTo(''); setPage(1); };

  const csvEscape = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };

  const exportCSV = () => {
    const headers = ['Category', 'Certificate Name', 'Property', 'Next Due', 'Cycle (months)', 'Effective', 'Expiry', 'Issued By', 'Reference No.', 'Responsible', 'Status'];
    const rows = filtered.map((d) => [d.category, d.name, d.center, d.nextInspection || '', d.cycleMonths || 12, d.inspectionDate || '', d.expiry || '', d.issuedBy, d.documentRef, d.responsible, d.status]);
    const csv = [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'compliance_records.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const bulkDownload = (activeOnly) => {
    const atts = filtered.flatMap((d) => listAttachments(d.id, d).filter((a) => !activeOnly || isAttachmentActive(a)));
    atts.forEach((att, i) => { setTimeout(() => { const a = document.createElement('a'); a.href = getAttachmentUrl(att); a.download = att.name; document.body.appendChild(a); a.click(); a.remove(); }, i * 200); });
  };

  const downloadDoc = (doc, activeOnly) => {
    const atts = listAttachments(doc.id, doc).filter((a) => !activeOnly || isAttachmentActive(a));
    atts.forEach((att, i) => { setTimeout(() => { const a = document.createElement('a'); a.href = getAttachmentUrl(att); a.download = att.name; document.body.appendChild(a); a.click(); a.remove(); }, i * 200); });
  };

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
        {/* Status counts — display only */}
        <StatusCount icon={<CheckCircle size={16} color="var(--success)" />} value={validCount} label={t('compliance.valid')} bg="var(--success-bg)" pct={statusFilter.length === 0 ? validPct : undefined} subLabel={t('compliance.documents')} />
        <StatusCount icon={<AlertTriangle size={16} color="#D97706" />} value={expiringCount} label={t('compliance.expiringSoon')} bg="#FEF3C7" pct={statusFilter.length === 0 ? expiringPct : undefined} subLabel={t('compliance.documents')} />
        <StatusCount icon={<Clock size={16} color="#DC2626" />} value={expiredCount} label={t('compliance.expired')} bg="#FEE2E2" pct={statusFilter.length === 0 ? expiredPct : undefined} subLabel={t('compliance.documents')} />
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
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'visible', padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Filter size={14} color="#64748B" />
          <MultiSelectDropdown
            options={COMPLIANCE_CATEGORIES.map((cat) => ({ value: cat, label: t(CATEGORY_KEY_MAP[cat] || cat) }))}
            selected={selectedCategories}
            onChange={setSelectedCategories}
            placeholder={t('compliance.filter.category')}
          />
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder={t('compliance.searchPlaceholder')} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none' }} />
          </div>
          {!isGlobalCentre && (
            <MultiSelectDropdown
              options={uniqueProperties.map((p) => ({ value: p, label: p.replace('PLK ', '') }))}
              selected={propertyFilter}
              onChange={(v) => { setPage(1); setPropertyFilter(v); }}
              placeholder={t('compliance.filter.property')}
            />
          )}
          <MultiSelectDropdown
            options={uniqueCycles.map((c) => ({ value: c, label: formatCycle(c) }))}
            selected={cycleFilter}
            onChange={(v) => { setPage(1); setCycleFilter(v); }}
            placeholder={t('compliance.filter.cycle')}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
            <span>{t('compliance.filter.expiryFrom')}</span>
            <input type="date" value={expiryFrom} onChange={(e) => { setPage(1); setExpiryFrom(e.target.value); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }} />
            <span>{t('compliance.filter.expiryTo')}</span>
            <input type="date" value={expiryTo} onChange={(e) => { setPage(1); setExpiryTo(e.target.value); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }} />
          </div>
          {[
            { key: 'Valid', label: t('compliance.valid'), icon: <CheckCircle size={13} />, activeBg: 'var(--success)', activeColor: '#fff', _inactiveBg: 'var(--success-bg)', _inactiveColor: 'var(--success)' },
            { key: 'Expiring', label: t('compliance.expiring'), icon: <AlertTriangle size={13} />, activeBg: '#F59E0B', activeColor: '#fff', _inactiveBg: '#FEF3C7', _inactiveColor: '#B45309' },
            { key: 'Expired', label: t('compliance.expired'), icon: <Clock size={13} />, activeBg: '#DC2626', activeColor: '#fff', _inactiveBg: '#FEE2E2', _inactiveColor: '#DC2626' },
          ].map(({ key, label, icon, activeBg, activeColor }) => {
            const isActive = statusFilter.includes(key);
            return (
              <button key={key} onClick={() => toggleStatusFilter(key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${isActive ? activeBg : 'var(--border)'}`, background: isActive ? activeBg : '#fff', color: isActive ? activeColor : '#64748B', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {icon}{label}
              </button>
            );
          })}
        </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#FAFBFC' }}>
          <button onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            <FileText size={13} /> {t('compliance.exportCsv')}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => bulkDownload(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
              <Download size={13} /> {t('compliance.downloadActiveDocs')}
            </button>
            <button onClick={() => bulkDownload(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
              <Download size={13} /> {t('compliance.downloadAllDocs')}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'category', label: t('compliance.col.category'), width: 160 },
                  { key: 'name', label: t('compliance.col.certificate') },
                  ...(!isGlobalCentre ? [{ key: 'center', label: t('compliance.col.property'), width: 200 }] : []),
                  { key: 'inspectionDate', label: t('compliance.col.lastInspect'), width: 110 },
                  { key: 'cycleMonths', label: t('compliance.col.cycle'), width: 80 },
                  { key: 'nextInspection', label: t('compliance.col.nextDue'), width: 110 },
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
              {pagedDocs.map((doc) => {
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
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{doc.inspectionDate}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{formatCycle(doc.cycleMonths || 12)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{doc.nextInspection}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: statusColors[doc.status]?.bg, color: statusColors[doc.status]?.color }}>{doc.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center', position: 'relative' }}>
                        <ActionBtn icon={<Eye size={14} />} color="var(--info)" title={t('compliance.action.viewDetails')} onClick={() => onViewDoc(doc.id)} />
                        <div style={{ position: 'relative' }}>
                          <ActionBtn icon={<Download size={14} />} color="#475569" title={t('compliance.download')} onClick={() => setDownloadMenu(downloadMenu === doc.id ? null : doc.id)} />
                          {downloadMenu === doc.id && (
                            <div data-download-menu style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 160, overflow: 'hidden' }}>
                              <button
                                onClick={() => { downloadDoc(doc, true); setDownloadMenu(null); }}
                                style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 500, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                              >{t('compliance.downloadActiveDocs')}</button>
                              <button
                                onClick={() => { downloadDoc(doc, false); setDownloadMenu(null); }}
                                style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 500, color: '#475569', background: 'none', border: 'none', borderTop: '1px solid #F1F5F9', cursor: 'pointer', textAlign: 'left' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                              >{t('compliance.downloadAllDocs')}</button>
                            </div>
                          )}
                        </div>
                        <ActionBtn icon={<Trash2 size={14} />} color="#DC2626" danger title={t('compliance.remove')} onClick={() => openDelete(doc)} />
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

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={250}>250</option>
            </select>
            <span>{t('compliance.perPage')}</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            {t('compliance.showing', { from: (safePage - 1) * perPage + 1, to: Math.min(safePage * perPage, filtered.length), total: filtered.length })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: safePage <= 1 ? '#CBD5E1' : '#475569', cursor: safePage <= 1 ? 'default' : 'pointer' }}>{t('compliance.prev')}</button>
            <input type="number" min={1} max={totalPages} value={safePage} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setPage(Math.max(1, Math.min(totalPages, v))); }} style={{ width: 44, padding: '5px 4px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, textAlign: 'center', outline: 'none', background: '#fff' }} />
            <span style={{ fontSize: 13, color: '#64748B' }}>{t('compliance.ofPages', { total: totalPages })}</span>
            <button disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: safePage >= totalPages ? '#CBD5E1' : '#475569', cursor: safePage >= totalPages ? 'default' : 'pointer' }}>{t('compliance.next')}</button>
          </div>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────── */}
      {modal === 'add' && <DocModal title={t('compliance.addTitle')} form={form} formUpdate={formUpdate} onSave={handleSave} onCancel={() => setModal(null)} t={t} isNew />}
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

function StatusCount({ icon, value, label, bg, active, onClick, pct, subLabel }) {
  return (
    <div onClick={onClick} style={{ position: 'relative', flex: 1, background: active ? bg : '#fff', borderRadius: 12, border: `2px solid ${active ? 'var(--info)' : 'var(--border)'}`, boxShadow: active ? '0 0 0 3px rgba(37,99,235,0.12)' : 'var(--card-shadow)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{pct != null ? `${pct}%` : value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 2 }}>{label}</div>
        {pct != null && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{value} {subLabel || 'documents'}</div>}
      </div>
    </div>
  );
}

function ActionBtn({ icon, color, danger, onClick, title }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button title={title} aria-label={title} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}
      style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hovered ? (danger ? '#FEE2E2' : '#F1F5F9') : 'transparent', color: hovered ? color : '#94A3B8', transition: 'all 0.15s' }}>
      {icon}
    </button>
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
            <ComboBox value={form.category} onChange={(val) => formUpdate('category', val)}
              options={COMPLIANCE_CATEGORIES.map((c) => ({ value: c, label: t(CATEGORY_KEY_MAP[c]) }))}
              placeholder={t('compliance.form.selectCategory')} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.property')} *</label>
            <ComboBox value={form.center} onChange={(val) => formUpdate('center', val)}
              options={PROPERTIES.map((p) => ({ value: p.name, label: p.name.replace('PLK ', '') }))}
              placeholder={t('compliance.form.selectProperty')} />
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
            <label style={labelStyle}>{t('compliance.form.effectiveDate')} *</label>
            <input type="date" value={form.inspectionDate} onChange={(e) => {
              const val = e.target.value;
              formUpdate('inspectionDate', val);
              if (val && form.cycleMonths) {
                const d = new Date(val);
                d.setMonth(d.getMonth() + (form.cycleMonths || 12));
                formUpdate('expiry', d.toISOString().slice(0, 10));
              }
            }} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.cycle')} (months)</label>
            <input type="number" value={form.cycleMonths} onChange={(e) => {
              const months = parseInt(e.target.value) || 12;
              formUpdate('cycleMonths', months);
              if (form.inspectionDate && months) {
                const d = new Date(form.inspectionDate);
                d.setMonth(d.getMonth() + months);
                formUpdate('expiry', d.toISOString().slice(0, 10));
              }
            }} min="1" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.form.expiry')}</label>
            <input type="date" value={form.expiry} readOnly style={{ ...fieldStyle, background: '#F8FAFC', color: '#64748B' }} />
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{t('compliance.autoExpiryHint') || 'Auto-calculated from Effective Date + Cycle'}</div>
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
        <button onClick={onSave} disabled={!form.name || !form.category || !form.center || !form.inspectionDate} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!form.name || !form.category || !form.center || !form.inspectionDate) ? 0.5 : 1 }}>{isNew ? t('compliance.form.create') : t('compliance.form.update')}</button>
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

function MultiSelectDropdown({ options, selected, onChange, placeholder }) {
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
          {selected.length === 0 ? (placeholder || 'All') : `${selected.length} selected`}
        </span>
        <ChevronDown size={12} />
      </button>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 220, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #F1F5F9' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, outline: 'none', background: '#F8FAFC' }} />
          </div>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={toggleAll}>
            <input type="checkbox" checked={allSelected} readOnly style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Select All</span>
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
            {filtered.length === 0 && <div style={{ padding: '8px', fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}
