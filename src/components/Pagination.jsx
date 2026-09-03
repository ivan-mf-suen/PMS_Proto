import { useTranslation } from '../i18n/LanguageContext';

export default function Pagination({ total, page, perPage, onPageChange, onPerPageChange, perPageOptions = [10, 50, 250] }) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, total);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
        <select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none' }}>
          {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>{t('common.perPage')}</span>
      </div>
      <div style={{ fontSize: 13, color: '#64748B' }}>
        {t('common.showing', { from, to, total })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: safePage <= 1 ? '#CBD5E1' : '#475569', cursor: safePage <= 1 ? 'default' : 'pointer' }}>{t('common.prev')}</button>
        <input type="number" min={1} max={totalPages} value={safePage} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) onPageChange(Math.max(1, Math.min(totalPages, v))); }} style={{ width: 44, padding: '5px 4px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, textAlign: 'center', outline: 'none', background: '#fff' }} />
        <span style={{ fontSize: 13, color: '#64748B' }}>{t('common.ofPages', { total: totalPages })}</span>
        <button disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: safePage >= totalPages ? '#CBD5E1' : '#475569', cursor: safePage >= totalPages ? 'default' : 'pointer' }}>{t('common.next')}</button>
      </div>
    </div>
  );
}
