import { useMemo, useState } from 'react';
import { CENTERS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { Plus, Search, Pencil, Trash2, ChevronDown, Download, Boxes, CircleCheck, HardHat, ClipboardCheck, X, Upload } from 'lucide-react';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import ImportModal from '../components/ImportModal';

const ALL_TYPES = ['All', 'HVAC', 'Fire Safety', 'Vertical Transport', 'Power', 'Security', 'Plumbing', 'MEP', 'Electrical'];
const ALL_STATUSES = ['All', 'Operational', 'Needs Inspection', 'Under Maintenance'];

function FilterDropdown({ label, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: selected !== 'All' ? 'var(--info-bg)' : '#fff', color: selected !== 'All' ? 'var(--info)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        {label}: {selected} <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, padding: 4 }}>
            {options.map((opt) => (
              <button key={opt} onClick={() => { onSelect(opt); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '7px 10px', fontSize: 12, border: 'none', background: selected === opt ? 'var(--info-bg)' : 'transparent', color: selected === opt ? 'var(--info)' : '#475569', cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Assets({ assets, setAssets, onViewAsset, onCreateAsset, onEditAsset, onRemoveAsset }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (typeFilter !== 'All' && a.type !== typeFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.serialNumber && a.serialNumber.toLowerCase().includes(q));
      }
      return true;
    });
  }, [assets, search, typeFilter, statusFilter]);

  const operationalCount = assets.filter((a) => a.status === 'Operational').length;
  const maintenanceCount = assets.filter((a) => a.status === 'Under Maintenance').length;
  const inspectionCount = assets.filter((a) => a.status === 'Needs Inspection').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedAssets = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const csvEscape = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };
  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Location', 'Status', 'Condition', 'Last Service', 'Next Service', 'Manufacturer', 'Model'];
    const rows = filtered.map((a) => [a.id, a.name, a.type, a.location, a.status, a.condition, a.lastService || '', a.nextService || '', a.manufacturer || '', a.model || '']);
    const csv = [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'assets.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const hasTypeFilter = typeFilter !== 'All';
  const hasStatusFilter = statusFilter !== 'All';
  const clearAll = () => { setTypeFilter('All'); setStatusFilter('All'); setSearch(''); };

  const statusColor = (status) => {
    if (status === 'Operational') return { bg: 'var(--success-bg)', color: 'var(--success)' };
    if (status === 'Under Maintenance') return { bg: 'var(--warning-bg)', color: '#B45309' };
    return { bg: 'var(--critical-bg)', color: 'var(--critical)' };
  };

  const conditionColor = (condition) => {
    if (condition === 'Good') return { bg: 'var(--success-bg)', color: 'var(--success)' };
    if (condition === 'Fair') return { bg: '#FEF3C7', color: '#B45309' };
    return { bg: 'var(--critical-bg)', color: 'var(--critical)' };
  };

  const importFieldValues = {
    type: ALL_TYPES.filter((tt) => tt !== 'All'),
    status: ALL_STATUSES.filter((s) => s !== 'All'),
    condition: ['Good', 'Fair', 'Poor'],
    department: ['SSD', 'PWD', 'ITD'],
  };

  const importFields = [
    { key: 'name', label: 'Asset Name', required: true },
    { key: 'type', label: 'Type', required: true, options: importFieldValues.type },
    { key: 'location', label: 'Location', required: true, options: CENTERS.concat(['All Sites']) },
    { key: 'status', label: 'Status', required: true, options: importFieldValues.status },
    { key: 'manufacturer', label: 'Manufacturer', required: false },
    { key: 'model', label: 'Model' },
    { key: 'serialNumber', label: 'Serial Number', required: true },
    { key: 'installYear', label: 'Install Year' },
    { key: 'condition', label: 'Condition', options: importFieldValues.condition },
    { key: 'department', label: 'Department', options: importFieldValues.department },
  ];

  const importExampleRow = { name: 'Central AHU System (CH-03)', type: 'HVAC', location: CENTERS[5], status: 'Operational', manufacturer: 'Carrier', model: '30XA-120', serialNumber: 'CAR-2019-08432', installYear: 2019, condition: 'Good', department: 'SSD' };

  const importCriticalFields = ['serialNumber'];

  const handleImport = ({ confirmed, duplicates, action, criticalFields }) => {
    const keyOf = (r) => (criticalFields || importCriticalFields).map((k) => String(r[k] || '').trim().toLowerCase()).join('|');
    const buildRecord = (r) => ({
      name: r.name,
      type: r.type,
      location: r.location,
      status: r.status,
      manufacturer: r.manufacturer || '',
      model: r.model || '',
      serialNumber: r.serialNumber || '',
      installYear: r.installYear ? Number(r.installYear) : 2024,
      condition: r.condition || 'Good',
      department: r.department || 'SSD',
      warrantyExpiry: '', expectedLifespan: 20, lastService: '', nextService: '', serviceHistory: [],
    });
    setAssets((prev) => {
      const next = [...prev];
      const toAdd = confirmed.map((r) => buildRecord(r));
      duplicates.forEach((r) => {
        const key = keyOf(r);
        if (!key) return;
        const idx = next.findIndex((a) => keyOf(a) === key);
        if (action === 'create') {
          toAdd.push(buildRecord(r));
        } else if (action === 'overwrite' && idx !== -1) {
          next[idx] = { ...next[idx], ...buildRecord(r) };
        }
      });
      let counter = next.reduce((acc, a) => { const m = parseInt((a.id || '').slice(4), 10); return Number.isNaN(m) ? acc : Math.max(acc, m); }, 0);
      return [...toAdd.map((r) => ({ ...r, id: `AST-${String(++counter).padStart(3, '0')}` })), ...next];
    });
    setShowImport(false);
  };

  const handleDelete = (id) => {
    onRemoveAsset(id);
    setConfirmDelete(null);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('assets.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{assets.length} {t('assets.count')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowImport(true)} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={15} /> {t('assets.import')}
          </button>
          <button onClick={onCreateAsset} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> {t('assets.add')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <SummaryCard icon={<Boxes size={16} color="var(--info)" />} value={assets.length} label={t('assets.summ.total')} bg="var(--info-bg)" />
        <SummaryCard icon={<CircleCheck size={16} color="var(--success)" />} value={operationalCount} label={t('assets.summ.operational')} bg="var(--success-bg)" />
        <SummaryCard icon={<HardHat size={16} color="#B45309" />} value={maintenanceCount} label={t('assets.summ.maintenance')} bg="#FEF3C7" />
        <SummaryCard icon={<ClipboardCheck size={16} color="#DC2626" />} value={inspectionCount} label={t('assets.summ.inspection')} bg="#FEE2E2" />
      </div>

      <FilterBar>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder={t('assets.searchPlaceholder')} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none' }} />
        </div>
        <FilterDropdown label="Type" options={ALL_TYPES} selected={typeFilter} onSelect={(v) => { setPage(1); setTypeFilter(v); }} />
        <FilterDropdown label="Status" options={ALL_STATUSES} selected={statusFilter} onSelect={(v) => { setPage(1); setStatusFilter(v); }} />
        <button onClick={exportCSV} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
          <Download size={13} /> {t('assets.export')}
        </button>
      </FilterBar>

      {(hasTypeFilter || hasStatusFilter || search) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {hasTypeFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--info-bg)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>
              Type: {typeFilter}
              <button onClick={() => setTypeFilter('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
            </span>
          )}
          {hasStatusFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--info-bg)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
            </span>
          )}
          {search && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--info-bg)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>
              {t('assets.searchLabel')}: "{search}"
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
            </span>
          )}
          <button onClick={clearAll} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>{t('assets.clearAll')}</button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {[t('assets.col.id'), t('assets.col.name'), t('assets.col.type'), t('assets.col.location'), t('assets.col.status'), t('assets.col.condition'), t('assets.col.lastService'), t('assets.col.nextService'), ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedAssets.map((asset) => {
              const sc = statusColor(asset.status);
              const cc = conditionColor(asset.condition);
              return (
                <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onViewAsset(asset.id)} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)', fontFamily: 'monospace' }}>{asset.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{asset.name}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{asset.type}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.location}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: sc.bg, color: sc.color }}>{asset.status}</span></td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: cc.bg, color: cc.color }}>{asset.condition || 'N/A'}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{asset.lastService}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{asset.nextService}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onEditAsset(asset.id)} title={t('assets.actions.edit')} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={13} color="#64748B" /></button>
                      <button onClick={() => setConfirmDelete(asset)} title={t('assets.actions.delete')} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FECACA', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} color="#DC2626" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
            <div style={{ fontSize: 16, marginBottom: 8, color: '#CBD5E1' }}>{t('assets.noResults')}</div>
            <div>{t('assets.tryAdjusting')}</div>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <Pagination total={filtered.length} page={safePage} perPage={perPage} onPageChange={setPage} onPerPageChange={(v) => { setPerPage(v); setPage(1); }} />
      )}

      {showImport && (
        <ImportModal
          entityLabel="Asset"
          fields={importFields}
          criticalFields={importCriticalFields}
          exampleRow={importExampleRow}
          existingRecords={assets}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>{t('assets.delete.title')}</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>{t('assets.delete.confirm')} <strong>{confirmDelete.name}</strong>? {t('assets.delete.undo')}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>{t('assets.cancel')}</button>
              <button onClick={() => handleDelete(confirmDelete.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>{t('assets.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, value, label, bg }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
