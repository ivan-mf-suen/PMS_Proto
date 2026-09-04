import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useAssets } from '../context/AssetsContext';
import { FLOORS, EQUIPMENT_CATEGORIES, TC01_ROOMS } from '../data/tc01Assets';

const ALL_STATUSES = ['Operational', 'Under Maintenance', 'Needs Inspection'];
const CONDITIONS = ['Good', 'Fair', 'Poor'];

export default function AssetForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { assets, addAsset, updateAsset } = useAssets();
  const editing = assets.find((a) => a.id === id) || null;

  const [form, setForm] = useState({
    floor: editing?.floor || '4F',
    room: editing?.room || '',
    category: editing?.category || EQUIPMENT_CATEGORIES[0],
    equipment: editing?.equipment || '',
    installYear: editing?.installYear || 2011,
    renovation: editing?.renovation || '',
    status: editing?.status || 'Operational',
    condition: editing?.condition || 'Good',
  });

  const roomsForFloor = useMemo(
    () => TC01_ROOMS.filter((r) => r.floor === form.floor).map((r) => r.name),
    [form.floor]
  );

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = form.room.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const record = {
      propertyId: 13,
      propertyCode: 'TC-01',
      propertyName: '保良局東涌護老院',
      floor: form.floor,
      room: form.room.trim(),
      category: form.category,
      equipment: form.category === '櫃' ? '櫃' : form.category === '煮食設備' ? '煮食設備' : '冷氣機/風扇/抽氣扇',
      installYear: Number(form.installYear) || 2011,
      renovation: form.renovation.trim(),
      status: form.status,
      condition: form.condition,
      lastService: editing?.lastService || '',
      nextService: editing?.nextService || '',
      serviceHistory: editing?.serviceHistory || [],
    };
    if (editing) {
      updateAsset(editing.id, record);
      navigate(`/assets/${editing.id}`);
    } else {
      const created = addAsset(record);
      navigate(`/assets/${created.id}`);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff', color: 'var(--foreground)' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };
  const fieldStyle = { marginBottom: 16 };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <button onClick={() => navigate(editing ? `/assets/${editing.id}` : '/assets')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> {t('assets.form.back')}
      </button>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 20 }}>
          {editing ? t('assets.form.editTitle') : t('assets.form.addTitle')}
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.floor')} <span style={{ color: 'var(--critical)' }}>*</span></label>
              <select value={form.floor} onChange={(e) => { update('floor', e.target.value); update('room', ''); }} style={inputStyle}>
                {FLOORS.map((f) => <option key={f.key} value={f.key}>{f.key}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.room')} <span style={{ color: 'var(--critical)' }}>*</span></label>
              <select value={form.room} onChange={(e) => update('room', e.target.value)} style={inputStyle}>
                <option value="">{t('assets.form.selectRoom')}</option>
                {roomsForFloor.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.category')} <span style={{ color: 'var(--critical)' }}>*</span></label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} style={inputStyle}>
                {EQUIPMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.installYear')}</label>
              <input type="number" value={form.installYear} onChange={(e) => update('installYear', parseInt(e.target.value) || 2011)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.status')}</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} style={inputStyle}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('assets.form.condition')}</label>
              <select value={form.condition} onChange={(e) => update('condition', e.target.value)} style={inputStyle}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t('assets.form.renovation')}</label>
            <input value={form.renovation} onChange={(e) => update('renovation', e.target.value)} placeholder={t('assets.form.renovationPh')} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => navigate(editing ? `/assets/${editing.id}` : '/assets')} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>{t('assets.form.cancel')}</button>
            <button onClick={handleSave} disabled={!canSave} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: canSave ? 'var(--primary)' : '#CBD5E1', fontSize: 13, fontWeight: 600, color: '#fff', cursor: canSave ? 'pointer' : 'not-allowed' }}>
              {editing ? t('assets.form.saveChanges') : t('assets.form.addAsset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
