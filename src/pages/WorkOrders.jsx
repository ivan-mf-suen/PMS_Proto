import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Plus, Search, Eye, Pencil, Trash2, X, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Info, CheckCircle, Calendar, User, MapPin } from 'lucide-react';

const ALL_STATUSES = ['Draft', 'Pending SSD Service Manager Endorsement', 'Pending SSD G&C Review', 'Pending SSD AS Endorsement', 'Under PWD Grouping', 'Pending OIC Review', 'Pending PWD Proceed IAS', 'Submitted to IAS for Tendering', 'Approved IAS', 'In Progress', 'Completed'];

const BUILDERS_WORKS = [
  'Concrete Repair',
  'Waterproofing/Re-roofing Works',
  'Painting',
  'Tile Replacement',
  'Vinyl Flooring Replacement',
  'Timber Door/Cabinet Replacement',
  'Timber Furring/Dado Replacement',
  'Window Replacement',
  'Replacement of False Ceiling',
  'Replacement of Sanitary Fitments',
];

const BUILDING_SERVICES = [
  'Air-conditioning/Ventilation System Addition/Replacement',
  'Lighting/Electrical System Addition/Replacement',
  'PD System Addition/Replacement',
  'ELV System (Call Bell, PA, etc.) Addition/Replacement',
  'Gas System Addition/Replacement',
];

const ALL_CATEGORIES = ['All', ...BUILDERS_WORKS, ...BUILDING_SERVICES];

const WO_TYPE_KEY_MAP = {
  'Concrete Repair': 'wo.type.concreteRepair',
  'Waterproofing/Re-roofing Works': 'wo.type.waterproofing',
  'Painting': 'wo.type.painting',
  'Tile Replacement': 'wo.type.tileReplacement',
  'Vinyl Flooring Replacement': 'wo.type.vinylFlooring',
  'Timber Door/Cabinet Replacement': 'wo.type.timberDoorCabinet',
  'Timber Furring/Dado Replacement': 'wo.type.timberFurring',
  'Window Replacement': 'wo.type.windowReplacement',
  'Replacement of False Ceiling': 'wo.type.falseCeiling',
  'Replacement of Sanitary Fitments': 'wo.type.sanitaryFitments',
  'Air-conditioning/Ventilation System Addition/Replacement': 'wo.type.airconVentilation',
  'Lighting/Electrical System Addition/Replacement': 'wo.type.lightingElectrical',
  'PD System Addition/Replacement': 'wo.type.pdSystem',
  'ELV System (Call Bell, PA, etc.) Addition/Replacement': 'wo.type.elvSystem',
  'Gas System Addition/Replacement': 'wo.type.gasSystem',
};

const ALL_PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

const STATUS_STYLES = {
  'Draft': { background: '#F1F5F9', color: '#64748B', activeBg: '#64748B', activeColor: '#fff' },
  'Pending SSD Service Manager Endorsement': { background: '#FFF7ED', color: '#B45309', activeBg: '#B45309', activeColor: '#fff' },
  'Pending SSD G&C Review': { background: '#FFF7ED', color: '#C2410C', activeBg: '#C2410C', activeColor: '#fff' },
  'Pending SSD AS Endorsement': { background: '#FFF7ED', color: '#92400E', activeBg: '#92400E', activeColor: '#fff' },
  'Under PWD Grouping': { background: '#EFF6FF', color: '#2563EB', activeBg: '#2563EB', activeColor: '#fff' },
  'Pending OIC Review': { background: '#FFF7ED', color: '#C2410C', activeBg: '#C2410C', activeColor: '#fff' },
  'Pending PWD Proceed IAS': { background: '#FFFBEB', color: '#D97706', activeBg: '#D97706', activeColor: '#fff' },
  'Submitted to IAS for Tendering': { background: '#F5F3FF', color: '#7C3AED', activeBg: '#7C3AED', activeColor: '#fff' },
  'Approved IAS': { background: '#F0FDF4', color: '#059669', activeBg: '#059669', activeColor: '#fff' },
  'In Progress': { background: '#ECFDF5', color: '#059669', activeBg: '#059669', activeColor: '#fff' },
  'Completed': { background: '#F0FDF4', color: '#16A34A', activeBg: '#16A34A', activeColor: '#fff' },
};

function statusStyle(status) {
  const s = STATUS_STYLES[status];
  return s ? { background: s.background, color: s.color } : { background: '#F1F5F9', color: '#64748B' };
}

const DROPDOWN_STYLE = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
  background: '#fff', border: '1px solid var(--border)',
  borderRadius: 8, boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
  zIndex: 100, overflow: 'hidden', maxHeight: 260, overflowY: 'auto',
};

