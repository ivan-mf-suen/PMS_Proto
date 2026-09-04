import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Wrench, History, PenSquare, PlusCircle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useAssets } from '../context/AssetsContext';

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

export default function AssetDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { assets, getPlotForAsset } = useAssets();
  const asset = assets.find((a) => a.id === id);
  const plot = asset ? getPlotForAsset(asset.id) : null;

  if (!asset) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate('/assets')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
          <ArrowLeft size={16} /> {t('assetDetail.back')}
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>{t('assetDetail.notFound')}</div>
      </div>
    );
  }

  const sc = statusColor(asset.status);
  const cc = conditionColor(asset.condition);

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <button onClick={() => navigate('/assets')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
        <ArrowLeft size={16} /> {t('assetDetail.back')}
      </button>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: 6, background: 'linear-gradient(90deg, var(--info), var(--primary))' }} />
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={24} color="var(--info)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{asset.room} — {asset.category}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569', fontFamily: 'monospace' }}>{asset.id}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#F1F5F9', color: '#475569' }}>{asset.propertyCode} · {asset.propertyName}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: sc.bg, color: sc.color }}>{asset.status}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: cc.bg, color: cc.color }}>{asset.condition}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#64748B', fontSize: 13 }}>
              <MapPin size={14} /> {t('assets.floorLabel')} {asset.floor} &middot; {asset.room}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(`/floor-plan?floor=${asset.floor}&asset=${asset.id}`)}
                style={{ flex: 1, minWidth: 140, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--info)', background: 'var(--info-bg)', color: 'var(--info)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <MapPin size={15} /> {t('assetDetail.viewOnMap')}
              </button>
              <button
                onClick={() => navigate(`/work-orders/new?property=${asset.propertyCode}&asset=${asset.id}`)}
                style={{ flex: 1, minWidth: 140, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <PlusCircle size={15} /> {t('assetDetail.createWO')}
              </button>
              <button
                onClick={() => navigate(`/assets/${asset.id}/edit`)}
                style={{ flex: 1, minWidth: 140, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <PenSquare size={15} /> {t('assetDetail.edit')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('assetDetail.assetInfo')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DetailField label={t('assetDetail.property')} value={`${asset.propertyCode} · ${asset.propertyName}`} />
            <DetailField label={t('assets.floorLabel')} value={asset.floor} />
            <DetailField label={t('assetDetail.room')} value={asset.room} />
            <DetailField label={t('assetDetail.category')} value={asset.category} />
            <DetailField label={t('assetDetail.equipment')} value={asset.equipment} />
            <DetailField label={t('assetDetail.installYear')} value={asset.installYear} />
            <DetailField label={t('assetDetail.renovation')} value={asset.renovation || 'N/A'} />
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>{t('assetDetail.maintenance')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DetailField label={t('assetDetail.status')} value={asset.status} />
            <DetailField label={t('assetDetail.lastService')} value={asset.lastService || 'N/A'} />
            <DetailField label={t('assetDetail.nextService')} value={asset.nextService || 'N/A'} />
            <DetailField label={t('assetDetail.condition')} value={asset.condition || 'N/A'} />
            <DetailField label={t('assetDetail.floorPlanPlot')} value={plot ? `${plot.floor} (${plot.x.toFixed(1)}%, ${plot.y.toFixed(1)}%)` : t('assetDetail.notPlotted')} />
          </div>
        </div>
      </div>

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

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#334155', marginTop: 4 }}>{value}</div>
    </div>
  );
}
