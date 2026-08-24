import { test, expect } from '@playwright/test';

test.describe('PMS Smoke Tests', () => {
  test('login screen loads with role cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Property Management System (PMS)')).toBeVisible();
    await expect(page.getByText('Presentation Quick-Login (Select Role)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'SSD OIC' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Super Admin' })).toBeVisible();
  });

  test('language toggle switches to Chinese', async ({ page }) => {
    await page.goto('/');
    const langButton = page.getByRole('button', { name: /繁體中文/ });
    await expect(langButton).toBeVisible();
    await langButton.click();
    await expect(page.getByText('物業管理系統 (PMS)')).toBeVisible();
  });

  test('login as SSD OIC navigates to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SSD OIC' }).click();
    await expect(page.getByText('Work Orders')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Properties')).toBeVisible();
  });

  test('dashboard shows KPI squares', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SSD OIC' }).click();
    await expect(page.getByText('Work Orders')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Active Work Orders')).toBeVisible();
    await expect(page.getByText('Pending Approval')).toBeVisible();
  });

  test('navigate to Work Orders page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SSD OIC' }).click();
    await page.getByText('Work Orders').first().click();
    await expect(page.getByText('Search by ID, title, assignee...')).toBeVisible({ timeout: 5000 });
  });

  test('navigate to Properties page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SSD OIC' }).click();
    await page.getByText('Properties').first().click();
    await expect(page.getByText('Search by name, address, or centre...')).toBeVisible({ timeout: 5000 });
  });

  test('navigate to Compliance Vault page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'SSD OIC' }).click();
    await page.getByText('Compliance Vault').first().click();
    await expect(page.getByText('Search certificates, property, or reference...')).toBeVisible({ timeout: 5000 });
  });
});
