import { useState } from 'react';
import { ASSETS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { Plus, Search } from 'lucide-react';

export default function Assets() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = ASSETS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.location.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status) => {
    if (status === 'Operational') return { bg: 'var(--success-bg)', color: 'var(--success)' };
    if (status === 'Under Maintenance') return { bg: 'var(--warning-bg)', color: '#B45309' };
    return { bg: 'var(--critical-bg)', color: 'var(--critical)' };
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('assets.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{ASSETS.length} {t('assets.count')}</p>
        </div>
        <button style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> {t('assets.add')}
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('assets.searchPlaceholder')}
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff', outline: 'none' }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {[t('assets.col.id'), t('assets.col.name'), t('assets.col.type'), t('assets.col.location'), t('assets.col.status'), t('assets.col.lastService'), t('assets.col.nextService')].map((h) => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((asset) => {
              const sc = statusColor(asset.status);
              return (
                <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--info)' }}>{asset.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{asset.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{asset.type}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{asset.location}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: sc.bg, color: sc.color }}>{asset.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{asset.lastService}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{asset.nextService}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
