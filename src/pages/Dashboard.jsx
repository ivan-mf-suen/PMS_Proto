import { useAuth } from '../context/AuthContext';
import { KPI_DATA, WORK_ORDERS, CHART_DATA, COMPLIANCE_DOCS } from '../data/constants';
import {
  TrendingUp, TrendingDown, Building2, DollarSign, ClipboardList, ShieldCheck,
  Clock, AlertTriangle, CheckCircle, ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

function KPICard({ title, value, subtitle, icon: Icon, iconBg, change, trend, critical }) {
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

export default function Dashboard() {
  const { permissions } = useAuth();

  const recentWOs = WORK_ORDERS.slice(0, 5);
  const expiringDocs = COMPLIANCE_DOCS.filter((d) => d.status === 'Expiring');

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPICard title="Occupancy Rate" value="94.2%" icon={Building2} iconBg="var(--info-bg)" change={1.3} trend="up" subtitle="Across all centers" />
        <KPICard title="Monthly Revenue" value="$2.85M" icon={DollarSign} iconBg="var(--success-bg)" change={5.8} trend="up" subtitle="Aug 2026" />
        <KPICard title="Open Work Orders" value="28" icon={ClipboardList} iconBg="var(--warning-bg)" subtitle="14 closed this month" critical />
        <KPICard title="Compliance Score" value="97.1%" icon={ShieldCheck} iconBg="var(--critical-bg)" change={-0.4} trend="down" subtitle="2 expiring soon" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Revenue Chart */}
        <div style={{ flex: 2, minWidth: 400, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 20 }}>Revenue Trend</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Chart */}
        <div style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 20 }}>Occupancy Trend</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip />
              <Line type="monotone" dataKey="occupancy" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Recent Work Orders */}
        <div style={{ flex: 2, minWidth: 400, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>Recent Work Orders</div>
            <button style={{ fontSize: 12, fontWeight: 600, color: 'var(--info)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Title', 'Priority', 'Status', 'Due'].map((h) => (
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
                      background: wo.status === 'Draft' ? '#F1F5F9' : wo.status === 'Pending Approval' ? 'var(--warning-bg)' : wo.status === 'Under PWD Assessment' ? 'var(--info-bg)' : wo.status === 'Completed' ? 'var(--success-bg)' : 'var(--success-bg)',
                      color: wo.status === 'Draft' ? '#64748B' : wo.status === 'Pending Approval' ? '#B45309' : wo.status === 'Under PWD Assessment' ? 'var(--info)' : 'var(--success)',
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
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>Compliance Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {expiringDocs.map((doc) => (
              <div key={doc.id} style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border)', background: '#FEF2F2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <AlertTriangle size={14} color="var(--critical)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--critical)' }}>{doc.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Expires: {doc.expiry} &middot; {doc.center}</div>
              </div>
            ))}
            {COMPLIANCE_DOCS.filter((d) => d.status === 'Valid').slice(0, 2).map((doc) => (
              <div key={doc.id} style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border)', background: '#F0FDF4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle size={14} color="var(--success)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>{doc.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Valid until: {doc.expiry} &middot; {doc.center}</div>
              </div>
            ))}
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
            <div style={{ fontSize: 12, color: '#64748B' }}>Avg. WO Completion Time</div>
          </div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>98.3%</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>SLA Compliance Rate</div>
          </div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} color="#B45309" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>7</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Pending Approvals (&gt;48h)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
