import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ROLES } from '../data/constants';
import {
  LayoutDashboard, Building2, ClipboardList, Package, Map,
  ShieldCheck, ChartColumn, Settings, ChevronRight, ChevronLeft,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', key: 'sidebar.dashboard' },
  { icon: Building2, label: 'Properties', path: '/properties', key: 'sidebar.properties' },
  { icon: ShieldCheck, label: 'Compliance Vault', path: '/compliance', key: 'sidebar.complianceVault', badge: 3, badgeCritical: true },
  { icon: ClipboardList, label: 'Work Orders', path: '/work-orders', key: 'sidebar.workOrders', badge: 42 },
  { icon: Package, label: 'Assets', path: '/assets', key: 'sidebar.assets' },
  { icon: Map, label: 'Floor Plan', path: '/floor-plan', key: 'sidebar.floorPlan' },
  { icon: ChartColumn, label: 'Reports', path: '/reports', key: 'sidebar.reports' },
  { icon: Settings, label: 'Settings', path: '/settings', key: 'sidebar.settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { role, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        transition: 'width 0.2s ease',
        background: '#0B132B',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        height: '100vh', position: 'sticky', top: 0, zIndex: 40,
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: collapsed ? '0 16px' : '0 20px', borderBottom: '1px solid var(--sidebar-border)', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, background: 'var(--sidebar-primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={15} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.2 }}>PMS</span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ icon: Icon, label, path, key, badge, badgeCritical }) => {
          const displayLabel = t(key);
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 18px' : '10px 16px',
                background: isActive ? 'var(--sidebar-accent)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                borderLeft: isActive ? '4px solid var(--sidebar-primary)' : '1px solid transparent',
                borderRadius: isActive ? 6 : 0,
                cursor: 'pointer',
                color: isActive ? '#ffffff' : 'rgba(226,232,240,0.65)',
                transition: 'background 0.15s, color 0.15s',
                position: 'relative', margin: '2px 8px',
                width: 'calc(100% - 16px)',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#F8FAFC'; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(226,232,240,0.65)'; } }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{displayLabel}</span>}
              {!collapsed && badge !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: badgeCritical ? 'var(--critical)' : 'rgba(255,255,255,0.12)', color: badgeCritical ? '#fff' : 'rgba(226,232,240,0.9)', lineHeight: 1.6 }}>{badge}</span>
              )}
              {collapsed && badge !== undefined && (
                <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: badgeCritical ? 'var(--critical)' : 'var(--info)', border: '1.5px solid var(--sidebar)' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            padding: collapsed ? '16px 0' : '16px 20px',
            borderTop: '1px solid var(--sidebar-border)',
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer', gap: 10, transition: 'background 0.2s',
            backgroundColor: userMenuOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = userMenuOpen ? 'rgba(255,255,255,0.05)' : 'transparent')}
        >
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--sidebar-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={14} color="#fff" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{role ? ROLES[role].name : 'User'}</div>
              <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.55)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{role ? ROLES[role].label : 'Property Manager'}</div>
            </div>
          )}
        </div>

        {userMenuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setUserMenuOpen(false)} />
            <div style={{ position: 'absolute', bottom: '100%', left: 16, width: 240, backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, padding: 16, zIndex: 50, marginBottom: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{role ? ROLES[role].name : t('sidebar.user')}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{role ? ROLES[role].label : t('sidebar.propertyManager')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', backgroundColor: '#1E293B', borderRadius: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{t('sidebar.sso')}</span>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                style={{ width: '100%', padding: 10, backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
              >
                {t('sidebar.logout')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', top: '50%', right: -12,
          transform: 'translateY(-50%)',
          width: 24, height: 24, borderRadius: '50%',
          background: '#fff', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        {collapsed ? <ChevronRight size={12} color="#475569" /> : <ChevronLeft size={12} color="#475569" />}
      </button>
    </aside>
  );
}
