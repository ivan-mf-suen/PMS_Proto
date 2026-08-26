import { useState, useMemo, useEffect } from 'react';
import { COMPLIANCE_CATEGORIES, PROPERTIES, CATEGORY_CONFIG, formatCycle, getDocStatus } from '../data/constants';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { listAttachments, uploadAttachment, deactivateAttachment, getAttachmentUrl, formatFileSize, formatTimestamp, formatDateOnly, isAttachmentActive, DOC_TYPES } from '../services/complianceFileService';
import {
  Search, CheckCircle, Clock, Bell, X, Eye, Pencil, Trash2,
  ChevronDown, ChevronUp, Wind, Zap, Flame, ArrowUp, Droplets, Leaf,
  CircleHelp, FileText, Calendar, AlertTriangle,
  Upload, Download, Paperclip, FileImage,
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

const CATEGORY_ICON = {
  '年檢項目 通風系統': Wind, '定期檢測項目 電力檢查WR2': Zap, '年檢項目 消防': Flame,
  '年檢項目 升降機/餐𨋢': ArrowUp, '年檢項目 水務': Droplets, '年檢項目 環境': Leaf,
  '年檢項目 煤氣': Flame, '年檢項目 其他': CircleHelp, '年檢項目 租約': FileText,
};

const EMPTY_FORM = { name: '', category: '', center: '', documentRef: '', issuedBy: '', inspectionDate: '', nextInspection: '', expiry: '', cycleMonths: 12, responsible: '', notes: '', status: 'Valid' };

export default function ComplianceVault({ selectedCenter }) {
  const { t } = useTranslation();
  const { docs, addDoc, updateDoc, removeDoc } = useCompliance();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');
  const [sortCol, setSortCol] = useState('nextInspection');
  const [sortDir, setSortDir] = useState('asc');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [downloadMenu, setDownloadMenu] = useState(null);

  useEffect(() => {
    if (downloadMenu === null) return;
    const close = () => setDownloadMenu(null);
    const handler = (e) => { if (!e.target.closest('[data-download-menu]')) close(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadMenu]);

  const isGlobalCentre = selectedCenter && selectedCenter !== 'All';
  const effectiveCenter = selectedCenter || 'All';

  const toggleCategory = (cat) => setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  const clearCategories = () => setSelectedCategories([]);
  const toggleStatusFilter = (status) => setStatusFilter((prev) => prev === status ? 'All' : status);

  const activeDocs = useMemo(() => docs.filter((d) => !d.removed), [docs]);

  const docsWithStatus = useMemo(() => activeDocs.map((d) => ({ ...d, status: getDocStatus(d.nextInspection) })), [activeDocs]);

  // Summary docs: status/center/search only (no category filter)
  // Used by categoryCoverage grid so all categories always remain visible
  const summaryDocs = useMemo(() => {
    return docsWithStatus.filter((d) => {
      if (statusFilter !== 'All' && d.status !== statusFilter) return false;
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

  // Table: applies ALL filters including category
  const filtered = useMemo(() => {
    let list = summaryDocs.filter((d) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(d.category)) return false;
      return true;
    });
    list.sort((a, b) => { const va = a[sortCol] ?? ''; const vb = b[sortCol] ?? ''; const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb; return sortDir === 'asc' ? cmp : -cmp; });
    return list;
  }, [summaryDocs, selectedCategories, sortCol, sortDir]);

  // Summary bar counts: from filtered so they match the table when categories are selected test
  const validCount = filtered.filter((d) => d.status === 'Valid').length;
  const expiringCount = filtered.filter((d) => d.status === 'Expiring').length;
  const expiredCount = filtered.filter((d) => d.status === 'Expired').length;
  const totalFiltered = filtered.length;
  const complianceRate = totalFiltered > 0 ? Math.round((validCount / totalFiltered) * 100) : 0;
  const validPct = totalFiltered > 0 ? Math.round((validCount / totalFiltered) * 100) : 0;
  const expiringPct = totalFiltered > 0 ? Math.round((expiringCount / totalFiltered) * 100) : 0;
  const expiredPct = totalFiltered > 0 ? Math.round((expiredCount / totalFiltered) * 100) : 0;

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
  if (expiryFrom) activeFilterPills.push({ key: 'expiryFrom', label: `${t('compliance.filter.expiryFrom')}: ${expiryFrom}`, clear: () => setExpiryFrom('') });
  if (expiryTo) activeFilterPills.push({ key: 'expiryTo', label: `${t('compliance.filter.expiryTo')}: ${expiryTo}`, clear: () => setExpiryTo('') });
  const hasFilters = activeFilterPills.length > 0;
  const clearAllFilters = () => { clearCategories(); setStatusFilter('All'); setSearch(''); setExpiryFrom(''); setExpiryTo(''); };

  const csvEscape = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };

  const exportCSV = () => {
    const headers = ['ID', 'Category', 'Certificate Name', 'Property', 'Next Due', 'Cycle (months)', 'Last Inspected', 'Expiry', 'Issued By', 'Reference No.', 'Responsible', 'Status'];
    const rows = filtered.map((d) => [d.id, d.category, d.name, d.center, d.nextInspection, d.cycleMonths || 12, d.inspectionDate, d.expiry, d.issuedBy, d.documentRef, d.responsible, d.status]);
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
        <StatusCount icon={<CheckCircle size={16} color="var(--success)" />} value={validCount} label={t('compliance.valid')} bg="var(--success-bg)" pct={statusFilter === 'All' ? validPct : undefined} />
        <StatusCount icon={<AlertTriangle size={16} color="#D97706" />} value={expiringCount} label={t('compliance.expiringSoon')} bg="#FEF3C7" pct={statusFilter === 'All' ? expiringPct : undefined} tooltip={t('compliance.expiringDesc')} />
        <StatusCount icon={<Clock size={16} color="#DC2626" />} value={expiredCount} label={t('compliance.expired')} bg="#FEE2E2" pct={statusFilter === 'All' ? expiredPct : undefined} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px' }}>
          <Calendar size={14} color="#94A3B8" />
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>{t('compliance.filter.expiryFrom')}</span>
          <input type="date" value={expiryFrom} onChange={(e) => setExpiryFrom(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 12, padding: '8px 2px', background: 'transparent', color: expiryFrom ? 'var(--foreground)' : '#94A3B8', fontFamily: 'inherit' }} />
          <span style={{ fontSize: 11, color: '#CBD5E1' }}>—</span>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>{t('compliance.filter.expiryTo')}</span>
          <input type="date" value={expiryTo} onChange={(e) => setExpiryTo(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 12, padding: '8px 2px', background: 'transparent', color: expiryTo ? 'var(--foreground)' : '#94A3B8', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {[
          { key: 'Valid', label: t('compliance.valid'), icon: <CheckCircle size={13} />, activeBg: 'var(--success)', activeColor: '#fff', inactiveBg: 'var(--success-bg)', inactiveColor: 'var(--success)' },
          { key: 'Expiring', label: t('compliance.expiringSoon'), icon: <AlertTriangle size={13} />, activeBg: '#F59E0B', activeColor: '#fff', inactiveBg: '#FEF3C7', inactiveColor: '#B45309' },
          { key: 'Expired', label: t('compliance.expired'), icon: <Clock size={13} />, activeBg: '#DC2626', activeColor: '#fff', inactiveBg: '#FEE2E2', inactiveColor: '#DC2626' },
        ].map(({ key, label, icon, activeBg, activeColor, inactiveBg, inactiveColor }) => {
          const isActive = statusFilter === key;
          return (
            <button key={key} onClick={() => toggleStatusFilter(key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${isActive ? activeBg : inactiveBg}`, background: isActive ? activeBg : inactiveBg, color: isActive ? activeColor : inactiveColor, cursor: 'pointer', transition: 'all 0.15s' }}>
              {icon}{label}
            </button>
          );
        })}
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
                  { key: 'nextInspection', label: t('compliance.col.nextDue'), width: 110 },
                  { key: 'cycleMonths', label: t('compliance.col.cycle'), width: 80 },
                  { key: 'inspectionDate', label: t('compliance.col.lastInspect'), width: 110 },
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
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{doc.inspectionDate}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: statusColors[doc.status]?.bg, color: statusColors[doc.status]?.color }}>{doc.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center', position: 'relative' }}>
                        <ActionBtn icon={<Eye size={14} />} color="var(--info)" title={t('compliance.action.viewDetails')} onClick={() => openView(doc)} />
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

      {/* ── MODALS ────────────────────────────────── */}
      {modal === 'add' && <DocModal title={t('compliance.addTitle')} form={form} formUpdate={formUpdate} onSave={handleSave} onCancel={() => setModal(null)} t={t} isNew />}
      {modal?.type === 'view' && <ViewModal doc={modal.doc} onClose={() => setModal(null)} onEdit={openEdit} t={t} />}
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

function StatusCount({ icon, value, label, bg, active, onClick, pct, tooltip }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} style={{ position: 'relative', flex: 1, background: active ? bg : '#fff', borderRadius: 12, border: `2px solid ${active ? 'var(--info)' : 'var(--border)'}`, boxShadow: active ? '0 0 0 3px rgba(37,99,235,0.12)' : 'var(--card-shadow)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={(e) => { setHovered(true); if (!active) e.currentTarget.style.borderColor = 'var(--info)'; }}
      onMouseLeave={(e) => { setHovered(false); if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}>
      {tooltip && hovered && !active && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: '#1E293B', color: '#F8FAFC', fontSize: 11, fontWeight: 500, lineHeight: 1.4, padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {tooltip}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', border: '5px solid transparent', borderTopColor: '#1E293B' }} />
        </div>
      )}
      <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 1 }}>{label}{pct != null && !active && <span style={{ color: '#94A3B8', fontWeight: 500, marginLeft: 4 }}>({pct}%)</span>}</div>
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

function ViewModal({ doc, onClose, onEdit, t }) {
  const { permissions } = useAuth();
  const uploaderName = permissions?.name || 'System';
  const [attachments, setAttachments] = useState(() => listAttachments(doc.id, doc));
  const [previewing, setPreviewing] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [inactiveTarget, setInactiveTarget] = useState(null);
  const [inactiveRemarks, setInactiveRemarks] = useState('');
  const [inactiveStep, setInactiveStep] = useState(0);

  const cfg = CATEGORY_CONFIG[doc.category] || {};
  const IconComp = CATEGORY_ICON[doc.category];
  const fields = [
    { label: t('compliance.detail.name'), value: doc.name },
    { label: t('compliance.detail.category'), value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 6, background: cfg.bg, fontSize: 12, fontWeight: 600, color: cfg.color }}>{IconComp && <IconComp size={12} />}{t(CATEGORY_KEY_MAP[doc.category])}</span> },
    { label: t('compliance.detail.property'), value: doc.center },
    { label: t('compliance.detail.ref'), value: doc.documentRef },
    { label: t('compliance.detail.issuedBy'), value: doc.issuedBy },
    { label: t('compliance.detail.inspectionDate'), value: doc.inspectionDate },
    { label: t('compliance.detail.nextInspection'), value: doc.nextInspection },
    { label: t('compliance.detail.expiry'), value: doc.expiry },
    { label: t('compliance.detail.cycle'), value: formatCycle(doc.cycleMonths || 12) },
    { label: t('compliance.detail.responsible'), value: doc.responsible || '—' },
    { label: t('compliance.detail.status'), value: <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: STATUS_BG[doc.status], color: STATUS_CLR[doc.status] }}>{doc.status}</span> },
    ...(doc.notes ? [{ label: t('compliance.detail.notes'), value: doc.notes }] : []),
  ];

  const handleUploadSubmitted = (payload) => {
    uploadAttachment(doc.id, payload, uploaderName);
    setAttachments(listAttachments(doc.id, doc));
    setUploadOpen(false);
  };

  const triggerDownload = (att) => {
    const a = document.createElement('a');
    a.href = getAttachmentUrl(att);
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDeactivate = () => {
    deactivateAttachment(doc.id, inactiveTarget.id, { by: uploaderName, at: new Date().toISOString(), remarks: inactiveRemarks.trim() });
    setAttachments(listAttachments(doc.id, doc));
    setInactiveTarget(null);
    setInactiveRemarks('');
    setInactiveStep(0);
  };

  return (
    <ModalShell width={640}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{t('compliance.viewTitle')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => onEdit(doc)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Pencil size={13} /> {t('compliance.detail.edit')}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
      </div>
      <div style={{ padding: 24 }}>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', padding: '8px 0', borderBottom: i < fields.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ width: 140, fontSize: 12, lineHeight: '18px', color: '#94A3B8', fontWeight: 500, flexShrink: 0 }}>{f.label}</div>
            <div style={{ flex: 1, fontSize: 13, lineHeight: '18px', color: 'var(--foreground)', fontWeight: 500 }}>{f.value}</div>
          </div>
        ))}

        <AttachmentHistory
          attachments={attachments}
          onUploadClick={() => setUploadOpen(true)}
          onPreview={setPreviewing}
          onDownload={triggerDownload}
          onDeactivate={(att) => { setInactiveTarget(att); setInactiveStep(0); setInactiveRemarks(''); }}
          t={t}
        />
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
      </div>
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onSubmit={handleUploadSubmitted} t={t} />}
      {previewing && <PreviewOverlay attachment={previewing} onClose={() => setPreviewing(null)} onDownload={() => triggerDownload(previewing)} t={t} />}
      {inactiveTarget && <InactiveConfirmModal target={inactiveTarget} step={inactiveStep} setStep={setInactiveStep} remarks={inactiveRemarks} setRemarks={setInactiveRemarks} onConfirm={handleDeactivate} onClose={() => { setInactiveTarget(null); setInactiveRemarks(''); setInactiveStep(0); }} t={t} />}
    </ModalShell>
  );
}

function UploadModal({ onClose, onSubmit, t }) {
  const fieldStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setName(f.name);
  };

  return (
    <ModalShell width={480}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{t('compliance.upload.title')}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>{t('compliance.upload.file')} *</label>
          <button onClick={() => document.getElementById('cv-upload-file-input')?.click()} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: file ? 'var(--foreground)' : '#94A3B8', fontWeight: file ? 600 : 500, boxSizing: 'border-box' }}>
            <Upload size={14} color="var(--info)" />
            {file ? file.name : t('compliance.upload.chooseFile')}
          </button>
          <input id="cv-upload-file-input" data-testid="upload-file-input" type="file" onChange={handlePick} style={{ display: 'none' }} />
        </div>
        <div>
          <label style={labelStyle}>{t('compliance.upload.name')} *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!file} placeholder={t('compliance.upload.noFile')} style={{ ...fieldStyle, opacity: file ? 1 : 0.6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>{t('compliance.upload.type')}</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ ...fieldStyle, appearance: 'auto' }}>
              {DOC_TYPES.map((dt) => <option key={dt} value={dt}>{t(`compliance.doctype.${dt}`)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('compliance.upload.docDate')}</label>
            <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} style={fieldStyle} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>{t('compliance.upload.expiry')}</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={fieldStyle} />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{t('compliance.upload.expiryOptional')}</div>
        </div>
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
        <button onClick={() => onSubmit({ file, name: name.trim() || file.name, docType, docDate, expiryDate: expiryDate || null })} disabled={!file} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: file ? 1 : 0.5 }}>
          {t('compliance.upload.submit')}
        </button>
      </div>
    </ModalShell>
  );
}

function AttachmentHistory({ attachments, onUploadClick, onPreview, onDownload, onDeactivate, t }) {
  const headStyle = { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden' };
  const cellStyle = { padding: '8px 10px', fontSize: 12, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  return (
    <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paperclip size={15} color="var(--info)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.attach.title')}</span>
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>({attachments.length})</span>
        </div>
        <button onClick={onUploadClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Upload size={13} /> {t('compliance.attach.upload')}
        </button>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 62 }} />
            <col />
            <col style={{ width: 100 }} />
            <col style={{ width: 138 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 148 }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
              <th style={headStyle}>{t('compliance.attach.col.status')}</th>
              <th style={headStyle}>{t('compliance.attach.col.name')}</th>
              <th style={headStyle}>{t('compliance.attach.col.uploader')}</th>
              <th style={headStyle}>{t('compliance.attach.col.time')}</th>
              <th style={headStyle}>{t('compliance.attach.col.size')}</th>
              <th style={headStyle}>{t('compliance.attach.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {attachments.map((att) => {
              const active = isAttachmentActive(att);
              return (
                <tr key={att.id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: active ? 'var(--success-bg)' : '#F1F5F9', color: active ? 'var(--success)' : '#64748B' }}>{active ? t('compliance.attach.active') : t('compliance.attach.inactive')}</span>
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--foreground)' }} title={`${att.name}${att.docType ? ` · ${att.docType}` : ''}${att.expiryDate ? ` · ${t('compliance.upload.expiry')}: ${formatDateOnly(att.expiryDate)}` : ''}`}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
                      <FileTypeIcon mimeType={att.mimeType} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</span>
                    </span>
                  </td>
                  <td style={cellStyle} title={att.uploader}>{att.uploader}</td>
                  <td style={cellStyle}>{formatTimestamp(att.uploadedAt)}</td>
                  <td style={cellStyle}>{formatFileSize(att.size)}</td>
                  <td style={{ ...cellStyle, whiteSpace: 'nowrap', overflow: 'visible' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <TextBtn label={t('compliance.attach.preview')} color="var(--info)" onClick={() => onPreview(att)} />
                      <TextBtn label={t('compliance.download')} color="#475569" onClick={() => onDownload(att)} />
                      {active && onDeactivate && <TextBtn label={t('compliance.attach.setInactive')} color="#DC2626" onClick={() => onDeactivate(att)} />}
                    </div>
                  </td>
                </tr>
              );
            })}
            {attachments.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>{t('compliance.attach.empty')}</div>
                  <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{t('compliance.attach.emptyHint')}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TextBtn({ label, color, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}
      style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${hovered ? color : 'var(--border)'}`, background: hovered ? 'var(--info-bg)' : '#fff', color, cursor: 'pointer', transition: 'all 0.15s' }}>
      {label}
    </button>
  );
}

function FileTypeIcon({ mimeType }) {
  if (mimeType?.startsWith('image/')) return <FileImage size={14} color="var(--info)" style={{ flexShrink: 0 }} />;
  return <FileText size={14} color="#DC2626" style={{ flexShrink: 0 }} />;
}

function PreviewOverlay({ attachment, onClose, onDownload, t }) {
  const url = getAttachmentUrl(attachment);
  const isImage = attachment.mimeType?.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.78)', display: 'flex', flexDirection: 'column', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 16 }}>{t('compliance.preview.title')} — {attachment.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={onDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> {t('compliance.download')}
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
      </div>
      {isImage ? (
        <img src={url} alt={attachment.name} style={{ flex: 1, minHeight: 0, maxWidth: '100%', objectFit: 'contain', borderRadius: 10 }} />
      ) : isPdf ? (
        <iframe src={url} title={attachment.name} style={{ flex: 1, width: '100%', border: 'none', borderRadius: 10, background: '#fff' }} />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', borderRadius: 10 }}>
          <FileText size={40} color="#CBD5E1" />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{t('compliance.preview.unsupported')}</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>{t('compliance.preview.downloadHint')}</div>
        </div>
      )}
    </div>
  );
}

function InactiveConfirmModal({ target, step, setStep, remarks, setRemarks, onConfirm, onClose, t }) {
  const fieldStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' };
  return (
    <ModalShell width={440}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626' }}>{t('compliance.inactive.title')}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
      </div>
      <div style={{ padding: 24 }}>
        {step === 0 ? (
          <div>
            <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6, marginBottom: 6 }}>{t('compliance.inactive.confirmMsg')}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, marginBottom: 4 }}>{target.name}</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6, marginBottom: 10 }}>{t('compliance.inactive.remarksMsg')}</div>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder={t('compliance.inactive.remarksPlaceholder')} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
        )}
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
        {step === 0 ? (
          <button onClick={() => setStep(1)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.inactive.confirm')}</button>
        ) : (
          <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.inactive.submit')}</button>
        )}
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
