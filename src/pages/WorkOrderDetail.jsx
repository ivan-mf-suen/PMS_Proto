import { useState, useRef } from 'react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  ArrowLeft, Paperclip, AlertTriangle, RotateCcw, Send, Info,
  CheckCircle, Circle, Download, Upload, FileText, X, Check,
  CheckSquare, Plus, Trash2, MinusCircle,
} from 'lucide-react';

const STATUS_STYLES = {
  'Draft': { background: '#64748B', color: '#fff' },
  'Pending SSD Service Manager Endorsement': { background: '#D97706', color: '#fff' },
  'Pending SSD G&C Review': { background: '#EA580C', color: '#fff' },
  'Pending SSD AS Endorsement': { background: '#B45309', color: '#fff' },
  'Under PWD Grouping': { background: '#2563EB', color: '#fff' },
  'Pending OIC Review': { background: '#C2410C', color: '#fff' },
  'Pending PWD Proceed IAS': { background: '#D97706', color: '#fff' },
  'Submitted to IAS for Tendering': { background: '#7C3AED', color: '#fff' },
  'Approved IAS': { background: '#059669', color: '#fff' },
  'In Progress': { background: '#059669', color: '#fff' },
  'Completed': { background: '#16A34A', color: '#fff' },
};

function statusStyle(status) {
  return STATUS_STYLES[status] || { background: '#64748B', color: '#fff' };
}

const PRIORITY_STYLES = {
  'Critical': { bg: 'var(--critical-bg)', color: 'var(--critical)' },
  'High': { bg: 'var(--warning-bg)', color: '#B45309' },
  'Medium': { bg: 'var(--info-bg)', color: 'var(--info)' },
  'Low': { bg: '#F1F5F9', color: '#64748B' },
};

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
      {children}
    </div>
  );
}

function FieldValue({ children, highlight }) {
  return (
    <div style={{ fontSize: 14, fontWeight: highlight ? 700 : 500, color: 'var(--foreground)' }}>
      {children || '—'}
    </div>
  );
}

function DetailCard({ title, number, children, compact }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)',
      marginBottom: 24, overflow: 'hidden',
    }}>
      <div style={{
        padding: compact ? '10px 20px' : '14px 24px', background: '#F8FAFC',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {typeof number === 'string' ? (
          <span style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>{number}</span>
        ) : (
          <span style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{number}</span>
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{title}</div>
      </div>
      <div style={{ padding: compact ? '12px 20px' : 24 }}>
        {children}
      </div>
    </div>
  );
}

const INPUT_BASE = {
  width: '100%', padding: '8px 12px', borderRadius: 6,
  border: '1px solid var(--border)', fontSize: 13,
  color: 'var(--foreground)', background: '#fff', boxSizing: 'border-box',
};

const INPUT_DISABLED = { ...INPUT_BASE, background: '#F8FAFC', color: '#64748B', cursor: 'default' };

const BTN_PRIMARY = {
  padding: '8px 18px', borderRadius: 6, border: 'none',
  fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const BTN_SECONDARY = {
  padding: '8px 18px', borderRadius: 6,
  border: '1px solid var(--border)', background: '#fff',
  fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const BTN_SM = {
  padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: '#fff',
  fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 4,
};

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '90%', maxWidth: 720,
        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ChecklistIcon({ state }) {
  if (state === 'completed') return <CheckCircle size={16} color="#059669" />;
  if (state === 'noNeed') return (
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: '#FFF7ED',
      border: '1.5px solid #FB923C', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <MinusCircle size={10} color="#FB923C" />
    </div>
  );
  return <Circle size={16} color="#CBD5E1" />;
}

function ChecklistBadge({ state }) {
  if (state === 'completed') return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
      background: '#DCFCE7', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.04em',
      marginLeft: 6, flexShrink: 0,
    }}>Complete</span>
  );
  if (state === 'noNeed') return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
      background: '#FFF7ED', color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.04em',
      marginLeft: 6, flexShrink: 0,
    }}>No Need</span>
  );
  return null;
}