function FilterDropdown({ label, options, selected, onSelect, counts, groups, t, typeKeyMap }) {
  const [open, setOpen] = useState(false);
  const isAll = selected === 'All' || selected === undefined;
  const displayLabel = (opt) => {
    if (opt === 'All') return 'All';
    if (t && typeKeyMap && typeKeyMap[opt]) return t(typeKeyMap[opt]);
    return opt;
  };
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '7px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          border: `1px solid ${isAll ? 'var(--border)' : 'var(--primary)'}`,
          background: isAll ? '#fff' : 'var(--info-bg)',
          color: isAll ? '#64748B' : 'var(--primary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {label}: {displayLabel(selected)}
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div style={DROPDOWN_STYLE}>
            {groups ? (
              <>
                <button
                  onClick={() => { onSelect('All'); setOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px',
                    background: isAll ? 'var(--info-bg)' : 'transparent',
                    border: 'none', cursor: 'pointer', fontSize: 12,
                    color: 'var(--foreground)', fontWeight: isAll ? 600 : 400,
                  }}
                >All</button>
                {groups.map(({ label: groupLabel, items }) => (
                  <div key={groupLabel}>
                    <div style={{ padding: '6px 12px 2px', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{groupLabel}</div>
                    {items.map((opt) => {
                      const isActive = opt === selected;
                      const count = counts?.[opt];
                      return (
                        <button
                          key={opt}
                          onClick={() => { onSelect(opt); setOpen(false); }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '7px 12px',
                            background: isActive ? 'var(--info-bg)' : 'transparent',
                            border: 'none', cursor: 'pointer', fontSize: 12,
                            color: 'var(--foreground)', fontWeight: isActive ? 600 : 400,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}
                        >
                          <span>{displayLabel(opt)}</span>
                          {count !== undefined && <span style={{ fontSize: 11, color: '#94A3B8' }}>({count})</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            ) : (
              options.map((opt) => {
                const isActive = opt === selected || (opt === 'All' && isAll);
                const count = counts?.[opt];
                return (
                  <button
                    key={opt}
                    onClick={() => { onSelect(opt); setOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px',
                      background: isActive ? 'var(--info-bg)' : 'transparent',
                      border: 'none', cursor: 'pointer', fontSize: 12,
                      color: 'var(--foreground)', fontWeight: isActive ? 600 : 400,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span>{displayLabel(opt)}</span>
                    {count !== undefined && <span style={{ fontSize: 11, color: '#94A3B8' }}>({count})</span>}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function WorkOrders({ selectedCenter }) {
  const { permissions } = useAuth();
  const { workOrders, deleteWorkOrder } = useWorkOrders();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [previewWO, setPreviewWO] = useState(null);

  const baseWorkOrders = selectedCenter && selectedCenter !== 'All'
    ? workOrders.filter((w) => w.center === selectedCenter)
    : workOrders;

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} color="#CBD5E1" />;
    return sortDir === 'asc' ? <ArrowUp size={12} color="var(--primary)" /> : <ArrowDown size={12} color="var(--primary)" />;
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    ALL_STATUSES.forEach((s) => { counts[s] = baseWorkOrders.filter((w) => w.status === s).length; });
    return counts;
  }, [baseWorkOrders]);

  const categoryCounts = useMemo(() => {
    const counts = { All: baseWorkOrders.length };
    ALL_CATEGORIES.slice(1).forEach((c) => { counts[c] = baseWorkOrders.filter((w) => w.category === c).length; });
    return counts;
  }, [baseWorkOrders]);

  const priorityCounts = useMemo(() => {
    const counts = { All: baseWorkOrders.length };
    ALL_PRIORITIES.slice(1).forEach((p) => { counts[p] = baseWorkOrders.filter((w) => w.priority === p).length; });
    return counts;
  }, [baseWorkOrders]);

  const filtered = useMemo(() => {
    let result = baseWorkOrders.filter((wo) => {
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(wo.status)) return false;
      if (categoryFilter !== 'All' && wo.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && wo.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!wo.id.toLowerCase().includes(q) && !wo.title.toLowerCase().includes(q) && !wo.assignee.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let aVal = a[sortCol];
      let bVal = b[sortCol];
      if (sortCol === 'budget') { aVal = Number(aVal); bVal = Number(bVal); }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [baseWorkOrders, search, selectedStatuses, categoryFilter, priorityFilter, sortCol, sortDir]);

  const activeFilters = [];
  selectedStatuses.forEach((s) => activeFilters.push({ key: `status-${s}`, label: s, clear: () => toggleStatus(s) }));
  if (categoryFilter !== 'All') activeFilters.push({ key: 'category', label: `Category: ${t(WO_TYPE_KEY_MAP[categoryFilter] || categoryFilter)}`, clear: () => setCategoryFilter('All') });
  if (priorityFilter !== 'All') activeFilters.push({ key: 'priority', label: `Priority: ${priorityFilter}`, clear: () => setPriorityFilter('All') });
  if (search) activeFilters.push({ key: 'search', label: `Search: "${search}"`, clear: () => setSearch('') });

  const clearAll = () => { setSelectedStatuses([]); setCategoryFilter('All'); setPriorityFilter('All'); setSearch(''); };

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('workOrders.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {filtered.length} {t('workOrders.results')}
          </p>
        </div>
        {permissions?.canCreateWO && (
          <button onClick={() => navigate('/work-orders/new')} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 3px rgba(37,99,235,0.3)' }}>
            <Plus size={16} /> {t('workOrders.create')}
          </button>
        )}
      </div>

      {/* Status Timeline Filter */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)', padding: '16px 20px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Status
          </div>
          {selectedStatuses.length > 0 && (
            <button
              onClick={() => setSelectedStatuses([])}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid var(--border)', background: '#fff',
                color: '#64748B', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 'min-content', position: 'relative' }}>
            {ALL_STATUSES.map((status, idx) => {
              const isSelected = selectedStatuses.includes(status);
              const sStyle = STATUS_STYLES[status] || STATUS_STYLES['Draft'];
              const count = statusCounts[status] || 0;
              const shortLabels = {
                'Draft': 'Draft',
                'Pending SSD Service Manager Endorsement': 'SM Review',
                'Pending SSD G&C Review': 'G&C Review',
                'Pending SSD AS Endorsement': 'AS Endorse',
                'Under PWD Grouping': 'PWD Group',
                'Pending OIC Review': 'OIC Review',
                'Pending PWD Proceed IAS': 'PWD→IAS',
                'Submitted to IAS for Tendering': 'IAS Tender',
                'Approved IAS': 'IAS Approved',
                'In Progress': 'In Progress',
                'Completed': 'Completed',
              };
              return (
                <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, minWidth: 72 }}>
                  {/* Connector line */}
                  {idx < ALL_STATUSES.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 14, left: '50%', right: '-50%', height: 2,
                      background: isSelected ? sStyle.activeBg : '#E2E8F0',
                      zIndex: 0,
                    }} />
                  )}
                  {/* Count badge */}
                  <div title={`${count} work order${count !== 1 ? 's' : ''} — ${status}`} style={{
                    fontSize: 11, fontWeight: count > 0 ? 700 : 500,
                    color: count > 0 ? (isSelected ? sStyle.activeBg : '#475569') : '#CBD5E1',
                    marginBottom: 8, minWidth: 20, textAlign: 'center',
                    padding: '2px 7px', borderRadius: 8,
                    background: count > 0 ? (isSelected ? `${sStyle.activeBg}15` : '#F1F5F9') : '#F8FAFC',
                    border: `1px solid ${count > 0 ? (isSelected ? `${sStyle.activeBg}30` : '#E2E8F0') : '#F1F5F9'}`,
                    lineHeight: 1.3,
                  }}>
                    {count}
                  </div>
                  {/* Node circle */}
                  <button
                    onClick={() => toggleStatus(status)}
                    title={status}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      border: `2.5px solid ${isSelected ? sStyle.activeBg : '#CBD5E1'}`,
                      background: isSelected ? sStyle.activeBg : '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', zIndex: 1, transition: 'all 0.15s',
                      boxShadow: isSelected ? `0 0 0 3px ${sStyle.activeBg}22` : 'none',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  {/* Label */}
                  <div style={{
                    marginTop: 8, fontSize: 10, fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? sStyle.activeBg : '#94A3B8',
                    textAlign: 'center', lineHeight: 1.3, maxWidth: 72,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {shortLabels[status]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search + Category/Priority Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('workOrders.searchPlaceholder')}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }}
          />
        </div>
        <FilterDropdown
          label="Category"
          options={ALL_CATEGORIES}
          selected={categoryFilter}
          onSelect={setCategoryFilter}
          counts={categoryCounts}
          groups={[
            { label: t('wo.group.buildersWorks'), items: BUILDERS_WORKS },
            { label: t('wo.group.buildingServices'), items: BUILDING_SERVICES },
          ]}
          t={t}
          typeKeyMap={WO_TYPE_KEY_MAP}
        />
        <FilterDropdown label="Priority" options={ALL_PRIORITIES} selected={priorityFilter} onSelect={setPriorityFilter} counts={priorityCounts} />
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {activeFilters.map((f) => (
            <span key={f.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: 'var(--info-bg)', color: 'var(--primary)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}>
              {f.label}
              <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--primary)' }}>
                <X size={12} />
              </button>
            </span>
          ))}
          <button onClick={clearAll} style={{ fontSize: 12, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'id', label: t('workOrders.col.id'), width: 100 },
                  { key: 'title', label: t('workOrders.col.title'), width: undefined },
                  { key: 'center', label: 'Center', width: 160 },
                  { key: 'priority', label: t('workOrders.col.priority'), width: 100 },
                  { key: 'status', label: t('workOrders.col.status'), width: 200 },
                  { key: 'pwdInvolvement', label: t('workOrders.col.pwd'), width: 80 },
                  { key: 'assignee', label: t('workOrders.col.assignee'), width: 140 },
                  { key: 'dueDate', label: t('workOrders.col.due'), width: 110 },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B',
                      textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em',
                      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                      width: col.width,
                      background: sortCol === col.key ? '#F1F5F9' : undefined,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label} <SortIcon col={col.key} />
                    </span>
                  </th>
                ))}
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('workOrders.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#334155' }}>{wo.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{wo.title}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.center}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: wo.priority === 'Critical' ? 'var(--critical-bg)' : wo.priority === 'High' ? 'var(--warning-bg)' : wo.priority === 'Medium' ? 'var(--info-bg)' : '#F1F5F9', color: wo.priority === 'Critical' ? 'var(--critical)' : wo.priority === 'High' ? '#B45309' : wo.priority === 'Medium' ? 'var(--info)' : '#64748B' }}>{wo.priority}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, ...statusStyle(wo.status) }}>{wo.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                      background: wo.pwdInvolvement === 'with' ? '#FEF3C7' : '#F1F5F9',
                      color: wo.pwdInvolvement === 'with' ? '#B45309' : '#94A3B8',
                    }}>
                      {wo.pwdInvolvement === 'with' ? t('common.yes') : t('common.no')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--foreground)' }}>{wo.assignee}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{wo.dueDate}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setPreviewWO(wo)} title="Preview Work Order" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} color="#64748B" /></button>
                      <button onClick={() => navigate(`/work-orders/${wo.id}`)} title="Edit Work Order" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} color="#64748B" /></button>
                      <button onClick={() => { if (window.confirm(`Delete work order ${wo.id}? This action cannot be undone.`)) { deleteWorkOrder(wo.id); } }} title="Delete Work Order" style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} color="#DC2626" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
            <div style={{ fontSize: 16, marginBottom: 8, color: '#CBD5E1' }}>{t('workOrders.noResults')}</div>
            <div>{t('workOrders.tryAdjusting')}</div>
            {activeFilters.length > 0 && (
              <button onClick={clearAll} style={{ marginTop: 12, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>
                {t('workOrders.clearAll')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewWO && (
        <div onClick={() => setPreviewWO(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{previewWO.id}</span>
                {(() => {
                  const s = STATUS_STYLES[previewWO.status] || STATUS_STYLES['Draft'];
                  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: s.bg, color: s.color }}>{previewWO.status}</span>;
                })()}
              </div>
              <button onClick={() => setPreviewWO(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#64748B" />
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>{previewWO.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                <FieldRow icon={<MapPin size={13} />} label={t('workOrders.previewCenter')} value={previewWO.center} />
                <FieldRow icon={<Info size={13} />} label={t('workOrders.previewCategory')} value={previewWO.category} />
                <FieldRow icon={<Info size={13} />} label={t('workOrders.previewPriority')} value={
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: previewWO.priority === 'Critical' ? '#FEE2E2' : previewWO.priority === 'High' ? '#FEF3C7' : previewWO.priority === 'Medium' ? '#DBEAFE' : '#F1F5F9', color: previewWO.priority === 'Critical' ? '#DC2626' : previewWO.priority === 'High' ? '#B45309' : previewWO.priority === 'Medium' ? '#2563EB' : '#64748B' }}>{previewWO.priority}</span>
                } />
                <FieldRow icon={<CheckCircle size={13} />} label={t('workOrders.previewPwd')} value={previewWO.pwdInvolvement === 'with' ? t('common.yes') : t('common.no')} />
                <FieldRow icon={<User size={13} />} label={t('workOrders.previewAssignee')} value={previewWO.assignee} />
                <FieldRow icon={<Calendar size={13} />} label={t('workOrders.previewDue')} value={previewWO.dueDate} />
              </div>
              {previewWO.description && (
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{t('workOrders.previewDescription')}</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{previewWO.description}</div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setPreviewWO(null); navigate(`/work-orders/${previewWO.id}`); }} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={13} /> {t('workOrders.previewEdit')}
              </button>
              <button onClick={() => setPreviewWO(null)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#0F172A', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                {t('workOrders.previewClose')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ icon, label, value }) {
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
