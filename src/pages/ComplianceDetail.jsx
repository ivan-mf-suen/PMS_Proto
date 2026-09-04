import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCycle, CATEGORY_CONFIG, CATEGORY_ICON, COMPLIANCE_CATEGORIES, PROPERTIES } from '../data/constants';
import { useCompliance } from '../context/ComplianceContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { ROLES } from '../data/constants';
import { listAttachments, uploadAttachment, deactivateAttachment, getAttachmentUrl, formatFileSize, formatTimestamp, isAttachmentActive, DOC_TYPES } from '../services/complianceFileService';
import ComboBox from '../components/ComboBox';
import { computeNextDue as computeNextDueUtil } from '../utils/dateUtils';
import {
  ArrowLeft, Pencil, Upload, Download, Paperclip, FileText, FileImage, X, Trash2,
  Search, Bell, Mail, Plus, ChevronDown, AlertTriangle,
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
  return computeNextDueUtil(effectiveDate, cycleMonths);
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

const DEFAULT_REMINDER_MSG = `Hi {recipient},

This is a reminder that the compliance document "{docName}" for {property} is expiring on {expiryDate}.

Please take action to renew or update this document before the expiry date.

Current Status: {status}
Effective Date: {effectiveDate}
Cycle: {cycle}

Thank you.`;

export default function ComplianceDetail() {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const { docs, updateDoc } = useCompliance();
  const navigate = useNavigate();
  const { id } = useParams();
  const uploaderName = permissions?.name || 'System';

  const doc = docs.find((d) => String(d.id) === String(id));

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
  const [expandedReminderIds, setExpandedReminderIds] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const [reminderConfirm, setReminderConfirm] = useState({ type: null, reminderId: null });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [expiryAttachment, setExpiryAttachment] = useState(null);
  const [expiryNoDoc, setExpiryNoDoc] = useState(false);
  const [expiryReason, setExpiryReason] = useState('');

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
        <button onClick={() => navigate('/compliance')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginBottom: 20 }}>
          <ArrowLeft size={16} /> {t('compliance.detail.back')}
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>{t('compliance.noDocs')}</div>
      </div>
    );
  }

  const nextDue = computeNextDue(doc.inspectionDate, doc.cycleMonths || 12);
  const status = doc.status || 'Valid';
  const canEdit = permissions?.name !== 'Viewer';

  const startEdit = () => {
    setEditForm({
      name: doc.name || '',
      category: doc.category || '',
      center: doc.center || '',
      documentRef: doc.documentRef || '',
      issuedBy: doc.issuedBy || '',
      inspectionDate: doc.inspectionDate || '',
      cycleMonths: doc.cycleMonths || 12,
      expiry: doc.expiry || '',
      responsible: doc.responsible || '',
      notes: doc.notes || '',
    });
    setExpiryAttachment(null);
    setExpiryNoDoc(false);
    setExpiryReason('');
    setIsEditing(true);
  };

  const expiryFieldChanged = editForm.inspectionDate !== doc.inspectionDate || String(editForm.cycleMonths) !== String(doc.cycleMonths || 12) || editForm.expiry !== (doc.expiry || '');
  const expiryAttachmentReady = !expiryFieldChanged || expiryAttachment || (expiryNoDoc && expiryReason.trim());

  const saveEdit = () => {
    if (!editForm.name || !editForm.category || !expiryAttachmentReady) return;
    const updatedDoc = { ...doc, ...editForm, cycleMonths: Number(editForm.cycleMonths) };
    if (expiryFieldChanged && expiryAttachment) {
      uploadAttachment(doc.id, { file: expiryAttachment, name: expiryAttachment.name, docType: 'Other', docDate: new Date().toISOString().slice(0, 10) }, uploaderName);
    }
    updateDoc(doc.id, updatedDoc);
    refreshAttachments();
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setExpiryAttachment(null);
    setExpiryNoDoc(false);
    setExpiryReason('');
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
    setReminderConfirm({ type: null, reminderId: null });
  };

  const toggleReminderActive = (id) => {
    const updated = reminders.map((r) => r.id === id ? { ...r, active: !r.active } : r);
    setReminders(updated);
    saveReminders(doc.id, updated);
    setReminderConfirm({ type: null, reminderId: null });
  };

  const toggleExpand = (id) => {
    setExpandedReminderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedReminderIds(new Set());
    } else {
      setExpandedReminderIds(new Set(reminders.map((r) => r.id)));
    }
    setAllExpanded(!allExpanded);
  };

  const CATEGORY_OPTIONS = COMPLIANCE_CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_KEY_MAP[c] ? t(CATEGORY_KEY_MAP[c]) : c,
  }));

  const PROPERTY_OPTIONS = PROPERTIES.map((p) => ({ value: p.name, label: p.name }));

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{t('compliance.detail.pageTitle')}</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{doc.name}</p>
        </div>
        {canEdit && !isEditing && (
          <button onClick={startEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Pencil size={13} /> {t('compliance.detail.edit')}
          </button>
        )}
      </div>

      {/* Document Fields Card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.detail.section.document')}</div>
        </div>
        <div style={{ padding: 20 }}>
          {isEditing ? (
            <>
              {/* Edit mode fields */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{t('compliance.detail.name')} *</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={fieldStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>{t('compliance.detail.category')} *</label>
                  <ComboBox value={editForm.category} onChange={(v) => {
                    const updated = { ...editForm, category: v };
                    const cfg = CATEGORY_CONFIG[v];
                    if (cfg?.defaultCycle) updated.cycleMonths = cfg.defaultCycle;
                    setEditForm(updated);
                  }} options={CATEGORY_OPTIONS} placeholder={t('compliance.form.selectCategory')}
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
                  <ComboBox value={editForm.center} onChange={(v) => setEditForm({ ...editForm, center: v })} options={PROPERTY_OPTIONS} placeholder={t('compliance.filter.property')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>{t('compliance.detail.ref')}</label>
                  <input value={editForm.documentRef} onChange={(e) => setEditForm({ ...editForm, documentRef: e.target.value })} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('compliance.detail.issuedBy')}</label>
                  <input value={editForm.issuedBy} onChange={(e) => setEditForm({ ...editForm, issuedBy: e.target.value })} style={fieldStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>{t('compliance.detail.effectiveDate')}</label>
                  <input type="date" value={editForm.inspectionDate} onChange={(e) => setEditForm({ ...editForm, inspectionDate: e.target.value })} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t('compliance.detail.cycle')}</label>
                  <select value={editForm.cycleMonths} onChange={(e) => setEditForm({ ...editForm, cycleMonths: e.target.value })} style={{ ...fieldStyle, appearance: 'auto' }}>
                    <option value={6}>6 mo</option>
                    <option value={12}>1 yr</option>
                    <option value={24}>2 yr</option>
                    <option value={36}>3 yr</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{t('compliance.detail.responsible')}</label>
                <input value={editForm.responsible} onChange={(e) => setEditForm({ ...editForm, responsible: e.target.value })} style={fieldStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{t('compliance.detail.notes')}</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} />
              </div>

              {/* Expiry Attachment Requirement */}
              {expiryFieldChanged && (
                <div style={{ marginTop: 16, padding: 16, borderRadius: 8, border: '1.5px solid #FCD34D', background: '#FFFBEB' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Paperclip size={13} /> Supporting document required for expiry date changes
                  </div>
                  {!expiryAttachment && !expiryNoDoc && (
                    <button onClick={() => document.getElementById('cv-expiry-upload')?.click()} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: '#94A3B8', fontWeight: 500, boxSizing: 'border-box' }}>
                      <Upload size={14} /> Click to attach supporting file
                    </button>
                  )}
                  <input id="cv-expiry-upload" type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setExpiryAttachment(f); }} />
                  {expiryAttachment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid var(--border)' }}>
                      <FileText size={14} color="var(--info)" />
                      <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{expiryAttachment.name}</span>
                      <button onClick={() => setExpiryAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
                    </div>
                  )}
                  {!expiryAttachment && (
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => setExpiryNoDoc(!expiryNoDoc)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: `1px solid ${expiryNoDoc ? '#B45309' : 'var(--border)'}`, background: expiryNoDoc ? '#FEF3C7' : '#fff', fontSize: 12, fontWeight: 600, color: expiryNoDoc ? '#92400E' : '#64748B', cursor: 'pointer' }}>
                        <AlertTriangle size={12} /> {t('compliance.noSupportingDoc')}
                      </button>
                      {expiryNoDoc && (
                        <div style={{ marginTop: 8 }}>
                          <label style={labelStyle}>Please provide a reason for this change *</label>
                          <input value={expiryReason} onChange={(e) => setExpiryReason(e.target.value)} placeholder="Enter reason..." style={fieldStyle} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Save / Cancel */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button onClick={cancelEdit} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.form.cancel')}</button>
                <button onClick={saveEdit} disabled={!editForm.name || !editForm.category || !expiryAttachmentReady} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!editForm.name || !editForm.category || !expiryAttachmentReady) ? 0.5 : 1 }}>{t('compliance.reminder.form.save')}</button>
              </div>
            </>
          ) : (
            /* Read-only fields */
            (() => {
              const catCfg = CATEGORY_CONFIG[doc.category];
              const CatIcon = catCfg ? CATEGORY_ICON[doc.category] : null;
              const fields = [
                { label: t('compliance.detail.name'), value: doc.name },
                { label: t('compliance.detail.category'), value: (
                  doc.category && catCfg ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: catCfg.bg, fontSize: 12, fontWeight: 600, color: catCfg.color }}>
                      {CatIcon && <CatIcon size={13} color={catCfg.color} />}
                      {CATEGORY_KEY_MAP[doc.category] ? t(CATEGORY_KEY_MAP[doc.category]) : doc.category}
                    </span>
                  ) : (doc.category || '—')
                )},
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
              return fields.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', padding: '8px 0', borderBottom: i < fields.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: 160, fontSize: 12, lineHeight: '18px', color: '#94A3B8', fontWeight: 500, flexShrink: 0 }}>{f.label}</div>
                  <div style={{ flex: 1, fontSize: 13, lineHeight: '18px', color: 'var(--foreground)', fontWeight: 500 }}>{f.value}</div>
                </div>
              ));
            })()
          )}
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

        {/* History Filters — status buttons first, then search */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
          {['all', 'active', 'inactive'].map((s) => (
            <button key={s} onClick={() => setAttStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${attStatusFilter === s ? 'var(--info)' : 'var(--border)'}`, background: attStatusFilter === s ? 'var(--info-bg)' : '#fff', fontSize: 12, fontWeight: 600, color: attStatusFilter === s ? 'var(--primary)' : '#64748B', cursor: 'pointer', transition: 'all 0.15s' }}>
              {t(`compliance.attach.filter.${s}`)}
            </button>
          ))}
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={attSearch} onChange={(e) => setAttSearch(e.target.value)} placeholder={t('compliance.attach.filter.search')} style={{ width: '100%', padding: '6px 10px 6px 32px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', outline: 'none' }} />
          </div>
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
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>{t('compliance.attach.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Section */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={15} color="#F59E0B" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{t('compliance.reminder.title')}</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>({reminders.length})</span>
            </div>
            {reminders.length > 0 && !showReminderForm && (
              <button onClick={toggleExpandAll} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', fontSize: 11, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>
                {allExpanded ? t('compliance.reminder.collapseAll') : t('compliance.reminder.expandAll')}
              </button>
            )}
          </div>
          {!showReminderForm && (
            <button onClick={() => { setEditingReminder(null); setShowReminderForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={13} /> {t('compliance.reminder.add')}
            </button>
          )}
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
            {reminders.map((r) => {
              const isExpanded = expandedReminderIds.has(r.id);
              const whenLabel = r.when?.type === 'before_expiry' ? `${t('compliance.reminder.beforeExpiry')}: ${r.when.daysBefore} days`
                : r.when?.type === 'recurring' ? FREQUENCIES.find((f) => f.value === r.when.frequency)?.label || r.when.frequency
                : r.when?.specificDate || '';
              const channelLabel = r.channels?.inApp && r.channels?.email ? 'In-App + Email' : r.channels?.inApp ? 'In-App' : 'Email';

              return (
                <div key={r.id} style={{ marginBottom: 8, borderRadius: 8, border: `1px solid ${r.active ? 'var(--border)' : '#E2E8F0'}`, background: r.active ? '#FFFBEB' : '#F8FAFC', opacity: r.active ? 1 : 0.6, overflow: 'hidden' }}>
                  {/* Summary Row */}
                  <div onClick={() => toggleExpand(r.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: r.active ? '#F59E0B' : '#CBD5E1', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {whenLabel} · {channelLabel} · {r.recipients?.userIds?.length || 0} {t('compliance.reminder.users')} + {r.recipients?.emails?.length || 0} {t('compliance.reminder.emails')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ChevronDown size={14} color="#94A3B8" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border)' }}>
                      {/* Action buttons row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 0', justifyContent: 'flex-end' }}>
                        {/* Toggle */}
                        <button onClick={(e) => { e.stopPropagation(); if (r.active) setReminderConfirm({ type: 'deactivate', reminderId: r.id }); else toggleReminderActive(r.id); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: `1px solid ${r.active ? '#FCD34D' : '#E2E8F0'}`, background: r.active ? '#FEF3C7' : '#fff', fontSize: 11, fontWeight: 600, color: r.active ? '#92400E' : '#64748B', cursor: 'pointer' }}>
                          <div style={{ width: 28, height: 14, borderRadius: 7, background: r.active ? '#F59E0B' : '#CBD5E1', position: 'relative', transition: 'background 0.2s' }}>
                            <div style={{ width: 10, height: 10, borderRadius: 5, background: '#fff', position: 'absolute', top: 2, left: r.active ? 16 : 2, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
                          </div>
                          {r.active ? t('compliance.reminder.active') : t('compliance.reminder.inactive')}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingReminder(r); setShowReminderForm(true); }} title={t('compliance.reminder.edit')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setReminderConfirm({ type: 'delete', reminderId: r.id }); }} title={t('compliance.reminder.delete')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {/* Detail view */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                        <div><span style={{ color: '#94A3B8' }}>When: </span><span style={{ fontWeight: 600 }}>{whenLabel}</span></div>
                        <div><span style={{ color: '#94A3B8' }}>Channels: </span><span style={{ fontWeight: 600 }}>{channelLabel}</span></div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#94A3B8' }}>Recipients: </span>
                          <span style={{ fontWeight: 600 }}>
                            {(r.recipients?.userIds || []).map((uid) => SYSTEM_USERS.find((u) => u.id === uid)?.name || uid).join(', ')}
                            {(r.recipients?.emails || []).length > 0 && ((r.recipients?.userIds || []).length > 0 ? ', ' : '') + r.recipients.emails.join(', ')}
                          </span>
                        </div>
                        {r.emailSubject && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94A3B8' }}>Subject: </span><span style={{ fontWeight: 600 }}>{r.emailSubject}</span></div>}
                        <div style={{ gridColumn: '1 / -1', whiteSpace: 'pre-wrap', color: '#475569', lineHeight: 1.5, fontSize: 11, fontFamily: 'monospace' }}>{r.messageTemplate || DEFAULT_REMINDER_MSG}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Reminder Confirmation Modals */}
      {reminderConfirm.type === 'deactivate' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{t('compliance.reminder.deactivate')}</div>
              <button onClick={() => setReminderConfirm({ type: null, reminderId: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{t('compliance.reminder.confirmDeactivate')}</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setReminderConfirm({ type: null, reminderId: null })} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.form.cancel')}</button>
              <button onClick={() => toggleReminderActive(reminderConfirm.reminderId)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.deactivate')}</button>
            </div>
          </div>
        </div>
      )}

      {reminderConfirm.type === 'delete' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{t('compliance.reminder.delete')}</div>
              <button onClick={() => setReminderConfirm({ type: null, reminderId: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{t('compliance.reminder.confirmDelete')}</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setReminderConfirm({ type: null, reminderId: null })} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.form.cancel')}</button>
              <button onClick={() => deleteReminder(reminderConfirm.reminderId)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('compliance.reminder.form.discard')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onSubmit={(payload) => { uploadAttachment(doc.id, payload, uploaderName); refreshAttachments(); setUploadOpen(false); }} t={t} />}
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
  const [isRecurring, setIsRecurring] = useState(reminder?.when?.recurring || false);
  const [frequency, setFrequency] = useState(reminder?.when?.frequency || 'monthly');
  const [startDate, setStartDate] = useState(reminder?.when?.startDate || doc.inspectionDate || '');
  const [inApp, setInApp] = useState(reminder?.channels?.inApp !== false);
  const [email, setEmail] = useState(reminder?.channels?.email !== false);
  const [selectedUsers, setSelectedUsers] = useState(reminder?.recipients?.userIds || []);
  const [customEmails, setCustomEmails] = useState(reminder?.recipients?.emails || []);
  const [emailInput, setEmailInput] = useState('');
  const [emailSubject, setEmailSubject] = useState(reminder?.emailSubject || `Reminder: ${doc.name} expiring on {expiryDate}`);
  const [message, setMessage] = useState(reminder?.messageTemplate || DEFAULT_REMINDER_MSG);
  const [msgFontSize, setMsgFontSize] = useState(reminder?.messageStyle?.fontSize || '11px');
  const [msgColor, setMsgColor] = useState(reminder?.messageStyle?.color || '#334155');
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
      id: reminder?.id || `rem-${Date.now()}`,
      docId: doc.id,
      name,
      when: { type: whenType, daysBefore: whenType === 'before_expiry' ? Number(daysBefore) : undefined, specificDate: whenType === 'specific_date' ? specificDate : undefined, recurring: whenType === 'specific_date' && isRecurring ? true : undefined, frequency: whenType === 'specific_date' && isRecurring ? frequency : undefined, startDate: whenType === 'specific_date' && isRecurring ? startDate : undefined },
      channels: { inApp, email },
      recipients: { userIds: selectedUsers, emails: customEmails },
      emailSubject,
      messageTemplate: message,
      messageStyle: { fontSize: msgFontSize, color: msgColor },
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
