import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets } from '../context/AssetsContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  Plus, Search, Pencil, Trash2, ChevronDown, Download, Boxes,
  CircleCheck, HardHat, X, MapPin, Building2,
} from 'lucide-react';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import { FLOORS, EQUIPMENT_CATEGORIES } from '../data/tc01Assets';

const ALL_FLOORS = ['All', ...FLOORS.map((f) => f.key)];
const ALL_CATEGORIES = ['All', ...EQUIPMENT_CATEGORIES];
const ALL_STATUSES = ['All', 'Operational', 'Under Maintenance', 'Needs Inspection'];

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

export default function Assets() {
  const { assets, property, removeAsset } = useAssets();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (floorFilter !== 'All' && a.floor !== floorFilter) return false;
      if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.room.toLowerCase().includes(q) || a.equipment.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assets, search, floorFilter, categoryFilter, statusFilter]);

  const operationalCount = assets.filter((a) => a.status === 'Operational').length;
  const maintenanceCount = assets.filter((a) => a.status === 'Under Maintenance').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedAssets = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const csvEscape = (v) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };
  const exportCSV = () => {
    const headers = ['ID', 'Property', 'Floor', 'Room', 'Category', 'Equipment', 'Qty', 'Install Year', 'Status', 'Renovation'];
    const rows = filtered.map((a) => [a.id, a.propertyName, a.floor, a.room, a.category, a.equipment, a.qty, a.installYear, a.status, a.renovation || '']);
    const csv = [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tc01_assets.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const hasFloor = floorFilter !== 'All';
  const hasCategory = categoryFilter !== 'All';
  const hasStatus = statusFilter !== 'All';
  const clearAll = () => { setFloorFilter('All'); setCategoryFilter('All'); setStatusFilter('All'); setSearch(''); };

  const statusColor = (status) => {
    if (status === 'Operational') return { bg: 'var(--success-bg)', color: 'var(--success)' };
    if (status === 'Under Maintenance') return { bg: 'var(--warning-bg)', color: '#B45309' };
    return { bg: 'var(--critical-bg)', color: 'var(--critical)' };
  };

  const handleDelete = (id) => {
    removeAsset(id);
    setConfirmDelete(null);
  };

  const countByFloor = (floor) => assets.filter((a) => a.floor === floor).length;

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color="var(--info)" /> {t('assets.title')}
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            <strong>{property.unitCode}</strong> &middot; {property.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/floor-plan')} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={15} /> {t('assets.viewMap')}
          </button>
          <button onClick={exportCSV} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={15} /> {t('assets.export')}
          </button>
          <button onClick={() => navigate('/assets/new')} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> {t('assets.add')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {FLOORS.map((f) => (
          <div key={f.key} style={{ flex: 1, minWidth: 120, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{t('assets.floorLabel')} {f.key}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', marginTop: 2 }}>{countByFloor(f.key)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <SummaryCard icon={<Boxes size={16} color="var(--info)" />} value={assets.length} label={t('assets.summ.total')} bg="var(--info-bg)" />
        <SummaryCard icon={<CircleCheck size={16} color="var(--success)" />} value={operationalCount} label={t('assets.summ.operational')} bg="var(--success-bg)" />
        <SummaryCard icon={<HardHat size={16} color="#B45309" />} value={maintenanceCount} label={t('assets.summ.maintenance')} bg="#FEF3C7" />
      </div>

      <FilterBar>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder={t('assets.searchPlaceholder')} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none' }} />
        </div>
        <FilterDropdown label="Floor" options={ALL_FLOORS} selected={floorFilter} onSelect={(v) => { setPage(1); setFloorFilter(v); }} />
        <FilterDropdown label="Category" options={ALL_CATEGORIES} selected={categoryFilter} onSelect={(v) => { setPage(1); setCategoryFilter(v); }} />
        <FilterDropdown label="Status" options={ALL_STATUSES} selected={statusFilter} onSelect={(v) => { setPage(1); setStatusFilter(v); }} />
      </FilterBar>

      {(hasFloor || hasCategory || hasStatus || search) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {hasFloor && (
            <Chip label={`Floor: ${floorFilter}`} onClear={() => setFloorFilter('All')} />
          )}
          {hasCategory && (
            <Chip label={`Category: ${categoryFilter}`} onClear={() => setCategoryFilter('All')} />
          )}
          {hasStatus && (
            <Chip label={`Status: ${statusFilter}`} onClear={() => setStatusFilter('All')} />
          )}
          {search && (
            <Chip label={`${t('assets.searchLabel')}: "${search}"`} onClear={() => setSearch('')} />
          )}
          <button onClick={clearAll} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>{t('assets.clearAll')}</button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {[t('assets.col.id'), t('assets.col.floornroom'), t('assets.col.type'), t('assets.col.qty'), t('assets.col.installYear'), t('assets.col.status'), t('assets.col.renovation'), ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedAssets.map((asset) => {
              const sc = statusColor(asset.status);
              return (
                <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/assets/${asset.id}`)} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)', fontFamily: 'monospace' }}>{asset.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                    <div>{asset.room}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{asset.floor}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{asset.category}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{asset.qty}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{asset.installYear}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: sc.bg, color: sc.color }}>{asset.status}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', maxWidth: 180 }}>{asset.renovation || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/assets/${asset.id}/edit`)} title={t('assets.actions.edit')} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={13} color="#64748B" /></button>
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

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>{t('assets.delete.title')}</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>{t('assets.delete.confirm')} <strong>{confirmDelete.room} / {confirmDelete.category}</strong>? {t('assets.delete.undo')}</div>
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

function Chip({ label, onClear }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--info-bg)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>
      {label}
      <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
    </span>
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
