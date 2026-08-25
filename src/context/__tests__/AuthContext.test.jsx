import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { ROLES } from '../../data/constants';
import { LanguageProvider } from '../../i18n/LanguageContext';

function AuthStatus() {
  const { role, permissions, logout } = useAuth();
  return (
    <div>
      <span data-testid="role">{role ?? 'none'}</span>
      <span data-testid="label">{permissions?.label ?? 'none'}</span>
      <span data-testid="canCreate">{String(permissions?.canCreateWO ?? false)}</span>
      <span data-testid="scope">{permissions?.centerScope ?? 'none'}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <LanguageProvider>
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    </LanguageProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts unauthenticated - shows login screen', () => {
    renderAuth();
    expect(screen.getByText(ROLES.OIC.label)).toBeInTheDocument();
    expect(screen.queryByTestId('role')).not.toBeInTheDocument();
  });

  it('shows login screen with role cards before auth', () => {
    render(
      <LanguageProvider>
        <AuthProvider />
      </LanguageProvider>
    );
    expect(screen.getByText(ROLES.OIC.label)).toBeInTheDocument();
    expect(screen.getByText(ROLES.SERVICE_MANAGER.label)).toBeInTheDocument();
    expect(screen.getByText(ROLES.SSD_GC.label)).toBeInTheDocument();
  });

  it('sets role and permissions on login', async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText(ROLES.OIC.label));
    expect(screen.getByTestId('role')).toHaveTextContent('OIC');
    expect(screen.getByTestId('label')).toHaveTextContent('SSD OIC');
    expect(screen.getByTestId('canCreate')).toHaveTextContent('true');
    expect(screen.getByTestId('scope')).toHaveTextContent('ASSIGNED_ONLY');
  });

  it('SERVICE_MANAGER cannot create WOs', async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText(ROLES.SERVICE_MANAGER.label));
    expect(screen.getByTestId('canCreate')).toHaveTextContent('false');
    expect(screen.getByTestId('scope')).toHaveTextContent('CLUSTER');
  });

  it('SSD_CENTRE_ADMIN can create but not submit WOs', async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText(ROLES.SSD_CENTRE_ADMIN.label));
    expect(screen.getByTestId('canCreate')).toHaveTextContent('true');
    expect(screen.getByTestId('scope')).toHaveTextContent('ASSIGNED_ONLY');
  });

  it('SSD_GC has full editing permissions', async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText(ROLES.SSD_GC.label));
    expect(screen.getByTestId('canCreate')).toHaveTextContent('false');
    expect(screen.getByTestId('scope')).toHaveTextContent('ALL');
  });

  it('PWD can edit task details and add map assets', async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText(ROLES.PWD.label));
    expect(screen.getByTestId('canCreate')).toHaveTextContent('false');
    expect(screen.getByTestId('scope')).toHaveTextContent('ALL');
  });

  it('logout resets to unauthenticated', async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText(ROLES.OIC.label));
    expect(screen.getByTestId('role')).toHaveTextContent('OIC');

    await user.click(screen.getByRole('button', { name: /Logout/i }));
    expect(screen.queryByTestId('role')).not.toBeInTheDocument();
    expect(screen.getByText(ROLES.OIC.label)).toBeInTheDocument();
  });

  it('switching roles updates permissions', async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByText(ROLES.OIC.label));
    expect(screen.getByTestId('scope')).toHaveTextContent('ASSIGNED_ONLY');

    await user.click(screen.getByRole('button', { name: /Logout/i }));
    await user.click(screen.getByText(ROLES.SERVICE_MANAGER.label));
    expect(screen.getByTestId('scope')).toHaveTextContent('CLUSTER');
  });

  it('all 8 roles exist in ROLES constant', () => {
    const expectedKeys = ['SUPER_ADMIN', 'IT_ADMIN', 'SSD_CENTRE_ADMIN', 'OIC', 'SERVICE_MANAGER', 'SSD_AS', 'SSD_GC', 'PWD'];
    expect(Object.keys(ROLES)).toEqual(expectedKeys);
  });

  it('each role has required permission flags', () => {
    Object.entries(ROLES).forEach(([key, role]) => {
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('label');
      expect(role).toHaveProperty('centerScope');
      expect(role).toHaveProperty('permissions');
      expect(role).toHaveProperty('canCreateWO');
      expect(role).toHaveProperty('canSubmitWO');
      expect(role).toHaveProperty('canEditTaskDetails');
      expect(role).toHaveProperty('canAddMapAssets');
      expect(['ALL', 'CLUSTER', 'ASSIGNED_ONLY']).toContain(role.centerScope);
    });
  });
});
