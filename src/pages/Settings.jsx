import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, PERMISSIONS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';
import { useLanguage } from '../i18n/LanguageContext';
import { User, Shield, Bell, Globe, Save, Plus, Eye, EyeOff, Lock, ChevronDown, ChevronRight } from 'lucide-react';

const ACCESS_LEVELS = {
  FULL: { label: 'Full Access', color: 'var(--success)', bg: 'var(--success-bg)' },
  MANAGE: { label: 'Manage', color: 'var(--info)', bg: 'var(--info-bg)' },
  VIEW_ONLY: { label: 'View Only', color: '#64748B', bg: '#F1F5F9' },
};

const GROUP_LABELS = {
  workOrders: 'Work Orders',
  properties: 'Properties',
  compliance: 'Compliance',
  assets: 'Assets',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users',
};

function getAccessLevel(permissions) {
  if (permissions.includes('settings_manage') || permissions.includes('user_manage') || permissions.length >= 18) return ACCESS_LEVELS.FULL;
  if (permissions.length >= 10) return ACCESS_LEVELS.MANAGE;
  return ACCESS_LEVELS.VIEW_ONLY;
}

export default function Settings() {
  const { role } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('profile');
  const [selectedRoleKey, setSelectedRoleKey] = useState(null);
  const [showCreateRole, setShowCreateRole] = useState(false);

  const sections = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'roles', label: t('settings.roles'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'localization', label: t('settings.localization'), icon: Globe },
  ];

  const isPrivileged = role === 'SUPER_ADMIN' || role === 'IT_ADMIN';

  return (
    <div style={{ padding: 24, maxWidth: 1400, display: 'flex', gap: 24 }}>
      <div style={{ width: 240, flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: 24 }}>{t('settings.settings')}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveSection(id); setSelectedRoleKey(null); setShowCreateRole(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8, border: 'none',
                background: activeSection === id ? 'var(--info-bg)' : 'transparent',
                color: activeSection === id ? 'var(--info)' : '#64748B',
                fontWeight: activeSection === id ? 600 : 400,
                fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 24 }}>
        {/* ─── PROFILE ─── */}
        {activeSection === 'profile' && (
          <ProfileSection role={role} t={t} />
        )}

        {/* ─── ROLES & PERMISSIONS ─── */}
        {activeSection === 'roles' && (
          <RolesSection
            role={role} t={t} isPrivileged={isPrivileged}
            selectedRoleKey={selectedRoleKey} setSelectedRoleKey={setSelectedRoleKey}
            showCreateRole={showCreateRole} setShowCreateRole={setShowCreateRole}
          />
        )}

        {/* ─── NOTIFICATIONS ─── */}
        {activeSection === 'notifications' && (
          <NotificationsSection t={t} />
        )}

        {/* ─── LOCALIZATION ─── */}
        {activeSection === 'localization' && (
          <LocalizationSection t={t} language={language} setLanguage={setLanguage} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROFILE SECTION
   ═══════════════════════════════════════════════════════════ */
function ProfileSection({ role, t }) {
  const [showPassword, setShowPassword] = useState(false);
  const r = role ? ROLES[role] : null;

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 24 }}>{t('settings.profile.title')}</h2>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: 16, background: '#F8FAFC', borderRadius: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--info), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }}>
          {r ? r.name.charAt(0) : 'U'}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{r ? r.name : 'User'}</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{r ? r.label : 'No role assigned'}</div>
          <button style={{ marginTop: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>{t('settings.profile.uploadAvatar') || 'Upload Photo'}</button>
        </div>
      </div>

      {/* Personal Information */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 14 }}>{t('settings.profile.personalInfo')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 600 }}>
          <Field label={t('settings.profile.displayName')} defaultValue={r ? r.name : ''} />
          <Field label={t('settings.profile.email')} defaultValue="user@gov.hk" disabled />
          <Field label={t('settings.profile.phone')} defaultValue="+852 " placeholder="+852 XXXX XXXX" />
          <Field label={t('settings.profile.employeeId')} defaultValue={role || ''} disabled />
          <Field label={t('settings.profile.role')} defaultValue={r ? r.label : ''} disabled />
          <Field label={t('settings.profile.department')} defaultValue="Social Services Division" disabled />
        </div>
      </div>

      {/* Preferences */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 14 }}>{t('settings.profile.preferences')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 600 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{t('settings.profile.language')}</label>
            <select style={selectStyle}>
              <option>English</option>
              <option>{'\u7E41\u9AD4\u4E2D\u6587'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={15} /> Change Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter current password" style={{ ...inputStyle, paddingRight: 38 }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter new password" style={{ ...inputStyle, paddingRight: 38 }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Re-enter new password" style={{ ...inputStyle, paddingRight: 38 }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
            Password must be at least 8 characters, including uppercase, lowercase, and a number.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={primaryBtnStyle}><Save size={14} /> {t('settings.profile.save')}</button>
        <button style={ghostBtnStyle}>Cancel</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLES & PERMISSIONS SECTION
   ═══════════════════════════════════════════════════════════ */
function RolesSection({ role, t, isPrivileged, selectedRoleKey, setSelectedRoleKey, showCreateRole, setShowCreateRole }) {
  if (selectedRoleKey || showCreateRole) {
    return (
      <RoleDetailView
        roleKey={selectedRoleKey} role={selectedRoleKey ? ROLES[selectedRoleKey] : null}
        isCreate={showCreateRole} t={t}
        onBack={() => { setSelectedRoleKey(null); setShowCreateRole(false); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>{t('settings.roles.title')}</h2>
        {isPrivileged && (
          <button onClick={() => setShowCreateRole(true)} style={{ ...primaryBtnStyle, fontSize: 12, padding: '7px 14px' }}>
            <Plus size={14} /> {t('settings.roles.addRole')}
          </button>
        )}
      </div>

      <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Shield size={16} style={{ color: 'var(--info)' }} />
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{t('settings.roles.currentRole')} </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>{role ? ROLES[role].label : 'N/A'}</span>
          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>{role ? ROLES[role].subtext : ''}</span>
        </div>
      </div>

      {/* Roles Table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={thStyle}>{t('settings.roles.table.role')}</th>
              <th style={thStyle}>{t('settings.roles.table.department')}</th>
              <th style={thStyle}>{t('settings.roles.table.access')}</th>
              <th style={{ ...thStyle, textAlign: 'right', paddingRight: 14 }}>{t('settings.roles.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ROLES).map(([key, r]) => {
              const access = getAccessLevel(r.permissions || []);
              const isCurrentRole = key === role;
              return (
                <tr key={key} style={{ borderTop: '1px solid var(--border)', background: isCurrentRole ? 'var(--info-bg)' : '#fff', cursor: 'pointer' }}
                  onClick={() => { if (isPrivileged || key === role) setSelectedRoleKey(key); }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{r.subtext}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                      {r.centerScope === 'ALL' ? 'All Centres' : r.centerScope === 'CLUSTER' ? 'Cluster' : 'Assigned Only'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: access.bg, color: access.color, fontWeight: 600 }}>
                      {access.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 14 }}>
                    {(isPrivileged || key === role) && (
                      <span style={{ fontSize: 11, color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        {isCurrentRole ? t('settings.roles.viewOwnRole') : <><Eye size={12} /> {t('common.view')}</>}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLE DETAIL / CREATE VIEW
   ═══════════════════════════════════════════════════════════ */
function RoleDetailView({ roleKey: _roleKey, role, isCreate, t, onBack }) {
  const [editPerms, setEditPerms] = useState(isCreate ? [] : (role?.permissions || []));
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [roleName, setRoleName] = useState(isCreate ? '' : (role?.label || ''));
  const [roleDesc, setRoleDesc] = useState(isCreate ? '' : (role?.subtext || ''));

  const togglePerm = (perm) => {
    setEditPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const toggleGroup = (group) => {
    const groupPerms = Object.entries(PERMISSIONS).filter(([, def]) => def.group === group).map(([key]) => key);
    const allSelected = groupPerms.every((p) => editPerms.includes(p));
    if (allSelected) {
      setEditPerms((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setEditPerms((prev) => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const groups = {};
  Object.entries(PERMISSIONS).forEach(([key, def]) => {
    if (!groups[def.group]) groups[def.group] = [];
    groups[def.group].push({ key, ...def });
  });

  const access = getAccessLevel(editPerms);

  return (
    <div>
      <button onClick={onBack} style={{ ...ghostBtnStyle, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> {t('common.back')}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Shield size={22} style={{ color: 'var(--info)' }} />
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>
            {isCreate ? t('settings.roles.createRole') : `${t('settings.roles.table.role')}: ${role?.label}`}
          </h2>
          {!isCreate && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{role?.subtext}</div>}
        </div>
      </div>

      {isCreate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, maxWidth: 400 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{t('settings.roles.roleName')}</label>
            <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Facilities Coordinator" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{t('settings.roles.description')}</label>
            <input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="Brief description of this role" style={inputStyle} />
          </div>
        </div>
      )}

      {/* Access Level Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 16px', background: access.bg, borderRadius: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Access Level:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: access.color, padding: '3px 10px', borderRadius: 6, background: '#fff' }}>{access.label}</span>
        <span style={{ fontSize: 12, color: '#64748B' }}>({editPerms.length} permissions)</span>
      </div>

      {/* Permission Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.entries(groups).map(([group, perms]) => {
          const selectedCount = perms.filter((p) => editPerms.includes(p.key)).length;
          const allSelected = selectedCount === perms.length;
          const someSelected = selectedCount > 0 && !allSelected;
          const isExpanded = expandedGroup === group;

          return (
            <div key={group} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => setExpandedGroup(isExpanded ? null : group)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#F8FAFC', cursor: 'pointer', userSelect: 'none' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                  style={{
                    width: 18, height: 18, borderRadius: 4, border: `2px solid ${allSelected ? 'var(--success)' : someSelected ? 'var(--warning)' : 'var(--border)'}`,
                    background: allSelected ? 'var(--success)' : someSelected ? 'var(--warning)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {allSelected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  {someSelected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>–</span>}
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>{GROUP_LABELS[group] || group}</span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{selectedCount}/{perms.length}</span>
                <ChevronDown size={14} style={{ color: '#94A3B8', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </div>
              {isExpanded && (
                <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, background: '#fff' }}>
                  {perms.map((p) => {
                    const checked = editPerms.includes(p.key);
                    return (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: checked ? 'var(--foreground)' : '#64748B', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, border: `1px solid ${checked ? 'var(--success)' : 'var(--border)'}`, background: checked ? 'var(--success-bg)' : '#fff', transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={checked} onChange={() => togglePerm(p.key)} style={{ display: 'none' }} />
                        <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${checked ? 'var(--success)' : '#CBD5E1'}`, background: checked ? 'var(--success)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', flexShrink: 0 }}>
                          {checked && '✓'}
                        </span>
                        {p.label}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button style={primaryBtnStyle}><Save size={14} /> {t('settings.roles.save')}</button>
        <button onClick={onBack} style={ghostBtnStyle}>{t('settings.roles.cancel')}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS SECTION
   ═══════════════════════════════════════════════════════════ */
function NotificationsSection({ t }) {
  const [channels, setChannels] = useState({
    woStatus: { email: true, inApp: true, push: false },
    complianceExpiry: { email: true, inApp: true, push: true },
    approvals: { email: false, inApp: true, push: false },
    system: { email: true, inApp: true, push: false },
    comments: { email: false, inApp: true, push: true },
  });

  const toggleChannel = (type, channel) => {
    setChannels((prev) => ({ ...prev, [type]: { ...prev[type], [channel]: !prev[type][channel] } }));
  };

  const notifTypes = [
    { key: 'woStatus', label: t('settings.notif.woStatus'), desc: t('settings.notif.woStatusDesc') },
    { key: 'complianceExpiry', label: t('settings.notif.complianceExpiry'), desc: t('settings.notif.complianceExpiryDesc') },
    { key: 'approvals', label: t('settings.notif.approvals'), desc: t('settings.notif.approvalsDesc') },
    { key: 'system', label: t('settings.notif.system'), desc: t('settings.notif.systemDesc') },
    { key: 'comments', label: t('settings.notif.comments'), desc: t('settings.notif.commentsDesc') },
  ];

  const channelKeys = [
    { key: 'email', label: t('settings.notif.email') },
    { key: 'inApp', label: t('settings.notif.inApp') },
    { key: 'push', label: t('settings.notif.push') },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 20 }}>{t('settings.notif.title')}</h2>

      {/* Notification Matrix */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 14 }}>{t('settings.notif.title')}</th>
              {channelKeys.map(({ key, label }) => (
                <th key={key} style={{ ...thStyle, textAlign: 'center', width: 90 }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {notifTypes.map(({ key, label, desc }) => (
              <tr key={key} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ ...tdStyle, paddingLeft: 14 }}>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{desc}</div>
                </td>
                {channelKeys.map(({ key: ch }) => (
                  <td key={ch} style={{ ...tdStyle, textAlign: 'center' }}>
                    <ToggleSwitch on={channels[key][ch]} onClick={() => toggleChannel(key, ch)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button style={primaryBtnStyle}><Save size={14} /> {t('settings.notif.save')}</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOCALIZATION SECTION
   ═══════════════════════════════════════════════════════════ */
function LocalizationSection({ t, language, setLanguage }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 24 }}>{t('settings.loc.title')}</h2>

      <div style={{ maxWidth: 400 }}>
        {/* ── Language ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Globe size={16} style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('settings.loc.preferredLanguage')}</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px 0' }}>{t('settings.loc.languageHelper')}</p>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle}>
            <option value="en">English</option>
            <option value="zh">{'\u7E41\u9AD4\u4E2D\u6587'} (Traditional Chinese)</option>
          </select>
        </div>

      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
        <button style={primaryBtnStyle}><Save size={14} /> {t('settings.loc.save')}</button>
        <button style={ghostBtnStyle}>{t('settings.loc.reset')}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function ToggleSwitch({ on, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 38, height: 22, borderRadius: 11, background: on ? 'var(--success)' : '#CBD5E1', padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background 0.2s' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }} />
    </div>
  );
}

function Field({ label, defaultValue, disabled, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: disabled ? '#94A3B8' : '#475569' }}>{label}</label>
      <input defaultValue={defaultValue} disabled={disabled} placeholder={placeholder}
        style={{ ...inputStyle, backgroundColor: disabled ? '#F8FAFC' : '#fff', color: disabled ? '#94A3B8' : 'var(--foreground)' }} />
    </div>
  );
}

const inputStyle = { padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' };
const selectStyle = { padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' };
const primaryBtnStyle = { padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const ghostBtnStyle = { padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#64748B', cursor: 'pointer' };
const thStyle = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' };
const tdStyle = { padding: '12px 14px', verticalAlign: 'top' };
