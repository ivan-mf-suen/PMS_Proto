import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../pages/Dashboard';
import { WorkOrderProvider } from '../../context/WorkOrderContext';
import { LanguageProvider } from '../../i18n/LanguageContext';

function renderDashboard(selectedCenter) {
  return render(
    <LanguageProvider>
      <WorkOrderProvider>
        <Dashboard selectedCenter={selectedCenter || 'All'} />
      </WorkOrderProvider>
    </LanguageProvider>
  );
}

describe('Dashboard', () => {
  it('renders all KPI squares', () => {
    renderDashboard();
    expect(screen.getByText('Active Work Orders')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Contracts Awarded')).toBeInTheDocument();
  });

  it('renders pipeline chart card', () => {
    renderDashboard();
    expect(screen.getByText('Work Order Pipeline')).toBeInTheDocument();
  });

  it('renders financial overview card', () => {
    renderDashboard();
    expect(screen.getByText('Financial Overview')).toBeInTheDocument();
  });

  it('renders contracts card', () => {
    renderDashboard();
    expect(screen.getByText('Contract Packaging Overview')).toBeInTheDocument();
  });

  it('renders facility snapshot card', () => {
    renderDashboard();
    expect(screen.getByText('Facility & Asset Snapshot')).toBeInTheDocument();
  });

  it('renders compliance alerts card', () => {
    renderDashboard();
    expect(screen.getByText('Compliance Alerts')).toBeInTheDocument();
  });

  it('renders PM insights card', () => {
    renderDashboard();
    expect(screen.getByText('Preventive Maintenance Insights')).toBeInTheDocument();
  });

  it('renders recent work orders table', () => {
    renderDashboard();
    expect(screen.getByText('Recent Work Orders')).toBeInTheDocument();
  });

  it('renders filter bar with dropdowns', () => {
    renderDashboard();
    expect(screen.getByText('District')).toBeInTheDocument();
    expect(screen.getByText('Facility Type')).toBeInTheDocument();
    expect(screen.getByText('Work Category')).toBeInTheDocument();
  });

  it('renders monthly trend chart', () => {
    renderDashboard();
    expect(screen.getByText('Work Orders by Type (Last 12 Months)')).toBeInTheDocument();
  });

  it('displays "All Centres" when no centre is selected', () => {
    renderDashboard();
    expect(screen.getByText('All Centres')).toBeInTheDocument();
  });

  it('displays selected centre label', () => {
    renderDashboard('PLK Main');
    expect(screen.getByText('PLK Main')).toBeInTheDocument();
  });

  it('renders the total budget section', () => {
    renderDashboard();
    expect(screen.getByText('Total Budget')).toBeInTheDocument();
    expect(screen.getByText('Total Committed Cost')).toBeInTheDocument();
  });
});
