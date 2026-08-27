import { useState, useRef, useEffect } from 'react';
import { CATEGORY_CONFIG, CATEGORY_ICON, COMPLIANCE_CATEGORIES, PROPERTIES } from '../data/constants';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ROLES } from '../data/constants';
import { uploadAttachment } from '../services/complianceFileService';
import ComboBox from '../components/ComboBox';
import {
  ArrowLeft, Bell, Mail, Plus, X, ChevronDown,
} from 'lucide-react';

const CATEGORY_KEY_MAP = {
  '年檢項目 通風系統': 'compliance.cat.Ventilation',
  '定期檢測項目 電力檢查WR2': 'compliance.cat.ElectricalWR2',
  '年檢項目 消防': 'compliance.cat.FireSafety',
  '年檢項目 升降機/餐𨋢': 'compliance.cat.Lifts',
  '年檢項目 水務': 'compliance.cat.WaterHygiene',
  '年檢項目 環境': 'compliance.cat.Environmental',
  '年檢項目 煤氣': 'compliance.cat.Gas',
  '年檢項目 其他': 'compliance.cat.Other',
  '年檢項目 租約': 'compliance.cat.Lease',
};

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const REMINDER_VARIABLES = [
  { value: '{recipient}', label: 'Recipient' },
  { value: '{docName}', label: 'Document Name' },
  { value: '{property}', label: 'Property' },
  { value: '{expiryDate}', label: 'Expiry Date' },
  { value: '{status}', label: 'Status' },
  { value: '{effectiveDate}', label: 'Effective Date' },
  { value: '{cycle}', label: 'Cycle' },
];

const MSG_FONT_SIZES = ['11px', '12px', '14px', '16px'];
const MSG_COLORS = ['#334155', '#DC2626', '#2563EB', '#16A34A', '#9333EA', '#EA580C'];

const SYSTEM_USERS = Object.entries(ROLES).map(([key, r]) => ({ id: key, name: r.name, label: r.label }));

const DEFAULT_REMINDER_MSG = `Hi {recipient},

This is a reminder that the compliance document "{docName}" for {property} is expiring on {expiryDate}.

Please take action to renew or update this document before the expiry date.

Current Status: {status}
Effective Date: {effectiveDate}
Cycle: {cycle}

Thank you.`;

const EMPTY_FORM = { name: '', category: '', center: '', documentRef: '', issuedBy: '', inspectionDate: '', cycleMonths: 12, responsible: '', notes: '' };

