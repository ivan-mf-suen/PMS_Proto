import { useState } from 'react';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

const EMPTY_FORM = { name: '', unitCode: '', unit: '', lsgNlsg: 'LSG', contact: '', email: '', phone: '', address: '' };

export default function PropertyCreate({ onBack, onCreated, onAddProperty, mode = 'create', property, onUpdate }) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(isEdit && property ? {
    name: property.name || '',
    unitCode: property.unitCode || '',
    unit: property.unit || '',
    lsgNlsg: property.lsgNlsg || 'LSG',
    contact: property.contact || '',
    email: property.email || '',
    phone: property.phone || '',
    address: property.address || '',
  } : { ...EMPTY_FORM });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const nameValid = form.name.trim().length > 0;
  const unitCodeValid = form.unitCode.trim().length > 0;
  const canSave = nameValid && unitCodeValid;

  const emailValid = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const handleSave = () => {
    if (!canSave || !emailValid) return;
    const record = {
      name: form.name.trim(),
      unitCode: form.unitCode.trim(),
      unit: form.unit.trim(),
      lsgNlsg: form.lsgNlsg,
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    if (isEdit) {
      onUpdate(property.id, record);
      onCreated(property.id);
    } else {
      const created = onAddProperty(record);
      onCreated(created.id);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 };

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 12 }}>
        <ArrowLeft size={16} /> {t('propertyCreate.back')}
      </button>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="var(--info)" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>{isEdit ? t('propertyEdit.title') : t('propertyCreate.title')}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{isEdit ? t('propertyEdit.subtitle') : t('propertyCreate.subtitle')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t('properties.col.name')} *</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g., PLK Main Building (Causeway Bay)" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('properties.col.unitCode')} *</label>
              <input value={form.unitCode} onChange={(e) => update('unitCode', e.target.value)} placeholder="e.g., CB-01" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('properties.col.unit')}</label>
              <input value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="e.g., Headquarters" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>LSG/NLSG</label>
            <select value={form.lsgNlsg} onChange={(e) => update('lsgNlsg', e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
              <option value="LSG">LSG</option>
              <option value="NLSG">NLSG</option>
              <option value="Contract Home">Contract Home</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('properties.col.contact')}</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={form.contact} onChange={(e) => update('contact', e.target.value)} placeholder="e.g., Chan Siu Ming" style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@plk.org.hk" style={{ ...inputStyle, paddingLeft: 34 }} />
                {form.email && !emailValid && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#DC2626', marginTop: 4 }}>
                    <XCircle size={12} /> {t('propertyCreate.invalidEmail')}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+852 2839 1234" style={{ ...inputStyle, paddingLeft: 34 }} />
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="e.g., 66 Leighton Road, Causeway Bay" style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>{t('common.cancel')}</button>
            <button onClick={handleSave} disabled={!canSave || !emailValid} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: canSave && emailValid ? 'var(--primary)' : '#CBD5E1', fontSize: 13, fontWeight: 600, color: '#fff', cursor: canSave && emailValid ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} /> {t('propertyCreate.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
