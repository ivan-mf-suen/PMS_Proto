import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { WorkOrderProvider } from '../context/WorkOrderContext';
import { ComplianceProvider } from '../context/ComplianceContext';
import { AssetsProvider } from '../context/AssetsContext';
import { LanguageProvider } from '../i18n/LanguageContext';

export function renderWithProviders(ui, { ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return (
      <LanguageProvider>
        <AuthProvider>
          <WorkOrderProvider>
            <ComplianceProvider>
              <AssetsProvider>
                {children}
              </AssetsProvider>
            </ComplianceProvider>
          </WorkOrderProvider>
        </AuthProvider>
      </LanguageProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