export default function ComplianceAddRecord({ onBack, onCreated }) {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const { addDoc } = useCompliance();
  const uploaderName = permissions?.name || 'System';

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [files, setFiles] = useState([]);
  const [reminder, setReminder] = useState(null);
  const [reminderName, setReminderName] = useState('');
  const [showReminder, setShowReminder] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const nextDue = (() => {
    if (!form.inspectionDate) return '';
    const d = new Date(form.inspectionDate + 'T00:00:00');
    d.setMonth(d.getMonth() + (form.cycleMonths || 12));
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const categoryOptions = COMPLIANCE_CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_KEY_MAP[c] ? t(CATEGORY_KEY_MAP[c]) : c,
  }));

  const propertyOptions = PROPERTIES.map((p) => ({ value: p.name, label: p.name }));

  const addFile = () => {
    setFiles((prev) => [...prev, { id: `f-${Date.now()}`, file: null, name: '', docType: '', docDate: '' }]);
  };

  const updateFile = (id, field, value) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    if (!form.name || !form.category || !form.center) return;
    const newId = `DOC-${Date.now()}`;
    const newDoc = {
      id: newId,
      name: form.name,
      category: form.category,
      center: form.center,
      documentRef: form.documentRef,
      issuedBy: form.issuedBy,
      inspectionDate: form.inspectionDate,
      effectiveDate: form.inspectionDate,
      cycleMonths: Number(form.cycleMonths),
      expiry: nextDue,
      responsible: form.responsible,
      notes: form.notes,
      status: 'Valid',
      uploader: uploaderName,
    };
    addDoc(newDoc);
    files.forEach((f) => {
      if (f.file) {
        uploadAttachment(newId, { file: f.file, name: f.name || f.file.name, docType: f.docType, docDate: f.docDate }, uploaderName);
      }
    });
    if (reminder) {
      const reminders = [{ ...reminder, id: `rem-${Date.now()}`, docId: newId, active: true, createdAt: new Date().toISOString() }];
      try { localStorage.setItem(`cv-reminders-${newId}`, JSON.stringify(reminders)); } catch {}
    }
    onCreated(newId);
  };

  const fieldStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 12 }}>
            <ArrowLeft size={16} /> {t('compliance.detail.back')}
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('compliance.addTitle')}</h1>
        </div>
      </div>

      {/* Document Information Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.detail.section.document')}</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('compliance.detail.name')} *</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>{t('compliance.detail.category')} *</label>
              <ComboBox value={form.category} onChange={(v) => {
                const updated = { ...form, category: v };
                const cfg = CATEGORY_CONFIG[v];
                if (cfg?.defaultCycle) updated.cycleMonths = cfg.defaultCycle;
                setForm(updated);
              }} options={categoryOptions} placeholder={t('compliance.form.selectCategory')}
                renderOption={(o) => {
                  const cfg = CATEGORY_CONFIG[o.value];
                  const Icon = cfg ? CATEGORY_ICON[o.value] : null;
                  return (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {Icon && <Icon size={13} color={cfg.color} />}
                      {o.label}
                    </span>
                  );
                }} />
            </div>
            <div>
              <label style={labelStyle}>{t('compliance.detail.property')} *</label>
              <ComboBox value={form.center} onChange={(v) => update('center', v)} options={propertyOptions} placeholder={t('compliance.filter.property')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>{t('compliance.detail.ref')}</label>
              <input value={form.documentRef} onChange={(e) => update('documentRef', e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('compliance.detail.issuedBy')}</label>
              <input value={form.issuedBy} onChange={(e) => update('issuedBy', e.target.value)} style={fieldStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>{t('compliance.detail.effectiveDate')}</label>
              <input type="date" value={form.inspectionDate} onChange={(e) => update('inspectionDate', e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('compliance.detail.cycle')}</label>
              <select value={form.cycleMonths} onChange={(e) => update('cycleMonths', e.target.value)} style={{ ...fieldStyle, appearance: 'auto' }}>
                <option value={6}>6 mo</option>
                <option value={12}>1 yr</option>
                <option value={24}>2 yr</option>
                <option value={36}>3 yr</option>
              </select>
            </div>
          </div>
          {nextDue && (
            <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 6, background: '#F0F9FF', fontSize: 12, color: '#0369A1' }}>
              <strong>{t('compliance.detail.nextDue')}:</strong> {nextDue}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('compliance.detail.responsible')}</label>
            <input value={form.responsible} onChange={(e) => update('responsible', e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('compliance.detail.notes')}</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {/* Upload Documents Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.attach.title')}</div>
          <button onClick={addFile} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> Add File
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {files.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No files attached. Click "Add File" to attach supporting documents.</div>
          )}
          {files.map((f, idx) => (
            <div key={f.id} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, background: '#FAFBFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>File {idx + 1}</span>
                <button onClick={() => removeFile(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>File</label>
                  <button onClick={() => document.getElementById(`add-file-${f.id}`)?.click()} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px dashed #CBD5E1', background: '#fff', cursor: 'pointer', fontSize: 11, color: f.file ? '#334155' : '#94A3B8', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
                    {f.file ? f.file.name : 'Choose file'}
                  </button>
                  <input id={`add-file-${f.id}`} type="file" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) { updateFile(f.id, 'file', file); if (!f.name) updateFile(f.id, 'name', file.name); } }} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Doc Type</label>
                  <select value={f.docType} onChange={(e) => updateFile(f.id, 'docType', e.target.value)} style={{ ...fieldStyle, padding: '6px 8px', fontSize: 11, appearance: 'auto' }}>
                    <option value="">Select</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Inspection Report">Inspection Report</option>
                    <option value="Site Photo">Site Photo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Date</label>
                  <input type="date" value={f.docDate} onChange={(e) => updateFile(f.id, 'docDate', e.target.value)} style={{ ...fieldStyle, padding: '6px 8px', fontSize: 11 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={15} color="#F59E0B" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.reminder.title')}</span>
          </div>
          {!showReminder && (
            <button onClick={() => { setReminderName(`${form.name || 'Document'} Reminder`); setShowReminder(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={13} /> {t('compliance.reminder.add')}
            </button>
          )}
        </div>
        <div style={{ padding: 20 }}>
          {reminder ? (
            <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{reminder.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    {reminder.when?.type === 'before_expiry' ? `${t('compliance.reminder.beforeExpiry')}: ${reminder.when.daysBefore} days` : reminder.when?.specificDate || ''}
                    {' · '}
                    {reminder.channels?.inApp && reminder.channels?.email ? 'In-App + Email' : reminder.channels?.inApp ? 'In-App' : 'Email'}
                  </div>
                </div>
                <button onClick={() => { setReminder(null); setShowReminder(true); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 11, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>{t('compliance.reminder.edit')}</button>
              </div>
            </div>
          ) : !showReminder ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>
              <Bell size={24} color="#CBD5E1" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t('compliance.reminder.empty')}</div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{t('compliance.reminder.emptyHint')}</div>
            </div>
          ) : (
            <AddRecordReminderForm
              docName={form.name || 'Document'}
              reminderName={reminderName}
              onSave={(r) => { setReminder(r); setShowReminder(false); }}
              onCancel={() => setShowReminder(false)}
              t={t}
            />
          )}
        </div>
      </div>

      {/* Save / Cancel Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 24 }}>
        <button onClick={onBack} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.form.cancel')}</button>
        <button onClick={handleSave} disabled={!form.name || !form.category || !form.center} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!form.name || !form.category || !form.center) ? 0.5 : 1 }}>{t('compliance.reminder.form.save')}</button>
      </div>
    </div>
  );
}

// ── Add Record Reminder Form ──────────────────────────────
function AddRecordReminderForm({ docName, reminderName, onSave, onCancel, t }) {
  const [name, setName] = useState(reminderName);
  const [whenType, setWhenType] = useState('before_expiry');
  const [daysBefore, setDaysBefore] = useState(30);
  const [specificDate, setSpecificDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [customEmails, setCustomEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Reminder: ${docName} expiring on {expiryDate}`);
  const [message, setMessage] = useState(DEFAULT_REMINDER_MSG);
  const [msgFontSize, setMsgFontSize] = useState('11px');
  const [msgColor, setMsgColor] = useState('#334155');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userFilter, setUserFilter] = useState('');
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const varDropdownRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowUserDropdown(false);
      if (varDropdownRef.current && !varDropdownRef.current.contains(e.target)) setShowVarDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredUsers = SYSTEM_USERS.filter((u) => u.name.toLowerCase().includes(userFilter.toLowerCase()) || u.label.toLowerCase().includes(userFilter.toLowerCase()));

  const toggleUser = (id) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
  };

  const addEmail = () => {
    const v = emailInput.trim();
    if (v && !customEmails.includes(v)) {
      setCustomEmails((prev) => [...prev, v]);
      setEmailInput('');
    }
  };

  const appendDomain = () => {
    setEmailInput((prev) => prev + '@poleungkuk.org.hk');
  };

  const removeEmail = (e) => setCustomEmails((prev) => prev.filter((em) => em !== e));

  const insertVariable = (varValue) => {
    const ta = textareaRef.current;
    if (!ta) { setMessage((prev) => prev + varValue); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = message.substring(0, start) + varValue + message.substring(end);
    setMessage(newVal);
    setShowVarDropdown(false);
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + varValue.length; }, 0);
  };

  const handleSave = () => {
    onSave({
      name,
      when: { type: whenType, daysBefore: whenType === 'before_expiry' ? Number(daysBefore) : undefined, specificDate: whenType === 'specific_date' ? specificDate : undefined, recurring: whenType === 'specific_date' && isRecurring ? true : undefined, frequency: whenType === 'specific_date' && isRecurring ? frequency : undefined, startDate: whenType === 'specific_date' && isRecurring ? startDate : undefined },
      channels: { inApp, email },
      recipients: { userIds: selectedUsers, emails: customEmails },
      emailSubject,
      messageTemplate: message,
      messageStyle: { fontSize: msgFontSize, color: msgColor },
    });
  };

  const fieldStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{t('compliance.reminder.form.name')} *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{t('compliance.reminder.form.when')}</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[
              { value: 'before_expiry', label: t('compliance.reminder.form.beforeExpiry') },
              { value: 'specific_date', label: t('compliance.reminder.form.specificDate') },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setWhenType(opt.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${whenType === opt.value ? 'var(--info)' : 'var(--border)'}`, background: whenType === opt.value ? 'var(--info-bg)' : '#fff', fontSize: 12, fontWeight: 600, color: whenType === opt.value ? 'var(--primary)' : '#64748B', cursor: 'pointer' }}>
                {opt.label}
              </button>
            ))}
          </div>
          {whenType === 'before_expiry' && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" value={daysBefore} onChange={(e) => setDaysBefore(e.target.value)} min="1" max="365" style={{ ...fieldStyle, width: 80 }} />
              <span style={{ fontSize: 12, color: '#64748B' }}>{t('compliance.reminder.form.daysBefore')}</span>
            </div>
          )}
          {whenType === 'specific_date' && (
            <div style={{ marginTop: 8 }}>
              <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} style={{ ...fieldStyle, width: 200 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} style={{ cursor: 'pointer' }} />
                {t('compliance.reminder.form.makeRecurring')}
              </label>
              {isRecurring && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ ...fieldStyle, width: 140, appearance: 'auto' }}>
                    {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{t('compliance.reminder.form.starting')}</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...fieldStyle, width: 160 }} />
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>{t('compliance.reminder.form.channels')}</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={inApp} onChange={() => setInApp(!inApp)} style={{ cursor: 'pointer' }} />
              <Bell size={13} /> {t('compliance.reminder.form.inApp')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={email} onChange={() => setEmail(!email)} style={{ cursor: 'pointer' }} />
              <Mail size={13} /> {t('compliance.reminder.form.email')}
            </label>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{t('compliance.reminder.form.recipients')}</label>
          <div style={{ position: 'relative', marginTop: 4 }} ref={dropdownRef}>
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
              <span>{selectedUsers.length > 0 ? `${selectedUsers.length} ${t('compliance.reminder.form.usersSelected')}` : t('compliance.reminder.form.selectUsers')}</span>
              <ChevronDown size={14} color="#94A3B8" />
            </button>
            {showUserDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 240, overflow: 'auto' }}>
                <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                  <input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder={t('compliance.reminder.form.filterUsers')} style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {filteredUsers.map((u) => (
                  <div key={u.id} onClick={() => toggleUser(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#475569', background: selectedUsers.includes(u.id) ? 'var(--info-bg)' : 'transparent' }}>
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} readOnly style={{ cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                    <span style={{ color: '#94A3B8' }}>({u.label})</span>
                  </div>
                ))}
                {filteredUsers.length === 0 && <div style={{ padding: '8px 12px', fontSize: 11, color: '#94A3B8' }}>No users found</div>}
              </div>
            )}
          </div>
          {selectedUsers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {selectedUsers.map((uid) => {
                const u = SYSTEM_USERS.find((su) => su.id === uid);
                return (
                  <span key={uid} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#E2E8F0', fontSize: 11, fontWeight: 500, color: '#475569' }}>
                    {u?.name || uid}
                    <button onClick={() => toggleUser(uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748B' }}><X size={10} /></button>
                  </span>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }} placeholder={t('compliance.reminder.form.emailPlaceholder')} style={{ ...fieldStyle, flex: 1 }} />
            <button onClick={appendDomain} title={t('compliance.reminder.form.domainSuffix')} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: '#F8FAFC', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('compliance.reminder.form.domainSuffix')}</button>
            <button onClick={addEmail} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('compliance.reminder.form.addEmail')}</button>
          </div>
          {customEmails.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {customEmails.map((em) => (
                <span key={em} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', fontSize: 11, fontWeight: 500, color: '#92400E' }}>
                  {em}
                  <button onClick={() => removeEmail(em)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#92400E' }}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{t('compliance.reminder.form.emailSubject')}</label>
          <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} style={fieldStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{t('compliance.reminder.form.message')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <select value={msgFontSize} onChange={(e) => setMsgFontSize(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11, background: '#fff', outline: 'none' }}>
              {MSG_FONT_SIZES.map((fs) => <option key={fs} value={fs}>{fs}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 3 }}>
              {MSG_COLORS.map((c) => (
                <button key={c} onClick={() => setMsgColor(c)} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: msgColor === c ? '2px solid #1E293B' : '1px solid #E2E8F0', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
            <div style={{ position: 'relative' }} ref={varDropdownRef}>
              <button onClick={() => setShowVarDropdown(!showVarDropdown)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: '#fff', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                {t('compliance.reminder.form.insertVariable')}
              </button>
              {showVarDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 60, minWidth: 180 }}>
                  {REMINDER_VARIABLES.map((v) => (
                    <div key={v.value} onClick={() => insertVariable(v.value)} style={{ padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#475569', borderBottom: '1px solid #F1F5F9' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <span style={{ fontWeight: 600 }}>{v.label}</span>
                      <span style={{ color: '#94A3B8', marginLeft: 6, fontFamily: 'monospace', fontSize: 10 }}>{v.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)} rows={8} style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: msgFontSize, lineHeight: 1.5, color: msgColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.form.cancel')}</button>
        <button onClick={handleSave} disabled={!name} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: name ? 1 : 0.5 }}>{t('compliance.reminder.form.save')}</button>
      </div>
    </div>
  );
}