export default function WorkOrderDetail({ woId, onBack }) {
  const { role } = useAuth();
  const { workOrders, updateWorkOrderStatus } = useWorkOrders();
  const { t } = useTranslation();
  const wo = workOrders.find((w) => w.id === woId);

  const [iasHovered, setIasHovered] = useState(false);

  const isSM = role === 'SERVICE_MANAGER' && wo?.status === 'Pending SSD Service Manager Endorsement';
  const isAS = role === 'SSD_AS' && wo?.status === 'Pending SSD AS Endorsement';
  const isGC = role === 'SSD_GC' && wo?.status === 'Pending SSD G&C Review';
  const isOIC = role === 'OIC' && wo?.status === 'Pending OIC Review';
  const isOICDraft = wo?.status === 'Draft' && role === 'OIC';
  const isPWDGrouping = role === 'PWD' && wo?.status === 'Under PWD Grouping';
  const isPendingIAS = wo?.status === 'Pending PWD Proceed IAS';
  const isSubmittedIAS = wo?.status === 'Submitted to IAS for Tendering';
  const isApprovedIAS = wo?.status === 'Approved IAS';
  const isInProgress = wo?.status === 'In Progress';
  const isCompleted = wo?.status === 'Completed';

  // ── Checklist item states ──
  const [itemStates, setItemStates] = useState({
    tender: 'pending',
    loa: 'pending',
    csA: 'pending',
    csB: 'pending',
    eot: 'pending',
    interimInvoice: 'pending',
    vo: 'pending',
    finalInvoice: 'pending',
  });

  const setItem = (key, state) => setItemStates((prev) => ({ ...prev, [key]: state }));

  // ── Tender ──
  const [tenderFile, setTenderFile] = useState(null);
  const tenderInputRef = useRef(null);

  // ── LOA ──
  const [loaPopupOpen, setLoaPopupOpen] = useState(false);
  const [loaState, setLoaState] = useState('initial');
  const [loaSignedFile, setLoaSignedFile] = useState(null);
  const loaSignedInputRef = useRef(null);

  // ── Control Sheet A ──
  const [csAPopupOpen, setCsAPopupOpen] = useState(false);
  const [controlSheet, setControlSheet] = useState({
    natureOfWorks: '', contractor: '', architect: '', consultants: '',
    contractSum: wo?.budget || 0, equipment: '', contingency: 0, provisionalSum: 0,
    archPercent: '', consultantFees: '', paymentConditions: '',
    completionDate: wo?.dueDate || '', laDamages: '', retentionPercent: '',
    retentionLimit: '', subRetention: '', retentionReleaseDate: '',
  });

  // ── Control Sheet B ──
  const [csBPopupOpen, setCsBPopupOpen] = useState(false);
  const [csBRows, setCsBRows] = useState([
    { centre: wo?.center || '', funding: wo?.fundingSource || '', hkd: '', auth: '' },
  ]);

  // ── EOT ──
  const [eotPopupOpen, setEotPopupOpen] = useState(false);
  const [eot, setEot] = useState({ reason: '', days: '', newDate: '', remarks: '' });

  // ── Interim Invoice ──
  const [interimFile, setInterimFile] = useState(null);
  const interimInputRef = useRef(null);

  // ── V.O. ──
  const [voPopupOpen, setVoPopupOpen] = useState(false);
  const [vo, setVo] = useState({ description: '', amount: '', justification: '', status: 'Pending' });

  // ── Final Invoice ──
  const [finalFile, setFinalFile] = useState(null);
  const finalInputRef = useRef(null);

  // ── Manual Approval ──
  const [manualApprovalOpen, setManualApprovalOpen] = useState(false);
  const [manualFiles, setManualFiles] = useState([]);
  const [manualRemarks, setManualRemarks] = useState('');
  const manualInputRef = useRef(null);

  if (!wo) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
        {t('common.noData')}
      </div>
    );
  }

  const today = 'Tuesday, 18 August 2026';
  const portfolio = 'PLK Shek Kip Mei Community Services Centre';
  const pStyle = PRIORITY_STYLES[wo.priority] || PRIORITY_STYLES['Medium'];
  const sStyle = statusStyle(wo.status);

  const csATotal = Number(controlSheet.contractSum || 0) + Number(controlSheet.contingency || 0) + Number(controlSheet.provisionalSum || 0);
  const csBTotal = csBRows.reduce((sum, r) => sum + Number(r.hkd || 0), 0);

  const handleCsField = (field, value) => setControlSheet((p) => ({ ...p, [field]: value }));

  const csBRowField = (idx, field, value) => {
    setCsBRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Page Header Bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)', flexShrink: 0,
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: '#fff',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569',
            }}
          >
            <ArrowLeft size={14} /> Back to Work Orders
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Work Order Tracking</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
              {today} &middot; Portfolio: {portfolio}
            </div>
          </div>
          {/* Status badge — flat label style */}
          <div style={{
            padding: '5px 14px', borderRadius: 6,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
            background: sStyle.background, color: sStyle.color,
          }}>
            Current Status: {wo.status}
          </div>
        </div>

        {/* Action Bar */}
        <div style={{
          background: '#F8FAFC', borderBottom: '1px solid var(--border)',
          padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              padding: '7px 16px', borderRadius: 6,
              background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)',
              fontSize: 13, fontWeight: 600, color: '#059669',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontWeight: 800 }}>{wo.id}</span> — {wo.title}
            </div>
          </div>
          {isSM && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); onBack(); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> Return to Draft
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending SSD AS Endorsement'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> Submit to AS for Endorsement
              </button>
            </div>
          )}
          {isAS && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); onBack(); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> Return to Draft
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending SSD G&C Review'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> Submit to G&C for Review
              </button>
            </div>
          )}
          {isGC && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); onBack(); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> Return to Draft
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending OIC Review'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> Submit to OIC for Review
              </button>
            </div>
          )}
          {isOIC && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Draft'); onBack(); }}
                style={{ ...BTN_SECONDARY, border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626' }}
              >
                <RotateCcw size={14} /> Return to Draft
              </button>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Under PWD Grouping'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> Submit to PWD
              </button>
            </div>
          )}
          {isOICDraft && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending SSD Service Manager Endorsement'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#059669' }}
              >
                <Send size={14} /> Submit to Service Manager
              </button>
            </div>
          )}
          {isPWDGrouping && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Pending PWD Proceed IAS'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#7C3AED', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
              >
                <Send size={14} /> Submit to IAS
              </button>
            </div>
          )}
          {isPendingIAS && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}
                onMouseEnter={() => setIasHovered(true)}
                onMouseLeave={() => setIasHovered(false)}
              >
                <button style={{
                  ...BTN_PRIMARY, background: '#7C3AED',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                }}>
                  <Send size={14} /> Create in IAS
                </button>
                {iasHovered && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 420, padding: '14px 18px', borderRadius: 8,
                    background: '#0F172A', color: '#CBD5E1',
                    fontSize: 12, lineHeight: 1.6, zIndex: 200,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#F8FAFC' }}>
                      <Info size={14} color="#A78BFA" /> IAS Integration
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <li>After all parties have endorsed the work order, this button will appear.</li>
                      <li>Once clicked, the WO status updates to <span style={{ color: '#A78BFA', fontWeight: 600 }}>"Submitted to IAS for Tendering"</span> and the WO becomes <span style={{ color: '#F87171', fontWeight: 600 }}>read-only</span>.</li>
                      <li>When clicked, it sends an API call to IAS with the endorsed WO details, so the user can continue input in IAS for the approval process (e.g. Tender analysis, quotation, etc.).</li>
                      <li>When the WO is approved in IAS, the user can return to this system to continue the WO process (e.g. assign tasks, schedule, etc.).</li>
                    </ul>
                    <div style={{ position: 'absolute', top: -5, right: 16, width: 10, height: 10, background: '#0F172A', transform: 'rotate(45deg)' }} />
                  </div>
                )}
              </div>
              <button
                onClick={() => setManualApprovalOpen((v) => !v)}
                style={{
                  ...BTN_SECONDARY, border: '1px solid #B45309', background: manualApprovalOpen ? '#FFFBEB' : '#fff', color: '#B45309',
                }}
              >
                <Check size={14} /> Manual Approval
              </button>
            </div>
          )}
          {isApprovedIAS && (role === 'PWD' || role === 'SSD_GC') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'In Progress'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#2563EB' }}
              >
                <Send size={14} /> Start Work
              </button>
            </div>
          )}
          {isInProgress && (role === 'PWD' || role === 'SSD_GC') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { updateWorkOrderStatus(wo.id, 'Completed'); onBack(); }}
                style={{ ...BTN_PRIMARY, background: '#16A34A' }}
              >
                <CheckCircle size={14} /> Mark Complete
              </button>
            </div>
          )}
          {isCompleted && (
            <div style={{ padding: '6px 14px', borderRadius: 6, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', fontSize: 12, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> Work Order Completed
            </div>
          )}
        </div>

        {/* IAS Status Banner — PENDING */}
        {isSubmittedIAS && (
          <div style={{
            margin: '0 32px', marginTop: 24, padding: '16px 24px', borderRadius: 10,
            background: '#F5F3FF', borderLeft: '4px solid #7C3AED',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <Info size={20} color="#7C3AED" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>IAS Status: PENDING</div>
              <div style={{ fontSize: 12, color: '#6D28D9', marginTop: 2 }}>
                This work order has been submitted to IAS for tendering and is now read-only.
              </div>
            </div>
          </div>
        )}

        {/* IAS Status Banner — APPROVED */}
        {isApprovedIAS && (
          <div style={{
            margin: '0 32px', marginTop: 24, padding: '16px 24px', borderRadius: 10,
            background: '#F0FDF4', borderLeft: '4px solid #059669',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <CheckCircle size={20} color="#059669" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>IAS Status: Approved</div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                This work order has been approved by IAS. Proceed with post-approval actions below.
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

          {/* ═══ Manual Approval Section ═══ */}
          {isPendingIAS && manualApprovalOpen && (
            <DetailCard title="Manual Approval" number={<Check size={14} color="#fff" />} compact>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <FieldLabel>Approval Attachments</FieldLabel>
                  <input ref={manualInputRef} type="file" multiple style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).map((f) => f.name);
                        setManualFiles((prev) => [...prev, ...newFiles]);
                      }
                    }} />
                  <button onClick={() => manualInputRef.current?.click()} style={BTN_SM}>
                    <Upload size={12} /> Choose Files
                  </button>
                  {manualFiles.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {manualFiles.map((f, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
                          borderRadius: 5, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)',
                          fontSize: 12, color: '#059669',
                        }}>
                          <FileText size={12} /> {f}
                          <button onClick={() => setManualFiles((prev) => prev.filter((_, j) => j !== i))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0, marginLeft: 'auto' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Remarks</FieldLabel>
                  <textarea
                    style={{ ...INPUT_BASE, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
                    value={manualRemarks}
                    onChange={(e) => setManualRemarks(e.target.value)}
                    placeholder="Enter approval remarks"
                  />
                </div>
              </div>
            </DetailCard>
          )}

          {/* ═══ Checklist ═══ */}
          {isApprovedIAS && (
            <DetailCard title="Checklist" number={<CheckSquare size={14} color="#fff" />} compact>
              <div style={{ display: 'flex', flexDirection: 'column' }}>

                {/* Item 1: Upload Tender Document */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.tender} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.tender === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Upload Tender Document
                  </span>
                  <ChecklistBadge state={itemStates.tender} />
                  {itemStates.tender === 'pending' && (
                    <>
                      <input ref={tenderInputRef} type="file" style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) { setTenderFile(e.target.files[0].name); setItem('tender', 'completed'); } }} />
                      <button onClick={() => tenderInputRef.current?.click()} style={BTN_SM}>
                        <Upload size={12} /> Choose File
                      </button>
                    </>
                  )}
                  {itemStates.tender === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#059669', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{tenderFile}
                      </span>
                      <button onClick={() => tenderInputRef.current?.click()} style={{ ...BTN_SM, color: '#475569' }}>
                        <Upload size={11} /> Replace
                      </button>
                      <button style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                        <Download size={11} /> Download
                      </button>
                    </div>
                  )}
                </div>

                {/* Item 2: Letter of Award (LOA) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.loa} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.loa === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Proceed Letter of Award (LOA)
                  </span>
                  <ChecklistBadge state={itemStates.loa} />
                  {itemStates.loa !== 'completed' && (
                    <button onClick={() => { setLoaPopupOpen(true); setLoaState('initial'); }}
                      style={{ ...BTN_SM, border: '1px solid #7C3AED', background: '#F5F3FF', color: '#7C3AED' }}>
                      <FileText size={12} /> LOA
                    </button>
                  )}
                  {itemStates.loa === 'completed' && (
                    <button onClick={() => { setLoaPopupOpen(true); setLoaState('confirmed'); }}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <Download size={12} /> Download
                    </button>
                  )}
                </div>

                {/* Item 3: Control Sheet Part A */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.csA} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.csA === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Proceed Control Sheet Part A
                  </span>
                  <ChecklistBadge state={itemStates.csA} />
                  {itemStates.csA !== 'completed' && (
                    <button onClick={() => setCsAPopupOpen(true)}
                      style={{ ...BTN_SM, border: '1px solid #B45309', background: '#FFFBEB', color: '#B45309' }}>
                      <FileText size={12} /> Part A
                    </button>
                  )}
                  {itemStates.csA === 'completed' && (
                    <button onClick={() => setCsAPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> View
                    </button>
                  )}
                </div>

                {/* Item 4: Control Sheet Part B */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.csB} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.csB === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Proceed Control Sheet Part B
                  </span>
                  <ChecklistBadge state={itemStates.csB} />
                  {itemStates.csB !== 'completed' && (
                    <button onClick={() => setCsBPopupOpen(true)}
                      style={{ ...BTN_SM, border: '1px solid #B45309', background: '#FFFBEB', color: '#B45309' }}>
                      <FileText size={12} /> Part B
                    </button>
                  )}
                  {itemStates.csB === 'completed' && (
                    <button onClick={() => setCsBPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> View
                    </button>
                  )}
                </div>

                {/* Item 5: Extension Of Time (EOT) — optional */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.eot} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.eot === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Submit Extension Of Time (EOT)
                  </span>
                  <ChecklistBadge state={itemStates.eot} />
                  {itemStates.eot === 'pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setEotPopupOpen(true)}
                        style={{ ...BTN_SM, border: '1px solid #7C3AED', background: '#F5F3FF', color: '#7C3AED' }}>
                        <FileText size={12} /> EOT
                      </button>
                      <button onClick={() => setItem('eot', 'noNeed')}
                        style={{ fontSize: 11, color: '#FB923C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                        No Need
                      </button>
                    </div>
                  )}
                  {itemStates.eot === 'completed' && (
                    <button onClick={() => setEotPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> View
                    </button>
                  )}
                  {itemStates.eot === 'noNeed' && (
                    <button onClick={() => setItem('eot', 'pending')}
                      style={{ fontSize: 11, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                      Undo
                    </button>
                  )}
                </div>

                {/* Item 6: Upload Interim Invoice — required */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.interimInvoice} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.interimInvoice === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Upload Interim Invoice
                  </span>
                  <ChecklistBadge state={itemStates.interimInvoice} />
                  {itemStates.interimInvoice === 'pending' && (
                    <>
                      <input ref={interimInputRef} type="file" style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) { setInterimFile(e.target.files[0].name); setItem('interimInvoice', 'completed'); } }} />
                      <button onClick={() => interimInputRef.current?.click()} style={BTN_SM}>
                        <Upload size={12} /> Choose File
                      </button>
                    </>
                  )}
                  {itemStates.interimInvoice === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#059669', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{interimFile}
                      </span>
                      <button onClick={() => interimInputRef.current?.click()} style={{ ...BTN_SM, color: '#475569' }}>
                        <Upload size={11} /> Replace
                      </button>
                      <button style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                        <Download size={11} /> Download
                      </button>
                    </div>
                  )}
                </div>

                {/* Item 7: Add V.O. — optional */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
                  <ChecklistIcon state={itemStates.vo} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.vo === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Add V.O.
                  </span>
                  <ChecklistBadge state={itemStates.vo} />
                  {itemStates.vo === 'pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setVoPopupOpen(true)}
                        style={{ ...BTN_SM, border: '1px solid #7C3AED', background: '#F5F3FF', color: '#7C3AED' }}>
                        <Plus size={12} /> Add V.O.
                      </button>
                      <button onClick={() => setItem('vo', 'noNeed')}
                        style={{ fontSize: 11, color: '#FB923C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                        No Need
                      </button>
                    </div>
                  )}
                  {itemStates.vo === 'completed' && (
                    <button onClick={() => setVoPopupOpen(true)}
                      style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                      <FileText size={12} /> View
                    </button>
                  )}
                  {itemStates.vo === 'noNeed' && (
                    <button onClick={() => setItem('vo', 'pending')}
                      style={{ fontSize: 11, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                      Undo
                    </button>
                  )}
                </div>

                {/* Item 8: Upload Final Invoice — required */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', background: '#FAFBFC' }}>
                  <ChecklistIcon state={itemStates.finalInvoice} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: itemStates.finalInvoice === 'completed' ? '#059669' : 'var(--foreground)', flex: 1 }}>
                    Upload Final Invoice
                  </span>
                  <ChecklistBadge state={itemStates.finalInvoice} />
                  {itemStates.finalInvoice === 'pending' && (
                    <>
                      <input ref={finalInputRef} type="file" style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) { setFinalFile(e.target.files[0].name); setItem('finalInvoice', 'completed'); } }} />
                      <button onClick={() => finalInputRef.current?.click()} style={BTN_SM}>
                        <Upload size={12} /> Choose File
                      </button>
                    </>
                  )}
                  {itemStates.finalInvoice === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#059669', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{finalFile}
                      </span>
                      <button onClick={() => finalInputRef.current?.click()} style={{ ...BTN_SM, color: '#475569' }}>
                        <Upload size={11} /> Replace
                      </button>
                      <button style={{ ...BTN_SM, color: '#059669', borderColor: '#059669' }}>
                        <Download size={11} /> Download
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </DetailCard>
          )}

          {/* Section 1: Administrative Details */}
          <DetailCard title="Administrative Details" number="1">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
              <div><FieldLabel>Work Order ID</FieldLabel><FieldValue highlight>{wo.id}</FieldValue></div>
              <div><FieldLabel>Title</FieldLabel><FieldValue highlight>{wo.title}</FieldValue></div>
              <div>
                <FieldLabel>Priority</FieldLabel>
                <FieldValue>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 10, background: pStyle.bg, color: pStyle.color, fontSize: 12, fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: pStyle.color }} />{wo.priority}
                  </span>
                </FieldValue>
              </div>
              <div><FieldLabel>Start Date</FieldLabel><FieldValue>{wo.created}</FieldValue></div>
              <div><FieldLabel>End Date / Due Date</FieldLabel><FieldValue>{wo.dueDate}</FieldValue></div>
              <div><FieldLabel>Estimated Budget</FieldLabel><FieldValue highlight>${wo.budget.toLocaleString()}</FieldValue></div>
              <div><FieldLabel>Funding Source</FieldLabel><FieldValue>{wo.fundingSource}</FieldValue></div>
              <div><FieldLabel>PWD Involvement</FieldLabel><FieldValue>{wo.pwdInvolvement === 'with' ? 'With PWD' : 'Without PWD'}</FieldValue></div>
              <div><FieldLabel>Category</FieldLabel><FieldValue>{wo.category}</FieldValue></div>
              <div><FieldLabel>Center</FieldLabel><FieldValue>{wo.center}</FieldValue></div>
              <div><FieldLabel>Assignee</FieldLabel><FieldValue>{wo.assignee}</FieldValue></div>
              <div><FieldLabel>Created By</FieldLabel><FieldValue>{wo.createdBy}</FieldValue></div>
            </div>
            <div style={{ marginTop: 20 }}>
              <FieldLabel>Description</FieldLabel>
              <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.7, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
                {wo.description}
              </div>
            </div>
          </DetailCard>

          {/* Section 2: Selected Assets */}
          <DetailCard title={`Selected Assets & Items (${wo.assets?.length || 0} Items)`} number="2">
            {wo.assets && wo.assets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {wo.assets.map((tag, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={18} color="var(--info)" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Asset Tag: {tag}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: 13 }}>No assets attached.</div>
            )}
          </DetailCard>

          {/* Section 3: Attachments */}
          <DetailCard title="Attachments" number="3">
            {wo.attachments && wo.attachments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wo.attachments.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <Paperclip size={14} color="#64748B" />
                    <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{file}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: 13 }}>No attachments.</div>
            )}
          </DetailCard>

          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          POPUPS
         ═══════════════════════════════════════════════════════════════════ */}

      {/* ── LOA Popup ── */}
      {loaPopupOpen && (
        <ModalOverlay onClose={() => setLoaPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileText size={20} color="#7C3AED" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Letter of Award (LOA)</span>
          </div>

          {(loaState === 'initial' || loaState === 'preview') && (
            <div>
              {loaState === 'initial' && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
                    Generate a Letter of Award for this work order based on the approved IAS tender details.
                  </div>
                  <button onClick={() => setLoaState('preview')} style={{ ...BTN_PRIMARY, background: '#7C3AED', padding: '10px 24px', fontSize: 14 }}>
                    <FileText size={16} /> Generate LOA
                  </button>
                </div>
              )}
              {loaState === 'preview' && (
                <div>
                  <div style={{ padding: 20, borderRadius: 8, border: '1px solid var(--border)', background: '#F8FAFC', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Letter of Award</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div><FieldLabel>Work Order ID</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.id}</div></div>
                      <div><FieldLabel>Title</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.title}</div></div>
                      <div><FieldLabel>Budget</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>${wo.budget.toLocaleString()}</div></div>
                      <div><FieldLabel>Due Date</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.dueDate}</div></div>
                      <div style={{ gridColumn: '1 / -1' }}><FieldLabel>Description</FieldLabel><div style={{ fontSize: 13, lineHeight: 1.6 }}>{wo.description}</div></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <button onClick={() => { setLoaState('confirmed'); setItem('loa', 'completed'); }} style={{ ...BTN_PRIMARY, background: '#059669' }}>
                      <Check size={14} /> Confirm LOA Details
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <FieldLabel>Upload Signed LOA</FieldLabel>
                    <input ref={loaSignedInputRef} type="file" style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files?.[0]) setLoaSignedFile(e.target.files[0].name); }}
                    />
                    <button onClick={() => loaSignedInputRef.current?.click()} style={{ ...BTN_SECONDARY, fontSize: 12 }}>
                      <Upload size={14} /> Choose Signed LOA File
                    </button>
                    {loaSignedFile && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', fontSize: 12, color: '#059669' }}>
                        <FileText size={14} /> {loaSignedFile}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {loaState === 'confirmed' && (
            <div>
              <div style={{ padding: 20, borderRadius: 8, border: '1px solid var(--border)', background: '#F8FAFC', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Letter of Award</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><FieldLabel>Work Order ID</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.id}</div></div>
                  <div><FieldLabel>Title</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.title}</div></div>
                  <div><FieldLabel>Budget</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>${wo.budget.toLocaleString()}</div></div>
                  <div><FieldLabel>Due Date</FieldLabel><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.dueDate}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><FieldLabel>Description</FieldLabel><div style={{ fontSize: 13, lineHeight: 1.6 }}>{wo.description}</div></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button style={{ ...BTN_PRIMARY, background: '#059669' }}><Download size={14} /> Download LOA</button>
                <button onClick={() => setLoaPopupOpen(false)} style={BTN_SECONDARY}>Close</button>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <FieldLabel>Upload Signed LOA</FieldLabel>
                <input ref={loaSignedInputRef} type="file" style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.[0]) setLoaSignedFile(e.target.files[0].name); }}
                />
                <button onClick={() => loaSignedInputRef.current?.click()} style={{ ...BTN_SECONDARY, fontSize: 12 }}>
                  <Upload size={14} /> Choose Signed LOA File
                </button>
                {loaSignedFile && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.2)', fontSize: 12, color: '#059669' }}>
                    <FileText size={14} /> {loaSignedFile}
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalOverlay>
      )}

      {/* ── Control Sheet Part A Popup ── */}
      {csAPopupOpen && (
        <ModalOverlay onClose={() => setCsAPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileText size={20} color="#B45309" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Control Sheet Part A</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FieldLabel>1. Name of Project</FieldLabel><input style={INPUT_DISABLED} value={wo.title} readOnly /></div>
            <div><FieldLabel>2. Nature of Works</FieldLabel><input style={INPUT_BASE} value={controlSheet.natureOfWorks} onChange={(e) => handleCsField('natureOfWorks', e.target.value)} placeholder="e.g. Renovation, Maintenance, Installation" /></div>
            <div><FieldLabel>3. Name of Main Contractor</FieldLabel><input style={INPUT_BASE} value={controlSheet.contractor} onChange={(e) => handleCsField('contractor', e.target.value)} placeholder="Enter contractor name" /></div>
            <div><FieldLabel>4. Name of Architect</FieldLabel><input style={INPUT_BASE} value={controlSheet.architect} onChange={(e) => handleCsField('architect', e.target.value)} placeholder="Enter architect name" /></div>
            <div><FieldLabel>5. Name of Consultant(s)</FieldLabel><input style={INPUT_BASE} value={controlSheet.consultants} onChange={(e) => handleCsField('consultants', e.target.value)} placeholder="Enter consultant name(s)" /></div>
            <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)', background: '#FAFBFC' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>6. Contract Sum</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><FieldLabel>Contract Sum ($)</FieldLabel><input style={INPUT_BASE} type="number" value={controlSheet.contractSum} onChange={(e) => handleCsField('contractSum', e.target.value)} /></div>
                <div><FieldLabel>Incl. Equipment (specify)</FieldLabel><input style={INPUT_BASE} value={controlSheet.equipment} onChange={(e) => handleCsField('equipment', e.target.value)} placeholder="Specify equipment" /></div>
                <div><FieldLabel>Contingency ($)</FieldLabel><input style={INPUT_BASE} type="number" value={controlSheet.contingency} onChange={(e) => handleCsField('contingency', e.target.value)} /></div>
                <div><FieldLabel>Provisional Sum(s) ($)</FieldLabel><input style={INPUT_BASE} type="number" value={controlSheet.provisionalSum} onChange={(e) => handleCsField('provisionalSum', e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 12 }}><FieldLabel>Total ($)</FieldLabel><input style={INPUT_DISABLED} value={csATotal.toLocaleString()} readOnly /></div>
            </div>
            <div><FieldLabel>7. Architect's Fees (%)</FieldLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input style={{ ...INPUT_BASE, width: 120 }} type="number" value={controlSheet.archPercent} onChange={(e) => handleCsField('archPercent', e.target.value)} placeholder="%" /><span style={{ fontSize: 13, color: '#64748B' }}>%</span></div></div>
            <div><FieldLabel>8. Consultant's Fees (pl. specify)</FieldLabel><input style={INPUT_BASE} value={controlSheet.consultantFees} onChange={(e) => handleCsField('consultantFees', e.target.value)} placeholder="Specify fee structure" /></div>
            <div><FieldLabel>9. Conditions for Payment of Contract Sum</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={controlSheet.paymentConditions} onChange={(e) => handleCsField('paymentConditions', e.target.value)} placeholder="Enter payment conditions" /></div>
            <div><FieldLabel>10. Expected Date of Completion of Work</FieldLabel><input style={INPUT_BASE} type="date" value={controlSheet.completionDate} onChange={(e) => handleCsField('completionDate', e.target.value)} /></div>
            <div><FieldLabel>11. L and A Damages ($ per day)</FieldLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input style={{ ...INPUT_BASE, width: 160 }} type="number" value={controlSheet.laDamages} onChange={(e) => handleCsField('laDamages', e.target.value)} placeholder="$" /><span style={{ fontSize: 13, color: '#64748B' }}>per day</span></div></div>
            <div><FieldLabel>12. % of Certified Value Retained (%)</FieldLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input style={{ ...INPUT_BASE, width: 120 }} type="number" value={controlSheet.retentionPercent} onChange={(e) => handleCsField('retentionPercent', e.target.value)} placeholder="%" /><span style={{ fontSize: 12, color: '#94A3B8' }}>(To be reduced by 1% if authorised by Architect.)</span></div></div>
            <div><FieldLabel>13. Limit of Retention Fund ($)</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={controlSheet.retentionLimit} onChange={(e) => handleCsField('retentionLimit', e.target.value)} placeholder="$" /></div>
            <div><FieldLabel>14. Retention money attributable to sub-contractors for new buildings ($)</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={controlSheet.subRetention} onChange={(e) => handleCsField('subRetention', e.target.value)} placeholder="$" /></div>
            <div><FieldLabel>15. Date of Release of Retention Fund</FieldLabel><input style={INPUT_BASE} type="date" value={controlSheet.retentionReleaseDate} onChange={(e) => handleCsField('retentionReleaseDate', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => { setItem('csA', 'completed'); setCsAPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> Confirm Control Sheet
            </button>
            <button onClick={() => setCsAPopupOpen(false)} style={BTN_SECONDARY}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Control Sheet Part B Popup ── */}
      {csBPopupOpen && (
        <ModalOverlay onClose={() => setCsBPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileText size={20} color="#B45309" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Control Sheet Part B — Funding Allocation</span>
          </div>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>
            The above-mentioned contract sum of <strong>${csATotal.toLocaleString()}</strong> should be charged to the following sources:
          </div>

          {/* Funding Table */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '30%' }}>Centre Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '25%' }}>Source of Funding</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '25%' }}>HKD ($)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, color: '#475569', width: '15%' }}>Authorized By</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)', width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {csBRows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12 }} value={row.centre} onChange={(e) => csBRowField(idx, 'centre', e.target.value)} placeholder="Centre name" />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12 }} value={row.funding} onChange={(e) => csBRowField(idx, 'funding', e.target.value)} placeholder="Funding source" />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12, textAlign: 'right' }} type="number" value={row.hkd} onChange={(e) => csBRowField(idx, 'hkd', e.target.value)} placeholder="0" />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <input style={{ ...INPUT_BASE, fontSize: 12 }} value={row.auth} onChange={(e) => csBRowField(idx, 'auth', e.target.value)} placeholder="Name" />
                    </td>
                    <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      {csBRows.length > 1 && (
                        <button onClick={() => setCsBRows((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC' }}>
                  <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--border)' }}>Total</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--border)' }}>${csBTotal.toLocaleString()}</td>
                  <td style={{ borderTop: '2px solid var(--border)' }}></td>
                  <td style={{ borderTop: '2px solid var(--border)' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button onClick={() => setCsBRows((prev) => [...prev, { centre: '', funding: '', hkd: '', auth: '' }])}
            style={{ ...BTN_SECONDARY, fontSize: 12, padding: '6px 14px', marginBottom: 20 }}>
            <Plus size={14} /> Add Row
          </button>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button onClick={() => { setItem('csB', 'completed'); setCsBPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> Confirm Control Sheet Part B
            </button>
            <button onClick={() => setCsBPopupOpen(false)} style={BTN_SECONDARY}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── EOT Popup ── */}
      {eotPopupOpen && (
        <ModalOverlay onClose={() => setEotPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FileText size={20} color="#7C3AED" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Extension Of Time (EOT)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FieldLabel>Reason for Extension</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={eot.reason} onChange={(e) => setEot((p) => ({ ...p, reason: e.target.value }))} placeholder="Describe the reason for the extension request" /></div>
            <div><FieldLabel>Number of Days Requested</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={eot.days} onChange={(e) => setEot((p) => ({ ...p, days: e.target.value }))} placeholder="Days" /></div>
            <div><FieldLabel>New Expected Completion Date</FieldLabel><input style={INPUT_BASE} type="date" value={eot.newDate} onChange={(e) => setEot((p) => ({ ...p, newDate: e.target.value }))} /></div>
            <div><FieldLabel>Supporting Remarks</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={eot.remarks} onChange={(e) => setEot((p) => ({ ...p, remarks: e.target.value }))} placeholder="Additional supporting information" /></div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => { setItem('eot', 'completed'); setEotPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> Submit EOT
            </button>
            <button onClick={() => setEotPopupOpen(false)} style={BTN_SECONDARY}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── V.O. Popup ── */}
      {voPopupOpen && (
        <ModalOverlay onClose={() => setVoPopupOpen(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Plus size={20} color="#7C3AED" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Variation Order (V.O.)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><FieldLabel>V.O. Description</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={vo.description} onChange={(e) => setVo((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the variation order" /></div>
            <div><FieldLabel>Amount ($)</FieldLabel><input style={{ ...INPUT_BASE, width: 200 }} type="number" value={vo.amount} onChange={(e) => setVo((p) => ({ ...p, amount: e.target.value }))} placeholder="$" /></div>
            <div><FieldLabel>Justification</FieldLabel><textarea style={{ ...INPUT_BASE, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={vo.justification} onChange={(e) => setVo((p) => ({ ...p, justification: e.target.value }))} placeholder="Explain why this variation is needed" /></div>
            <div>
              <FieldLabel>Approval Status</FieldLabel>
              <select style={{ ...INPUT_BASE, padding: '8px 12px' }} value={vo.status} onChange={(e) => setVo((p) => ({ ...p, status: e.target.value }))}>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button onClick={() => { setItem('vo', 'completed'); setVoPopupOpen(false); }} style={{ ...BTN_PRIMARY, background: '#059669', padding: '10px 24px' }}>
              <Check size={14} /> Add V.O.
            </button>
            <button onClick={() => setVoPopupOpen(false)} style={BTN_SECONDARY}>Cancel</button>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
}
