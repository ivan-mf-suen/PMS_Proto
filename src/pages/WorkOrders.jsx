import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { WORK_ORDERS } from '../data/constants';
import { Plus, Search, SlidersHorizontal, Eye, Pencil, Trash2, Paperclip, X } from 'lucide-react';

const TABS = ['All', 'Draft', 'Pending OIC Submission', 'Pending Manager Endorsement', 'Pending SSD Endorsement', 'Pending Approval', 'Under PWD Assessment', 'Approved', 'Submitted to IAS for Tendering', 'In Progress', 'Completed'];
const CATEGORIES = ['All', 'MEP', 'Building', 'Facilities', 'Security'];

const STATUS_STYLES = {
  'Draft': { background: '#F1F5F9', color: '#64748B' },
  'Pending OIC Submission': { background: '#FFF7ED', color: '#C2410C' },
  'Pending Manager Endorsement': { background: '#FFF7ED', color: '#B45309' },
  'Pending SSD Endorsement': { background: '#FFF7ED', color: '#92400E' },
  'Pending Approval': { background: 'var(--warning-bg)', color: '#B45309' },
  'Under PWD Assessment': { background: 'var(--info-bg)', color: 'var(--info)' },
  'Approved': { background: 'var(--success-bg)', color: 'var(--success)' },
  'Submitted to IAS for Tendering': { background: '#F5F3FF', color: '#7C3AED' },
  'In Progress': { background: '#ECFDF5', color: '#059669' },
  'Completed': { background: 'var(--success-bg)', color: 'var(--success)' },
};

function statusStyle(status) {
  return STATUS_STYLES[status] || { background: '#F1F5F9', color: '#64748B' };
}

function WorkOrderModal({ wo, onClose }) {
  if (!wo) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 600, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>{wo.id}</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{wo.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#64748B" />
          </button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Priority</div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: wo.priority === 'Critical' ? 'var(--critical-bg)' : wo.priority === 'High' ? 'var(--warning-bg)' : 'var(--info-bg)', color: wo.priority === 'Critical' ? 'var(--critical)' : wo.priority === 'High' ? '#B45309' : 'var(--info)' }}>{wo.priority}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10, ...statusStyle(wo.status) }}>{wo.status}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Center</div>
              <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{wo.center}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Category</div>
              <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{wo.category}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Budget</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>${wo.budget.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Due Date</div>
              <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{wo.dueDate}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Assignee</div>
              <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{wo.assignee}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Created</div>
              <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{wo.created}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
            <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6 }}>{wo.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Paperclip size={14} /> Attachments</button>
            <button style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Pencil size={14} /> Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrders({ onCreateWorkOrder }) {
  const { permissions } = useAuth();
  const [activeTab, setActiveTab] = useState(permissions?.defaultTab || 'All');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedWO, setSelectedWO] = useState(null);

  const tabs = TABS;

  const filtered = WORK_ORDERS.filter((wo) => {
    if (activeTab !== 'All' && wo.status !== activeTab) return false;
    if (category !== 'All' && wo.category !== category) return false;
    if (search && !wo.title.toLowerCase().includes(search.toLowerCase()) && !wo.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Work Orders</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{filtered.length} orders found</p>
        </div>
        {permissions?.canCreateWO && (
          <button onClick={onCreateWorkOrder} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 3px rgba(37,99,235,0.3)' }}>
            <Plus size={16} /> New Work Order
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work orders..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: category === c ? 'var(--primary)' : '#fff', color: category === c ? '#fff' : '#64748B', cursor: 'pointer' }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 16, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? 'var(--primary)' : '#64748B', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2, cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {tab} <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>({tab === 'All' ? WORK_ORDERS.length : WORK_ORDERS.filter((w) => w.status === tab).length})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['ID', 'Title', 'Center', 'Priority', 'Status', 'Assignee', 'Due', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((wo) => (
              <tr key={wo.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedWO(wo)} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)' }}>{wo.id}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{wo.title}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.center}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: wo.priority === 'Critical' ? 'var(--critical-bg)' : wo.priority === 'High' ? 'var(--warning-bg)' : wo.priority === 'Medium' ? 'var(--info-bg)' : '#F1F5F9', color: wo.priority === 'Critical' ? 'var(--critical)' : wo.priority === 'High' ? '#B45309' : wo.priority === 'Medium' ? 'var(--info)' : '#64748B' }}>{wo.priority}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, ...statusStyle(wo.status) }}>{wo.status}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--foreground)' }}>{wo.assignee}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{wo.dueDate}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} color="#64748B" /></button>
                    <button style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} color="#64748B" /></button>
                    <button style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} color="#DC2626" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No work orders found matching your filters.</div>
        )}
      </div>

      <WorkOrderModal wo={selectedWO} onClose={() => setSelectedWO(null)} />
    </div>
  );
}
