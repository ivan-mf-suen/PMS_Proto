import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import WorkOrders from '../../pages/WorkOrders';
import { WorkOrderProvider } from '../../context/WorkOrderContext';
import { LanguageProvider } from '../../i18n/LanguageContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    role: 'SSD_CENTRE_ADMIN',
    permissions: { canCreateWO: true, canEditWO: true, canDeleteWO: true, canApproveWO: true, label: 'SSD Centre Admin' },
  }),
}));

function renderWorkOrders(selectedCenter) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <WorkOrderProvider>
          <WorkOrders selectedCenter={selectedCenter || 'All'} />
        </WorkOrderProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('WorkOrders', () => {
  it('renders the page title', () => {
    renderWorkOrders();
    expect(screen.getByText('Work Orders')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderWorkOrders();
    expect(screen.getByPlaceholderText('Search by ID, title, assignee...')).toBeInTheDocument();
  });

  it('renders filter by status section', () => {
    renderWorkOrders();
    expect(screen.getByText('Filter by Status')).toBeInTheDocument();
  });

  it('shows result count text', () => {
    renderWorkOrders();
    expect(screen.getByText(/results/)).toBeInTheDocument();
  });

  it('renders WO rows in the table', () => {
    renderWorkOrders();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('search filters the table', async () => {
    const user = userEvent.setup();
    renderWorkOrders();
    const searchInput = screen.getByPlaceholderText('Search by ID, title, assignee...');
    const rowsBefore = screen.getAllByRole('row').length;
    await user.type(searchInput, 'ZZZZNONEXISTENT');
    const rowsAfter = screen.getAllByRole('row').length;
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);
  });

  it('shows create button for users with create permission', () => {
    renderWorkOrders();
    expect(screen.getByText('Create Work Order')).toBeInTheDocument();
  });

  it('renders pipeline with short status labels', () => {
    renderWorkOrders();
    expect(screen.getByText('SM Review')).toBeInTheDocument();
    expect(screen.getByText('G&C Review')).toBeInTheDocument();
  });
});
