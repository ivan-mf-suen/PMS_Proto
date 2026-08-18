import { useState } from 'react';
import { COMPLIANCE_DOCS } from '../data/constants';
import { Plus, Search, ShieldCheck, AlertTriangle, CheckCircle, FileText, Upload } from 'lucide-react';

export default function ComplianceVault() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = COMPLIANCE_DOCS.filter((d) => {
    if (filter === 'Expiring' && d.status !== 'Expiring') return false;
    if (filter === 'Valid' && d.status !== 'Valid') return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Compliance Vault</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{COMPLIANCE_DOCS.length} documents &middot; {COMPLIANCE_DOCS.filter((d) => d.status === 'Expiring').length} expiring soon</p>
        </div>
        <button style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Upload size={16} /> Upload Document
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20} color="var(--success)" /></div>
          <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>{COMPLIANCE_DOCS.filter((d) => d.status === 'Valid').length}</div><div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Valid</div></div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--critical-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={20} color="var(--critical)" /></div>
          <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--critical)' }}>{COMPLIANCE_DOCS.filter((d) => d.status === 'Expiring').length}</div><div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Expiring Soon</div></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }} />
        </div>
        {['All', 'Valid', 'Expiring'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: filter === f ? 'var(--primary)' : '#fff', color: filter === f ? '#fff' : '#64748B', cursor: 'pointer' }}>{f}</button>
        ))}
      </div>

      {/* Document Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.map((doc) => (
          <div key={doc.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${doc.status === 'Expiring' ? 'var(--critical)' : 'var(--border)'}`, boxShadow: 'var(--card-shadow)', padding: 20, cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.1)')} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--card-shadow)')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: doc.status === 'Expiring' ? 'var(--critical-bg)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color={doc.status === 'Expiring' ? 'var(--critical)' : 'var(--success)'} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: doc.status === 'Expiring' ? 'var(--critical-bg)' : 'var(--success-bg)', color: doc.status === 'Expiring' ? 'var(--critical)' : 'var(--success)' }}>{doc.status}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>{doc.name}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>{doc.type} &middot; {doc.center}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Expires</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: doc.status === 'Expiring' ? 'var(--critical)' : 'var(--foreground)' }}>{doc.expiry}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
