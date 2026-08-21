import { useWorkOrders } from '../context/WorkOrderContext';
import { COMPLIANCE_DOCS, COMPLIANCE_CATEGORIES } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import {
  TrendingUp, TrendingDown, ClipboardList, ShieldCheck,
  Clock, AlertTriangle, CheckCircle, ArrowRight, Building2, FileText,
} from 'lucide-react';

function KPICard({ title, value, subtitle, icon: Icon, iconBg, change, trend }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', flex: 1, minWidth: 240 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={iconBg === 'var(--critical-bg)' ? 'var(--critical)' : iconBg === 'var(--success-bg)' ? 'var(--success)' : 'var(--info)'} />
        </div>
        {change !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--critical)' : '#64748B' }}>
            {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
            {trend !== 'stable' && `${change > 0 ? '+' : ''}${change}%`}
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

export default function Dashboard({ selectedCenter }) {
  const { t } = useTranslation();
  const { workOrders } = useWorkOrders();

  const filteredWOs = selectedCenter && selectedCenter !== 'All'
    ? workOrders.filter((w) => w.center === selectedCenter)
    : workOrders;
  const filteredDocs = selectedCenter && selectedCenter !== 'All'
    ? COMPLIANCE_DOCS.filter((d) => d.center === selectedCenter)
    : COMPLIANCE_DOCS;

  const recentWOs = filteredWOs.slice(0, 5);
  const expiringDocs = filteredDocs.filter((d) => d.status === 'Expiring');
  const expiredDocs = filteredDocs.filter((d) => d.status === 'Expired');
  const totalDocs = filteredDocs.length;
  const validDocs = filteredDocs.filter((d) => d.status === 'Valid').length;
  const complianceRate = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 0;

  const categoryStats = COMPLIANCE_CATEGORIES.map((cat) => {
    const catDocs = filteredDocs.filter((d) => d.category === cat);
    const catValid = catDocs.filter((d) => d.status === 'Valid').length;
    return { category: cat, total: catDocs.length, valid: catValid, pct: catDocs.length > 0 ? Math.round((catValid / catDocs.length) * 100) : 0 };
  });

  const centreLabel = selectedCenter && selectedCenter !== 'All' ? selectedCenter : t('dashboard.allCentres');

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard title={t('dashboard.kpi.openWO')} value={filteredWOs.filter((w) => w.status !== 'Completed').length} icon={ClipboardList} iconBg="var(--info-bg)" subtitle={`${filteredWOs.filter((w) => w.status === 'Completed').length} ${t('dashboard.kpi.completed')}`} />
        <KPICard title={t('dashboard.kpi.complianceScore')} value={`${complianceRate}%`} icon={ShieldCheck} iconBg={expiringDocs.length + expiredDocs.length > 0 ? 'var(--critical-bg)' : 'var(--success-bg)'} change={expiringDocs.length + expiredDocs.length > 0 ? -(expiringDocs.length + expiredDocs.length) : 0} trend={expiringDocs.length + expiredDocs.length > 0 ? 'down' : 'stable'} subtitle={`${expiringDocs.length} ${t('dashboard.kpi.expiring')}, ${expiredDocs.length} ${t('dashboard.kpi.expired')}`} />
        <KPICard title={t('dashboard.kpi.totalProperties')} value={filteredDocs.length > 0 ? [...new Set(filteredDocs.map((d) => d.center))].length : (selectedCenter && selectedCenter !== 'All' ? 1 : 12)} icon={Building2} iconBg="#F3E8FF" subtitle={centreLabel} />
        <KPICard title={t('dashboard.kpi.complianceDocs')} value={totalDocs} icon={FileText} iconBg="var(--success-bg)" subtitle={`${validDocs} ${t('dashboard.kpi.valid')}, ${expiredDocs.length} ${t('dashboard.kpi.expired')}`} />
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Recent Work Orders */}
        <div style={{ flex: 2, minWidth: 400, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{t('dashboard.recentWO')}</div>
            <button style={{ fontSize: 12, fontWeight: 600, color: 'var(--info)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {t('dashboard.viewAll')} <ArrowRight size={12} />
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[t('dashboard.col.id'), t('dashboard.col.title'), t('dashboard.col.priority'), t('dashboard.col.status'), t('dashboard.col.due')].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentWOs.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--info)' }}>{wo.id}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--foreground)' }}>{wo.title}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                      background: wo.priority === 'Critical' ? 'var(--critical-bg)' : wo.priority === 'High' ? 'var(--warning-bg)' : wo.priority === 'Medium' ? 'var(--info-bg)' : '#F1F5F9',
                      color: wo.priority === 'Critical' ? 'var(--critical)' : wo.priority === 'High' ? '#B45309' : wo.priority === 'Medium' ? 'var(--info)' : '#64748B',
                    }}>{wo.priority}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                      background: wo.status === 'Draft' ? '#F1F5F9' : wo.status === 'Pending PWD Proceed IAS' ? 'var(--warning-bg)' : wo.status === 'Under PWD Grouping' ? 'var(--info-bg)' : wo.status === 'Completed' ? 'var(--success-bg)' : 'var(--success-bg)',
                      color: wo.status === 'Draft' ? '#64748B' : wo.status === 'Pending PWD Proceed IAS' ? '#B45309' : wo.status === 'Under PWD Grouping' ? 'var(--info)' : 'var(--success)',
                    }}>{wo.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#64748B' }}>{wo.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compliance Alerts */}
        <div style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{t('dashboard.complianceAlerts')}</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: complianceRate < 90 ? 'var(--critical)' : complianceRate < 95 ? '#B45309' : 'var(--success)' }}>{complianceRate}% {t('dashboard.compliant')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expiredDocs.slice(0, 2).map((doc) => (
              <div key={doc.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <AlertTriangle size={13} color="#DC2626" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>{doc.name}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{t('dashboard.expired')}: {doc.nextInspection} &middot; {doc.center}</div>
              </div>
            ))}
            {expiringDocs.slice(0, 3).map((doc) => (
              <div key={doc.id} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: '#FFFBEB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <AlertTriangle size={13} color="#B45309" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#B45309' }}>{doc.name}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{t('dashboard.due')}: {doc.nextInspection} &middot; {doc.center}</div>
              </div>
            ))}
            {expiredDocs.length === 0 && expiringDocs.length === 0 && (
              <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: '#F0FDF4', textAlign: 'center' }}>
                <CheckCircle size={16} color="var(--success)" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{t('dashboard.allUpToDate')}</div>
              </div>
            )}
          </div>
          {/* Category Coverage Mini */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{t('dashboard.categoryCoverage')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categoryStats.filter((c) => c.total > 0).slice(0, 5).map((c) => (
                <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#64748B', width: 100, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.category}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.pct}%`, borderRadius: 3, background: c.pct === 100 ? 'var(--success)' : '#F59E0B' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: c.pct === 100 ? 'var(--success)' : '#B45309', width: 32, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="var(--info)" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>4.2 days</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{t('dashboard.avgCompletion')}</div>
          </div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>98.3%</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{t('dashboard.slaCompliance')}</div>
          </div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} color="#B45309" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>7</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{t('dashboard.pendingPwdIAS')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
