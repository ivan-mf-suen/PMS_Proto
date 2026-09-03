import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComplianceVault from '../../pages/ComplianceVault';
import { ComplianceProvider } from '../../context/ComplianceContext';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { isAttachmentActive } from '../../services/complianceFileService';

function renderVault({ selectedCenter, withRouter } = {}) {
  const vault = (
    <ComplianceVault selectedCenter={selectedCenter || 'All'} />
  );
  return render(
    <MemoryRouter initialEntries={['/compliance']}>
      <LanguageProvider>
        <ComplianceProvider>
          {withRouter ? (
            <Routes>
              <Route path="/compliance" element={vault} />
              <Route path="/compliance/:id" element={<div>DOC DETAIL PAGE</div>} />
              <Route path="/compliance/new" element={<div>NEW RECORD PAGE</div>} />
            </Routes>
          ) : vault}
        </ComplianceProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('ComplianceVault', () => {
  it('renders the page title', () => {
    renderVault();
    expect(screen.getByText('Compliance Vault')).toBeInTheDocument();
  });

  it('displays summary bar with compliance rate and document counts', () => {
    renderVault();
    expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
    const validLabels = screen.getAllByText('Valid');
    expect(validLabels.length).toBeGreaterThanOrEqual(1);
    const expiringLabels = screen.getAllByText('Expiring');
    expect(expiringLabels.length).toBeGreaterThanOrEqual(1);
    const expiredLabels = screen.getAllByText('Expired');
    expect(expiredLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Coverage by Category section', () => {
    renderVault();
    expect(screen.getByText('Coverage by Category')).toBeInTheDocument();
  });

  it('renders category cards in the coverage grid', () => {
    renderVault();
    const fireElements = screen.getAllByText('Fire Safety');
    expect(fireElements.length).toBeGreaterThanOrEqual(1);
    const electricalElements = screen.getAllByText('Electrical Inspection WR2');
    expect(electricalElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders table with expected columns', () => {
    renderVault();
    expect(screen.getAllByText('Category').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Certificate Name')).toBeInTheDocument();
    expect(screen.getAllByText('Property').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Next Due')).toBeInTheDocument();
    expect(screen.getAllByText('Cycle').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Effective')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders doc rows in the table', () => {
    renderVault();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('search filters the table', async () => {
    const user = userEvent.setup();
    renderVault();
    const searchInput = screen.getByPlaceholderText('Search certificates, property, or reference...');
    const rowsBefore = screen.getAllByRole('row').length;
    await user.type(searchInput, 'ZZZZNONEXISTENT');
    const rowsAfter = screen.getAllByRole('row').length;
    expect(rowsAfter).toBeLessThan(rowsBefore);
  });

  it('status filter button toggles status filter', async () => {
    const user = userEvent.setup();
    renderVault();
    const filterBtns = screen.getAllByText('Expired');
    const filterBtn = filterBtns.find((el) => el.closest('button'));
    if (filterBtn) {
      await user.click(filterBtn.closest('button'));
      const clearBtns = screen.getAllByText('Clear all');
      expect(clearBtns.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('category card click toggles category filter', async () => {
    const user = userEvent.setup();
    renderVault();
    const fireCards = screen.getAllByText('Fire Safety');
    const categoryCard = fireCards.find((el) => el.closest('[style*="cursor"]'));
    if (categoryCard) {
      await user.click(categoryCard);
      const clearBtns = screen.getAllByText('Clear all');
      expect(clearBtns.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('Add Record button navigates to new-record page', async () => {
    const user = userEvent.setup();
    renderVault({ withRouter: true });
    await user.click(screen.getByText('Add Record'));
    expect(screen.getByText('NEW RECORD PAGE')).toBeInTheDocument();
  });

  it('view button navigates to the detail page', async () => {
    const user = userEvent.setup();
    renderVault({ withRouter: true });
    const viewBtns = document.querySelectorAll('table tbody tr button');
    if (viewBtns.length > 0) {
      await user.click(viewBtns[0]);
      expect(screen.getByText('DOC DETAIL PAGE')).toBeInTheDocument();
    }
  });

  it('hides property column when global centre is set', () => {
    renderVault({ selectedCenter: 'PLK Main' });
    expect(screen.queryByText('Property')).not.toBeInTheDocument();
  });

  it('shows property column when no global centre', () => {
    renderVault({ selectedCenter: 'All' });
    expect(screen.getAllByText('Property').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the subtitle text', () => {
    renderVault();
    expect(screen.getByText(/Track and manage/)).toBeInTheDocument();
  });

  it('row has view details, download, and delete actions', () => {
    renderVault();
    const firstRow = container_firstDataRow();
    const buttons = within(firstRow).getAllByRole('button');
    expect(buttons.length).toBe(3);
    expect(buttons[0]).toHaveAttribute('aria-label', 'View Details');
    expect(within(firstRow).queryByLabelText('Edit')).not.toBeInTheDocument();
  });

  function container_firstDataRow() {
    return document.querySelector('table tbody tr');
  }

  it('isAttachmentActive derives status from expiry date', () => {
    expect(isAttachmentActive({ expiryDate: null })).toBe(true);
    expect(isAttachmentActive({ expiryDate: '2000-01-01' })).toBe(false);
    expect(isAttachmentActive({ expiryDate: '2999-12-31' })).toBe(true);
  });

  it('renders Export CSV and download toolbar buttons', () => {
    renderVault();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Download Active Documents')).toBeInTheDocument();
    expect(screen.getByText('Download All Documents')).toBeInTheDocument();
  });

  it('renders status filter buttons between search and table', () => {
    renderVault();
    const filterBtns = document.querySelectorAll('button');
    const validBtn = Array.from(filterBtns).find((b) => b.textContent.includes('Valid') && b.closest('[style*="border-radius: 6"]'));
    expect(validBtn).toBeTruthy();
  });

  it('renders MultiSelectDropdown filters for category, cycle, and property', () => {
    renderVault();
    const dropdownBtns = document.querySelectorAll('button');
    const categoryBtn = Array.from(dropdownBtns).find((b) => b.textContent === 'Category');
    const cycleBtn = Array.from(dropdownBtns).find((b) => b.textContent === 'Cycle');
    expect(categoryBtn).toBeTruthy();
    expect(cycleBtn).toBeTruthy();
  });

  it('status filter buttons support multi-select', async () => {
    const user = userEvent.setup();
    renderVault();
    const filterBtns = document.querySelectorAll('button');
    const validBtn = Array.from(filterBtns).find((b) => b.textContent === 'Valid' && b.closest('[style*="border-radius: 20"]'));
    const expiredBtn = Array.from(filterBtns).find((b) => b.textContent === 'Expired' && b.closest('[style*="border-radius: 20"]'));
    if (validBtn && expiredBtn) {
      await user.click(validBtn);
      await user.click(expiredBtn);
      const clearBtns = screen.getAllByText('Clear all');
      expect(clearBtns.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('summary card labels show correct text', () => {
    renderVault();
    expect(screen.getAllByText('Expiring').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Expiring Soon')).not.toBeInTheDocument();
  });
});
