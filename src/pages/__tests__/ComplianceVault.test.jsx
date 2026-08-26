import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComplianceVault from '../../pages/ComplianceVault';
import { ComplianceProvider } from '../../context/ComplianceContext';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { isAttachmentActive } from '../../services/complianceFileService';

function renderVault(selectedCenter) {
  return render(
    <LanguageProvider>
      <ComplianceProvider>
        <ComplianceVault selectedCenter={selectedCenter || 'All'} />
      </ComplianceProvider>
    </LanguageProvider>
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
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Certificate Name')).toBeInTheDocument();
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('Next Due')).toBeInTheDocument();
    expect(screen.getByText('Cycle')).toBeInTheDocument();
    expect(screen.getByText('Last Inspected')).toBeInTheDocument();
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

  it('Add Record button opens add modal', async () => {
    const user = userEvent.setup();
    renderVault();
    await user.click(screen.getByText('Add Record'));
    expect(screen.getByText('Category *')).toBeInTheDocument();
    expect(screen.getByText('Property *')).toBeInTheDocument();
  });

  it('view button opens view modal', async () => {
    const user = userEvent.setup();
    renderVault();
    const viewBtns = document.querySelectorAll('table tbody tr button');
    if (viewBtns.length > 0) {
      await user.click(viewBtns[0]);
      expect(screen.getByText('Compliance Document Details')).toBeInTheDocument();
    }
  });

  it('hides property column when global centre is set', () => {
    renderVault('PLK Main');
    expect(screen.queryByText('Property')).not.toBeInTheDocument();
  });

  it('shows property column when no global centre', () => {
    renderVault('All');
    expect(screen.getByText('Property')).toBeInTheDocument();
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

  it('view modal shows document history section with expected columns', async () => {
    const user = userEvent.setup();
    renderVault();
    await user.click(container_firstDataRow().querySelector('button'));
    expect(screen.getByText('Document History')).toBeInTheDocument();
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Uploaded By')).toBeInTheDocument();
    expect(screen.getByText('Uploaded At')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Upload Document' })).toBeInTheDocument();
  });

  it('document history lists seeded records', async () => {
    const user = userEvent.setup();
    renderVault();
    await user.click(container_firstDataRow().querySelector('button'));
    const pdfCells = screen.getAllByText(/\.pdf$/i);
    expect(pdfCells.length).toBeGreaterThanOrEqual(1);
  });

  it('upload modal collects metadata then adds an active row', async () => {
    const user = userEvent.setup();
    renderVault();
    await user.click(container_firstDataRow().querySelector('button'));
    await user.click(screen.getByRole('button', { name: 'Upload Document' }));
    const file = new File(['demo content'], 'My Uploaded Cert.pdf', { type: 'application/pdf' });
    fireEvent.change(document.querySelector('[data-testid="upload-file-input"]'), { target: { files: [file] } });
    expect(await screen.findByDisplayValue('My Uploaded Cert.pdf')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Upload', exact: true }));
    const nameEl = await screen.findByText('My Uploaded Cert.pdf');
    const row = nameEl.closest('tr');
    expect(within(row).getByText('System')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
  });

  it('preview action opens the document preview overlay', async () => {
    const user = userEvent.setup();
    renderVault();
    await user.click(container_firstDataRow().querySelector('button'));
    const seededRow = screen.getAllByText(/\.pdf$/i)[0].closest('tr');
    await user.click(within(seededRow).getByRole('button', { name: 'Preview' }));
    expect(screen.getByText(/Document Preview/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Download' }).length).toBeGreaterThanOrEqual(1);
  });

  it('edit button in view details opens the edit modal', async () => {
    const user = userEvent.setup();
    renderVault();
    await user.click(container_firstDataRow().querySelector('button'));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit Compliance Document')).toBeInTheDocument();
  });

  it('isAttachmentActive derives status from expiry date', () => {
    expect(isAttachmentActive({ expiryDate: null })).toBe(true);
    expect(isAttachmentActive({ expiryDate: '2000-01-01' })).toBe(false);
    expect(isAttachmentActive({ expiryDate: '2999-12-31' })).toBe(true);
  });

  it('renders Export CSV and download toolbar buttons', () => {
    renderVault();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Download Active')).toBeInTheDocument();
    expect(screen.getByText('Download All')).toBeInTheDocument();
  });

  it('renders status filter buttons between search and table', () => {
    renderVault();
    const filterBtns = document.querySelectorAll('button');
    const validBtn = Array.from(filterBtns).find((b) => b.textContent.includes('Valid') && b.closest('[style*="border-radius: 20"]'));
    expect(validBtn).toBeTruthy();
  });

  it('renders column filter dropdowns for category, cycle, and property', () => {
    renderVault();
    const selects = document.querySelectorAll('thead select[multiple]');
    expect(selects.length).toBeGreaterThanOrEqual(2);
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
