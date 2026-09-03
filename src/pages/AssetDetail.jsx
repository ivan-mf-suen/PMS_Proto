import { ArrowLeft, MapPin, Wrench, History } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

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

export default function AssetDetail({ assetId, assets = [], onBack }) {
  const { t } = useTranslation();
  const asset = assets.find((a) => a.id === assetId);

  if (!asset) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
          <ArrowLeft size={16} /> {t('assetDetail.back')}
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>{t('assetDetail.notFound')}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
        <ArrowLeft size={16} /> {t('assetDetail.back')}
      </button>

      {/* Asset Header */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: 6, background: 'linear-gradient(90deg, var(--info), var(--primary))' }} />
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={24} color="var(--info)" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{asset.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569', fontFamily: 'monospace' }}>{asset.id}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{asset.type}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: statusColor(asset.status).bg, color: statusColor(asset.status).color }}>{asset.status}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: conditionColor(asset.condition).bg, color: conditionColor(asset.condition).color }}>{asset.condition}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#64748B', fontSize: 13 }}>
              <MapPin size={14} /> {asset.location}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('assetDetail.assetInfo')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DetailField label={t('assetDetail.manufacturer')} value={asset.manufacturer || 'N/A'} />
            <DetailField label={t('assetDetail.model')} value={asset.model || 'N/A'} />
            <DetailField label={t('assetDetail.serial')} value={asset.serialNumber || 'N/A'} mono />
            <DetailField label={t('assetDetail.department')} value={asset.department || 'SSD'} />
            <DetailField label={t('assetDetail.installYear')} value={asset.installYear} />
            <DetailField label={t('assetDetail.lifespan')} value={asset.expectedLifespan ? `${asset.expectedLifespan} years` : 'N/A'} />
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('assetDetail.maintenance')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DetailField label={t('assetDetail.lastService')} value={asset.lastService || 'N/A'} />
            <DetailField label={t('assetDetail.nextService')} value={asset.nextService || 'N/A'} />
            <DetailField label={t('assetDetail.warranty')} value={asset.warrantyExpiry || 'N/A'} />
            <DetailField label={t('assetDetail.condition')} value={asset.condition || 'N/A'} />
          </div>
        </div>
      </div>

      {/* Service History */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color="var(--info)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('assetDetail.serviceHistory')}</span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{t('assetDetail.records', { n: (asset.serviceHistory || []).length })}</span>
        </div>
        {(asset.serviceHistory || []).length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {[t('assetDetail.colDate'), t('assetDetail.colType'), t('assetDetail.colDesc'), t('assetDetail.colContractor')].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {asset.serviceHistory.map((record, idx) => (
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
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>{t('assetDetail.noHistory')}</div>
        )}
      </div>
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
