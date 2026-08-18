import { createContext, useContext, useState } from 'react';
import { ROLES } from '../data/constants';

const AuthContext = createContext({
  role: null,
  permissions: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);

  return (
    <AuthContext.Provider
      value={{
        role,
        permissions: role ? ROLES[role] : null,
        login: setRole,
        logout: () => setRole(null),
      }}
    >
      {role ? children : <LoginScreen onLogin={setRole} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function LoginScreen({ onLogin }) {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #E2E8F0', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, backgroundColor: '#0B132B', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#0B132B', letterSpacing: '-0.02em' }}>PMS</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.02em' }}>Single Sign-On Portal</h1>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 40 }}>Corporate Authentication Gateway</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Corporate ID</label>
            <input disabled placeholder="Enter your ID" style={{ padding: '12px 16px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#94A3B8' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Password</label>
            <input type="password" disabled placeholder="••••••••" style={{ padding: '12px 16px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#94A3B8' }} />
          </div>
          <button disabled style={{ marginTop: 8, padding: 14, backgroundColor: '#94A3B8', color: '#fff', borderRadius: 6, border: 'none', fontSize: 15, fontWeight: 600 }}>Authenticate with Corporate SSO</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>Presentation Quick-Login (Select Role)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(ROLES).map(([key, role]) => (
            <button
              key={key}
              onClick={() => onLogin(key)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '20px 24px', backgroundColor: '#fff',
                border: '1px solid #E2E8F0', borderRadius: 12,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#94A3B8')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, backgroundColor: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{role.label}</span>
              </div>
              <span style={{ fontSize: 13, color: '#64748B', paddingLeft: 44 }}>{role.subtext}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
