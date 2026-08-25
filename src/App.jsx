import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { WorkOrderProvider } from './context/WorkOrderContext';
import { ComplianceProvider } from './context/ComplianceContext';
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
import ComplianceVault from './pages/ComplianceVault';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const PAGES = {
  Dashboard,
  Properties,
  'Work Orders': WorkOrders,
  Assets,
  'Floor Plan': FloorPlan,
  'Compliance Vault': ComplianceVault,
  Reports,
  Settings,
};

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [subView, setSubView] = useState(null);
  const [viewWOId, setViewWOId] = useState(null);
  const [viewPropertyId, setViewPropertyId] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState('All');

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setSubView(null);
    setViewWOId(null);
    setViewPropertyId(null);
  };

  const handleCenterChange = (center) => {
    setSelectedCenter(center);
    if (activeTab !== 'Compliance Vault') {
      setActiveTab('Dashboard');
    }
    setSubView(null);
    setViewWOId(null);
    setViewPropertyId(null);
  };

  const handleViewWO = (woId) => {
    setViewWOId(woId);
    setSubView('workOrderDetail');
  };

  const handleViewProperty = (propId) => {
    setViewPropertyId(propId);
    setSubView('propertyDetail');
  };

  const PageComponent = PAGES[activeTab] || Dashboard;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header selectedCenter={selectedCenter} onCenterChange={handleCenterChange} />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--secondary)' }}>
          {subView === 'workOrderCreate' ? (
            <WorkOrderCreate
              onBack={() => setSubView(null)}
              onViewWO={handleViewWO}
              selectedCenter={selectedCenter}
            />
          ) : subView === 'workOrderDetail' ? (
            <WorkOrderDetail
              woId={viewWOId}
              onBack={() => { setSubView(null); setViewWOId(null); }}
            />
          ) : subView === 'propertyDetail' ? (
            <PropertyDetail
              propertyId={viewPropertyId}
              onBack={() => { setSubView(null); setViewPropertyId(null); }}
            />
          ) : (
            <PageComponent
              onCreateWorkOrder={() => setSubView('workOrderCreate')}
              onViewWO={handleViewWO}
              onViewProperty={handleViewProperty}
              selectedCenter={selectedCenter}
            />
          )}
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
            <AppLayout />
          </ComplianceProvider>
        </WorkOrderProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
