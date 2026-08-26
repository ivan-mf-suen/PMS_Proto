import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { formatCycle } from '../data/constants';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ROLES } from '../data/constants';
import { listAttachments, uploadAttachment, deactivateAttachment, getAttachmentUrl, formatFileSize, formatTimestamp, isAttachmentActive, DOC_TYPES } from '../services/complianceFileService';
import {
  ArrowLeft, Pencil, Upload, Download, Paperclip, FileText, FileImage, X, Trash2,
  Search, CheckCircle, Clock, Bell, Mail, Plus, ChevronDown,
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

const STATUS_BG = { Valid: 'var(--success-bg)', Expiring: '#FEF3C7', Expired: '#FEE2E2' };
const STATUS_CLR = { Valid: 'var(--success)', Expiring: '#B45309', Expired: '#DC2626' };

function computeNextDue(effectiveDate, cycleMonths) {
  if (!effectiveDate) return '';
  const d = new Date(effectiveDate + 'T00:00:00');
  d.setMonth(d.getMonth() + (cycleMonths || 12));
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getReminderStorageKey(docId) {
  return `cv-reminders-${docId}`;
}

function loadReminders(docId) {
  try {
    const raw = localStorage.getItem(getReminderStorageKey(docId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveReminders(docId, reminders) {
  localStorage.setItem(getReminderStorageKey(docId), JSON.stringify(reminders));
}

const SYSTEM_USERS = Object.entries(ROLES).map(([key, r]) => ({ id: key, name: r.name, label: r.label }));

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const DEFAULT_REMINDER_MSG = `Hi {recipient},

This is a reminder that the compliance document "{docName}" for {property} is expiring on {expiryDate}.

Please take action to renew or update this document before the expiry date.

Current Status: {status}
Effective Date: {effectiveDate}
Cycle: {cycle}

Thank you.`;

export default function ComplianceDetail({ docId, onBack }) {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const { docs } = useCompliance();
  const uploaderName = permissions?.name || 'System';

  const doc = docs.find((d) => d.id === docId);

  const [attachments, setAttachments] = useState(() => doc ? listAttachments(doc.id, doc) : []);
  const [previewing, setPreviewing] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [inactiveTarget, setInactiveTarget] = useState(null);
  const [inactiveRemarks, setInactiveRemarks] = useState('');
  const [inactiveStep, setInactiveStep] = useState(0);

  const [attSearch, setAttSearch] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('all');

  const [reminders, setReminders] = useState(() => doc ? loadReminders(doc.id) : []);
  const [editingReminder, setEditingReminder] = useState(null);
  const [showReminderForm, setShowReminderForm] = useState(false);

  const refreshAttachments = useCallback(() => {
    if (doc) setAttachments(listAttachments(doc.id, doc));
  }, [doc]);

  useEffect(() => { refreshAttachments(); }, [refreshAttachments]);

  const filteredAttachments = useMemo(() => {
    let list = attachments;
    if (attStatusFilter === 'active') list = list.filter((a) => isAttachmentActive(a));
    else if (attStatusFilter === 'inactive') list = list.filter((a) => !isAttachmentActive(a));
    if (attSearch) {
      const q = attSearch.toLowerCase();
      list = list.filter((a) => (a.name && a.name.toLowerCase().includes(q)) || (a.uploader && a.uploader.toLowerCase().includes(q)));
    }
    return list;
  }, [attachments, attSearch, attStatusFilter]);

  if (!doc) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
          <ArrowLeft size={16} /> {t('compliance.detail.back')}
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>{t('compliance.noDocs')}</div>
      </div>
    );
  }

  const nextDue = computeNextDue(doc.inspectionDate, doc.cycleMonths || 12);
  const status = doc.status || 'Valid';

  const handleUploadSubmitted = (payload) => {
    uploadAttachment(doc.id, payload, uploaderName);
    refreshAttachments();
    setUploadOpen(false);
  };

  const triggerDownload = (att) => {
    const a = document.createElement('a');
    a.href = getAttachmentUrl(att);
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDeactivate = () => {
    deactivateAttachment(doc.id, inactiveTarget.id, { by: uploaderName, at: new Date().toISOString(), remarks: inactiveRemarks.trim() });
    refreshAttachments();
    setInactiveTarget(null);
    setInactiveRemarks('');
    setInactiveStep(0);
  };

  const saveReminder = (reminder) => {
    const updated = [...reminders.filter((r) => r.id !== reminder.id), reminder];
    setReminders(updated);
    saveReminders(doc.id, updated);
    setShowReminderForm(false);
    setEditingReminder(null);
  };

  const deleteReminder = (id) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveReminders(doc.id, updated);
  };

  const toggleReminderActive = (id) => {
    const updated = reminders.map((r) => r.id === id ? { ...r, active: !r.active } : r);
    setReminders(updated);
    saveReminders(doc.id, updated);
  };

  const fields = [
    { label: t('compliance.detail.name'), value: doc.name },
    { label: t('compliance.detail.category'), value: doc.category ? (CATEGORY_KEY_MAP[doc.category] ? t(CATEGORY_KEY_MAP[doc.category]) : doc.category) : '—' },
    { label: t('compliance.detail.property'), value: doc.center },
    { label: t('compliance.detail.ref'), value: doc.documentRef || '—' },
    { label: t('compliance.detail.issuedBy'), value: doc.issuedBy || '—' },
    { label: t('compliance.detail.effectiveDate'), value: doc.inspectionDate || '—' },
    { label: t('compliance.detail.nextDue'), value: nextDue || '—' },
    { label: t('compliance.detail.expiry'), value: doc.expiry || '—' },
    { label: t('compliance.detail.cycle'), value: formatCycle(doc.cycleMonths || 12) },
    { label: t('compliance.detail.responsible'), value: doc.responsible || '—' },
    { label: t('compliance.detail.status'), value: <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: STATUS_BG[status], color: STATUS_CLR[status] }}>{status}</span> },
    ...(doc.notes ? [{ label: t('compliance.detail.notes'), value: doc.notes }] : []),
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 12 }}>
            <ArrowLeft size={16} /> {t('compliance.detail.back')}
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('compliance.detail.pageTitle')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{doc.name}</p>
        </div>
      </div>

      {/* Document Fields Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.detail.section.document')}</div>
        </div>
        <div style={{ padding: 20 }}>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', padding: '8px 0', borderBottom: i < fields.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ width: 160, fontSize: 12, lineHeight: '18px', color: '#94A3B8', fontWeight: 500, flexShrink: 0 }}>{f.label}</div>
              <div style={{ flex: 1, fontSize: 13, lineHeight: '18px', color: 'var(--foreground)', fontWeight: 500 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Document History */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Paperclip size={15} color="var(--info)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.attach.title')}</span>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>({attachments.length})</span>
          </div>
          <button onClick={() => setUploadOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Upload size={13} /> {t('compliance.attach.upload')}
          </button>
        </div>

        {/* History Filters */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={attSearch} onChange={(e) => setAttSearch(e.target.value)} placeholder={t('compliance.attach.filter.search')} style={{ width: '100%', padding: '6px 10px 6px 32px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none' }} />
          </div>
          {['all', 'active', 'inactive'].map((s) => (
            <button key={s} onClick={() => setAttStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${attStatusFilter === s ? 'var(--info)' : 'var(--border)'}`, background: attStatusFilter === s ? 'var(--info-bg)' : '#fff', fontSize: 12, fontWeight: 600, color: attStatusFilter === s ? 'var(--primary)' : '#64748B', cursor: 'pointer', transition: 'all 0.15s' }}>
              {t(`compliance.attach.filter.${s}`)}
            </button>
          ))}
        </div>

        {/* History Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: t('compliance.attach.col.status'), width: 70 },
                  { label: t('compliance.attach.col.name') },
                  { label: t('compliance.attach.col.uploader'), width: 120 },
                  { label: t('compliance.attach.col.time'), width: 140 },
                  { label: t('compliance.attach.col.size'), width: 70 },
                  { label: t('compliance.attach.col.actions'), width: 160 },
                ].map((col, i) => (
                  <th key={i} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#64748B', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: col.width }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAttachments.map((att) => {
                const active = isAttachmentActive(att);
                return (
                  <tr key={att.id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: active ? 'var(--success-bg)' : '#F1F5F9', color: active ? 'var(--success)' : '#64748B' }}>{active ? t('compliance.attach.active') : t('compliance.attach.inactive')}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {att.mimeType?.startsWith('image/') ? <FileImage size={14} color="var(--info)" /> : <FileText size={14} color="#DC2626" />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{att.name}</span>
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#64748B' }}>{att.uploader}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#64748B' }}>{formatTimestamp(att.uploadedAt)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#64748B' }}>{formatFileSize(att.size)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setPreviewing(att)} style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', color: 'var(--info)', cursor: 'pointer' }}>{t('compliance.attach.preview')}</button>
                        <button onClick={() => triggerDownload(att)} style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: 'pointer' }}>{t('compliance.download')}</button>
                        {active && <button onClick={() => { setInactiveTarget(att); setInactiveStep(0); setInactiveRemarks(''); }} style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #FECACA', background: '#fff', color: '#DC2626', cursor: 'pointer' }}>{t('compliance.attach.setInactive')}</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAttachments.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t('compliance.attach.empty')}</div>
                  <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{t('compliance.attach.emptyHint')}</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Section */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={15} color="#F59E0B" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.reminder.title')}</span>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>({reminders.length})</span>
          </div>
          <button onClick={() => { setEditingReminder(null); setShowReminderForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={13} /> {t('compliance.reminder.add')}
          </button>
        </div>

        {reminders.length === 0 && !showReminderForm && (
          <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
            <Bell size={24} color="#CBD5E1" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t('compliance.reminder.empty')}</div>
            <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{t('compliance.reminder.emptyHint')}</div>
          </div>
        )}

        {reminders.length > 0 && !showReminderForm && (
          <div style={{ padding: '12px 20px' }}>
            {reminders.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: r.active ? '#FFFBEB' : '#F8FAFC', marginBottom: 8, opacity: r.active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: r.active ? '#F59E0B' : '#CBD5E1' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      {r.when.type === 'before_expiry' ? `${t('compliance.reminder.beforeExpiry')}: ${r.when.daysBefore} days` : r.when.type === 'recurring' ? `${FREQUENCIES.find((f) => f.value === r.when.frequency)?.label || r.when.frequency}` : r.when.specificDate}
                      {' · '}
                      {r.channels.inApp && r.channels.email ? 'In-App + Email' : r.channels.inApp ? 'In-App' : 'Email'}
                      {' · '}
                      {r.recipients.userIds?.length || 0} {t('compliance.reminder.users')} + {r.recipients.emails?.length || 0} {t('compliance.reminder.emails')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => toggleReminderActive(r.id)} title={r.active ? t('compliance.reminder.deactivate') : t('compliance.reminder.activate')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: r.active ? '#F59E0B' : '#CBD5E1' }}>
                    {r.active ? <CheckCircle size={14} /> : <Clock size={14} />}
                  </button>
                  <button onClick={() => { setEditingReminder(r); setShowReminderForm(true); }} title={t('compliance.reminder.edit')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteReminder(r.id)} title={t('compliance.reminder.delete')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showReminderForm && (
          <ReminderForm
            doc={doc}
            reminder={editingReminder}
            onSave={saveReminder}
            onCancel={() => { setShowReminderForm(false); setEditingReminder(null); }}
            t={t}
          />
        )}
      </div>

      {/* Modals */}
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onSubmit={handleUploadSubmitted} t={t} />}
      {previewing && <PreviewOverlay attachment={previewing} onClose={() => setPreviewing(null)} onDownload={() => triggerDownload(previewing)} t={t} />}
      {inactiveTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{inactiveStep === 0 ? t('compliance.inactive.title') : t('compliance.inactive.remarksMsg')}</div>
              <button onClick={() => { setInactiveTarget(null); setInactiveRemarks(''); setInactiveStep(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              {inactiveStep === 0 ? (
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{t('compliance.inactive.confirmMsg')}</p>
              ) : (
                <>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{t('compliance.inactive.remarksMsg')}</label>
                  <input value={inactiveRemarks} onChange={(e) => setInactiveRemarks(e.target.value)} placeholder={t('compliance.inactive.remarksPlaceholder')} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setInactiveTarget(null); setInactiveRemarks(''); setInactiveStep(0); }} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
              {inactiveStep === 0 ? (
                <button onClick={() => setInactiveStep(1)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.inactive.confirm')}</button>
              ) : (
                <button onClick={handleDeactivate} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.inactive.submit')}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reminder Form ────────────────────────────────────────
function ReminderForm({ doc, reminder, onSave, onCancel, t }) {
  const [name, setName] = useState(reminder?.name || `${doc.name} Reminder`);
  const [whenType, setWhenType] = useState(reminder?.when?.type || 'before_expiry');
  const [daysBefore, setDaysBefore] = useState(reminder?.when?.daysBefore || 30);
  const [specificDate, setSpecificDate] = useState(reminder?.when?.specificDate || '');
  const [frequency, setFrequency] = useState(reminder?.when?.frequency || 'monthly');
  const [startDate, setStartDate] = useState(reminder?.when?.startDate || doc.inspectionDate || '');
  const [inApp, setInApp] = useState(reminder?.channels?.inApp !== false);
  const [email, setEmail] = useState(reminder?.channels?.email !== false);
  const [selectedUsers, setSelectedUsers] = useState(reminder?.recipients?.userIds || []);
  const [customEmails, setCustomEmails] = useState(reminder?.recipients?.emails || []);
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState(reminder?.messageTemplate || DEFAULT_REMINDER_MSG);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowUserDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleUser = (id) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
  };

  const addEmail = () => {
    const v = emailInput.trim();
    if (v && v.includes('@') && !customEmails.includes(v)) {
      setCustomEmails((prev) => [...prev, v]);
      setEmailInput('');
    }
  };

  const removeEmail = (e) => setCustomEmails((prev) => prev.filter((em) => em !== e));

  const handleSave = () => {
    onSave({
      id: reminder?.id || `rem-${Date.now()}`,
      docId: doc.id,
      name,
      when: { type: whenType, daysBefore: whenType === 'before_expiry' ? Number(daysBefore) : undefined, specificDate: whenType === 'specific_date' ? specificDate : undefined, frequency: whenType === 'recurring' ? frequency : undefined, startDate: whenType === 'recurring' ? startDate : undefined },
      channels: { inApp, email },
      recipients: { userIds: selectedUsers, emails: customEmails },
      messageTemplate: message,
      active: reminder?.active !== undefined ? reminder.active : true,
      createdAt: reminder?.createdAt || new Date().toISOString(),
    });
  };

  const fieldStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };

  return (
    <div style={{ padding: 20 }}>
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
              { value: 'recurring', label: t('compliance.reminder.form.recurring') },
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
            </div>
          )}
          {whenType === 'recurring' && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ ...fieldStyle, width: 140, appearance: 'auto' }}>
                {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <span style={{ fontSize: 12, color: '#64748B' }}>{t('compliance.reminder.form.starting')}</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...fieldStyle, width: 160 }} />
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
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 200, overflow: 'auto' }}>
                {SYSTEM_USERS.map((u) => (
                  <div key={u.id} onClick={() => toggleUser(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#475569', background: selectedUsers.includes(u.id) ? 'var(--info-bg)' : 'transparent' }}>
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} readOnly style={{ cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                    <span style={{ color: '#94A3B8' }}>({u.label})</span>
                  </div>
                ))}
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
          <label style={labelStyle}>{t('compliance.reminder.form.message')}</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5 }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.form.cancel')}</button>
        <button onClick={handleSave} disabled={!name} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: name ? 1 : 0.5 }}>{t('compliance.reminder.form.save')}</button>
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────
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
            <button onClick={() => document.getElementById('cv-detail-upload-input')?.click()} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: file ? 'var(--foreground)' : '#94A3B8', fontWeight: file ? 600 : 500, boxSizing: 'border-box' }}>
              {file ? file.name : t('compliance.upload.chooseFile')}
            </button>
            <input id="cv-detail-upload-input" type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!name) setName(f.name); } }} />
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

// ── Preview Overlay ───────────────────────────────────────
function PreviewOverlay({ attachment, onClose, onDownload, t }) {
  const isImage = attachment.mimeType?.startsWith('image/');
  const previewUrl = isImage ? getAttachmentUrl(attachment) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <button onClick={onDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Download size={13} /> {t('compliance.download')}
        </button>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
      </div>
      <div style={{ maxWidth: '80vw', maxHeight: '80vh' }}>
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={attachment.name} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <FileText size={48} color="#CBD5E1" />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginTop: 16 }}>{attachment.name}</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>{t('compliance.preview.unsupported')}</div>
            <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4 }}>{t('compliance.preview.downloadHint')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
