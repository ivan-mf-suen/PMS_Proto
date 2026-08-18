import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import WorkOrderCreate from './pages/WorkOrderCreate';
import FloorPlan from './pages/FloorPlan';
import Properties from './pages/Properties';
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

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setSubView(null);
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
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--secondary)' }}>
          {subView === 'workOrderCreate' ? (
            <WorkOrderCreate onBack={() => setSubView(null)} />
          ) : (
            <PageComponent
              onCreateWorkOrder={() => setSubView('workOrderCreate')}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
