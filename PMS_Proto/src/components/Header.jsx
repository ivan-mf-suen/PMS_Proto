import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { CENTERS, NOTIFICATIONS } from '../data/constants';
import { Building2, ChevronDown, Bell } from 'lucide-react';

const ALL_CENTERS_OPTION = 'All';

export default function Header({ selectedCenter, onCenterChange }) {
  const { permissions } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [centerDropdownOpen, setCenterDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const displayLabel = selectedCenter === ALL_CENTERS_OPTION ? t('header.allCentres') : selectedCenter;

  return (
    <header
      style={{
        height: 56, background: '#fff',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
        position: 'sticky', top: 0, zIndex: 30,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}
    >
      {/* Center Selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { if (permissions?.centerScope !== 'ASSIGNED_ONLY') setCenterDropdownOpen(!centerDropdownOpen); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: permissions?.centerScope === 'ASSIGNED_ONLY' ? '#F8FAFC' : 'var(--secondary)',
            border: '1px solid var(--border)', borderRadius: 6,
            cursor: permissions?.centerScope === 'ASSIGNED_ONLY' ? 'default' : 'pointer',
            color: permissions?.centerScope === 'ASSIGNED_ONLY' ? '#475569' : 'var(--foreground)',
            opacity: permissions?.centerScope === 'ASSIGNED_ONLY' ? 0.8 : 1,
          }}
        >
          <Building2 size={14} color={permissions?.centerScope === 'ASSIGNED_ONLY' ? '#64748B' : 'var(--info)'} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{displayLabel}</span>
          {permissions?.centerScope !== 'ASSIGNED_ONLY' && <ChevronDown size={13} color="#64748B" />}
          {permissions?.centerScope === 'ASSIGNED_ONLY' && (
            <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', backgroundColor: '#E2E8F0', color: '#475569', borderRadius: 4, fontWeight: 700 }}>{t('header.locked')}</span>
          )}
        </button>
        {centerDropdownOpen && permissions?.centerScope !== 'ASSIGNED_ONLY' && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(15,23,42,0.1)', minWidth: 240, zIndex: 100, overflow: 'hidden' }}>
            <div style={{ padding: '6px 12px 4px', fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {permissions?.centerScope === 'CLUSTER' ? t('header.clusterCentres') : t('header.allGlobalCentres')}
            </div>
            <button
              onClick={() => { onCenterChange(ALL_CENTERS_OPTION); setCenterDropdownOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px',
                background: selectedCenter === ALL_CENTERS_OPTION ? 'var(--secondary)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 13,
                color: selectedCenter === ALL_CENTERS_OPTION ? 'var(--info)' : 'var(--foreground)',
                fontWeight: selectedCenter === ALL_CENTERS_OPTION ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedCenter === ALL_CENTERS_OPTION ? 'var(--info)' : 'transparent', display: 'inline-block' }} />
              {t('header.allCentres')}
            </button>
            <div style={{ height: 1, background: 'var(--border)', margin: '2px 12px' }} />
            {CENTERS.map((center) => (
              <button
                key={center}
                onClick={() => { onCenterChange(center); setCenterDropdownOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px',
                  background: center === selectedCenter ? 'var(--secondary)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 13,
                  color: center === selectedCenter ? 'var(--info)' : 'var(--foreground)',
                  fontWeight: center === selectedCenter ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: center === selectedCenter ? 'var(--info)' : 'transparent', display: 'inline-block' }} />
                {center}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Language Toggle */}
      <div style={{ display: 'flex', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
        {['en', 'zh'].map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            style={{
              padding: '5px 12px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: language === l ? 'var(--primary)' : 'transparent',
              color: language === l ? '#fff' : '#64748B',
              transition: 'background 0.15s',
            }}
          >
            {l === 'en' ? 'EN' : '\u7E41'}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}
        >
          <Bell size={16} color="#475569" />
          <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: '50%', background: 'var(--critical)', border: '1.5px solid #fff' }} />
        </button>
        {notifOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', zIndex: 100, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{t('header.notifications')}</span>
              <span style={{ fontSize: 11, padding: '2px 7px', background: 'var(--critical-bg)', color: 'var(--critical)', borderRadius: 10, fontWeight: 600 }}>3 {t('header.new')}</span>
            </div>
            {NOTIFICATIONS.map((n) => (
              <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.type === 'critical' ? 'var(--critical)' : n.type === 'warning' ? 'var(--warning)' : 'var(--info)', marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.4 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setNotifOpen(false)}
              style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--info)', cursor: 'pointer' }}
            >
              {t('header.viewAll')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
