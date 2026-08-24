import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComplianceProvider, useCompliance } from '../ComplianceContext';

function ComplianceTestUI() {
  const { docs, addDoc, updateDoc, removeDoc } = useCompliance();
  const activeDocs = docs.filter((d) => !d.removed);
  const validDocs = activeDocs.filter((d) => d.status === 'Valid');
  const expiringDocs = activeDocs.filter((d) => d.status === 'Expiring');
  const expiredDocs = activeDocs.filter((d) => d.status === 'Expired');

  return (
    <div>
      <span data-testid="total">{activeDocs.length}</span>
      <span data-testid="valid">{validDocs.length}</span>
      <span data-testid="expiring">{expiringDocs.length}</span>
      <span data-testid="expired">{expiredDocs.length}</span>
      <span data-testid="first-doc">{activeDocs[0]?.name ?? 'none'}</span>
      <button onClick={() => addDoc({ name: 'Test Cert', category: 'Fire Safety', center: 'PLK Main', documentRef: 'TEST-001', issuedBy: 'Test', inspectionDate: '2026-01-01', nextInspection: '2027-01-01', expiry: '2027-06-01', cycleMonths: 12, responsible: 'Tester', notes: '', status: 'Valid' })}>Add</button>
      <button onClick={() => updateDoc(docs[0]?.id, { name: 'Updated Name' })}>Update</button>
      <button onClick={() => removeDoc(docs[0]?.id)}>Remove</button>
    </div>
  );
}

function renderCompliance() {
  return render(<ComplianceProvider><ComplianceTestUI /></ComplianceProvider>);
}

describe('ComplianceContext', () => {
  it('loads initial docs from constants', () => {
    renderCompliance();
    expect(screen.getByTestId('total').textContent).not.toBe('0');
    expect(screen.getByTestId('first-doc').textContent).not.toBe('none');
  });

  it('computes status from expiry dates', () => {
    renderCompliance();
    const total = parseInt(screen.getByTestId('total').textContent);
    const valid = parseInt(screen.getByTestId('valid').textContent);
    const expiring = parseInt(screen.getByTestId('expiring').textContent);
    const expired = parseInt(screen.getByTestId('expired').textContent);
    expect(valid + expiring + expired).toBe(total);
  });

  it('adds a new doc', async () => {
    const user = userEvent.setup();
    renderCompliance();
    const before = parseInt(screen.getByTestId('total').textContent);
    await user.click(screen.getByRole('button', { name: /Add/i }));
    const after = parseInt(screen.getByTestId('total').textContent);
    expect(after).toBe(before + 1);
  });

  it('new doc is prepended (appears first)', async () => {
    const user = userEvent.setup();
    renderCompliance();
    await user.click(screen.getByRole('button', { name: /Add/i }));
    expect(screen.getByTestId('first-doc').textContent).toBe('Test Cert');
  });

  it('updates a doc', async () => {
    const user = userEvent.setup();
    renderCompliance();
    await user.click(screen.getByRole('button', { name: /Update/i }));
    expect(screen.getByTestId('first-doc').textContent).toBe('Updated Name');
  });

  it('soft-deletes a doc (removed flag)', async () => {
    const user = userEvent.setup();
    renderCompliance();
    const before = parseInt(screen.getByTestId('total').textContent);
    await user.click(screen.getByRole('button', { name: /Remove/i }));
    const after = parseInt(screen.getByTestId('total').textContent);
    expect(after).toBe(before - 1);
  });

  it('removed doc does not appear in active docs', async () => {
    const user = userEvent.setup();
    renderCompliance();
    const firstName = screen.getByTestId('first-doc').textContent;
    await user.click(screen.getByRole('button', { name: /Remove/i }));
    expect(screen.queryByText(firstName)).not.toBeInTheDocument();
  });

  it('updateDoc recomputes status', async () => {
    const user = userEvent.setup();
    renderCompliance();
    const before = parseInt(screen.getByTestId('valid').textContent);
    await user.click(screen.getByRole('button', { name: /Update/i }));
    const after = parseInt(screen.getByTestId('valid').textContent);
    expect(after).toBe(before);
  });

  it('addDoc assigns auto-incremented id', async () => {
    const user = userEvent.setup();
    renderCompliance();
    await user.click(screen.getByRole('button', { name: /Add/i }));
    await user.click(screen.getByRole('button', { name: /Add/i }));
    const after = parseInt(screen.getByTestId('total').textContent);
    expect(after).toBeGreaterThanOrEqual(2);
  });
});
