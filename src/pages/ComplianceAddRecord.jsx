import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_CONFIG, CATEGORY_ICON, COMPLIANCE_CATEGORIES, PROPERTIES } from '../data/constants';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ROLES } from '../data/constants';
import { uploadAttachment, DOC_TYPES } from '../services/complianceFileService';
import ComboBox from '../components/ComboBox';
import { computeNextDue } from '../utils/dateUtils';
import {
  ArrowLeft, Bell, Mail, Plus, X, ChevronDown, ChevronRight, Trash2,
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

const EMPTY_FORM = { name: '', category: '', center: '', documentRef: '', issuedBy: '', inspectionDate: '', cycleMonths: 12, responsible: '', notes: '', expiry: '' };

export default function ComplianceAddRecord({ selectedCenter }) {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const { addDoc, docs } = useCompliance();
  const navigate = useNavigate();
  const uploaderName = permissions?.name || 'System';

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [files, setFiles] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [skipEffective, setSkipEffective] = useState(false);

  const isCentreLocked = !!selectedCenter && selectedCenter !== 'All';

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (isCentreLocked && form.center !== selectedCenter) {
      setForm((prev) => ({ ...prev, center: selectedCenter }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenter]);

  useEffect(() => {
    const creatorUser = SYSTEM_USERS.find((u) => u.name === uploaderName) || SYSTEM_USERS.find((u) => u.label === uploaderName) || null;
    const baseEmail = uploaderName && uploaderName !== 'System' ? uploaderName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') : '';
    const creatorEmail = baseEmail ? `${baseEmail}@poleungkuk.org.hk` : '';
    setReminders([{
      id: `rem-default-${Date.now()}`,
      name: `${form.name || 'Document'} Reminder`,
      when: { type: 'before_expiry', daysBefore: 30 },
      channels: { inApp: true, email: true },
      recipients: { userIds: creatorUser ? [creatorUser.id] : [], emails: creatorEmail ? [creatorEmail] : [] },
      emailSubject: `Reminder: {docName} expiring on {expiryDate}`,
      messageTemplate: DEFAULT_REMINDER_MSG + `\n\n${t('compliance.reminder.systemGenerated')}`,
      messageStyle: { fontSize: '11px', color: '#334155' },
    }]);
    setShowReminderForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveDateFilled = !skipEffective && !!form.inspectionDate;
  const autoNext = effectiveDateFilled ? computeNextDue(form.inspectionDate, Number(form.cycleMonths) || 12) : '';

  const expiryValue = effectiveDateFilled ? autoNext : form.expiry;
  const expiryReadOnly = effectiveDateFilled;

  const hasEffectiveDate = effectiveDateFilled;
  const hasExpiry = !!expiryValue;
  const canSave = !!form.name && !!form.category && !!form.center && (hasEffectiveDate || hasExpiry);

  const toggleSkipEffective = () => {
    setSkipEffective((prev) => !prev);
    if (!skipEffective) {
      update('inspectionDate', '');
      update('expiry', '');
    }
  };

  const nameHistory = [...new Set(docs.map((d) => d.name).filter(Boolean))];
  const issuedByHistory = [...new Set(docs.map((d) => d.issuedBy).filter(Boolean))];
  const responsibleHistory = [...new Set(docs.map((d) => d.responsible).filter(Boolean))];
  const filteredNameHistory = form.category ? nameHistory.filter((n) => docs.some((d) => d.name === n && d.category === form.category)) : nameHistory;

  const categoryOptions = COMPLIANCE_CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_KEY_MAP[c] ? t(CATEGORY_KEY_MAP[c]) : c,
  }));

  const propertyOptions = PROPERTIES.map((p) => ({ value: p.name, label: p.name }));

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    if (!canSave) return;
    const newId = `DOC-${Date.now()}`;
    const finalExpiry = hasEffectiveDate ? autoNext : form.expiry;
    const newDoc = {
      id: newId,
      name: form.name,
      category: form.category,
      center: isCentreLocked ? selectedCenter : form.center,
      documentRef: form.documentRef,
      issuedBy: form.issuedBy,
      inspectionDate: skipEffective ? '' : form.inspectionDate,
      effectiveDate: skipEffective ? '' : form.inspectionDate,
      cycleMonths: Number(form.cycleMonths),
      expiry: finalExpiry,
      responsible: form.responsible,
      notes: form.notes,
      status: 'Valid',
      uploader: uploaderName,
    };
    addDoc(newDoc);
    files.forEach((f) => {
      if (f.file) {
        uploadAttachment(newId, { file: f.file, name: f.name || f.file.name, docType: f.docType, docDate: f.docDate, expiryDate: f.expiryDate }, uploaderName);
      }
    });
    if (reminders.length > 0) {
      const now = new Date().toISOString();
      const savedReminders = reminders.map((r, idx) => {
        const withDefaults = idx === 0
          ? {
              ...r,
              recipients: {
                ...r.recipients,
                userIds: (r.recipients?.userIds?.length ? r.recipients.userIds : [creatorIdForSave()]),
                emails: (r.recipients?.emails?.length ? r.recipients.emails : [creatorEmailForSave()]),
              },
            }
          : r;
        return { ...withDefaults, id: r.id || `rem-${Date.now()}-${idx}`, docId: newId, active: true, createdAt: now };
      });
      try { localStorage.setItem(`cv-reminders-${newId}`, JSON.stringify(savedReminders)); } catch {}
    }
    navigate(`/compliance/${newId}`);
  };

  const creatorIdForSave = () => {
    const cu = SYSTEM_USERS.find((u) => u.name === uploaderName) || SYSTEM_USERS.find((u) => u.label === uploaderName) || null;
    return cu ? cu.id : '';
  };
  const creatorEmailForSave = () => {
    const base = uploaderName && uploaderName !== 'System' ? uploaderName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') : '';
    return base ? `${base}@poleungkuk.org.hk` : '';
  };

  const fieldStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <button onClick={() => navigate('/compliance')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 12 }}>
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
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('compliance.detail.name')} *</label>
            <input list="add-name-history" value={form.name} onChange={(e) => update('name', e.target.value)} style={fieldStyle} />
            <datalist id="add-name-history">
              {filteredNameHistory.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('compliance.detail.property')} *</label>
            {isCentreLocked ? (
              <input value={form.center} readOnly style={{ ...fieldStyle, background: '#F8FAFC', color: '#475569', cursor: 'not-allowed' }} />
            ) : (
              <ComboBox value={form.center} onChange={(v) => update('center', v)} options={propertyOptions} placeholder={t('compliance.form.selectProperty')} />
            )}
            {isCentreLocked && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{t('compliance.propertyLocked')}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>{t('compliance.detail.ref')}</label>
              <input value={form.documentRef} onChange={(e) => update('documentRef', e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('compliance.detail.issuedBy')}</label>
              <input list="add-issuedby-history" value={form.issuedBy} onChange={(e) => update('issuedBy', e.target.value)} style={fieldStyle} />
              <datalist id="add-issuedby-history">
                {issuedByHistory.map((v) => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>{t('compliance.detail.effectiveDate')}</label>
              <input type="date" value={skipEffective ? '' : form.inspectionDate} onChange={(e) => update('inspectionDate', e.target.value)} disabled={skipEffective} style={{ ...fieldStyle, opacity: skipEffective ? 0.5 : 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 11, color: '#64748B', cursor: 'pointer' }}>
                <input type="checkbox" checked={skipEffective} onChange={toggleSkipEffective} style={{ cursor: 'pointer' }} />
                {t('compliance.form.skip')}
              </label>
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
            <div>
              <label style={labelStyle}>{t('compliance.detail.expiry')}{skipEffective ? ' *' : ''}</label>
              <input type="date" value={expiryValue} onChange={(e) => update('expiry', e.target.value)} disabled={expiryReadOnly} style={{ ...fieldStyle, opacity: expiryReadOnly ? 0.6 : 1 }} />
              {effectiveDateFilled && <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{t('compliance.autoExpiryHint')}</div>}
            </div>
          </div>
          {autoNext && effectiveDateFilled && (
            <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 6, background: '#F0F9FF', fontSize: 12, color: '#0369A1' }}>
              <strong>{t('compliance.detail.nextDue')}:</strong> {autoNext}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t('compliance.detail.responsible')}</label>
            <input list="add-responsible-history" value={form.responsible} onChange={(e) => update('responsible', e.target.value)} style={fieldStyle} />
            <datalist id="add-responsible-history">
              {responsibleHistory.map((v) => <option key={v} value={v} />)}
            </datalist>
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
          <button onClick={() => setUploadOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> {t('compliance.attach.addFile')}
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {files.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>{t('compliance.attach.noFiles')}</div>
          )}
          {files.map((f, idx) => (
            <div key={f.id} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, background: '#FAFBFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{t('compliance.attach.fileLabel', { n: idx + 1 })}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name || f.file?.name || t('compliance.attach.file')}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      {f.docType ? t(`compliance.doctype.${f.docType}`) : ''}
                      {f.docDate ? ` · ${f.docDate}` : ''}
                      {f.expiryDate ? ` · ${t('compliance.attach.expiryDate')}: ${f.expiryDate}` : ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFile(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', flexShrink: 0 }} aria-label={t('common.delete') || 'Remove'}><X size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSubmit={(payload) => {
            setFiles((prev) => [...prev, { id: `f-${Date.now()}`, ...payload }]);
            setUploadOpen(false);
          }}
          t={t}
        />
      )}

      {/* Reminder Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={15} color="#F59E0B" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.reminder.title')}</span>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>({reminders.length})</span>
          </div>
          <button onClick={() => { setEditingId(null); setShowReminderForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> {t('compliance.reminder.add')}
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {showReminderForm && (
            <div style={{ marginBottom: reminders.length ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Plus size={13} color="#F59E0B" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{editingId !== null ? t('compliance.reminder.edit') : t('compliance.reminder.add')}</span>
              </div>
              <AddRecordReminderForm
                docName={form.name || 'Document'}
                initial={editingId !== null ? (reminders.find((r) => r.id === editingId) || null) : null}
                onSave={(r) => {
                  const newId = editingId ?? `rem-${Date.now()}`;
                  setReminders((prev) => {
                    if (prev.some((x) => x.id === editingId)) {
                      return prev.map((x) => x.id === editingId ? { ...r, id: editingId } : x);
                    }
                    return [...prev, { ...r, id: newId }];
                  });
                  setExpandedIds((prev) => {
                    const next = new Set(prev);
                    next.add(editingId ?? newId);
                    return next;
                  });
                  setEditingId(null);
                  setShowReminderForm(false);
                }}
                onCancel={() => { setEditingId(null); setShowReminderForm(false); }}
                t={t}
              />
            </div>
          )}

          {reminders.length === 0 && !showReminderForm ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>
              <Bell size={24} color="#CBD5E1" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t('compliance.reminder.empty')}</div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{t('compliance.reminder.emptyHint')}</div>
            </div>
          ) : (
            reminders.map((r) => {
              const isOpen = expandedIds.has(r.id);
              const hasRecipients = (r.recipients?.userIds?.length || 0) || (r.recipients?.emails?.length || 0);
              return (
                <div key={r.id} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: '#FFFBEB', marginBottom: 8 }}>
                  <div
                    onClick={() => setExpandedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(r.id)) next.delete(r.id); else next.add(r.id);
                      return next;
                    })}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isOpen ? <ChevronDown size={14} color="#94A3B8" /> : <ChevronRight size={14} color="#94A3B8" />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {r.when?.type === 'before_expiry' ? `${t('compliance.reminder.beforeExpiry')}: ${r.when.daysBefore} days` : r.when?.specificDate || ''}
                          {' · '}
                          {r.channels?.inApp && r.channels?.email ? 'In-App + Email' : r.channels?.inApp ? 'In-App' : 'Email'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditingId(r.id); setShowReminderForm(true); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 11, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>{t('compliance.reminder.edit')}</button>
                      <button onClick={() => setReminders((prev) => prev.filter((x) => x.id !== r.id))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 11, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}><Trash2 size={11} /> {t('compliance.reminder.delete')}</button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)', fontSize: 12, color: '#475569', display: 'grid', gap: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{t('compliance.reminder.form.recipients')}: </span>
                        {hasRecipients ? (
                          <span>
                            {r.recipients?.userIds?.length ? `${r.recipients.userIds.length} ${t('compliance.reminder.form.usersSelected')}` : ''}
                            {r.recipients?.userIds?.length && r.recipients?.emails?.length ? ' · ' : ''}
                            {r.recipients?.emails?.length ? r.recipients.emails.join(', ') : ''}
                          </span>
                        ) : '—'}
                      </div>
                      {r.emailSubject && <div><span style={{ fontWeight: 600 }}>{t('compliance.reminder.form.emailSubject')}: </span>{r.emailSubject}</div>}
                      {r.messageTemplate && (
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{t('compliance.reminder.form.message')}</div>
                          <div style={{ whiteSpace: 'pre-wrap', color: '#64748B', fontSize: 11 }}>{r.messageTemplate}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Save / Cancel Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 24, alignItems: 'center' }}>
        {!canSave && (form.name && form.category && form.center) && (
          <span style={{ fontSize: 12, color: '#B45309', marginRight: 'auto' }}>{t('compliance.form.dateRequired')}</span>
        )}
        <button onClick={() => navigate('/compliance')} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.form.cancel')}</button>
        <button onClick={handleSave} disabled={!canSave} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: canSave ? 1 : 0.5 }}>{t('compliance.reminder.form.save')}</button>
      </div>
    </div>
  );
}

// ── Add Record Reminder Form ──────────────────────────────
function AddRecordReminderForm({ docName, onSave, onCancel, t, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [whenType, setWhenType] = useState(initial?.when?.type || 'before_expiry');
  const [daysBefore, setDaysBefore] = useState(initial?.when?.daysBefore || 30);
  const [specificDate, setSpecificDate] = useState(initial?.when?.specificDate || '');
  const [isRecurring, setIsRecurring] = useState(initial?.when?.recurring || false);
  const [frequency, setFrequency] = useState(initial?.when?.frequency || 'monthly');
  const [startDate, setStartDate] = useState(initial?.when?.startDate || '');
  const [inApp, setInApp] = useState(initial?.channels?.inApp ?? true);
  const [email, setEmail] = useState(initial?.channels?.email ?? true);
  const [selectedUsers, setSelectedUsers] = useState(initial?.recipients?.userIds || []);
  const [customEmails, setCustomEmails] = useState(initial?.recipients?.emails || []);
  const [emailInput, setEmailInput] = useState('');
  const [emailSubject, setEmailSubject] = useState(initial?.emailSubject || `Reminder: ${docName} expiring on {expiryDate}`);
  const [message, setMessage] = useState(initial?.messageTemplate || DEFAULT_REMINDER_MSG + `\n\n${t('compliance.reminder.systemGenerated')}`);
  const [msgFontSize, setMsgFontSize] = useState(initial?.messageStyle?.fontSize || '11px');
  const [msgColor, setMsgColor] = useState(initial?.messageStyle?.color || '#334155');
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
                {filteredUsers.length === 0 && <div style={{ padding: '8px 12px', fontSize: 11, color: '#94A3B8' }}>{t('compliance.attach.noUsers')}</div>}
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

// ── Upload Document Modal ────────────────────────────────
function UploadModal({ onClose, onSubmit, t }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('');
  const [docDate, setDocDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t('compliance.upload.title')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{t('compliance.upload.file')}</label>
            <button onClick={() => document.getElementById('cv-add-upload-input')?.click()} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: file ? 'var(--foreground)' : '#94A3B8', fontWeight: file ? 600 : 500, boxSizing: 'border-box' }}>
              {file ? file.name : t('compliance.upload.chooseFile')}
            </button>
            <input id="cv-add-upload-input" type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!name) setName(f.name); } }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{t('compliance.upload.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{t('compliance.upload.type')}</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, appearance: 'auto', boxSizing: 'border-box' }}>
                <option value="">{t('compliance.form.selectCategory')}</option>
                {DOC_TYPES.map((dt) => <option key={dt} value={dt}>{t(`compliance.doctype.${dt}`)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{t('compliance.upload.docDate')}</label>
              <input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{t('compliance.upload.expiry')}</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{t('compliance.upload.expiryOptional')}</div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
          <button onClick={() => onSubmit({ file, name: name.trim() || file?.name || 'Untitled', docType, docDate, expiryDate: expiryDate || null })} disabled={!file} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: file ? 1 : 0.5 }}>{t('compliance.upload.submit')}</button>
        </div>
      </div>
    </div>
  );
}
