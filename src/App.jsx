import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkOrderProvider } from './context/WorkOrderContext';
import { ComplianceProvider } from './context/ComplianceContext';
import { AssetsProvider } from './context/AssetsContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import WorkOrderCreate from './pages/WorkOrderCreate';
import WorkOrderDetail from './pages/WorkOrderDetail';
import FloorPlan from './pages/FloorPlan';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import AssetForm from './pages/AssetForm';
import ComplianceVault from './pages/ComplianceVault';
import ComplianceDetail from './pages/ComplianceDetail';
import ComplianceAddRecord from './pages/ComplianceAddRecord';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState('All');
  const navigate = useNavigate();
  const location = useLocation();

  const handleCenterChange = (center) => {
    setSelectedCenter(center);
    if (!location.pathname.startsWith('/compliance')) {
      navigate('/');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header selectedCenter={selectedCenter} onCenterChange={handleCenterChange} />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--secondary)' }}>
          <Routes>
            <Route index element={<Dashboard selectedCenter={selectedCenter} />} />
            <Route path="properties" element={<Properties selectedCenter={selectedCenter} />} />
            <Route path="properties/:id" element={<PropertyDetail />} />
            <Route path="compliance" element={<ComplianceVault selectedCenter={selectedCenter} />} />
            <Route path="compliance/new" element={<ComplianceAddRecord selectedCenter={selectedCenter} />} />
            <Route path="compliance/:id" element={<ComplianceDetail />} />
            <Route path="work-orders" element={<WorkOrders selectedCenter={selectedCenter} />} />
            <Route path="work-orders/new" element={<WorkOrderCreate />} />
            <Route path="work-orders/:id" element={<WorkOrderDetail />} />
            <Route path="assets" element={<Assets />} />
            <Route path="assets/new" element={<AssetForm />} />
            <Route path="assets/:id" element={<AssetDetail />} />
            <Route path="assets/:id/edit" element={<AssetForm />} />
            <Route path="floor-plan" element={<FloorPlan selectedCenter={selectedCenter} />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WorkOrderProvider>
          <ComplianceProvider>
            <AssetsProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/*" element={<AppLayout />} />
                </Routes>
              </BrowserRouter>
            </AssetsProvider>
          </ComplianceProvider>
        </WorkOrderProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}