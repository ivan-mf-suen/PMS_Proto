import { useState, useMemo } from 'react';
import { ASSETS, CENTERS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { Plus, Search, Pencil, Trash2, ChevronDown, Wrench, MapPin, History, ArrowLeft } from 'lucide-react';

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

const EMPTY_FORM = { name: '', type: 'HVAC', location: '', status: 'Operational', manufacturer: '', model: '', serialNumber: '', installYear: 2024, warrantyExpiry: '', expectedLifespan: 20, condition: 'Good', department: 'SSD' };

export default function Assets() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assets, setAssets] = useState([...ASSETS]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const handleSave = () => {
    if (editingAsset) {
      setAssets((prev) => prev.map((a) => a.id === editingAsset.id ? { ...a, ...form } : a));
    } else {
      const newId = `AST-${String(assets.length + 1).padStart(3, '0')}`;
      setAssets((prev) => [{ ...form, id: newId, lastService: '', nextService: '', serviceHistory: [] }, ...prev]);
    }
    setShowForm(false);
    setEditingAsset(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setForm({ name: asset.name, type: asset.type, location: asset.location, status: asset.status, manufacturer: asset.manufacturer || '', model: asset.model || '', serialNumber: asset.serialNumber || '', installYear: asset.installYear || 2024, warrantyExpiry: asset.warrantyExpiry || '', expectedLifespan: asset.expectedLifespan || 20, condition: asset.condition || 'Good', department: asset.department || 'SSD' });
    setShowForm(true);
    setSelectedAsset(null);
  };

  const handleDelete = (id) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setConfirmDelete(null);
    setSelectedAsset(null);
  };

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      {selectedAsset ? (
        /* Asset Detail View */
        <div>
          <button onClick={() => setSelectedAsset(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
            <ArrowLeft size={16} /> Back to Assets
          </button>

          {/* Asset Header */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ height: 6, background: 'linear-gradient(90deg, var(--info), var(--primary))' }} />
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Wrench size={24} color="var(--info)" />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{selectedAsset.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569', fontFamily: 'monospace' }}>{selectedAsset.id}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{selectedAsset.type}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: statusColor(selectedAsset.status).bg, color: statusColor(selectedAsset.status).color }}>{selectedAsset.status}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: conditionColor(selectedAsset.condition).bg, color: conditionColor(selectedAsset.condition).color }}>{selectedAsset.condition}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#64748B', fontSize: 13 }}>
                    <MapPin size={14} /> {selectedAsset.location}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleEdit(selectedAsset)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => setConfirmDelete(selectedAsset)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FECACA', background: '#fff', fontSize: 13, fontWeight: 600, color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* Asset Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>Asset Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <DetailField label="Manufacturer" value={selectedAsset.manufacturer || 'N/A'} />
                <DetailField label="Model" value={selectedAsset.model || 'N/A'} />
                <DetailField label="Serial Number" value={selectedAsset.serialNumber || 'N/A'} mono />
                <DetailField label="Department" value={selectedAsset.department || 'SSD'} />
                <DetailField label="Install Year" value={selectedAsset.installYear} />
                <DetailField label="Expected Lifespan" value={selectedAsset.expectedLifespan ? `${selectedAsset.expectedLifespan} years` : 'N/A'} />
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>Maintenance Schedule</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <DetailField label="Last Service" value={selectedAsset.lastService || 'N/A'} />
                <DetailField label="Next Service" value={selectedAsset.nextService || 'N/A'} />
                <DetailField label="Warranty Expiry" value={selectedAsset.warrantyExpiry || 'N/A'} />
                <DetailField label="Condition" value={selectedAsset.condition || 'N/A'} />
              </div>
            </div>
          </div>

          {/* Service History */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} color="var(--info)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Service History</span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>({(selectedAsset.serviceHistory || []).length} records)</span>
            </div>
            {(selectedAsset.serviceHistory || []).length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Type', 'Description', 'Contractor'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedAsset.serviceHistory.map((record, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{record.date}</td>
                      <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: record.type.includes('Corrective') ? '#FEF3C7' : '#F0FDF4', color: record.type.includes('Corrective') ? '#B45309' : 'var(--success)' }}>{record.type}</span></td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748B' }}>{record.description}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748B' }}>{record.contractor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No service history records</div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {confirmDelete && (
            <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>Delete Asset</div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleDelete(confirmDelete.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : showForm ? (
        /* Add/Edit Form */
        <div>
          <button onClick={() => { setShowForm(false); setEditingAsset(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
            <ArrowLeft size={16} /> Back to Assets
          </button>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 24, maxWidth: 700 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 20 }}>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Asset Name *</label>
                <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="e.g., Central AHU System" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Type *</label>
                  <select value={form.type} onChange={(e) => updateForm('type', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff' }}>
                    {ALL_TYPES.filter((t) => t !== 'All').map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Status *</label>
                  <select value={form.status} onChange={(e) => updateForm('status', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff' }}>
                    {ALL_STATUSES.filter((s) => s !== 'All').map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Location *</label>
                <select value={form.location} onChange={(e) => updateForm('location', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="">Select location...</option>
                  <option value="All Sites">All Sites</option>
                  {CENTERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Manufacturer</label>
                  <input value={form.manufacturer} onChange={(e) => updateForm('manufacturer', e.target.value)} placeholder="e.g., Carrier" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Model</label>
                  <input value={form.model} onChange={(e) => updateForm('model', e.target.value)} placeholder="e.g., 30XA-120" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Serial Number</label>
                  <input value={form.serialNumber} onChange={(e) => updateForm('serialNumber', e.target.value)} placeholder="e.g., CAR-2019-08432" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Department</label>
                  <select value={form.department} onChange={(e) => updateForm('department', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="SSD">SSD</option>
                    <option value="PWD">PWD</option>
                    <option value="ITD">ITD</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Install Year</label>
                  <input type="number" value={form.installYear} onChange={(e) => updateForm('installYear', parseInt(e.target.value) || 2024)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Warranty Expiry</label>
                  <input type="date" value={form.warrantyExpiry} onChange={(e) => updateForm('warrantyExpiry', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Condition</label>
                  <select value={form.condition} onChange={(e) => updateForm('condition', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => { setShowForm(false); setEditingAsset(null); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={!form.name || !form.location} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: form.name && form.location ? 'var(--primary)' : '#CBD5E1', fontSize: 13, fontWeight: 600, color: '#fff', cursor: form.name && form.location ? 'pointer' : 'not-allowed' }}>{editingAsset ? 'Save Changes' : 'Add Asset'}</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Asset List View */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('assets.title')}</h1>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{assets.length} {t('assets.count')}</p>
            </div>
            <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingAsset(null); setShowForm(true); }} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> {t('assets.add')}
            </button>
          </div>

          {/* Search + Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('assets.searchPlaceholder')} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }} />
            </div>
            <FilterDropdown label="Type" options={ALL_TYPES} selected={typeFilter} onSelect={setTypeFilter} />
            <FilterDropdown label="Status" options={ALL_STATUSES} selected={statusFilter} onSelect={setStatusFilter} />
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {[t('assets.col.id'), t('assets.col.name'), t('assets.col.type'), t('assets.col.location'), t('assets.col.status'), 'Condition', t('assets.col.lastService'), t('assets.col.nextService'), ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => {
                  const sc = statusColor(asset.status);
                  const cc = conditionColor(asset.condition);
                  return (
                    <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedAsset(asset)} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
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
                          <button onClick={() => handleEdit(asset)} title="Edit" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={13} color="#64748B" /></button>
                          <button onClick={() => setConfirmDelete(asset)} title="Delete" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FECACA', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} color="#DC2626" /></button>
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

          {/* Delete Confirmation Modal */}
          {confirmDelete && (
            <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>Delete Asset</div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleDelete(confirmDelete.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginTop: 4, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
    </div>
  );
}
