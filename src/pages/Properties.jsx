import { useState } from 'react';
import { PROPERTIES } from '../data/constants';
import { Plus, Search, MapPin, Building2, Users, TrendingUp } from 'lucide-react';

export default function Properties() {
  const [search, setSearch] = useState('');

  const filtered = PROPERTIES.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Properties</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{PROPERTIES.length} properties managed</p>
        </div>
        <button style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Property
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search properties..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map((prop) => (
          <div key={prop.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.1)')} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--card-shadow)')}>
            <div style={{ height: 8, background: 'linear-gradient(90deg, var(--info), var(--primary))' }} />
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="var(--info)" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{prop.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{prop.type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <MapPin size={13} color="#94A3B8" />
                <span style={{ fontSize: 12, color: '#64748B' }}>{prop.address}</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, padding: 10, background: '#F8FAFC', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>{prop.units}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Units</div>
                </div>
                <div style={{ flex: 1, padding: 10, background: '#F8FAFC', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: prop.occupancy >= 95 ? 'var(--success)' : 'var(--info)' }}>{prop.occupancy}%</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Occupancy</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
