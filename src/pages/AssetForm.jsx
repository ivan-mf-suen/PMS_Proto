import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CENTERS } from '../data/constants';
import { useTranslation } from '../i18n/LanguageContext';

const ALL_TYPES = ['HVAC', 'Fire Safety', 'Vertical Transport', 'Power', 'Security', 'Plumbing', 'MEP', 'Electrical'];
const ALL_STATUSES = ['Operational', 'Needs Inspection', 'Under Maintenance'];
const CONDITIONS = ['Good', 'Fair', 'Poor'];
const DEPARTMENTS = ['SSD', 'PWD', 'ITD'];

export default function AssetForm({ mode, asset = null, onBack, onAdd, onUpdate, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => ({
    name: asset?.name || '',
    type: asset?.type || 'HVAC',
    location: asset?.location || '',
    status: asset?.status || 'Operational',
    manufacturer: asset?.manufacturer || '',
    model: asset?.model || '',
    serialNumber: asset?.serialNumber || '',
    installYear: asset?.installYear || 2024,
    warrantyExpiry: asset?.warrantyExpiry || '',
    expectedLifespan: asset?.expectedLifespan || 20,
    condition: asset?.condition || 'Good',
    department: asset?.department || 'SSD',
  }));

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = form.name.trim().length > 0 && form.location.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const record = {
      name: form.name.trim(),
      type: form.type,
      location: form.location,
      status: form.status,
      manufacturer: form.manufacturer.trim(),
      model: form.model.trim(),
      serialNumber: form.serialNumber.trim(),
      installYear: Number(form.installYear) || 2024,
      warrantyExpiry: form.warrantyExpiry,
      expectedLifespan: Number(form.expectedLifespan) || 20,
      condition: form.condition,
      department: form.department,
    };
    if (mode === 'edit' && asset) {
      onUpdate(asset.id, record);
      onSaved(asset.id);
    } else {
      const created = onAdd(record);
      onSaved(created.id);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };
  const fieldStyle = { marginBottom: 16 };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> {t('assets.form.back')}
      </button>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 20 }}>
          {mode === 'edit' ? t('assets.form.editTitle') : t('assets.form.addTitle')}
        </div>
        <div>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t('assets.form.name')} <span style={{ color: 'var(--critical)' }}>*</span></label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('assets.form.namePh')} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.type')} <span style={{ color: 'var(--critical)' }}>*</span></label>
              <select value={form.type} onChange={(e) => update('type', e.target.value)} style={inputStyle}>
                {ALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.status')} <span style={{ color: 'var(--critical)' }}>*</span></label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} style={inputStyle}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t('assets.form.location')} <span style={{ color: 'var(--critical)' }}>*</span></label>
            <select value={form.location} onChange={(e) => update('location', e.target.value)} style={inputStyle}>
              <option value="">{t('assets.form.selectLocation')}</option>
              <option value="All Sites">{t('assets.form.allSites')}</option>
              {CENTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.manufacturer')}</label>
              <input value={form.manufacturer} onChange={(e) => update('manufacturer', e.target.value)} placeholder={t('assets.form.manufacturerPh')} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.model')}</label>
              <input value={form.model} onChange={(e) => update('model', e.target.value)} placeholder={t('assets.form.modelPh')} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.serial')}</label>
              <input value={form.serialNumber} onChange={(e) => update('serialNumber', e.target.value)} placeholder={t('assets.form.serialPh')} style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.department')}</label>
              <select value={form.department} onChange={(e) => update('department', e.target.value)} style={inputStyle}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.installYear')}</label>
              <input type="number" value={form.installYear} onChange={(e) => update('installYear', parseInt(e.target.value) || 2024)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.warranty')}</label>
              <input type="date" value={form.warrantyExpiry} onChange={(e) => update('warrantyExpiry', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.condition')}</label>
              <select value={form.condition} onChange={(e) => update('condition', e.target.value)} style={inputStyle}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t('assets.form.lifespan')}</label>
            <input type="number" value={form.expectedLifespan} onChange={(e) => update('expectedLifespan', parseInt(e.target.value) || 20)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>{t('assets.form.cancel')}</button>
            <button onClick={handleSave} disabled={!canSave} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: canSave ? 'var(--primary)' : '#CBD5E1', fontSize: 13, fontWeight: 600, color: '#fff', cursor: canSave ? 'pointer' : 'not-allowed' }}>
              {mode === 'edit' ? t('assets.form.saveChanges') : t('assets.form.addAsset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
