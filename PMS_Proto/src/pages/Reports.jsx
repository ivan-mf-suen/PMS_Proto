import { REPORTS_DATA } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { FileText, Download, Calendar, BarChart3, TrendingUp, PieChart } from 'lucide-react';

export default function Reports() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('reports.title')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{t('reports.subtitle')}</p>
        </div>
      </div>

      {/* Quick Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: BarChart3, label: t('reports.financialSummary'), color: 'var(--info)' },
          { icon: TrendingUp, label: t('reports.woAnalytics'), color: 'var(--success)' },
          { icon: PieChart, label: t('reports.occupancyReport'), color: '#8B5CF6' },
          { icon: Calendar, label: t('reports.complianceCalendar'), color: '#F59E0B' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'box-shadow 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.1)')} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--card-shadow)')}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={24} color={color} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', textAlign: 'center' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Report List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{t('reports.generatedReports')}</div>
        {REPORTS_DATA.map((report) => (
          <div key={report.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#475569" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{report.name}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{report.date}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: report.status === 'Ready' ? 'var(--success-bg)' : 'var(--warning-bg)', color: report.status === 'Ready' ? 'var(--success)' : '#B45309' }}>{report.status}</span>
            <button style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Download size={12} /> {t('reports.export')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
