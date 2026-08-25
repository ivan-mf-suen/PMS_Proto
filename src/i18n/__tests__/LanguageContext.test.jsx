import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useTranslation, useLanguage } from '../LanguageContext';

function TestComponent() {
  const { t } = useTranslation();
  return (
    <div>
      <span data-testid="title">{t('login.brandName')}</span>
      <span data-testid="param">{t('compliance.validCount', { valid: 5, total: 10 })}</span>
      <span data-testid="missing">{t('nonexistent.key')}</span>
    </div>
  );
}

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>
      {language}
    </button>
  );
}

describe('LanguageContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('defaults to English', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('title')).toHaveTextContent('Property Management System (PMS)');
  });

  it('translates to Chinese when language changes', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageToggle />
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('title')).toHaveTextContent('Property Management System (PMS)');

    await user.click(screen.getByRole('button', { name: 'en' }));

    expect(screen.getByTestId('title')).toHaveTextContent('物業管理系統 (PMS)');
  });

  it('interpolates parameters with {param} syntax', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('param')).toHaveTextContent('5/10 valid');
  });

  it('replaces all occurrences of a parameter', () => {
    function MultiParam() {
      const { t } = useTranslation();
      return <span data-testid="multi">{t('compliance.validCount', { valid: 'X', total: 'Y' })}</span>;
    }
    render(
      <LanguageProvider>
        <MultiParam />
      </LanguageProvider>
    );
    const text = screen.getByTestId('multi').textContent;
    expect(text).toContain('X');
    expect(text).toContain('Y');
  });

  it('falls back to key when translation is missing', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('missing')).toHaveTextContent('nonexistent.key');
  });

  it('falls back to English when key exists in en but not in zh', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageToggle />
        <TestComponent />
      </LanguageProvider>
    );

    await user.click(screen.getByRole('button', { name: 'en' }));

    expect(screen.getByTestId('title')).toHaveTextContent('物業管理系統 (PMS)');
  });

  it('persists language choice to sessionStorage', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageToggle />
      </LanguageProvider>
    );

    await user.click(screen.getByRole('button', { name: 'en' }));

    expect(sessionStorage.getItem('pms-lang')).toBe('zh');
  });

  it('restores language from sessionStorage on remount', () => {
    sessionStorage.setItem('pms-lang', 'zh');
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('title')).toHaveTextContent('物業管理系統 (PMS)');
  });

  it('handles sessionStorage errors gracefully', () => {
    const original = sessionStorage.setItem;
    sessionStorage.setItem = () => { throw new Error('quota'); };

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('title')).toHaveTextContent('Property Management System (PMS)');
    sessionStorage.setItem = original;
  });
});
